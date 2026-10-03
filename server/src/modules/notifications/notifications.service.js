// The notification inbox, plus settle-up reminders.
import { withTransaction } from '../../db/pool.js';
import { HttpError } from '../../utils/HttpError.js';
import { formatPeso } from '../../lib/money.js';
import { projectedSuggestions } from '../balances/balances.service.js';
import * as balancesRepo from '../balances/balances.repository.js';
import { assertUuid } from '../groups/membership.js';
import * as groupsRepo from '../groups/groups.repository.js';
import * as notify from './notify.js';
import * as repo from './notifications.repository.js';

const REMINDER_COOLDOWN_HOURS = 12;

// GET /api/notifications?limit=&before=&unread=true
export async function list(user, { limit, before, unreadOnly }) {
  const [rows, unreadCount] = await Promise.all([
    repo.listForUser(user.id, { limit, before, unreadOnly }),
    repo.countUnread(user.id),
  ]);
  return { notifications: rows.map(repo.toNotification), unreadCount };
}

// PATCH /api/notifications/:id/read
export async function markRead(user, notificationId) {
  assertUuid(notificationId, 'Notification');
  const row = await repo.markRead(user.id, notificationId);
  if (!row) throw HttpError.notFound('Notification not found.');
  return repo.toNotification(row);
}

// POST /api/notifications/read-all
export async function markAllRead(user) {
  return { updated: await repo.markAllRead(user.id) };
}

// DELETE /api/notifications/:id
export async function remove(user, notificationId) {
  assertUuid(notificationId, 'Notification');
  if (!(await repo.remove(user.id, notificationId))) throw HttpError.notFound('Notification not found.');
}

/**
 * POST /api/groups/:groupId/reminders  { memberIds? }
 *
 * Nudges everyone who owes money in this group (or just `memberIds`), using
 * the same Settle Up suggestions the app shows, so each person is told exactly
 * whom to pay (someone whose payment is already pending isn't nagged).
 * Guests can't be notified, nobody is reminded twice within 12 hours, and you
 * can't remind yourself.
 * Returns { sent: [{ memberId, name, amount }], skipped: [{ memberId, name, reason }] }
 */
export async function sendReminders(user, member, { memberIds } = {}) {
  return withTransaction(async (db) => {
    const [members, pending] = await Promise.all([
      groupsRepo.listAllMembers(member.group_id, db),
      balancesRepo.pendingSettlements([member.group_id], db),
    ]);
    const byId = new Map(members.map((m) => [m.id, m]));
    const payments = projectedSuggestions(members, pending); // same list the Settle Up screen shows

    // Group the suggested payments by who has to pay.
    const debts = new Map(); // memberId → { total, lines[] }
    for (const p of payments) {
      if (memberIds && !memberIds.includes(p.from)) continue;
      const entry = debts.get(p.from) ?? { total: 0, lines: [] };
      entry.total += p.amount;
      entry.lines.push(`${byId.get(p.to).name} ${formatPeso(p.amount)}`);
      debts.set(p.from, entry);
    }

    const since = new Date(Date.now() - REMINDER_COOLDOWN_HOURS * 3600 * 1000);
    const debtorUserIds = [...debts.keys()].map((id) => byId.get(id).user_id).filter(Boolean);
    const alreadyReminded = await repo.recentlyReminded(member.group_id, debtorUserIds, since, db);

    const sent = [];
    const skipped = [];
    const toSend = [];
    for (const [memberId, debt] of debts) {
      const m = byId.get(memberId);
      const who = { memberId, name: m.name };
      if (m.user_id === user.id) skipped.push({ ...who, reason: 'self' });
      else if (!m.user_id) skipped.push({ ...who, reason: 'guest' });
      else if (alreadyReminded.has(m.user_id)) skipped.push({ ...who, reason: 'recently_reminded' });
      else {
        toSend.push({ userId: m.user_id, lines: debt.lines, totalCentavos: debt.total });
        sent.push({ ...who, amount: debt.total / 100 });
      }
    }

    await notify.reminders(db, { groupId: member.group_id, actorId: user.id, reminders: toSend });
    return { sent, skipped };
  });
}
