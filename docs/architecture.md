# Architecture

## Backend (`/backend`)
- Express REST API with versioned entrypoint (`/api/v1`) and backward-compatible `/api` alias.
- Security middleware: `helmet`, request IDs, and endpoint rate limiting.
- Validation middleware with `zod` schemas for auth/payment payloads.
- Centralized not-found + error handlers for consistent JSON errors.
- Modular services:
  - `fraudService`: deterministic risk scoring from frequency, velocity, and behavior features.
  - `routingService`: weighted provider selection across Stripe/PayPal/Bank.
  - `decisionLogService`: explainable decision persistence with model version and request ID.
- Payment flow supports idempotency keys and transaction statuses (`pending`, `approved`, `failed`, `reversed`).
- Ledger persistence via `ledger_entries` for approved debits/credits.
- Admin-only review endpoint for global decision logs.

## Frontend (`/frontend`)
- React + Vite SPA.
- Protected routing and auth context.
- Payment form sends idempotency key header to prevent duplicate charges.
- Transaction and send-payment pages display risk/routing explanations and status.

## Data model
- `users`: identity, hashed credentials, admin role flag, wallet balance.
- `transactions`: statusful transfer records with fraud/routing metadata + idempotency.
- `ledger_entries`: durable balance movement entries for accounting traceability.
- `decision_logs`: auditable AI-decision trail with metadata snapshots.

## Production-hardening baseline now included
- Validation, rate limiting, centralized error handling.
- Request IDs in responses + logs for traceability.
- Idempotent payment creation and ledger persistence.
- Admin review path for decision auditing.
