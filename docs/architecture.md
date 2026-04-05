# Architecture

## Backend (`/backend`)
- Express REST API with versioned entrypoint (`/api/v1`) and `/api` compatibility path.
- Security middleware: `helmet`, request IDs, endpoint rate limiting, and route-level validation.
- Centralized not-found + error handlers with structured logs.
- Modular services:
  - `fraudService`: deterministic risk scoring and configurable threshold policy (low/medium/high).
  - `routingService`: provider scoring abstraction over Stripe/PayPal/Bank simulation.
  - `decisionLogService`: decision persistence with model version + request ID.
  - `idempotencyService`: duplicate payment protection utility.
  - `loggerService`: structured JSON logs for operational tracing.
- Payment flow supports idempotency key, transaction lifecycle states, and manual review for high risk.
- Stripe webhook endpoint scaffold added for later real-provider integration.

## Data model
- `users`: identity, hashed credentials, admin role flag, wallet balance.
- `transactions`: statusful transfer records, idempotency key, provider reference, fraud/routing metadata.
- `ledger_entries`: durable accounting trail for approved balance movement.
- `decision_logs`: auditable AI-decision trail with metadata snapshots.

## Frontend (`/frontend`)
- React + Vite SPA with protected routes.
- Payment form sends idempotency key header.
- UI surfaces status, fraud reasons, and routing explanation.

## Test strategy (phase 2 baseline)
- Unit tests for fraud scoring, routing, idempotency helper, and auth middleware.
- Integration-oriented tests for admin protection and review policy behavior.
