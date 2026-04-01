# AI Payment App

Full-stack AI-powered payment application with wallet transfers, transaction history, fraud risk scoring, and smart route recommendations.

## Project Structure

- `backend/` - Node.js + Express REST API + PostgreSQL logic
- `frontend/` - React + Vite UI
- `docs/` - architecture and setup documentation
- `.env.example` - local environment template

## Features

- Email/password authentication with JWT
- Wallet system with per-user balances
- Send and receive payments between users
- Transaction history with timestamps
- AI fraud detection:
  - Numeric risk score (0-100) per transaction
  - Explanation for why a transaction is risky
  - Detection from frequency + velocity + balance-drain patterns
- Smart payment routing:
  - Simulates Stripe, PayPal, and Bank providers
  - Chooses best provider using cost, speed, and safety signals

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

Base URL: `http://localhost:4000/api`

### Auth
- `POST /auth/register` `{ name, email, password }`
- `POST /auth/login` `{ email, password }`

### Users
- `GET /users/me` (JWT required)
- `GET /users` (JWT required)

### Payments / Transactions
- `POST /payments/route-suggestion` `{ amount, priority }`
- `POST /payments/send` `{ recipientEmail, amount, note, priority }`
- `GET /payments/transactions`
- `GET /payments/decision-logs`

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
