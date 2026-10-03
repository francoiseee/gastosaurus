# QA checklist

Click through this before a demo or release. You need **two accounts** (for example your own and a groupmate's) so you can see both sides of invites and payments. Use two browsers, or a normal window plus a private one.

> Accounts: with Supabase's built-in email, confirmation emails only reach your own team's addresses. For testing, turn **Confirm email** off in Supabase → Authentication → Providers → Email, or set up SMTP.

Start both servers first: `cd server && npm run dev`, then `npm run dev` at the repo root.

## 1. Accounts
- [ ] Sign up → you land on the Dashboard, and the bell shows **Welcome to Gastosaurus, <name>!**
- [ ] Log out, then log in again. "Keep me logged in" survives a browser restart.
- [ ] Forgot password sends a reset link (only if email is set up).

## 2. Groups and members (account A)
- [ ] **New Group** with a name, icon, color, category, and two friends by name (e.g. Miguel, Bea) → you land on **Build Your Squad**.
- [ ] **Continue** → group page shows you as **Admin** and Miguel and Bea as **Guest**.
- [ ] **Group Details** → change the icon and edit the name or note; the changes show everywhere.
- [ ] Dashboard and Groups list show the new group as **Settled**.

## 3. Adding expenses (account A)
- [ ] **Add Expenses** → amount `300`, item `Wagyu`, everyone selected → **Continue**.
- [ ] **Add Item** → `120`, `Sake`, untick yourself → **Continue**.
- [ ] Item Split shows Wagyu ÷3 in every bucket and Sake ÷2 for Miguel and Bea. Drag, reassign (⇄) and **Split Item** all move items between people.
- [ ] Name it, set **Paid by you**, **Save Expense** → toast, back on the group page.
- [ ] **Expenses Detail**: total ₱420, your share ₱100, balance **+₱320**; expanding the row shows Bea ₱160, Miguel ₱160, you ₱100.
- [ ] A one-item expense saves as **Split Equally** (₱100 ÷ 3 = 33.34 / 33.33 / 33.33).
- [ ] Delete an expense from its expanded row → balances update.
- [ ] Try **Save** with an item still unassigned → you get a clear message and nothing is saved.

## 4. Invites and joining (A and B)
- [ ] A: on Bea's guest card, **Invite** → enter B's email → a pending invite card appears.
- [ ] B: the bell shows the invite → **Accept** → B lands in the group *in Bea's spot*, already owing ₱160.
- [ ] A: gets **"Bea joined …"**.
- [ ] A: **Invite Member** → copy the link → open it in a third browser while logged out → the sign-up screen opens; after signing up you're in the group.
- [ ] A (admin): **Reset link** → the old link now says it's no longer valid.

## 5. Settling up
- [ ] B: **Settlements** shows **YOU OWE Alex ₱160** → **Pay** → GCash → **Confirm & Settle**.
- [ ] B: the row changes to **PENDING · waiting for Alex to confirm**, and there's no second "Pay" for the same debt.
- [ ] A: the notification **"Bea says they paid you ₱160.00 via GCash"** → **Confirm received**.
- [ ] B: gets **"Alex confirmed your ₱160.00 payment"**.
- [ ] A: **Mark received** on Miguel's row (a guest) → it counts immediately.
- [ ] Dashboard: Net Balance, You Owe and You Are Owed are all correct; the group shows **Settled**.
- [ ] **Send Reminders** (while someone owes you) → they get a reminder naming whom to pay. A second try within 12 hours says *already reminded*.

## 6. Leaving and deleting
- [ ] Leave a group while you still owe → you get a clear "settle up first" message.
- [ ] Once settled, **Leave Group** works and the group disappears from your list.
- [ ] Admin: **Group Details → Delete** only works when everyone is settled.

## 7. Personal balance
- [ ] Dashboard → **Personal Balance**: this month's share by category. Set a monthly budget → the bar and percent appear.

## 8. Live updates
- [ ] With A and B both open, B adds an expense → A's bell dot appears and A's balances refresh without reloading the page.

---

## Files that are safe to delete

Nothing imports these any more. After deleting them, `npm run lint` at the root is clean.

| File | Why it's unused |
|---|---|
| `src/data/mockData.js` | All screens load real data from the API |
| `src/components/AddExpenseModal.jsx` | Replaced by the calculator → item split flow |
| `src/components/SettleUpModal.jsx` | Replaced by Settlements → Payment |
| `src/components/BankIllustration.jsx` | Was never used |
| `assets/` (repo root) | Original art files. The app uses the copies in `src/assets/`. Check with the designer before removing. |

Their styles in `src/App.css` (classes such as `.add-expense-modal-card` and `.payment-method-selector`) can be removed later. They do nothing without the components.
