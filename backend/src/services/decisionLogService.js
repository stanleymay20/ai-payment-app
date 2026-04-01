import { pool } from '../config/db.js';

export const logDecision = async ({
  userId,
  transactionId = null,
  decisionType,
  riskScore = null,
  recommendation = null,
  explanation,
  metadata = {}
}) => {
  await pool.query(
    `INSERT INTO decision_logs
     (user_id, transaction_id, decision_type, risk_score, recommendation, explanation, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId,
      transactionId,
      decisionType,
      riskScore,
      recommendation,
      explanation,
      metadata
    ]
  );
};
