# Gastosaurus API (`server/`)

The Express + PostgreSQL backend. Login itself is handled by **Supabase Auth** in the browser. This API receives the user's Supabase access token and does all the app logic. See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for the full design.

## Setup

```bash
cd server
npm install
cp .env.example .env
```

Then fill in `DATABASE_URL` in `.env`:

1. Open the **gastosaurus** project in [Supabase](https://supabase.com/dashboard/project/oieupqfsmnbcoatoicef) and click **Connect** at the top.
2. Copy the **Session pooler** connection string (it works on any network and supports IPv4).
3. Replace `[YOUR-PASSWORD]` with the database password. If you don't know it, set a new one at **Project Settings → Database → Reset database password**.

`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are already filled in.

## Run

```bash
npm run dev      # http://localhost:4000, restarts on file changes
```

Check it's alive at http://localhost:4000/api/health. Run the frontend from the repo root with `npm run dev`; Vite forwards `/api` here.

## Endpoints

| Area | Endpoints |
|---|---|
| Health | `GET /api/health` |
| Me | `GET/PATCH /api/me` · `GET /api/me/summary?month=YYYY-MM` · `GET /api/me/settle-up` |
| Groups | `GET/POST /api/groups` · `GET/PATCH/DELETE /api/groups/:groupId` |
| Members | `POST /api/groups/:groupId/members` · `PATCH/DELETE /api/groups/:groupId/members/:memberId` · `DELETE /api/groups/:groupId/members/me` |
| Invites | `POST /api/groups/:groupId/invites` · `GET /api/invites` · `POST /api/invites/:id/accept` · `POST /api/invites/:id/decline` · `DELETE /api/invites/:id` |
| Expenses | `GET/POST /api/groups/:groupId/expenses` · `GET/PATCH/DELETE /api/expenses/:id` |
| Balances | `GET /api/groups/:groupId/balances` |
| Payments | `GET/POST /api/groups/:groupId/settlements` · `PATCH/DELETE /api/settlements/:id` |

Request and response shapes are in [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) §6. The splitting math is explained in [`../docs/HOW-THE-MONEY-WORKS.md`](../docs/HOW-THE-MONEY-WORKS.md).

Try it with the token from a logged-in browser (DevTools console: `(await supabase.auth.getSession()).data.session.access_token`, or copy it from localStorage):

```bash
curl http://localhost:4000/api/me -H "Authorization: Bearer <token>"
```

## Tests

Tests run against a **local** throwaway Postgres (never Supabase) and a fake Supabase Auth server that the tests start themselves. `test/splitting.test.js` covers the algorithm alone; `test/groups.test.js` walks a whole barkada through the API (create → split → claim invite → settle → leave). Test files run one at a time because they share the test database.

```bash
createdb gastosaurus_test           # needs a local Postgres, e.g. Postgres.app on Mac
cp .env.test.example .env.test
npm test
```

## Database changes

Schema lives in [`../supabase/migrations/`](../supabase/migrations). To add a table, create a new numbered `.sql` file (with RLS policies) and apply it through the Supabase dashboard's SQL editor or the Supabase CLI.

**Phase 2 needs two new migrations on Supabase**, applied in order: `20261003020000_create_groups.sql`, then `20261003030000_create_expenses_and_settlements.sql`. Paste each one into **SQL Editor → New query → Run**. Then check **Advisors** for warnings. The tests apply every migration automatically.

## Adding a feature module

```
src/modules/groups/
  groups.routes.js       router + requireAuth + validateBody
  groups.validation.js   zod schemas
  groups.service.js      rules (e.g. only members can add expenses)
  groups.repository.js   SQL only
```

Mount it in `src/app.js` with `app.use('/api/groups', groupsRouter)`.
