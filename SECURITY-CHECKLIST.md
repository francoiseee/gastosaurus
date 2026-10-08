# Security checklist

**Project:** Gastosaurus · **Repository:** https://github.com/francoiseee/gastosaurus · **Live app:** https://gastosaurus-francoise.vercel.app/
**Checked on:** 2026-10-08, against `main`, the Supabase project `gastosaurus` and the Vercel project `gastosaurus`.

Every row is answered **Yes**, **No** or **N/A**, with what I checked, where, and what I found.

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 1 | `.env` is gitignored and is not in the repository | Yes | `.gitignore` lines 9–13 ignore `.env`, `.env.local`, `.env.*.local`, `server/.env` and `server/.env.test` (and `server/.gitignore` repeats it). `git ls-files` lists only the three `*.example` files, and `git log --all -- .env .env.local server/.env server/.env.test` returns nothing, so a real `.env` was never committed. |
| 2 | A `.env.example` with placeholder values only is committed | Yes | `.env.example` (frontend) and `server/.env.example` (API) list every variable with placeholders: `https://your-project-ref.supabase.co`, `sb_publishable_your-publishable-key`, `[YOUR-PASSWORD]`. `server/.env.test.example` points at a throwaway local test database (`postgres:postgres@localhost/gastosaurus_test`), not a real server. |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | Yes | `server/src/config/env.js` reads `DATABASE_URL`, `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from the environment and stops if one is missing; `src/lib/supabase.js` reads `import.meta.env.VITE_*`. `git grep` for `sb_secret`, `service_role`, `eyJhbGci` (JWTs) and `postgres://` finds only placeholders, docs that say *not* to commit them, and the local test URL above. |
| 4 | Git history is clean: I searched `git log -p` for password, secret, api key and `postgres://` | Yes | Ran `git log --all -p` with a search for password, secret, api key, `sb_secret`, `service_role`, JWTs and `postgres(ql)://`. Hits are only placeholders (`[YOUR-PASSWORD]`, `<DB-PASSWORD>`), the local test URL, and test strings like `password: "asdf"` inside `node_modules` (zod's own tests), which were committed by mistake early on and untracked in 7db6529. No real database password or secret key appears. |
| 5 | Any credential that was ever committed has been rotated | N/A | No secret was ever committed (checked in rows 1 and 4). The only key that was ever in the repo is the Supabase *publishable* key, which is public by design: it ships inside the browser bundle of the live site, and data is protected by Row Level Security (row 19), so there is nothing to rotate. |
| 6 | Production credentials live only in my hosting provider's environment settings | Yes | Vercel → gastosaurus → Settings → Environment Variables holds `DATABASE_URL`, `DATABASE_SSL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, all marked Sensitive (the Supabase integration's `POSTGRES_*` / `SUPABASE_*` variables are there too, also Sensitive). The database password exists only there and in my local, gitignored `server/.env`. |

## GitHub Actions

This project has **no workflows**: there is no `.github/` folder, and Vercel deploys straight from its GitHub integration, so every row in this section is N/A.

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 7 | No secret value is written literally in any workflow YAML file | N/A | No workflows (no `.github/workflows/`). |
| 8 | Secrets are stored in repository Actions secrets and read with `${{ secrets.NAME }}` | N/A | No workflows; production secrets live in Vercel instead (row 6). |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | N/A | No workflows, so there are no runs or run logs. |
| 10 | Uploaded build artifacts contain no `.env`, key file or generated config | N/A | No workflows upload artifacts. The Vercel build only bundles `VITE_*` values, which are public. |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | N/A | No workflows, so no third-party actions are used. |
| 12 | Secret scanning and push protection are enabled on the repository | N/A | Marked N/A with the rest of this section because the project has no workflows, as the template instructs. |

