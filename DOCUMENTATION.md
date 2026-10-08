# Gastosaurus: Documentation

<p align="center">
  <img src="src/assets/mascot.png" alt="Gastosaurus mascot" width="140">
</p>

Everything a new reader needs to understand Gastosaurus, get it running from nothing, and use it.
Short version and presentation links: [README.md](README.md).

- **Public repository:** https://github.com/francoiseee/gastosaurus
- **Live app:** https://gastosaurus-francoise.vercel.app/

## Contents

1. [Overview](#1-overview)
2. [Setup and installation](#2-setup-and-installation)
3. [How to run it](#3-how-to-run-it)
4. [Features and usage](#4-features-and-usage)
5. [Project structure](#5-project-structure)
6. [Screenshots](#6-screenshots)
7. [Known issues and next steps](#7-known-issues-and-next-steps)

Also: [Security checklist](#security-checklist) · [AI usage](#ai-usage) · [More documentation](#more-documentation) · [Credits](#credits)

---

## 1. Overview

Gastosaurus is a group expense tracker for barkadas, roommates and trips, built around Filipino *ambagan*. You add a bill, say who paid and who it's for, and the app works out everyone's share, item by item if needed. It keeps a running balance per person, suggests the fewest payments to settle up, and has the receiver confirm each payment, so nobody has to keep a spreadsheet or chase friends in the group chat.

**Who it's for:** any group that shares costs (friends eating out, roommates splitting bills, a class trip) and wants to know exactly who owes whom without doing the math by hand.

**Built with**

| Part | Technology | Folder |
|---|---|---|
| Frontend | React 19 + Vite | `src/` |
| API | Node.js + Express 5 + PostgreSQL (`pg`), validated with `zod` | `server/` |
| Database and login | Supabase (Postgres, Supabase Auth, Realtime) | `supabase/migrations/` |
| Hosting | Vercel: static site plus the API as one Vercel Function | `api/`, `vercel.json` |

## 2. Setup and installation

Follow these steps in order to get the app running on your own computer from nothing.

### 2.1 What to install first

| Tool | Version | Why |
|---|---|---|
| [Node.js](https://nodejs.org/) + npm | **22 LTS** (or 20.19+) | Vite 8 needs `^20.19.0 \|\| >=22.12.0`; the API needs 20.6+ for `--env-file` |
| [Git](https://git-scm.com/) | any | to clone the repository |
| A [Supabase](https://supabase.com/) account and project | free plan | hosts the Postgres database and the login |
| PostgreSQL (local) | 15+ | **only** for running the API tests (`npm test`) |

Create the Supabase project now (**New project** in the [Supabase dashboard](https://supabase.com/dashboard)) and write down the database password you choose. You need it for the environment variables below.

### 2.2 Get the code

```bash
git clone https://github.com/francoiseee/gastosaurus.git
cd gastosaurus
```

### 2.3 Install dependencies

```bash
npm install                        # frontend (Vercel also installs the API's packages from here)
cd server && npm install && cd ..  # API
```

### 2.4 Environment and configuration

Copy the two example files, then replace the placeholders with your own values. **Never commit the real files.** `.env`, `.env.local`, `server/.env` and `server/.env.test` are all in `.gitignore`.

```bash
cp .env.example .env.local           # frontend
cp server/.env.example server/.env   # API
```

**Frontend: `.env.local`**

| Variable | Example value | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-ref.supabase.co` | Supabase → Project Settings → API Keys |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_your-publishable-key` | Supabase → Project Settings → API Keys → Publishable key |
| `VITE_API_URL` | *(leave empty)* | Only needed if the API runs on a different domain. Locally, Vite forwards `/api` to port 4000 |

**API: `server/.env`**

| Variable | Example value | Notes |
|---|---|---|
| `NODE_ENV` | `development` | |
| `PORT` | `4000` | |
| `DATABASE_URL` | `postgresql://postgres.your-project-ref:YOUR-PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` | **Secret.** Supabase → **Connect** → *Session pooler* string, with your database password filled in |
| `DATABASE_SSL` | `true` | `false` only for a local Postgres |
| `SUPABASE_URL` | `https://your-project-ref.supabase.co` | same value as the frontend |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_your-publishable-key` | same value as the frontend |
| `CLIENT_ORIGIN` | `http://localhost:5173` | the only origin CORS allows |

**API tests: `server/.env.test`** (only if you run the tests): `cp server/.env.test.example server/.env.test`. It points at a local throwaway database `gastosaurus_test` and a fake Supabase Auth server that the tests start themselves, so no real credentials are needed.

### 2.5 Set up and seed the database

1. In Supabase, open **SQL Editor → New query** and run each file in [`supabase/migrations/`](supabase/migrations) **in this order**, one query per file:
   1. `20261003010000_create_profiles.sql`: profiles, plus a trigger that creates one on sign-up
   2. `20261003020000_create_groups.sql`: groups, members, invites
   3. `20261003030000_create_expenses_and_settlements.sql`: expenses, items, shares, payments
   4. `20261003040000_create_notifications.sql`: the notification inbox
   5. `20261003050000_add_group_invite_codes.sql`: join links

   Each file turns on Row Level Security for its tables. Afterwards, **Advisors → Security** should show no RLS warnings.
2. **Authentication → URL Configuration:** set **Site URL** to `http://localhost:5173` and add `http://localhost:5173/**` to **Redirect URLs**.
3. **Authentication → Sign In / Providers → Email:** for local testing, turn **Confirm email** off (Supabase's built-in email only reaches your own team's addresses), or set up custom SMTP.

**Seeding:** there is no seed script, on purpose, so no fake or real people's data goes into the database. To get data, sign up in the app and create a group (section 4 walks through it). The API tests create their own invented data in a separate local database.

## 3. How to run it

Open two terminals in the repository folder:

```bash
# Terminal 1: API
cd server
npm run dev
# → 🦖 Gastosaurus API listening on http://localhost:4000

# Terminal 2: frontend
npm run dev
# → VITE ready … Local: http://localhost:5173/
```

**What you should see when it works**

- **http://localhost:5173** shows the landing page, *"Master Your Budget, Effortlessly."*, with the dino mascot, a **Log In** button and **Start Saving**.
- **http://localhost:4000/api/health** returns `{"status":"ok"}`.
- Calling any other API route without logging in returns `401` with `{"error":{"code":"UNAUTHORIZED",…}}`. That is expected.
- If `DATABASE_URL` is wrong, the API stops at startup with `Cannot connect to Supabase Postgres (check DATABASE_URL in server/.env)`.

**Other commands**

| Where | Command | What it does |
|---|---|---|
| root | `npm run build` | Production build into `dist/` |
| root | `npm run preview` | Serve the production build locally |
| root | `npm run lint` | ESLint (browser rules for `src/`, Node rules for `server/`) |
| `server/` | `npm test` | API tests on a local Postgres: run `createdb gastosaurus_test` once, then `npm test` |

To put it online, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (one Vercel project serves both the app and the API).

## 4. Features and usage

### The main flow

1. **Sign up or log in** with email and password (Supabase Auth, with "Keep me logged in" and forgot password). First-timers pick a **dino avatar** and a display name.
2. **Create a group** with **New Group**: name, icon, colour, category, and friends added by name as **guests**, so they don't need an account yet. You become the group's admin.
3. **Add an expense** with **Add Expenses**: type the amount on the calculator, pick who's in, then either
   - **Split equally**: ₱100 for 3 people becomes ₱33.34 / ₱33.33 / ₱33.33, which always adds up exactly, or
   - **Itemize it** (*ambagan*): add each item, drag or reassign items between people, share an item between several people, then **Save Expense**. A shared item costs each person its price ÷ the number of people sharing it.
4. **Check balances** on the group page and the dashboard: who is owed (+) and who owes (−), plus your monthly spending against an optional budget (**Personal Balance**).
5. **Invite people**: invite a guest's spot by email (they take over that guest's balance when they accept), or share the group's **join link**. Admins can reset the link.
6. **Settle up**: **Settlements** shows the fewest payments needed. **Pay** records a payment by GCash, bank transfer or cash (the money itself moves outside the app). It stays *pending* until the receiver taps **Confirm received**, and nobody is asked to pay the same debt twice.
7. **Notifications**: the bell updates live (Supabase Realtime) for invites, new expenses, people joining, payments to confirm and reminders. Any member can **Send Reminders** to people who owe, at most once per person every 12 hours.
8. **Leave a group** once your balance is ₱0. An admin can delete the group once everyone is settled.

How the splitting and settle-up math works, with worked examples: [docs/HOW-THE-MONEY-WORKS.md](docs/HOW-THE-MONEY-WORKS.md).

### API endpoints

Every endpoint except `/api/health` needs `Authorization: Bearer <Supabase access token>`. Routes under `/api/groups/:groupId` also require you to be a member of that group (otherwise **404**). Bad input returns **400** with a message per field, and conflicts return **409**. Request and response shapes are in [docs/ARCHITECTURE.md §6](docs/ARCHITECTURE.md#6-api).

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Liveness check (no login needed) |
| GET / PATCH | `/api/me` | Read / update my profile (name, avatar, monthly budget) |
| GET | `/api/me/summary?month=YYYY-MM` | My spending and balances for a month |
| GET | `/api/me/settle-up` | My suggested payments across all groups |
| GET / POST | `/api/groups` | List my groups with my balance / create a group |
| GET / PATCH / DELETE | `/api/groups/:groupId` | View / edit / delete a group (edit and delete: admin only) |
| POST | `/api/groups/:groupId/members` | Add a guest |
| PATCH / DELETE | `/api/groups/:groupId/members/:memberId` | Edit / remove a member (admin) |
| DELETE | `/api/groups/:groupId/members/me` | Leave a group (only when settled) |
| POST | `/api/groups/:groupId/invites` | Invite someone by email |
| POST | `/api/groups/:groupId/invite-code` | Reset the join link (admin) |
| GET | `/api/invites` | Invites sent to me |
| POST | `/api/invites/join` | Join a group with a link code |
| POST | `/api/invites/:id/accept` · `/api/invites/:id/decline` | Answer an invite |
| DELETE | `/api/invites/:id` | Cancel an invite |
| GET / POST | `/api/groups/:groupId/expenses` | List / add expenses (equal, itemized or custom split) |
| GET / PATCH / DELETE | `/api/expenses/:id` | View / edit or re-split / delete an expense |
| GET | `/api/groups/:groupId/balances` | Everyone's balance and the suggested payments |
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
│   ├── components/           one file per screen or modal (Dashboard, GroupsView, ItemizedAmbaganView, SettlementsView, …)
│   ├── hooks/                useAsync, useNotifications (Supabase Realtime)
│   ├── lib/                  api.js (calls to the API), supabase.js (login client), format.js (₱ and dates)
│   ├── data/                 dino avatars and group icon lists
│   └── assets/               images (dinos, icons, mascots)
├── server/                   Express API
│   ├── src/app.js            builds the app: helmet, CORS, JSON, routers, error handler
│   ├── src/server.js         local entry point (checks the database, then listens on :4000)
│   ├── src/config/env.js     every environment variable in one place
│   ├── src/db/pool.js        Postgres connection pool and transaction helper
│   ├── src/middleware/       requireAuth, validateBody, errorHandler
│   ├── src/lib/              splitting.js and money.js (the split math), token check, shared validators
│   ├── src/modules/<area>/   routes → validation (zod) → service (rules) → repository (SQL)
│   └── test/                 node:test tests against a local Postgres
├── api/index.js              Vercel Function entry point: exports the Express app
├── supabase/migrations/      database tables, RLS policies and triggers, applied in filename order
├── docs/                     architecture, money math, deployment, design system, QA checklist
│   └── screenshots/          the screenshots in section 6
├── public/                   static files served as-is (mascot)
├── vercel.json               sends /api/* to the function, region sin1 (Singapore)
├── README.md                 project summary and quick start
├── DOCUMENTATION.md          this file
├── SECURITY-CHECKLIST.md     completed security checklist
└── AI-USAGE.md               how AI was used, and which code is ours
```

## 6. Screenshots

| Landing page | Dashboard |
|---|---|
| ![Landing page](docs/screenshots/landing.png) | ![Dashboard with groups and balances](docs/screenshots/dashboard.png) |

| Group expenses | Itemized ambagan split |
|---|---|
| ![A group's expenses and balances](docs/screenshots/group-expenses.png) | ![Splitting items between people](docs/screenshots/itemized-split.png) |

| Settlements |
|---|
| ![Settle up with pending payments](docs/screenshots/settlements.png) |

## 7. Known issues and next steps

**Known issues**

- **The API connects to Postgres as the owner role**, which has more rights than it needs and bypasses RLS. Every service checks group membership itself, but a mistake there wouldn't be caught by the database ([checklist row 15](SECURITY-CHECKLIST.md)).
- **The database accepts connections from any IP** (password and SSL are still required), because Vercel Functions have no fixed IP to allow-list.
- **Sign-up needs email confirmation.** Supabase's built-in email sender is rate-limited and only reaches addresses on the Supabase team unless custom SMTP is set up. If the email doesn't arrive, check Spam/Promotions.
- **Payments are records only.** Choosing GCash, bank or cash doesn't move money; the receiver confirms it arrived.
- **Leaked-password protection is off** in Supabase Auth (flagged by the Supabase security advisor).
- **No rate limiting** on the API beyond Supabase Auth's own limits, and **no CI**: tests only run locally because they need a local Postgres.
- **Three early commits carry a lab PC's git identity** (someone else's email in the author field). Rewriting history would break the commit links in `AI-USAGE.md`, so it's documented instead ([checklist row 27](SECURITY-CHECKLIST.md)).
- Google sign-in was removed on purpose; login is email and password only.

**Next steps**

1. Give the API its own Postgres role with only `SELECT/INSERT/UPDATE/DELETE` on the app's tables.
2. Add a GitHub Actions workflow that runs `npm run lint` and the API tests against a Postgres service container.
3. Add `express-rate-limit` on write routes and turn on leaked-password protection.
4. Set up custom SMTP so anyone can sign up without hitting the built-in email limits.
5. Export a group's history as CSV, and add recurring expenses (rent, subscriptions).

---

## Security checklist

The completed security checklist is in [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md). Every row is answered Yes, No or N/A with what was checked.

## AI usage

Built with heavy AI assistance: Claude (Claude Code) wrote the backend and connected the frontend to it; the React frontend, the Vercel deployment and the dino avatar picker are ours. Details, mistakes the AI made, and who wrote what: [AI-USAGE.md](AI-USAGE.md).

## More documentation

| Document | What's in it |
|---|---|
| [README.md](README.md) | Project summary, quick start, presentation and AI usage links |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the system is built: diagrams, data model, login flow, full API reference |
| [docs/HOW-THE-MONEY-WORKS.md](docs/HOW-THE-MONEY-WORKS.md) | The app flow and the splitting / settle-up math in plain language |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Putting the app and API online on Vercel |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | UI tokens, components and layout rules |
| [docs/QA-CHECKLIST.md](docs/QA-CHECKLIST.md) | What to click through before a demo or release |
| [server/README.md](server/README.md) | API-only setup, endpoints, tests and how to add a module |
| [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) | Completed security checklist |
| [AI-USAGE.md](AI-USAGE.md) | How AI was used in this project |

## Credits

- **Font:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) via Google Fonts (SIL Open Font License).
- **Icons:** [Lucide](https://lucide.dev/) via `lucide-react` (ISC license).
