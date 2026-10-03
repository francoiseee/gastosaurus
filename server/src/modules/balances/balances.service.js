// Balances: who owes whom, computed live.
//
//   net = what you paid for the group − your shares + payments you sent − payments you received
//
// net > 0 → you are owed, net < 0 → you owe, 0 → settled. Only COMPLETED
// payments count; pending ones are shown separately until the receiver confirms.
//
// "Settle Up" suggestions come from suggestSettlements() in lib/splitting.js:
// the biggest debtor pays the biggest creditor, repeat — at most n − 1 payments.
import { toCentavos, fromCentavos, statusFor } from '../../lib/money.js';
import { suggestSettlements } from '../../lib/splitting.js';
import * as groupsRepo from '../groups/groups.repository.js';
import * as profiles from '../profile/profile.repository.js';
import * as settlementsRepo from '../settlements/settlements.repository.js';
import * as repo from './balances.repository.js';

const APP_TIME_ZONE = 'Asia/Manila';

function person(row, currentUserId) {
  return {
    memberId: row.member_id ?? row.id,
    name: row.name,
    avatarEmoji: row.avatar_emoji ?? '🙂',
    isGuest: row.user_id === null,
    isCurrentUser: row.user_id !== null && row.user_id === currentUserId,
  };
}

/** rows with { net } → suggested payments with names attached. */
function suggestionsFor(rows, currentUserId) {
  const byId = new Map(rows.map((r) => [r.member_id ?? r.id, r]));
  const payments = suggestSettlements(rows.map((r) => ({ memberId: r.member_id ?? r.id, net: toCentavos(r.net ?? '0') })));
  return payments.map((p) => ({
    from: person(byId.get(p.from), currentUserId),
    to: person(byId.get(p.to), currentUserId),
    amount: fromCentavos(p.amount),
  }));
}

// GET /api/groups/:groupId/balances
export async function groupBalances(user, member) {
  const all = await groupsRepo.listAllMembers(member.group_id);
  const myNet = toCentavos(all.find((m) => m.id === member.id)?.net ?? '0');
  return {
    me: { memberId: member.id, net: fromCentavos(myNet), statusType: statusFor(myNet) },
    // Active members, plus anyone who left while the books were later changed.
    members: all
      .filter((m) => !m.left_at || toCentavos(m.net ?? '0') !== 0)
      .map((m) => groupsRepo.toMember(m, user.id)),
    suggestedSettlements: suggestionsFor(all, user.id),
    isSettled: all.every((m) => toCentavos(m.net ?? '0') === 0),
  };
}

/** 'YYYY-MM' → [first day, first day of next month] */
function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`;
  return [`${y}-${pad(m)}-01`, next];
}

export function currentMonth(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIME_ZONE, year: 'numeric', month: '2-digit' }).format(now);
}

// GET /api/me/summary?month=YYYY-MM — the dashboard cards
export async function mySummary(user, month = currentMonth()) {
  const [rows, profile] = await Promise.all([repo.balancesInMyGroups(user.id), profiles.findById(user.id)]);
  const mine = rows.filter((r) => r.user_id === user.id);

  let youOwe = 0;
  let youAreOwed = 0;
  let oweGroupCount = 0;
  let owedGroupCount = 0;
  for (const r of mine) {
    const net = toCentavos(r.net);
    if (net < 0) {
      youOwe += -net;
      oweGroupCount += 1;
    } else if (net > 0) {
      youAreOwed += net;
      owedGroupCount += 1;
    }
  }

  const [from, to] = monthRange(month);
  const spending = toCentavos(await repo.shareTotalBetween(user.id, from, to));
  const budget = profile?.monthly_budget === null || profile?.monthly_budget === undefined ? null : toCentavos(profile.monthly_budget);
  const net = youAreOwed - youOwe;

  return {
    netBalance: fromCentavos(net),
    statusType: statusFor(net),
    youOwe: fromCentavos(youOwe),
    youAreOwed: fromCentavos(youAreOwed),
    oweGroupCount,
    owedGroupCount,
    groupCount: mine.length,
    month,
    personalSpending: fromCentavos(spending),
    monthlyBudget: budget === null ? null : fromCentavos(budget),
    budgetRemaining: budget === null ? null : fromCentavos(budget - spending),
    budgetUsedPercent: budget ? Math.round((spending / budget) * 1000) / 10 : null,
  };
}

// GET /api/me/settle-up — every suggested payment that involves me, across groups,
// plus payments waiting for confirmation.
export async function mySettleUp(user) {
  const rows = await repo.balancesInMyGroups(user.id);
  const byGroup = new Map();
  for (const r of rows) {
    if (!byGroup.has(r.group_id)) byGroup.set(r.group_id, { id: r.group_id, name: r.group_name, iconId: r.icon_id, rows: [] });
    byGroup.get(r.group_id).rows.push(r);
  }

  const toPay = [];
  const toReceive = [];
  for (const g of byGroup.values()) {
    for (const s of suggestionsFor(g.rows, user.id)) {
      const group = { id: g.id, name: g.name, iconId: g.iconId };
      if (s.from.isCurrentUser) toPay.push({ group, to: s.to, amount: s.amount });
      if (s.to.isCurrentUser) toReceive.push({ group, from: s.from, amount: s.amount });
    }
  }

  const pending = (await settlementsRepo.listForUser(user.id, { status: 'pending' })).map((r) =>
    settlementsRepo.toSettlement(r, user.id),
  );
  const recent = (await settlementsRepo.listForUser(user.id, { status: 'completed', limit: 20 })).map((r) =>
    settlementsRepo.toSettlement(r, user.id),
  );

  return {
    toPay,
    toReceive,
    totalToPay: fromCentavos(toPay.reduce((a, p) => a + Math.round(p.amount * 100), 0)),
    totalToReceive: fromCentavos(toReceive.reduce((a, p) => a + Math.round(p.amount * 100), 0)),
    awaitingMyConfirmation: pending.filter((s) => s.to.isCurrentUser),
    awaitingTheirConfirmation: pending.filter((s) => s.from.isCurrentUser),
    recent,
  };
}
