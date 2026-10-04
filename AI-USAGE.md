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
- **What I asked for:** <!-- TODO: the specific things you asked Antigravity for, e.g. "how to make the icon picker filter by search", "fix my CSS grid on the dashboard" --> TODO
- **What came back:** TODO
- **What I kept / changed and why:** TODO. I built the screens from our Figma design myself: landing page, dashboard, groups, create-group modal, members, expenses, add-expense calculator, itemized ambagan, payment, settlements, notifications.
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
- **What I kept / changed and why:** Kept. Claude also wrote `docs/QA-CHECKLIST.md`, a click-through test that uses two accounts. <!-- TODO: only claim you ran it if you did -->
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
- **What I kept / changed and why:** Kept the structure and the commit links. I corrected how my frontend work was described and wrote the TODO parts myself.
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
- **What I did instead:** <!-- TODO: how you noticed it, e.g. testing with two accounts --> I asked for Settle Up to count pending payments as already sent when it suggests payments, without changing the real balances. `projectedSuggestions()` adds each pending payment to the payer's balance and takes it off the receiver's before running the settle-up. The row now shows "PENDING · waiting for … to confirm", with no second Pay button.
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

<!--
  Pick 2–3 of these and explain them IN YOUR OWN WORDS: what it does and why you built it that way.
  The rubric grades your understanding, so don't paste anything here you can't explain out loud.
  Note: Claude later connected these screens to the API (commit addbde0), so some lines in them are
  Claude's. Say which part is yours (git blame shows it line by line).
-->

### 3.1 Code I wrote myself

<!-- Pick 2–3 of the pieces below and explain them IN YOUR OWN WORDS. Delete the ones you don't use. -->

#### Deploying the Express API on Vercel: `api/index.js`, `vercel.json`, `server/src/db/pool.js`
- **Commit:** [fb03124](https://github.com/francoiseee/gastosaurus/commit/fb031249e5964a83d7e9e1521fe8953fd627bfaa) (this commit also carries the first draft of this file, which Claude wrote; see 1.10)
- **What it does and why it is built that way:** TODO, in your words. (Cover: why `api/index.js` only needs to export `createApp()`; how the rewrite in `vercel.json` sends every `/api/*` request to that one function while Express still sees the original path; why the region is `sin1`; why the pool is smaller on Vercel (`max: 5`, shorter idle timeout) and what `attachDatabasePool` is for; why `env.js` treats a Vercel deployment as production.)

#### `src/components/ChooseDinoModal.jsx` (292 of 292 lines mine) and `GroupCard.jsx` (61 of 61)
- **Commit:** [f2a0fd1](https://github.com/francoiseee/gastosaurus/commit/f2a0fd1535701d93f8400264d1684cb9c52b3586)
- **What it does and why it is built that way:** TODO, in your words. (Cover: the state (`selectedId`, `displayName`, `isSaving`, `animatingId`); `handleSelectDino` and `handleRandomize`; what `handleSave` sends to the API and how it reaches your profile; how the modal works for a new user's first pick versus changing it later.)

#### The rest of the React frontend
Git blame shows the frontend lines that are still mine (my own commits) in [9137d2a](https://github.com/francoiseee/gastosaurus/commit/9137d2a5f15ca90a0886bf1b8c8acbc94e4ef7bf) and [3a7d428](https://github.com/francoiseee/gastosaurus/commit/3a7d4288019bf44d45f69295a1e1bc2e90e1141e): about 3,000 lines of JSX plus most of `App.css`.

#### `src/components/CreateGroupModal.jsx` (423 of 468 lines still mine)
- **Commit:** [9137d2a](https://github.com/francoiseee/gastosaurus/commit/9137d2a5f15ca90a0886bf1b8c8acbc94e4ef7bf)
- **What it does and why it is built that way:** TODO, in your words. (Cover: the form state, the icon picker with set tabs + search, the colour themes, `handleAddMember` / `handleRemoveMember` for guests, and what `handleSubmit` checks before saving.)

#### `src/components/AddExpenseCalculatorView.jsx` (322 of 401 lines still mine)
- **Commit:** [3a7d428](https://github.com/francoiseee/gastosaurus/commit/3a7d4288019bf44d45f69295a1e1bc2e90e1141e)
- **What it does and why it is built that way:** TODO, in your words. (Cover: why the amount is kept as a string (`amountStr`), how `handleKeyPress` and the keyboard listener build the amount, `handleAmountBlur` formatting, and how `deselected` tracks who is NOT in the split.)

#### `src/components/PaymentView.jsx` (205 of 250 lines still mine)
- **Commit:** [3a7d428](https://github.com/francoiseee/gastosaurus/commit/3a7d4288019bf44d45f69295a1e1bc2e90e1141e)
- **What it does and why it is built that way:** TODO, in your words. (Cover: choosing which debts to pay, select-all, the payment method, and why `isProcessing` exists.)

### 3.2 The AI-written code I understand best: `server/src/lib/splitting.js`
- **File:** [`server/src/lib/splitting.js`](server/src/lib/splitting.js) (and `money.js`)
- **Commit:** [c440ccd](https://github.com/francoiseee/gastosaurus/commit/c440ccd0e15ff11a51250cf95a3e20af166fb10b)
- **Explanation (TODO: rewrite in your own words; points to cover):**
  - Why centavos: all money is stored as whole centavos (₱1.00 = 100), because floats lose precision (`0.1 + 0.2 !== 0.3`). `toCentavos` reads the peso string digit by digit instead of multiplying a float by 100.
  - `apportion()` and largest remainder: ₱100 ÷ 3 can't be split evenly. Everyone first gets the floor (33.33), and the leftover centavo goes to whoever lost the biggest fraction (ties go to the first person listed). So shares always add up to exactly the total, and nobody is more than ₱0.01 off.
  - `equalSplit`: apportion with everyone weighted the same, which gives 33.34 / 33.33 / 33.33.
  - `itemizedSplit`: an item shared by k people costs each of them price ÷ k. Exact fractions use BigInt and a common denominator (the LCM of the k's), then everyone is scaled by total ÷ subtotal so service charges and discounts are spread in proportion to what each person ordered.
  - `customSplit`: the shares the user typed must add up to the total exactly, otherwise the error says how many pesos it's short or over.
  - `suggestSettlements` (greedy): the person who owes the most pays the person owed the most. Each payment clears at least one person, so n people need at most n − 1 payments.
  - Why it's "pure" (no database or Express): it can be unit-tested on its own (`server/test/splitting.test.js`), and a database trigger double-checks that the shares add up to the total.
  - Try it: `cd server && npm test`. Then work one example by hand, e.g. Wagyu ₱300 for 3 people + Sake ₱120 for 2 → Bea ₱160, Miguel ₱160, you ₱100.
