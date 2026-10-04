# Deploying Gastosaurus (everything on Vercel)

One Vercel project serves both halves:

| Piece | Runs as | URL |
|---|---|---|
| React app (`src/`) | Static site built by Vite | `https://<your-app>.vercel.app` |
| Express API (`server/`) | One Vercel Function (`api/index.js`) | `https://<your-app>.vercel.app/api/*` |
| Database + login | Supabase (already live) | `https://oieupqfsmnbcoatoicef.supabase.co` |

Vercel Functions don't sleep. The first request after a quiet period has a cold start of about a second, not a long wake-up.

### How it's wired

- `api/index.js` imports `createApp()` from `server/src/app.js` and exports it. Vercel runs it as a function.
- `vercel.json` rewrites `/api/(.*)` to that function (Express still sees the original path) and runs it in
  **`sin1` (Singapore)**, the same region as the Supabase database, so each SQL query stays fast.
- The server's dependencies (`express`, `pg`, `zod`, …) are also listed in the **root** `package.json`, because
  Vercel only installs the root.
- `server/src/db/pool.js`: on Vercel, it keeps a small pool and calls `attachDatabasePool` so idle connections close cleanly.
- Same origin, so no CORS setup and no `VITE_API_URL`.

Local development is unchanged: `cd server && npm run dev` plus `npm run dev` at the root.

---

## Keys and values (Vercel → Project → Settings → Environment Variables)

| Name | Value | Secret? |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://oieupqfsmnbcoatoicef.supabase.co` | No |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_X_GIvsZsh4xokrg_Gok9WQ_rZuW2t1X` | No |
| `SUPABASE_URL` | `https://oieupqfsmnbcoatoicef.supabase.co` | No |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_X_GIvsZsh4xokrg_Gok9WQ_rZuW2t1X` | No |
| `DATABASE_SSL` | `true` | No |
| `DATABASE_URL` | The **Transaction pooler** string (port **6543**), see below | **YES** |

**`DATABASE_URL`:** take the line from your local `server/.env` and change the port from `:5432` to `:6543`:

```
postgresql://postgres.oieupqfsmnbcoatoicef:<DB-PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

(Or in Supabase, click **Connect**, open the **Transaction pooler** tab and copy that string.) Transaction mode is the one
Supabase recommends for serverless, because many short-lived function instances share a few database connections.
Forgot the password? Project Settings → Database → Reset database password (then update your local `server/.env`).

Do **not** set `NODE_ENV` on Vercel. It would make the build skip Vite and fail. Vercel handles it.
You don't need the `service_role` / `sb_secret_…` key. Never commit `DATABASE_URL` or paste it anywhere public.

---

## Step 1 — Get the code onto `main`

```bash
cd gastosaurus
git add -A
git status            # check that no .env file is in the list
git commit -m "feat: deploy API as a Vercel Function; deployment guide"
git push
```

On GitHub: **Pull requests → New → base `main` ← compare `backend-groups` → Create → Merge.**
Then locally: `git checkout main && git pull`.

## Step 2 — Create the Vercel project

1. Sign in at <https://vercel.com> with the GitHub account that can see `francoiseee/gastosaurus`.
2. **Add New → Project → Import `francoiseee/gastosaurus`.**
3. Framework Preset: **Vite** (auto). Root Directory: `./`. Build: `npm run build`. Output: `dist`.
4. Open **Environment Variables** and add all six rows above (all environments is fine).
5. **Deploy.**

## Step 3 — Check it

- `https://<your-app>.vercel.app/api/health` → `{"status":"ok"}` (the function is up)
- `https://<your-app>.vercel.app/api/me` → `401 … Please log in` (the routing works)
- The site loads and you can sign up / log in.

If an API call returns 500, open **Vercel → Project → Logs** (or the deployment → Functions). The usual cause is a wrong
`DATABASE_URL` password or port.

## Step 4 — Supabase settings for the live URL

**Authentication → URL Configuration**
- Site URL: `https://<your-app>.vercel.app`
- Redirect URLs: keep `http://localhost:5173/**`, add `https://<your-app>.vercel.app/**`

Without this, confirmation and password-reset links send people back to localhost.

**Authentication → Sign In / Providers → Email:** for class demos, turn **Confirm email** off
(the built-in mailer only reaches your own team and is rate-limited), or set up custom SMTP.

## Step 5 — Smoke test

On the live site: sign up → create a group → add an itemized expense → check balances → record and confirm a payment →
open a join link (`/?join=<code>`) in a private window → check that the bell updates live. Full list: `docs/QA-CHECKLIST.md`.

---

## Good to know

- **Auto-deploys:** every push to `main` redeploys. Other branches get their own preview URLs (login redirects on
  previews go to the Site URL unless you add `https://*-<your-team>.vercel.app/**` to Supabase Redirect URLs).
- **`VITE_*` values are baked in at build time.** After changing one, redeploy.
- **Supabase free projects pause** after about a week with no activity at all. Any real use keeps it awake; if it pauses,
  click Restore in the Supabase dashboard.
- **Hobby (free) plan** covers a class project easily. Vercel's terms say Hobby is for non-commercial use.
- **New migrations** aren't run by deploys. Run new files in `supabase/migrations/` in the SQL Editor, then check Advisors.
- The bundle-size warning (> 500 kB) during `vite build` is harmless.
