// Every notification the app sends, in one place: who gets it and what it says.
//
// Services call these INSIDE their transaction (pass the same `db`), so a
// notification is saved only if the change it describes is saved too.
// Rules that apply to all of them:
//   • the person who did the thing (the actor) is never notified about it
//   • guests have no account, so they never get notifications
import { formatPeso, toCentavos } from '../../lib/money.js';
import * as repo from './notifications.repository.js';

const METHOD_LABELS = { cash: 'cash', gcash: 'GCash', maya: 'Maya', bank: 'bank transfer' };

async function names(db, { groupId, actorId }) {
  const { rows } = await db.query(
    `SELECT (SELECT name FROM public.groups WHERE id = $1) AS group_name,
            (SELECT name FROM public.profiles WHERE id = $2) AS actor_name`,
    [groupId, actorId],
  );
  return { groupName: rows[0].group_name ?? 'your group', actorName: rows[0].actor_name ?? 'Someone' };
}

const others = (userIds, actorId) => [...new Set(userIds.filter((id) => id && id !== actorId))];

/** Someone invited an email address. Notifies them if they already have an account. */
export async function inviteSent(db, { groupId, actorId, email, inviteId }) {
  const userId = await repo.userIdForEmail(email, db);
  if (!userId || userId === actorId) return;
  const { groupName, actorName } = await names(db, { groupId, actorId });
  await repo.insertMany(
    [
      {
        userId,
        type: 'invite',
        title: `${actorName} invited you to "${groupName}"`,
        body: 'Accept the invite to start splitting with the group.',
        groupId,
        actorId,
        data: { inviteId },
      },
    ],
    db,
  );
}

/** A new member joined (accepted an invite). Tells everyone else in the group. */
export async function memberJoined(db, { groupId, userId }) {
  const recipients = others(await repo.activeMemberUserIds(groupId, db), userId);
  const { groupName, actorName } = await names(db, { groupId, actorId: userId });
  await repo.insertMany(
    recipients.map((id) => ({
      userId: id,
      type: 'group',
      title: `${actorName} joined "${groupName}"`,
      groupId,
      actorId: userId,
    })),
    db,
  );
}

/** An admin removed someone. Tells the person who was removed. */
export async function memberRemoved(db, { groupId, actorId, removedUserId }) {
  if (!removedUserId || removedUserId === actorId) return;
  const { groupName, actorName } = await names(db, { groupId, actorId });
  await repo.insertMany(
    [{ userId: removedUserId, type: 'group', title: `${actorName} removed you from "${groupName}"`, groupId, actorId }],
    db,
  );
}

/**
 * An expense was added, re-split or deleted. Tells everyone in it (payer +
 * people with a share), each with their own share in the message.
 *   change: 'added' | 'updated' | 'deleted'
 *   shares: [{ memberId, amount (centavos) }]   (the new shares; for 'deleted', the old ones)
 *   removedMemberIds: people an edit took off the bill (they hear about it too)
 */
export async function expenseChanged(
  db,
  { change, groupId, actorId, expenseId, description, totalCentavos, payerMemberId, shares, removedMemberIds = [] },
) {
  const memberIds = [...new Set([payerMemberId, ...shares.map((s) => s.memberId), ...removedMemberIds])];
  const { rows } = await db.query(
    'SELECT id, user_id FROM public.group_members WHERE id = ANY($1::uuid[]) AND user_id IS NOT NULL',
    [memberIds],
  );
  const recipients = rows.filter((r) => r.user_id !== actorId);
  if (!recipients.length) return;

  const { groupName, actorName } = await names(db, { groupId, actorId });
  const shareOf = new Map(shares.map((s) => [s.memberId, s.amount]));
  const verb = { added: 'added', updated: 'updated', deleted: 'deleted' }[change];

  await repo.insertMany(
    recipients.map((r) => {
      const share = shareOf.get(r.id) ?? 0;
      let body;
      if (change === 'deleted') body = 'It no longer counts toward anyone\'s balance.';
      else if (share > 0) body = `Your share: ${formatPeso(share)}`;
      else if (r.id === payerMemberId) body = 'You paid for this one.';
      else body = 'You\'re no longer part of this bill.';
      return {
        userId: r.user_id,
        type: 'expense',
        title: `${actorName} ${verb} "${description}" (${formatPeso(totalCentavos)}) in ${groupName}`,
        body,
        groupId,
        actorId,
        data: change === 'deleted' ? {} : { expenseId },
      };
    }),
    db,
  );
}

/**
 * A payment was recorded. Tells the other side:
 *   pending   → the receiver is asked to confirm it
 *   completed → the payer learns it was recorded
 * settlement: a row from settlements.repository (with from_/to_ names and user ids)
 */
export async function paymentRecorded(db, { settlement, actorId }) {
  const amount = formatPeso(toCentavos(settlement.amount));
  const method = METHOD_LABELS[settlement.method];
  const { actorName } = await names(db, { groupId: settlement.group_id, actorId });
  const base = { type: 'payment', groupId: settlement.group_id, actorId, data: { settlementId: settlement.id } };
  const rows = [];

  if (settlement.to_user_id && settlement.to_user_id !== actorId) {
    rows.push({
      ...base,
      userId: settlement.to_user_id,
      title:
        settlement.status === 'pending'
          ? `${settlement.from_name} says they paid you ${amount} via ${method}`
          : `${actorName} recorded ${amount} from ${settlement.from_name} via ${method}`,
      body: settlement.status === 'pending' ? 'Confirm it once you\'ve received the money.' : `In ${settlement.group_name}.`,
      data: { ...base.data, action: settlement.status === 'pending' ? 'confirm' : null },
    });
  }
  if (settlement.from_user_id && settlement.from_user_id !== actorId) {
    rows.push({
      ...base,
      userId: settlement.from_user_id,
      title: `${actorName} recorded your ${amount} payment to ${settlement.to_name}`,
      body: settlement.status === 'pending' ? 'Waiting for the receiver to confirm.' : `In ${settlement.group_name}.`,
    });
  }
  await repo.insertMany(rows, db);
}

/** The receiver confirmed a payment. Tells the payer. */
export async function paymentConfirmed(db, { settlement, actorId }) {
  if (!settlement.from_user_id || settlement.from_user_id === actorId) return;
  const amount = formatPeso(toCentavos(settlement.amount));
  await repo.insertMany(
    [
      {
        userId: settlement.from_user_id,
        type: 'payment',
        title: `${settlement.to_name} confirmed your ${amount} payment`,
        body: `In ${settlement.group_name}.`,
        groupId: settlement.group_id,
        actorId,
        data: { settlementId: settlement.id },
      },
    ],
    db,
  );
}

/**
 * Settle-up nudges. reminders: [{ userId, lines: ['Miguel ₱85.00', …], totalCentavos }]
 */
export async function reminders(db, { groupId, actorId, reminders: list }) {
  const { groupName, actorName } = await names(db, { groupId, actorId });
  await repo.insertMany(
    list.map((r) => ({
      userId: r.userId,
      type: 'reminder',
      title: `Reminder from ${actorName}: settle your share in "${groupName}"`,
      body: `You owe ${formatPeso(r.totalCentavos)} — pay ${r.lines.join(', ')}.`,
      groupId,
      actorId,
    })),
    db,
  );
}
