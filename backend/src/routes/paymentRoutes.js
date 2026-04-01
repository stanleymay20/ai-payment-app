import express from 'express';
import { pool } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';
import { scoreFraudRisk } from '../services/fraudService.js';
import { suggestPaymentRoute } from '../services/routingService.js';
import { logDecision } from '../services/decisionLogService.js';

const router = express.Router();

router.post('/route-suggestion', authRequired, async (req, res) => {
  try {
    const { amount, priority, fraudRisk = 0 } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount required' });
    }

    const route = suggestPaymentRoute({ amount: Number(amount), priority, fraudRisk });

    await logDecision({
      userId: req.user.userId,
      decisionType: 'routing_preview',
      riskScore: Number(fraudRisk || 0),
      recommendation: route.recommended.provider,
      explanation: route.selectionReason,
      metadata: route
    });

    return res.json(route);
  } catch (error) {
    return res.status(500).json({ message: 'Could not generate route suggestion', error: error.message });
  }
});

router.post('/send', authRequired, async (req, res) => {
  const client = await pool.connect();

  try {
    const { recipientEmail, amount, note, priority } = req.body;
    const parsedAmount = Number(amount);

    if (!recipientEmail || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Recipient and positive amount are required' });
    }

    await client.query('BEGIN');

    const senderResult = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [req.user.userId]);
    const recipientResult = await client.query('SELECT * FROM users WHERE email = $1 FOR UPDATE', [recipientEmail.toLowerCase()]);

    if (!senderResult.rows.length || !recipientResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Sender or recipient not found' });
    }

    const sender = senderResult.rows[0];
    const recipient = recipientResult.rows[0];

    if (sender.id === recipient.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cannot send payment to yourself' });
    }

    if (Number(sender.wallet_balance) < parsedAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const recent = await client.query(
      'SELECT created_at, amount FROM transactions WHERE sender_id = $1 ORDER BY created_at DESC LIMIT 50',
      [sender.id]
    );

    const fraud = scoreFraudRisk({
      amount: parsedAmount,
      recentTransactions: recent.rows,
      senderBalance: Number(sender.wallet_balance)
    });

    const route = suggestPaymentRoute({ amount: parsedAmount, priority, fraudRisk: fraud.riskScore });

    const updatedSenderBalance = Number(sender.wallet_balance) - parsedAmount;
    const updatedRecipientBalance = Number(recipient.wallet_balance) + parsedAmount;

    await client.query('UPDATE users SET wallet_balance = $1 WHERE id = $2', [updatedSenderBalance, sender.id]);
    await client.query('UPDATE users SET wallet_balance = $1 WHERE id = $2', [updatedRecipientBalance, recipient.id]);

    const txResult = await client.query(
      `INSERT INTO transactions
       (sender_id, recipient_id, amount, note, risk_score, is_flagged, fraud_reasons, fraud_explanation, route_provider, route_fee, route_explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        sender.id,
        recipient.id,
        parsedAmount,
        note || null,
        fraud.riskScore,
        fraud.flagged,
        fraud.reasons,
        fraud.reasons.join(' '),
        route.recommended.provider,
        route.recommended.estimatedFee,
        route.recommended.explanation
      ]
    );

    await client.query('COMMIT');

    await logDecision({
      userId: sender.id,
      transactionId: txResult.rows[0].id,
      decisionType: 'fraud_assessment',
      riskScore: fraud.riskScore,
      recommendation: fraud.flagged ? 'review_required' : 'approved',
      explanation: fraud.reasons.join(' '),
      metadata: fraud
    });

    await logDecision({
      userId: sender.id,
      transactionId: txResult.rows[0].id,
      decisionType: 'routing_selection',
      riskScore: fraud.riskScore,
      recommendation: route.recommended.provider,
      explanation: route.selectionReason,
      metadata: route
    });

    return res.status(201).json({
      transaction: txResult.rows[0],
      route,
      fraud
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: 'Failed to send payment', error: error.message });
  } finally {
    client.release();
  }
});


router.get('/decision-logs', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM decision_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [req.user.userId]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch decision logs', error: error.message });
  }
});

router.get('/transactions', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        t.*,
        s.email AS sender_email,
        r.email AS recipient_email
      FROM transactions t
      JOIN users s ON s.id = t.sender_id
      JOIN users r ON r.id = t.recipient_id
      WHERE t.sender_id = $1 OR t.recipient_id = $1
      ORDER BY t.created_at DESC`,
      [req.user.userId]
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

export default router;
