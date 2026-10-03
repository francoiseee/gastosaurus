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

## Endpoints (Phase 1)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/health` | – | `{ "status": "ok" }` |
| GET | `/api/me` | Bearer token | Your profile |
| PATCH | `/api/me` | Bearer token | `{ name?, avatarEmoji?, monthlyBudget? }` |

Try it with the token from a logged-in browser (DevTools console: `(await supabase.auth.getSession()).data.session.access_token`, or copy it from localStorage):

```bash
curl http://localhost:4000/api/me -H "Authorization: Bearer <token>"
```

## Tests

Tests run against a **local** throwaway Postgres (never Supabase) and a fake Supabase Auth server that the tests start themselves.

```bash
createdb gastosaurus_test           # needs a local Postgres, e.g. Postgres.app on Mac
cp .env.test.example .env.test
npm test
```

## Database changes

Schema lives in [`../supabase/migrations/`](../supabase/migrations). To add a table, create a new numbered `.sql` file (with RLS policies) and apply it through the Supabase dashboard's SQL editor or the Supabase CLI. The tests apply every migration automatically.

## Adding a feature module

```
src/modules/groups/
  groups.routes.js       router + requireAuth + validateBody
  groups.validation.js   zod schemas
  groups.service.js      rules (e.g. only members can add expenses)
  groups.repository.js   SQL only
```

Mount it in `src/app.js` with `app.use('/api/groups', groupsRouter)`.
