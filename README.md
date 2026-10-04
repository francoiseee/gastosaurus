# Gastosaurus

[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

<p align="center">
  <img src="src/assets/mascot.png" alt="Gastosaurus Logo" width="180">
</p>

Group expense tracker with "ambagan"-style auto-splitting: add an expense, tag who paid and who it's for, and everyone's share updates instantly, including itemized splits.

- **Frontend:** React + Vite (`src/`)
- **Auth & database:** Supabase (project `gastosaurus`)
- **API:** Node.js + Express + PostgreSQL (`server/`), deployed as a Vercel Function (`api/`)

**Live app:** https://gastosaurus-francoise.vercel.app/

Read the **[system architecture](docs/ARCHITECTURE.md)** first.

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
| 1. Accounts: sign up, log in, forgot password, profile | ✅ |
| 2. Groups: guests, email invites, join links | ✅ |
| 3. Expenses: equal, itemized and custom splitting | ✅ |
| 4. Balances, Settle Up and payments | ✅ |
| 5. Notifications, reminders, live updates | ✅ |
| 6. Deploy on Vercel ([guide](docs/DEPLOYMENT.md)) | ✅ |

Every screen runs on real data. Before a release, go through **[docs/QA-CHECKLIST.md](docs/QA-CHECKLIST.md)**.

How the splitting works, in plain language: **[docs/HOW-THE-MONEY-WORKS.md](docs/HOW-THE-MONEY-WORKS.md)**.

## AI credit

Built with heavy AI assistance. I wrote the React frontend (with some help from Google Antigravity), the Vercel deployment and the dino avatar picker. Claude (Claude Code, Claude Opus 5.5) wrote the backend (`server/`, `supabase/`), connected the frontend to it, and helped with later fixes and a cleanup pass. What the AI did, where it got things wrong, and which parts are ours: **[AI-USAGE.md](AI-USAGE.md)**.
