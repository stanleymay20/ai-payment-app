CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  recipient_id INTEGER NOT NULL REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  risk_score INTEGER NOT NULL DEFAULT 0,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  fraud_reasons TEXT[] DEFAULT '{}',
  fraud_explanation TEXT,
  route_provider VARCHAR(50),
  route_fee NUMERIC(12,2) DEFAULT 0,
  route_explanation TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fraud_explanation TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS route_provider VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS route_explanation TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS route_fee NUMERIC(12,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fraud_reasons TEXT[] DEFAULT '{}';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS risk_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS decision_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  transaction_id INTEGER REFERENCES transactions(id),
  decision_type VARCHAR(60) NOT NULL,
  risk_score INTEGER,
  recommendation VARCHAR(120),
  explanation TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_logs_user_id ON decision_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_logs_transaction_id ON decision_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_decision_logs_decision_type ON decision_logs(decision_type);
