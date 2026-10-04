# AI usage

**Project:** Gastosaurus, a group expense tracker with "ambagan"-style splitting
**Repository owner:** [@francoiseee](https://github.com/francoiseee) · **Live app:** https://gastosaurus-francoise.vercel.app/
**Assistants used:** Google Antigravity for help while I wrote the React frontend; Claude (Claude Code, model Claude Opus 5.5) for the whole backend, the database, connecting the frontend to it, some later fixes and a cleanup pass, and the first draft of this file.

**Honest summary.** I wrote the frontend myself (commits 9137d2a and 3a7d428), with help from Antigravity on parts of it. The backend is AI-written: every commit in `server/` and `supabase/` is authored by Claude, with a `Co-Authored-By: Claude` line and a link to the session it came from. For the backend, my part was deciding what to build and in what order, reviewing and merging each phase through a pull request, and catching the problems in section 2. After that I wrote the Vercel deployment and the dino avatar picker myself, and used Claude for smaller fixes and a final cleanup.

Commit links below point to `https://github.com/francoiseee/gastosaurus`.

---

## 1. How I used AI

### 1.1 Help while building the frontend screens (26–27 Sep 2026)
- **Tool:** Google Antigravity
- **What I asked for:** Help with CSS layout when a card or modal didn't come out like our Figma design.
- **What came back:** Suggested CSS fixes for those layouts.
- **What I kept / changed and why:** I kept the fixes that made the screens match the Figma. I built the screens from our Figma design myself: landing page, dashboard, groups, create-group modal, members, expenses, add-expense calculator, itemized ambagan, payment, settlements, notifications.
- **Commits:** [9137d2a](https://github.com/francoiseee/gastosaurus/commit/9137d2a5f15ca90a0886bf1b8c8acbc94e4ef7bf), [3a7d428](https://github.com/francoiseee/gastosaurus/commit/3a7d4288019bf44d45f69295a1e1bc2e90e1141e)

### 1.2 Cleaning up the repository (3 Oct 2026)
- **Tool:** Claude (Claude Code)
- **What I asked for:** To get the repo ready for a backend, because `node_modules/`, `dist/` and `.DS_Store` files had been committed by mistake.
- **What came back:** A commit that stops tracking those generated files and a `.gitignore` that also keeps every `.env` file out of git.
- **What I kept / changed and why:** Kept as is. Keeping `.env` out of git matters most, since the Supabase keys and database URL live there.
- **Commit:** [7db6529](https://github.com/francoiseee/gastosaurus/commit/7db6529b655fa4e33d31d94fb150f6caf38033ce)

### 1.3 Backend architecture and the Express skeleton (3 Oct 2026)
- **Tool:** Claude (Claude Code)
- **What I asked for:** A plan for the Node + Express + PostgreSQL backend that our frontend needs, and the basic server to build on.
- **What came back:** `docs/ARCHITECTURE.md` (data model, API plan, phased roadmap) and `server/`: an Express 5 app, a `pg` connection pool, zod request validation, and one error handler that turns every failure into the same JSON shape.
- **What I kept / changed and why:** I chose Supabase as the Postgres host and asked for each phase on its own feature branch, so I could review and merge it through a pull request. I kept the plan's phase order (accounts → groups → expenses → balances → notifications) because each phase depends on the one before it.
- **Commit:** [34b1e7f](https://github.com/francoiseee/gastosaurus/commit/34b1e7f398b399d164363fed66da6bc2af45691b), merged in [PR #1](https://github.com/francoiseee/gastosaurus/pull/1)

### 1.4 Sign-up and login with Supabase Auth (3 Oct 2026)
- **Tool:** Claude (Claude Code)
- **What I asked for:** Real accounts behind our login/sign-up modal.
- **What came back:** The `AuthModal` wired to Supabase Auth (email sign-up, login, Google, forgot password, "Keep me logged in"; I removed Google sign-in later, see 1.12); a `profiles` table migration with row-level security and a trigger that creates a profile on sign-up; middleware that verifies the Supabase token on every API request; `GET/PATCH /api/me`; integration tests.
- **What I kept / changed and why:** I chose Supabase Auth instead of writing our own password handling, so we never store passwords ourselves. The rest I kept.
- **Commit:** [34b1e7f](https://github.com/francoiseee/gastosaurus/commit/34b1e7f398b399d164363fed66da6bc2af45691b)

### 1.5 The ambagan splitting engine (3 Oct 2026)
- **Tool:** Claude (Claude Code)
- **What I asked for:** The core money logic: equal splits, itemized splits where people only pay for what they ordered, custom splits, and a "Settle Up" that suggests who pays whom.
- **What came back:** `server/src/lib/money.js` and `server/src/lib/splitting.js` (all amounts in integer centavos, largest-remainder rounding, a greedy settle-up), 16 unit tests, and `docs/HOW-THE-MONEY-WORKS.md`.
- **What I kept / changed and why:** Kept as is. This is the AI-written code I explain in section 3.
- **Commit:** [c440ccd](https://github.com/francoiseee/gastosaurus/commit/c440ccd0e15ff11a51250cf95a3e20af166fb10b)

### 1.6 Groups, expenses and settlements API with migrations (3 Oct 2026)
- **Tool:** Claude (Claude Code)
- **What I asked for:** The endpoints and tables for groups, members (including guests added by name), email invites, expenses and payments.
- **What came back:** Route/service/repository modules for groups, invites, expenses, balances and settlements; two migrations (read-only RLS, composite foreign keys, and a trigger that rejects an expense whose shares don't add up to its total); an end-to-end API test.
- **What I kept / changed and why:** Kept, but this commit had two of the problems in section 2: settle-up ignored pending payments, and the paging schema was copy-pasted across route files.
- **Commit:** [c440ccd](https://github.com/francoiseee/gastosaurus/commit/c440ccd0e15ff11a51250cf95a3e20af166fb10b), merged in [PR #2](https://github.com/francoiseee/gastosaurus/pull/2)

### 1.7 Notifications, reminders and join links (3 Oct 2026)
- **Tool:** Claude (Claude Code)
- **What I asked for:** The notification bell, payment confirmations, settle-up reminders, and invite links people can join with.
- **What came back:** A `notifications` table with Supabase Realtime, `notify.js` (the one place that decides who gets told what), reminders with a 12-hour cooldown, and invite codes with an admin reset.
- **What I kept / changed and why:** Kept. The same commit also has my fixes for section 2's cases 2.1, 2.2 and 2.4.
- **Commit:** [addbde0](https://github.com/francoiseee/gastosaurus/commit/addbde061c133e86a488ecbd439b096331f52fe9)

### 1.8 Every screen on real data (3 Oct 2026)
- **Tool:** Claude (Claude Code)
- **What I asked for:** Replace the mock data on every screen with calls to the API.
- **What came back:** `src/lib/api.js`, the `useAsync` and `useNotifications` hooks, `lib/format.js`, and rewritten screens (dashboard, groups, expenses, add-expense flow, settlements, notifications).
- **What I kept / changed and why:** Kept. Claude also wrote `docs/QA-CHECKLIST.md`, a click-through test with two accounts. I tested the app with two accounts, which is how I found case 2.1.
- **Commit:** [addbde0](https://github.com/francoiseee/gastosaurus/commit/addbde061c133e86a488ecbd439b096331f52fe9)

### 1.9 Removing dead code (3 Oct 2026)
- **Tool:** Claude (Claude Code)
- **What I asked for:** Delete everything the app no longer used once it was on real data (see case 2.3).
- **What came back:** Deleted `mockData.js`, three unused components and the ~560 lines of CSS only they used.
- **What I kept / changed and why:** Kept. I left the root `assets/` folder for now because the designer still needs to OK removing it.
- **Commit:** [72898b9](https://github.com/francoiseee/gastosaurus/commit/72898b9e456e0509029b06408fa203d6b3264298)

### 1.10 Drafting this file and the README credit (3 Oct 2026)
- **Tool:** Claude
- **What I asked for:** A first draft of AI-USAGE.md and the README credit, built from the repo's git history.
- **What came back:** Entries built from the commit messages and diffs, with every commit linked. The parts only I could write (what I asked Antigravity, my explanations in section 3) were left as TODOs.
- **What I kept / changed and why:** Kept the structure and the commit links. I corrected how my frontend work was described. Claude then filled in the TODO parts from my answers (what I asked Antigravity, how I found case 2.1) and from git blame, which is why section 3 marks exactly which lines in each file are mine and which are Claude's.
- **Commit:** [fb03124](https://github.com/francoiseee/gastosaurus/commit/fb031249e5964a83d7e9e1521fe8953fd627bfaa)

### 1.11 Small fixes after testing (3 Oct 2026)
- **Tool:** Claude
- **What I asked for:** Three fixes from clicking through the app: a way to share one item between people on the item-split screen, a hint for people who can't find their confirmation email, and an "Other" group category.
- **What came back:** The "Reassign to" menu became a "Split with" menu that adds or removes people on an item (the bucket owner always stays on it) ([c42c478](https://github.com/francoiseee/gastosaurus/commit/c42c47804c262b7a56e9bfda232c4e70d5cedd1c)); a "check your Spam or Promotions folder" line on the check-your-email screen ([685f359](https://github.com/francoiseee/gastosaurus/commit/685f359f5605ac9f7f01f3ccd9c1e91f1c1381a0)); and an "Other" category with a dino icon ([d8eff3a](https://github.com/francoiseee/gastosaurus/commit/d8eff3af3105abebb2df7a50a8a5008a2341944f)). That last change also updated the server's `iconId` validation so the API accepts `dino`.
- **What I kept / changed and why:** Kept all three. The split menu fits how ambagan really works: one item is often shared by a few people, not moved to one person.
- **Commits:** [c42c478](https://github.com/francoiseee/gastosaurus/commit/c42c47804c262b7a56e9bfda232c4e70d5cedd1c), [685f359](https://github.com/francoiseee/gastosaurus/commit/685f359f5605ac9f7f01f3ccd9c1e91f1c1381a0), [d8eff3a](https://github.com/francoiseee/gastosaurus/commit/d8eff3af3105abebb2df7a50a8a5008a2341944f)

### 1.12 Cleanup and speed pass (4 Oct 2026)
- **Tool:** Claude
- **What I asked for:** Remove what we don't use, make the app load faster, and remove Google sign-in, which we decided we didn't need.
- **What came back:** Google sign-in removed from the login modal, the Supabase client and the docs; every screen behind the login lazy-loaded with `React.lazy` + `Suspense`, so the landing page loads less JavaScript; images compressed (e.g. the 1.7 MB container background PNG became a 21 KB WebP); unused original art in `assets/` and the duplicate `public/dinos/` copies deleted.
- **What I kept / changed and why:** Kept. Dropping Google sign-in leaves one login path to test and maintain.
- **Commit:** [673d58e](https://github.com/francoiseee/gastosaurus/commit/673d58e12395896b1bc11e41dc064d4dc00dd6f9)

---

## 2. Where the AI got it wrong

### 2.1 Settle Up told people to pay the same debt twice
- **What the AI gave me:** In `balances.service.js`, Settle Up worked out suggested payments from confirmed balances only ([c440ccd](https://github.com/francoiseee/gastosaurus/commit/c440ccd0e15ff11a51250cf95a3e20af166fb10b)).
- **What was wrong:** A payment stays `pending` until the receiver confirms it. A pending payment doesn't change balances yet, so after someone pressed **Pay** they were still shown "You owe ₱160 → Pay" and could pay the same debt again. In a money app that's a real bug.
- **What I did instead:** I found it while testing with two accounts: I paid from one account, and before my friend confirmed, the Pay button was still there for the same debt. I asked for Settle Up to count pending payments as already sent when it suggests payments, without changing the real balances. `projectedSuggestions()` adds each pending payment to the payer's balance and takes it off the receiver's before running the settle-up. The row now shows "PENDING · waiting for … to confirm", with no second Pay button.
- **Commit:** [addbde0](https://github.com/francoiseee/gastosaurus/commit/addbde061c133e86a488ecbd439b096331f52fe9)

### 2.2 The AI's server code broke `npm run lint`
- **What the AI gave me:** Server files like `server/src/config/env.js` that read `process.env` ([34b1e7f](https://github.com/francoiseee/gastosaurus/commit/34b1e7f398b399d164363fed66da6bc2af45691b)).
- **What was wrong:** Our `eslint.config.js` (from the Vite template) gives every `.js` file browser globals only, so ESLint reported `'process' is not defined` across `server/`. The AI added server code without checking it against the project's existing lint setup.
- **What I did instead:** I had Claude add a separate ESLint block for `server/**/*.js` that uses Node globals, since the API runs on Node and not in the browser, and remove the unused imports lint found.
- **Commit:** [addbde0](https://github.com/francoiseee/gastosaurus/commit/addbde061c133e86a488ecbd439b096331f52fe9)

### 2.3 Dead code left behind after the switch to real data
- **What the AI gave me:** The commit that moved every screen onto the API ([addbde0](https://github.com/francoiseee/gastosaurus/commit/addbde061c133e86a488ecbd439b096331f52fe9)) left the old pieces in place: `src/data/mockData.js` (438 lines), `AddExpenseModal`, `SettleUpModal`, `BankIllustration`, and their CSS.
- **What was wrong:** Nothing imported them anymore, but they made it look like there were two add-expense flows and two settle-up screens. Anyone editing the wrong one would see nothing change.
- **What I did instead:** I asked Claude to confirm nothing imported them and delete them, along with the 61 CSS classes only they used (~560 lines of `App.css`).
- **Commit:** [72898b9](https://github.com/francoiseee/gastosaurus/commit/72898b9e456e0509029b06408fa203d6b3264298)

### 2.4 The same validation code pasted into several route files
- **What the AI gave me:** In [c440ccd](https://github.com/francoiseee/gastosaurus/commit/c440ccd0e15ff11a51250cf95a3e20af166fb10b), each list endpoint defined its own copy of the paging schema (`limit` 1–100, default 50; `offset` ≥ 0), and the settlements validation sat inline in its routes file.
- **What was wrong:** With copies, changing the page limit means remembering every file, and sooner or later one copy drifts.
- **What I did instead:** I had Claude move `paging` into `server/src/lib/validators.js` so every route imports it, and give settlements its own `settlements.validation.js` like the other modules.
- **Commit:** [addbde0](https://github.com/francoiseee/gastosaurus/commit/addbde061c133e86a488ecbd439b096331f52fe9)

---

## 3. Who wrote what

By git blame, about 10,650 lines of the frontend (JSX and CSS) are from my own commits, and about 2,350 are Claude's. The backend (`server/`, `supabase/`) is Claude's, except the Vercel deployment below. Some of my screens were later connected to the API by Claude ([addbde0](https://github.com/francoiseee/gastosaurus/commit/addbde061c133e86a488ecbd439b096331f52fe9)), so for each file I say which part is mine.

### 3.1 Code I wrote myself

#### Deploying the Express API on Vercel: `api/index.js`, `vercel.json`, `server/src/db/pool.js`
- **Commit:** [fb03124](https://github.com/francoiseee/gastosaurus/commit/fb031249e5964a83d7e9e1521fe8953fd627bfaa) (this commit also carries the first draft of this file, which Claude wrote; see 1.10)
- **What it does and why:** Vercel doesn't run a normal server that stays on. It runs a function for each request. An Express app is already a function that takes a request and a response, so `api/index.js` only needs to build the app with `createApp()` and export it. `vercel.json` has a rewrite that sends every `/api/...` request to that one function. Express still sees the original path, like `/api/groups`, so all the routes work exactly as they do locally. I set the region to `sin1` (Singapore) because our Supabase database is in Singapore too, so every query has a short trip. In `pool.js`, every running copy of the function opens its own connection pool. If each one kept 10 connections, the database could run out, so on Vercel I keep at most 5 with a shorter idle timeout and let Supabase's pooler do the real pooling. `attachDatabasePool` lets Vercel close idle connections before it pauses the function. I also made `env.js` treat a Vercel deployment as production, because `NODE_ENV` isn't always set there.

#### Dino avatar picker: `src/components/ChooseDinoModal.jsx` (292 of 292 lines mine) and `GroupCard.jsx` (61 of 61)
- **Commit:** [f2a0fd1](https://github.com/francoiseee/gastosaurus/commit/f2a0fd1535701d93f8400264d1684cb9c52b3586)
- **What it does and why:** The modal lets you pick a dino avatar and your display name. `selectedId` is the dino you're looking at and `displayName` is the name box. Clicking a dino (`handleSelectDino`) selects it and sets `animatingId` for 400 ms so it does a little bounce. `handleRandomize` picks a random dino that isn't the current one. `handleSave` checks that the name isn't empty, then sends `PATCH /api/me` with the dino's id in `avatarEmoji` (the profile already had that column) plus the name. `isSaving` stops double clicks. The same modal handles two cases: a new user's first pick (`isInitialOnboarding` shows "Step 2 of 2" and a welcome message) and changing your avatar later. When the modal opens again, it resets to your saved dino and name so it never shows a stale pick. `GroupCard` is one group tile used on both the Dashboard and the Groups page, so both screens show groups the same way. It also opens with Enter or Space, so it works with a keyboard.

#### Add-expense calculator: `src/components/AddExpenseCalculatorView.jsx` (322 of 401 lines mine)
- **Commit:** [3a7d428](https://github.com/francoiseee/gastosaurus/commit/3a7d4288019bf44d45f69295a1e1bc2e90e1141e)
- **What it does and why:** This is the screen where you type the amount. I keep the amount as a string (`amountStr`), not a number, so while someone is typing I can keep things like "0." or "12.5" on screen and stop them at two decimals. If I turned it into a number on every key, the dot would disappear mid-typing. The on-screen keypad calls `handleKeyPress`, which handles backspace, only one decimal point, at most two decimal places and a length limit. A `keydown` listener sends real keyboard keys to the same function, but it ignores them while you're typing in another box like the item name, so typing "Wagyu" doesn't add numbers to the amount. Typing straight into the amount box goes through `handleAmountInputChange`, which strips anything that isn't a digit or a dot. `handleAmountBlur` tidies it to two decimals when you leave the box. Not mine: the member list and the `deselected` set (who is not in the split) were added by Claude in [addbde0](https://github.com/francoiseee/gastosaurus/commit/addbde061c133e86a488ecbd439b096331f52fe9).

#### Create-group modal: `src/components/CreateGroupModal.jsx`
- **Commits:** [9137d2a](https://github.com/francoiseee/gastosaurus/commit/9137d2a5f15ca90a0886bf1b8c8acbc94e4ef7bf), [3a7d428](https://github.com/francoiseee/gastosaurus/commit/3a7d4288019bf44d45f69295a1e1bc2e90e1141e)
- **What it does and why:** Mine are the form state, the icon picker and the guest list. `filteredIcons` uses `useMemo` to filter the icons by the set tab and the search box (matching the icon name or its set name), so the list only recalculates when the tab or search changes. `handleAddMember` adds a friend by name as a guest, so they don't need an account yet, and `handleRemoveMember` removes them by position. Not mine: the duplicate-name check and the `handleSubmit` call to the API are Claude's ([addbde0](https://github.com/francoiseee/gastosaurus/commit/addbde061c133e86a488ecbd439b096331f52fe9)), and the "Other" category and `iconTouched` logic were Claude's ([d8eff3a](https://github.com/francoiseee/gastosaurus/commit/d8eff3af3105abebb2df7a50a8a5008a2341944f)).

#### Paying debts: `src/components/PaymentView.jsx`
- **Commit:** [3a7d428](https://github.com/francoiseee/gastosaurus/commit/3a7d4288019bf44d45f69295a1e1bc2e90e1141e)
- **What it does and why:** Mine is the selection part. Everything starts selected. `toggleItemSelection` adds or removes one debt, `handleToggleSelectAll` selects all or none, and `totalSelectedAmount` adds up only the selected debts so the total updates as you tick and untick. If nothing is selected, Confirm shows "Please select at least one item" instead of doing anything, and `isProcessing` disables the button while it's working. Not mine: recording each payment through the API and the "waiting for confirmation" message are Claude's ([addbde0](https://github.com/francoiseee/gastosaurus/commit/addbde061c133e86a488ecbd439b096331f52fe9)).

### 3.2 The AI-written code I understand best: `server/src/lib/splitting.js`
- **File:** [`server/src/lib/splitting.js`](server/src/lib/splitting.js) (and `money.js`)
- **Commit:** [c440ccd](https://github.com/francoiseee/gastosaurus/commit/c440ccd0e15ff11a51250cf95a3e20af166fb10b)
- **Explanation:**
  - **Centavos, not pesos.** All money is stored as whole centavos (₱1.00 = 100) because JavaScript decimals aren't exact (`0.1 + 0.2 !== 0.3`). `toCentavos` reads the peso text digit by digit instead of multiplying a decimal by 100, so no rounding error can sneak in.
  - **`apportion()`, the one rounding rule.** ₱100 split three ways is 33.333… each. Everyone first gets the whole centavos (33.33), which leaves one centavo. That centavo goes to whoever lost the biggest fraction, and ties go to whoever is listed first. So the shares always add up to exactly the total, and nobody is more than ₱0.01 off.
  - **`equalSplit`:** everyone has the same weight, so ₱100 for three people becomes 33.34 / 33.33 / 33.33.
  - **`itemizedSplit`:** each person pays only for what they had. An item shared by k people costs each of them price ÷ k. To keep the fractions exact it uses `BigInt` and a common denominator (the least common multiple of the k's). Then everyone is scaled by total ÷ subtotal, so a service charge or discount is spread by how much each person ordered. Example: Wagyu ₱300 for three people plus Sake ₱120 for two gives ₱160, ₱160 and ₱100.
  - **`customSplit`:** the amounts you type must add up to the total exactly. If not, the error says how many pesos it's short or over.
  - **`suggestSettlements`:** the person who owes the most pays the person owed the most, as much as one of them needs. Each payment clears at least one person, so a group of n people needs at most n − 1 payments.
  - **Why it's built this way:** it's pure functions with no database and no Express, so it can be tested on its own (`server/test/splitting.test.js`, run with `cd server && npm test`). The database also double-checks, with a trigger, that an expense's shares add up to its total.
