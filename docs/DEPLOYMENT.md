# Deploying Gastosaurus (everything on Vercel)

The live app is at **https://gastosaurus-francoise.vercel.app/**. This guide shows how to deploy your own copy. For running it on your own computer instead, see the [documentation](../DOCUMENTATION.md#2-setup-and-installation).

## How it's wired

One Vercel project serves both halves:

| Piece | Runs as | URL |
|---|---|---|
| React app (`src/`) | Static site built by Vite | `https://<your-app>.vercel.app` |
| Express API (`server/`) | One Vercel Function (`api/index.js`) | `https://<your-app>.vercel.app/api/*` |
| Database + login | Supabase | `https://<your-project-ref>.supabase.co` |

- `api/index.js` imports `createApp()` from `server/src/app.js` and exports it. Vercel runs it as a function.
- `vercel.json` rewrites `/api/(.*)` to that function (Express still sees the original path) and runs it in
  **`sin1` (Singapore)**, the same region as the Supabase database, so each SQL query stays fast.
- The server's dependencies (`express`, `pg`, `zod`, …) are also listed in the **root** `package.json`, because
  Vercel only installs the root.
- `server/src/db/pool.js`: on Vercel, it keeps a small pool and calls `attachDatabasePool` so idle connections close cleanly.
- The app and API share one origin, so there is no CORS setup and no `VITE_API_URL`.
- Vercel Functions don't sleep. The first request after a quiet period has a cold start of about a second.

## Before you start

- The code is on GitHub (`main` branch).
- A Supabase project with all the migrations applied (DOCUMENTATION.md §2.5).
- A [Vercel](https://vercel.com) account signed in with a GitHub account that can see the repository.

## Step 1: Create the Vercel project

1. **Add New → Project → Import** the `gastosaurus` repository.
2. Framework Preset: **Vite** (auto). Root Directory: `./`. Build command: `npm run build`. Output: `dist`.
3. Don't deploy yet; add the environment variables first (Step 2).

## Step 2: Environment variables

In **Vercel → Project → Settings → Environment Variables**, add these six (all environments is fine):

| Name | Example value | Secret? |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-ref.supabase.co` | No |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_your-publishable-key` (Supabase → Project Settings → API Keys) | No |
| `SUPABASE_URL` | `https://your-project-ref.supabase.co` | No |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_your-publishable-key` | No |
| `DATABASE_SSL` | `true` | No |
| `DATABASE_URL` | The **Transaction pooler** string (port **6543**), see below | **YES** |

**`DATABASE_URL`:** take the line from your local `server/.env` and change the port from `:5432` to `:6543`:

```
postgresql://postgres.your-project-ref:YOUR-PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

(Or in Supabase, click **Connect**, open the **Transaction pooler** tab and copy that string.) Transaction mode is the one
Supabase recommends for serverless, because many short-lived function instances share a few database connections.
Forgot the password? Project Settings → Database → Reset database password (then update your local `server/.env`).

- Do **not** set `NODE_ENV` on Vercel. It would make the build skip Vite's dev dependencies and fail. Vercel handles it.
- You don't need the `service_role` / `sb_secret_…` key.
- Never commit `DATABASE_URL` or paste it anywhere public.

Then click **Deploy**.

## Step 3: Supabase settings for the live URL

**Authentication → URL Configuration**
- Site URL: `https://<your-app>.vercel.app`
- Redirect URLs: keep `http://localhost:5173/**`, add `https://<your-app>.vercel.app/**`

Without this, confirmation and password-reset links send people back to localhost.

**Authentication → Sign In / Providers → Email:** for class demos, turn **Confirm email** off
(the built-in mailer only reaches your own team and is rate-limited), or set up custom SMTP.

## Step 4: Check it

- `https://<your-app>.vercel.app/api/health` → `{"status":"ok"}` (the function is up)
- `https://<your-app>.vercel.app/api/me` → `401 … Please log in` (the routing works)
- The site loads and you can sign up and log in.

Then smoke-test on the live site: sign up → create a group → add an itemized expense → check balances → record and confirm
a payment → open a join link (`/?join=<code>`) in a private window → check that the bell updates live.
Full list: [QA-CHECKLIST.md](QA-CHECKLIST.md).

## Troubleshooting

- **An API call returns 500:** open **Vercel → Project → Logs** (or the deployment → Functions). The usual cause is a wrong
  `DATABASE_URL` password or port.
- **Login links go to localhost:** Step 3 wasn't saved.
- **Changed a `VITE_*` value but nothing changed:** those are baked in at build time. Redeploy.
- **The bundle-size warning (> 500 kB)** during `vite build` is harmless.

## Good to know

- **Auto-deploys:** every push to `main` redeploys. Other branches get their own preview URLs (login redirects on
  previews go to the Site URL unless you add `https://*-<your-team>.vercel.app/**` to Supabase Redirect URLs).
- **New migrations aren't run by deploys.** Run new files in `supabase/migrations/` in the SQL Editor, then check Advisors.
- **Supabase free projects pause** after about a week with no activity at all. If it pauses, click Restore in the Supabase dashboard.
- **Hobby (free) plan** covers a class project easily. Vercel's terms say Hobby is for non-commercial use.
