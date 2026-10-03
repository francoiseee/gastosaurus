# 🦖 Gastosaurus

Group expense tracker with "ambagan"-style auto-splitting: add an expense, tag who paid and who it's for, and everyone's share updates instantly, including itemized splits.

- **Frontend:** React + Vite (`src/`)
- **Auth & database:** Supabase (project `gastosaurus`)
- **API:** Node.js + Express + PostgreSQL (`server/`)

📐 Read the **[system architecture](docs/ARCHITECTURE.md)** first.

## Quick start

```bash
# 1. Frontend
npm install
cp .env.example .env.local        # Supabase URL + publishable key are pre-filled

# 2. Backend
cd server
npm install
cp .env.example .env              # paste the DATABASE_URL — see server/README.md
npm run dev                       # API → http://localhost:4000

# 3. In another terminal, from the repo root
npm run dev                       # App → http://localhost:5173
```

## Scripts

| Where | Command | What it does |
|---|---|---|
| root | `npm run dev` | Start the React app (proxies `/api` to the backend) |
| root | `npm run build` | Production build into `dist/` |
| root | `npm run lint` | ESLint |
| server | `npm run dev` | Start the API with auto-restart |
| server | `npm test` | API tests (local Postgres) |

## Status

| Phase | |
|---|---|
| 1. Accounts: sign up, log in, Google, forgot password, profile | ✅ |
| 2. Groups: guests, email invites, join links | ✅ |
| 3. Expenses: equal, itemized and custom splitting | ✅ |
| 4. Balances, Settle Up and payments | ✅ |
| 5. Notifications, reminders, live updates | ✅ |
| 6. Deploy | next |

Every screen runs on real data. Before a release, go through **[docs/QA-CHECKLIST.md](docs/QA-CHECKLIST.md)**.

How the splitting works, in plain language: **[docs/HOW-THE-MONEY-WORKS.md](docs/HOW-THE-MONEY-WORKS.md)**.
