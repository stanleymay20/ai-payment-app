import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  fraudLowThreshold: Number(process.env.FRAUD_LOW_THRESHOLD || 30),
  fraudMediumThreshold: Number(process.env.FRAUD_MEDIUM_THRESHOLD || 70),
  providerMode: process.env.PROVIDER_MODE || 'simulated',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
};
