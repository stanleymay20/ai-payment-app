import { pool } from '../config/db.js';

const FRAUD_MODEL_VERSION = 'fraud-rules-v2';
const ROUTING_MODEL_VERSION = 'routing-rules-v2';

export const logDecision = async ({
  userId,
  transactionId = null,
  decisionType,
  riskScore = null,
  recommendation = null,
  explanation,
  metadata = {},
  requestId = null
}) => {
  const modelVersion = decisionType.startsWith('fraud') ? FRAUD_MODEL_VERSION : ROUTING_MODEL_VERSION;

  await pool.query(
    `INSERT INTO decision_logs
     (user_id, transaction_id, decision_type, model_version, risk_score, recommendation, explanation, metadata, request_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [userId, transactionId, decisionType, modelVersion, riskScore, recommendation, explanation, metadata, requestId]
  );
};
