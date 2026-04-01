import express from 'express';
import { pool } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';
import { scoreFraudRisk } from '../services/fraudService.js';
import { suggestPaymentRoute } from '../services/routingService.js';
import { logDecision } from '../services/decisionLogService.js';
import { paymentLimiter } from '../config/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { routeSuggestionSchema, sendPaymentSchema } from '../validation/schemas.js';

const router = express.Router();

router.post('/route-suggestion', authRequired, paymentLimiter, validate(routeSuggestionSchema), async (req, res, next) => {
  try {
    const { amount, priority, fraudRisk = 0 } = req.validated.body;
    const route = suggestPaymentRoute({ amount, priority, fraudRisk });

    await logDecision({
      userId: req.user.userId,
      decisionType: 'routing_preview',
      riskScore: Number(fraudRisk || 0),
      recommendation: route.recommended.provider,
      explanation: route.selectionReason,
      metadata: route,
      requestId: req.requestId
    });

    return res.json(route);
  } catch (error) {
    return next(error);
  }
});

router.post('/send', authRequired, paymentLimiter, validate(sendPaymentSchema), async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { recipientEmail, amount, note, priority } = req.validated.body;
    const idempotencyKey = req.headers['idempotency-key'];

    const existing = await client.query(
      'SELECT * FROM transactions WHERE sender_id = $1 AND idempotency_key = $2 LIMIT 1',
      [req.user.userId, idempotencyKey]
    );
    if (existing.rows.length) {
      return res.status(200).json({
        transaction: existing.rows[0],
        idempotentReplay: true
      });
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

    if (Number(sender.wallet_balance) < amount) {
      const failedTx = await client.query(
        `INSERT INTO transactions (sender_id, recipient_id, amount, note, status, idempotency_key, risk_score, is_flagged)
         VALUES ($1, $2, $3, $4, 'failed', $5, 0, FALSE)
         RETURNING *`,
        [sender.id, recipient.id, amount, note || null, idempotencyKey]
      );
      await client.query('COMMIT');
      return res.status(400).json({ message: 'Insufficient wallet balance', transaction: failedTx.rows[0] });
    }

    const recent = await client.query(
      'SELECT created_at, amount FROM transactions WHERE sender_id = $1 ORDER BY created_at DESC LIMIT 50',
      [sender.id]
    );

    const fraud = scoreFraudRisk({
      amount,
      recentTransactions: recent.rows,
      senderBalance: Number(sender.wallet_balance)
    });

    const route = suggestPaymentRoute({ amount, priority, fraudRisk: fraud.riskScore });
    const status = fraud.riskScore >= 70 ? 'pending' : 'approved';

    let updatedSenderBalance = Number(sender.wallet_balance);
    let updatedRecipientBalance = Number(recipient.wallet_balance);

    if (status === 'approved') {
      updatedSenderBalance -= amount;
      updatedRecipientBalance += amount;

      await client.query('UPDATE users SET wallet_balance = $1 WHERE id = $2', [updatedSenderBalance, sender.id]);
      await client.query('UPDATE users SET wallet_balance = $1 WHERE id = $2', [updatedRecipientBalance, recipient.id]);
    }

    const txResult = await client.query(
      `INSERT INTO transactions
       (sender_id, recipient_id, amount, note, status, idempotency_key, risk_score, is_flagged, fraud_reasons, fraud_explanation, route_provider, route_fee, route_explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        sender.id,
        recipient.id,
        amount,
        note || null,
        status,
        idempotencyKey,
        fraud.riskScore,
        fraud.flagged,
        fraud.reasons,
        fraud.reasons.join(' '),
        route.recommended.provider,
        route.recommended.estimatedFee,
        route.recommended.explanation
      ]
    );

    const tx = txResult.rows[0];

    if (status === 'approved') {
      await client.query(
        `INSERT INTO ledger_entries (transaction_id, user_id, direction, amount, balance_after)
         VALUES ($1, $2, 'debit', $3, $4), ($1, $5, 'credit', $3, $6)`,
        [tx.id, sender.id, amount, updatedSenderBalance, recipient.id, updatedRecipientBalance]
      );
    }

    await client.query('COMMIT');

    await logDecision({
      userId: sender.id,
      transactionId: tx.id,
      decisionType: 'fraud_assessment',
      riskScore: fraud.riskScore,
      recommendation: status === 'pending' ? 'review_required' : 'approved',
      explanation: fraud.reasons.join(' '),
      metadata: fraud,
      requestId: req.requestId
    });

    await logDecision({
      userId: sender.id,
      transactionId: tx.id,
      decisionType: 'routing_selection',
      riskScore: fraud.riskScore,
      recommendation: route.recommended.provider,
      explanation: route.selectionReason,
      metadata: route,
      requestId: req.requestId
    });

    return res.status(201).json({ transaction: tx, route, fraud, status });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.get('/decision-logs', authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM decision_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [req.user.userId]
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/transactions', authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.*, s.email AS sender_email, r.email AS recipient_email
       FROM transactions t
       JOIN users s ON s.id = t.sender_id
       JOIN users r ON r.id = t.recipient_id
       WHERE t.sender_id = $1 OR t.recipient_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.userId]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

export default router;