## Database

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 13 | Every query taking user input uses parameters, never string concatenation | Yes | Every query goes through `pg` with `$1, $2…` placeholders (`server/src/db/pool.js` `query()`, and all `*.repository.js` files). The only SQL built with `${…}` are column names in `groups.repository.js` and `profile.repository.js`, and those come from fixed maps in the code (`GROUP_COLUMNS`, the profile `map`), never from the request. |
| 14 | The database is not open to the whole internet, or is reachable only by the app | No | The Supabase Postgres pooler accepts connections from any IP. It needs the database password and SSL (`DATABASE_SSL=true`), but I can't restrict it to the app's IP because Vercel Functions don't have a fixed IP. Supabase's REST API is also public, but with only the publishable key it is blocked by RLS (row 19). |
| 15 | The database user the app connects as has only the permissions it needs | No | The API connects as `postgres.<project-ref>`, the project owner role (`rolbypassrls = true`, `rolcreaterole = true`), which has more rights than the API needs. To make up for it, every service checks group membership before reading or writing (`requireGroupMember` / `assertMember` in `server/src/modules/groups/membership.js`). Next step: create a role with only `SELECT/INSERT/UPDATE/DELETE` on the app's tables. |
| 16 | Seed and sample data is invented, not real people's data | Yes | There is no seed script; the live database only contains what we typed into the app ourselves. The automated tests create invented people with `@example.com` addresses (a reserved domain) in a throwaway local database (`server/test/`). |
| 17 | Debug, seed and reset routes are removed before going public | Yes | `server/src/app.js` mounts only the real feature routers plus `GET /api/health`, which returns `{ "status": "ok" }` and nothing else. Searching `server/src` and `api/` for seed, reset, debug and test routes finds none (the only "reset" is an admin resetting a group's invite link, which needs login and admin rights). |

## Access control

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | Yes | A real login: sign-up, log-in and password reset with Supabase Auth (`src/components/AuthModal.jsx`). Every API request must carry the user's Supabase access token, which `server/src/middleware/requireAuth.js` verifies (`server/src/lib/verifySupabaseToken.js`). |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | Yes | RLS is enabled on all 10 tables in `public` (every migration in `supabase/migrations/` has `enable row level security`), and the policies are read-only for `authenticated` users. I tested it signed out on 2026-10-08 as the `anon` role: selecting from groups, members, expenses, settlements, notifications, profiles and invites returned 0 rows (the database holds 7 groups, 13 expenses and 24 notifications), and an `INSERT` into `groups` failed with "new row violates row-level security policy". The Supabase security advisor reports no RLS issues. |
| 20 | If Zero Trust: tjakoen.s@gmail.com is on the access policy. If an app password: the credentials are in my private workspace `project/README.md` | N/A | Neither applies: the app has no Zero Trust policy and no shared app password. Access is a real login where each person signs up for their own account (row 18), so there are no gate credentials to hand over. |
| 21 | The gate covers every route, including the ones that only change data | Yes | Every router runs `router.use(requireAuth)` before its routes (`server/src/modules/*/*.routes.js`), and everything under `/api/groups/:groupId` also runs `requireGroupMember`, so outsiders get 404. The only route without login is `GET /api/health`. Tests check that requests with no token, a bad token or an expired token get 401 (`server/test/profile.test.js`, `server/test/groups.test.js`). Direct writes through Supabase's REST API are blocked by RLS (row 19). |
| 22 | The credentials for the gate are environment variables, not in source | Yes | The API checks tokens against `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` from the environment (`server/src/config/env.js`); the frontend uses `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`. Users' passwords are stored by Supabase Auth, never in our database or code. |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 23 | Input from the user is validated on the server, not only in the browser | Yes | Every `POST`/`PATCH` with a body runs a zod schema through `validateBody` (`server/src/middleware/validate.js`, schemas in `*.validation.js`); bad input returns 400 with field messages. Path ids are checked with `assertUuid`, query strings are parsed with zod (`paging`, `listQuery`) or a regex (`month`), and the database adds checks plus a trigger that rejects an expense whose shares don't add up to its total. |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | Yes | The frontend is React, which escapes text in JSX. Searching `src/` for `dangerouslySetInnerHTML`, `innerHTML`, `eval(` and `document.write` finds nothing. |
| 25 | Error responses do not expose stack traces, file paths or connection details | Yes | `server/src/middleware/errorHandler.js` sends only `{ error: { code, message } }`. For unexpected errors it sends a generic "Something went wrong" message, and adds `detail` only when not in production (on Vercel, `env.js` treats the deployment as production). The full error is logged on the server only (`console.error`). |
| 26 | CORS is not a wildcard on routes that change data | Yes | `server/src/app.js` uses `cors({ origin: env.clientOrigin })`, one exact origin (default `http://localhost:5173`), never `*`. In production the frontend and API share one origin on Vercel, so no other site gets CORS access. The API also uses Bearer tokens, not cookies. |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 27 | No student number, personal email, phone number or home address in the repository or in commit messages | No | The files and commit *messages* have none: searching for emails finds only `@example.com` test addresses and form placeholders, and there are no phone or student numbers. But 3 early commits (e50b1c0, ae82678, 0a0700f, 23 Sep) have a personal Gmail that isn't any of ours as the *author* email, because the school computer-lab PC I used had someone else's git identity configured. My own commits use my GitHub noreply address. Fixing it means rewriting history, which would change every commit hash linked in `AI-USAGE.md`, so I'm leaving it and reporting it here. |
| 28 | No classmate's personal data in the repository | Yes | No classmate's email, phone, address or student number is in any file. The test fixtures use first names with invented `@example.com` addresses, and the screens and docs use made-up people (Miguel, Bea, Alex). (The lab-PC author email is covered in row 27.) |
| 29 | Dependencies come from official registries, and `node_modules` is gitignored | Yes | All 368 `resolved` entries in `package-lock.json` and `server/package-lock.json` point to `https://registry.npmjs.org`. `node_modules/` and `server/node_modules/` are in `.gitignore` (lines 2–3); the copy committed by mistake early on was untracked in 7db6529. |
| 30 | Images, fonts and other assets are mine, licensed, or credited | Yes | The dino avatars, the group icon sets, the mascots, the ribbon and the background in `src/assets/` and `public/` were made by our team. The font is Plus Jakarta Sans from Google Fonts (SIL Open Font License) and the UI icons come from `lucide-react` (ISC license); both are credited in the README. |
| 31 | Repository visibility is deliberate, and I checked it after my last push | Yes | The repository is public on purpose because the course requires a public repository. After pushing this checklist I checked `https://api.github.com/repos/francoiseee/gastosaurus`, which reports `"visibility": "public"`, and confirmed nothing secret is in it (rows 1–4). |

## Anything I found and fixed

The checklist caught three things I didn't know about. Our `.env.example` files had the real Supabase project URL and publishable key in them instead of placeholders. The key is public anyway, but I replaced both with placeholders and pointed the setup docs at where to get your own. It also showed that a school lab PC recorded three of our early commits under someone else's personal email (row 27), and that the API connects to Postgres as the owner role (row 15). I didn't fix those two tonight: one would mean rewriting history, the other a new database role. Both are listed as next steps in the README, along with Supabase's advisor warning that leaked-password protection is turned off.
