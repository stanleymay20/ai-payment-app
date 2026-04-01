# Architecture

## Backend (`/backend`)
- Express REST API with modular routes and middleware.
- PostgreSQL (Supabase-compatible) via `pg` pool.
- JWT auth middleware for protected endpoints.
- Services are separated by responsibility:
  - `fraudService`: risk scoring using amount, frequency, and velocity signals.
  - `routingService`: provider selection simulation across Stripe/PayPal/Bank using weighted speed/cost/safety scoring.
  - `decisionLogService`: immutable decision logging for fraud and routing outcomes.
- Payment execution uses DB transactions to keep wallet debits/credits atomic.

## Frontend (`/frontend`)
- React + Vite SPA.
- Protected app shell with pages:
  - Login
  - Dashboard
  - Send Payment
  - Transaction History
- Axios API client with JWT interceptor.

## Data model
- `users`: identity, credentials hash, wallet balance.
- `transactions`: transfer info, fraud risk details, routing provider + explanation.
- `decision_logs`: persistent audit trail for fraud and routing decisions with explanation + JSON metadata.

## Production-readiness patterns
- Explicit service layer boundaries.
- Risk score bounded to `0..100` and explanation-driven outputs.
- Deterministic provider scoring with configurable weighted priorities.
- Decision logging for explainability and operational auditing.
