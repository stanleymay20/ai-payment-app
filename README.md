# AI Payment App

Full-stack AI-powered payment application with wallet transfers, transaction history, fraud risk scoring, smart provider routing, and auditable decision logs.

## Project Structure

- `backend/` - Node.js + Express REST API + PostgreSQL logic
- `frontend/` - React + Vite UI
- `docs/` - architecture and setup documentation
- `.env.example` - local environment template

## Features

- Email/password authentication with JWT
- Wallet system with per-user balances
- Send and receive payments between users
- Transaction history with statuses (`pending`, `approved`, `failed`, `reversed`)
- AI fraud detection:
  - Numeric risk score (0-100) per transaction
  - Explanation of risky signals (frequency/velocity/balance behavior)
- Smart payment routing:
  - Simulates Stripe, PayPal, and Bank providers
  - Chooses best provider using cost, speed, and safety
- Decision logging:
  - Stores fraud + routing decisions with explanation and metadata
- Production-hardening phase 2 additions:
  - Structured logging for key payment/routing/fraud events
  - Configurable fraud thresholds + low/medium/high policy bands
  - Manual review status for high-risk transactions
  - Stripe integration scaffold + webhook verification placeholder
  - Unit/integration-oriented backend tests using `node:test`

## Requirements

- Node.js 20+
- PostgreSQL 14+ (or Supabase Postgres)

## Local Setup

### 1) Clone and configure env

```bash
cp .env.example .env
```

Update `DATABASE_URL` and `JWT_SECRET` in `.env`.

### 2) Backend setup

```bash
cd backend
npm install
npm run db:init
npm run dev
```

Backend runs at `http://localhost:4000`.

### 3) Frontend setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## API Overview

Base URL: `http://localhost:4000/api/v1`

Health: `GET /api/v1/health`

### Auth
- `POST /auth/register` `{ name, email, password }`
- `POST /auth/login` `{ email, password }`

### Users
- `GET /users/me` (JWT required)
- `GET /users` (JWT required)

### Payments / Transactions
- `POST /payments/route-suggestion` `{ amount, priority, fraudRisk? }`
- `POST /payments/send` `{ recipientEmail, amount, note?, priority? }` + header `Idempotency-Key`
- `POST /payments/webhooks/stripe` (scaffold placeholder with signature header check)
- `GET /payments/transactions`
- `GET /payments/decision-logs`

### Admin
- `GET /admin/decision-logs` (JWT + admin role)

## Database bootstrap

SQL schema is in `backend/db/schema.sql` and can be applied with:

```bash
cd backend
npm run db:init
```

## Supabase compatibility

Use Supabase Postgres connection string for `DATABASE_URL`.
If SSL is required, set `DB_SSL=true`.

## Docs

See `docs/architecture.md` for architecture details.


## Testing

Run backend tests:

```bash
cd backend
npm test
```
