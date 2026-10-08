# Gastosaurus

[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

<p align="center">
  <img src="src/assets/mascot.png" alt="Gastosaurus mascot" width="180">
</p>

**Live app:** https://gastosaurus-francoise.vercel.app/

## 1. Overview

Gastosaurus is a group expense tracker for barkadas, roommates and trips, built around Filipino *ambagan*: add a bill, say who paid and who it's for, and everyone's share is worked out for you, item by item if needed. It keeps a running balance per person, suggests the fewest payments to settle up, and has the receiver confirm each payment, so nobody has to keep a spreadsheet or chase friends in the group chat.

- **Frontend:** React 19 + Vite (`src/`)
- **API:** Node.js + Express 5 + PostgreSQL (`server/`), deployed as one Vercel Function (`api/`)
- **Database and login:** Supabase (Postgres + Supabase Auth + Realtime)

More detail: [system architecture](docs/ARCHITECTURE.md) · [how the money math works](docs/HOW-THE-MONEY-WORKS.md) · [deployment](docs/DEPLOYMENT.md) · [security checklist](SECURITY-CHECKLIST.md).

## 2. Setup and installation

### What to install first

| Tool | Version | Why |
|---|---|---|
| [Node.js](https://nodejs.org/) + npm | **22 LTS** (or 20.19+) | Vite 8 needs `^20.19.0 \|\| >=22.12.0`; the API needs ≥ 20.6 for `--env-file` |
| [Git](https://git-scm.com/) | any | to clone the repo |
| A [Supabase](https://supabase.com/) project | free plan | hosts the Postgres database and the login |
| PostgreSQL (local) | 15+ | **only** for running the API tests (`npm test`) |

### Get the code and install dependencies

```bash
git clone https://github.com/francoiseee/gastosaurus.git
cd gastosaurus
npm install              # frontend (and the API's packages, which Vercel installs from the root)
cd server && npm install && cd ..
```

### Set up the database

1. Create a project in the [Supabase dashboard](https://supabase.com/dashboard) and note the database password you choose.
2. Open **SQL Editor → New query** and run each file in [`supabase/migrations/`](supabase/migrations) **in order** (one query per file):
   1. `20261003010000_create_profiles.sql`: profiles, plus a trigger that creates one on sign-up
   2. `20261003020000_create_groups.sql`: groups, members, invites
   3. `20261003030000_create_expenses_and_settlements.sql`: expenses, items, shares, payments
   4. `20261003040000_create_notifications.sql`: the notification inbox
   5. `20261003050000_add_group_invite_codes.sql`: join links

   Every table gets Row Level Security in the same file. Afterwards, **Advisors → Security** should show no RLS warnings.
3. **Authentication → URL Configuration:** set **Site URL** to `http://localhost:5173` and add `http://localhost:5173/**` to Redirect URLs.
4. **Authentication → Providers → Email:** for local testing, turn **Confirm email** off (Supabase's built-in email only reaches your own team's addresses), or set up custom SMTP.

**Seeding:** there is no seed script on purpose, so no fake or real people's data goes into the database. Sign up in the app and create a group to get data. The API tests make their own invented data in a separate local database (see section 3).

### Environment variables

Copy the examples, then fill in your own values. **Never commit the real files**; `.env`, `.env.local` and `server/.env` are gitignored.

```bash
cp .env.example .env.local           # frontend
cp server/.env.example server/.env   # API
```

**Frontend: `.env.local`**

| Variable | Example | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-ref.supabase.co` | Project Settings → API Keys |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_your-publishable-key` | Project Settings → API Keys → Publishable key |
| `VITE_API_URL` | *(leave empty)* | Only for an API on a different domain; locally Vite proxies `/api` to port 4000 |

**API: `server/.env`**

| Variable | Example | Notes |
|---|---|---|
| `NODE_ENV` | `development` | |
| `PORT` | `4000` | |
| `DATABASE_URL` | `postgresql://postgres.your-project-ref:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` | **Secret.** Supabase → **Connect** → Session pooler string, with your password |
| `DATABASE_SSL` | `true` | `false` only for a local Postgres |
| `SUPABASE_URL` | `https://your-project-ref.supabase.co` | same as the frontend |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_your-publishable-key` | same as the frontend |
| `CLIENT_ORIGIN` | `http://localhost:5173` | the only origin CORS allows |

**API tests: `server/.env.test`** (`cp server/.env.test.example server/.env.test`) points at a local throwaway database `gastosaurus_test` and a fake Supabase Auth server the tests start themselves.

## 3. How to run it

Use two terminals from the repo root:

```bash
# Terminal 1: API
cd server
npm run dev
# → 🦖 Gastosaurus API listening on http://localhost:4000

# Terminal 2: frontend
npm run dev
# → VITE ready … Local: http://localhost:5173/
```

- Open **http://localhost:4000/api/health**. You should get `{"status":"ok"}`. If `DATABASE_URL` is wrong, the API stops at startup with `Cannot connect to Supabase Postgres (check DATABASE_URL in server/.env)`.
- Open **http://localhost:5173**. You should see the landing page ("Master Your Budget, Effortlessly.") with the mascot, a **Log In** button and **Start Saving**.
- Calling the API without logging in returns `401` with `{"error":{"code":"UNAUTHORIZED",…}}`, which is expected.

Other scripts:

| Where | Command | What it does |
|---|---|---|
| root | `npm run build` | Production build into `dist/` |
| root | `npm run lint` | ESLint (browser rules for `src/`, Node rules for `server/`) |
| server | `npm test` | API tests on a local Postgres: `createdb gastosaurus_test`, then `npm test` |

## 4. Features and usage

### The main flow

1. **Sign up / log in** with email and password (Supabase Auth; "Keep me logged in" and forgot password included). First-timers pick a **dino avatar** and a display name.
2. **Create a group** (**New Group**): name, icon, colour, category, and friends added by name as **guests**, so they don't need an account yet. You become the group's admin.
3. **Add an expense** (**Add Expenses**): type the amount on the calculator, pick who's in, then either:
   - **Split equally**: ₱100 for 3 people becomes ₱33.34 / ₱33.33 / ₱33.33, and always adds up exactly, or
   - **Itemize it** (*ambagan*): add each item, drag or reassign items between people, share an item between several people, then **Save Expense**. A shared item costs each person price ÷ number of people.
4. **See balances** on the group page and dashboard: who is owed (+) and who owes (−), plus your monthly spending against an optional budget.
5. **Invite people**: invite a guest's spot by email (they take over that guest's balance when they accept), or share the group's **join link**. Admins can reset the link.
6. **Settle up**: **Settlements** shows the fewest payments needed. **Pay** records a payment (GCash, bank transfer or cash; the money itself moves outside the app). It stays *pending* until the receiver taps **Confirm received**, and nobody is asked to pay the same debt twice.
7. **Notifications**: the bell updates live (Supabase Realtime) for invites, new expenses, joins, payments to confirm, and reminders. Any member can send **reminders** to people who owe (at most once per person every 12 hours).

### API endpoints

Every endpoint except `/api/health` needs `Authorization: Bearer <Supabase access token>`. Routes under `/:groupId` also require you to be a member (otherwise **404**). Bad input returns **400** with field messages, and conflicts return **409**. Full request and response shapes are in [docs/ARCHITECTURE.md §6](docs/ARCHITECTURE.md).

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Liveness check (no login) |
| GET / PATCH | `/api/me` | Read / update my profile (name, avatar, monthly budget) |
| GET | `/api/me/summary?month=YYYY-MM` | My spending and balances for a month |
| GET | `/api/me/settle-up` | My suggested payments across all groups |
| GET / POST | `/api/groups` | List my groups with my balance / create a group |
| GET / PATCH / DELETE | `/api/groups/:groupId` | View / edit / delete a group (edit and delete: admin) |
| POST | `/api/groups/:groupId/members` | Add a guest |
| PATCH / DELETE | `/api/groups/:groupId/members/:memberId` | Edit / remove a member (admin) |
| DELETE | `/api/groups/:groupId/members/me` | Leave a group (only when settled) |
| POST | `/api/groups/:groupId/invites` | Invite someone by email |
| POST | `/api/groups/:groupId/invite-code` | Reset the join link (admin) |
| GET | `/api/invites` | Invites sent to me |
| POST | `/api/invites/join` | Join a group with a link code |
| POST | `/api/invites/:id/accept` · `/decline` | Answer an invite |
| DELETE | `/api/invites/:id` | Cancel an invite |
| GET / POST | `/api/groups/:groupId/expenses` | List / add expenses (equal, itemized or custom split) |
| GET / PATCH / DELETE | `/api/expenses/:id` | View / edit or re-split / delete an expense |
| GET | `/api/groups/:groupId/balances` | Everyone's balance and suggested payments |
| GET / POST | `/api/groups/:groupId/settlements` | List / record payments |
| PATCH / DELETE | `/api/settlements/:id` | Confirm / delete a payment |
| GET | `/api/notifications` | My notifications (`?unread=true`, paging) |
| PATCH | `/api/notifications/:id/read` | Mark one as read |
| POST | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete a notification |
| POST | `/api/groups/:groupId/reminders` | Remind members who owe |

## 5. Project structure

```
gastosaurus/
├── src/                      React frontend
│   ├── components/           one file per screen/modal (Dashboard, GroupsView, ItemizedAmbaganView, SettlementsView, …)
│   ├── hooks/                useAsync, useNotifications (Supabase Realtime)
│   ├── lib/                  api.js (fetch wrappers), supabase.js (auth client), format.js
│   ├── data/                 dino avatars and group icon lists
│   └── assets/               images (dinos, icons, mascots)
├── server/                   Express API
│   ├── src/app.js            builds the app: helmet, CORS, JSON, routers, error handler
│   ├── src/server.js         local entry point (checks the DB, then listens on :4000)
│   ├── src/config/env.js     every environment variable in one place
│   ├── src/db/pool.js        pg pool + transaction helper
│   ├── src/middleware/       requireAuth, validateBody, errorHandler
│   ├── src/lib/              splitting.js + money.js (the split math), token verification, shared validators
│   ├── src/modules/<area>/   routes → validation (zod) → service (rules) → repository (SQL)
│   └── test/                 node:test integration tests against a local Postgres
├── api/index.js              Vercel Function entry: exports the Express app
├── supabase/migrations/      the database schema, RLS policies and triggers, in order
├── docs/                     architecture, money math, deployment, design system, QA checklist, screenshots
├── vercel.json               rewrites /api/* to the function, region sin1
├── SECURITY-CHECKLIST.md     completed security checklist
└── AI-USAGE.md               how AI was used, and which code is ours
```

## 6. Screenshots

| Landing page | Dashboard |
|---|---|
| ![Landing page](docs/Landing-page.png) | ![Dashboard with groups and balances](docs/Dashboard.png) |

| Group expenses | Itemized ambagan split |
|---|---|
| ![A group's expenses and balances](docs/Group-expenses.png) | ![Splitting items between people](docs/Itemized-split.png) |

| Settlements |
|---|
| ![Settle up with pending payments](docs/Settlement.png) |

## 7. Known issues and next steps

**Known issues**
- **The API connects to Postgres as the owner role**, which has more rights than it needs and bypasses RLS. Every service checks group membership itself, but a mistake there wouldn't be caught by the database ([checklist row 15](SECURITY-CHECKLIST.md)).
- **The database accepts connections from any IP** (password and SSL required), because Vercel Functions have no fixed IP to allow-list.
- **Sign-up needs email confirmation.** Supabase's built-in email sender is rate-limited and only reaches addresses on the Supabase team unless custom SMTP is set up. If the email doesn't come, check Spam/Promotions.
- **Payments are records only.** Choosing GCash, bank or cash doesn't move money; the receiver confirms it arrived.
- **Leaked-password protection is off** in Supabase Auth (flagged by the Supabase security advisor).
- **No rate limiting** on the API beyond Supabase Auth's own limits, and **no CI**: tests run only locally because they need a local Postgres.
- **Three early commits carry a lab PC's git identity** (someone else's email in the author field). Rewriting history would break the commit links in `AI-USAGE.md`, so it's documented instead ([checklist row 27](SECURITY-CHECKLIST.md)).
- Google sign-in was removed on purpose; login is email and password only.

**Next steps**
1. Give the API its own Postgres role with only `SELECT/INSERT/UPDATE/DELETE` on the app's tables.
2. Add a GitHub Actions workflow that runs `npm run lint` and the API tests against a Postgres service container.
3. Add `express-rate-limit` on write routes and turn on leaked-password protection.
4. Set up custom SMTP so anyone can sign up without hitting the built-in email limits.
5. Export a group's history as CSV, and add recurring expenses (rent, subscriptions).

## Credits

- **Font:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) via Google Fonts (SIL Open Font License).
- **Icons:** [Lucide](https://lucide.dev/) via `lucide-react` (ISC license).

## AI credit

Built with heavy AI assistance. I wrote the React frontend (with some help from Google Antigravity), the Vercel deployment and the dino avatar picker. Claude (Claude Code, Claude Opus 5.5) wrote the backend (`server/`, `supabase/`), connected the frontend to it, and helped with later fixes and a cleanup pass. What the AI did, where it got things wrong, and which parts are ours: **[AI-USAGE.md](AI-USAGE.md)**.
