// Settlement (payment) rules.
//
// Recording:  the payer, the receiver, or a group admin can record a payment.
// Confirming: a payment only changes balances once it's COMPLETED.
//   • Recorded by the receiver ("Bea paid me ₱500 cash") → completed right away.
//   • Paying a guest (no account to confirm with)       → completed right away.
//   • Otherwise ("I sent ₱500 via GCash")               → pending, until the
//     receiver (or an admin) confirms with PATCH { status: 'completed' }.
// Undoing:    a pending payment can be withdrawn by whoever recorded it, either
//             party, or an admin. A completed one only by the receiver or an
//             admin (the receiver is the one who knows the money didn't arrive).
import { withTransaction } from '../../db/pool.js';
import { HttpError } from '../../utils/HttpError.js';
import { assertMember, assertUuid } from '../groups/membership.js';
import * as groupsRepo from '../groups/groups.repository.js';
import * as notify from '../notifications/notify.js';
import * as repo from './settlements.repository.js';

// GET /api/groups/:groupId/settlements
export async function listForGroup(user, member, paging) {
  const rows = await repo.listForGroup(member.group_id, paging);
  return rows.map((r) => repo.toSettlement(r, user.id));
}

// POST /api/groups/:groupId/settlements  { toMemberId, amount, fromMemberId?, method?, note? }
export async function recordSettlement(user, member, body) {
  const fromMember = body.fromMemberId ?? member.id;
  const toMember = body.toMemberId;
  if (fromMember === toMember) {
    throw HttpError.badRequest('Pick two different people.', { toMemberId: 'Cannot pay yourself.' });
  }

  const id = await withTransaction(async (db) => {
    const [from, to] = await Promise.all([
      groupsRepo.findMember(member.group_id, fromMember, db),
      groupsRepo.findMember(member.group_id, toMember, db),
    ]);
    if (!from || from.left_at) throw HttpError.badRequest('The payer is not in this group.', { fromMemberId: 'Not a member.' });
    if (!to || to.left_at) throw HttpError.badRequest('The receiver is not in this group.', { toMemberId: 'Not a member.' });

    const isPayer = from.id === member.id;
    const isReceiver = to.id === member.id;
    if (!isPayer && !isReceiver && member.role !== 'admin') {
      throw HttpError.forbidden('You can only record payments you sent or received.');
    }

    const status = isReceiver || to.user_id === null ? 'completed' : 'pending';
    const settlementId = await repo.insert(
      {
        groupId: member.group_id,
        fromMember,
        toMember,
        amountCentavos: body.amount,
        method: body.method,
        status,
        note: body.note,
        createdBy: user.id,
      },
      db,
    );
    await groupsRepo.touchGroup(member.group_id, db);
    await notify.paymentRecorded(db, { settlement: await repo.findById(settlementId, db), actorId: user.id });
    return settlementId;
  });

  return repo.toSettlement(await repo.findById(id), user.id);
}

async function loadForMember(settlementId, userId, db) {
  assertUuid(settlementId, 'Payment');
  const settlement = await repo.findById(settlementId, db, { forUpdate: true });
  if (!settlement) throw HttpError.notFound('Payment not found.');
  const member = await assertMember(settlement.group_id, userId, db).catch(() => {
    throw HttpError.notFound('Payment not found.');
  });
  return { settlement, member };
}

// PATCH /api/settlements/:id  { status: 'completed' } — receiver confirms
export async function confirmSettlement(user, settlementId) {
  await withTransaction(async (db) => {
    const { settlement, member } = await loadForMember(settlementId, user.id, db);
    if (settlement.to_member !== member.id && member.role !== 'admin') {
      throw HttpError.forbidden('Only the person who received the payment can confirm it.');
    }
    if (settlement.status === 'completed') throw HttpError.conflict('This payment is already confirmed.');
    await repo.markCompleted(settlement.id, db);
    await notify.paymentConfirmed(db, { settlement, actorId: user.id });
  });
  return repo.toSettlement(await repo.findById(settlementId), user.id);
}

// DELETE /api/settlements/:id — withdraw / undo
export async function deleteSettlement(user, settlementId) {
  await withTransaction(async (db) => {
    const { settlement, member } = await loadForMember(settlementId, user.id, db);
    const isAdmin = member.role === 'admin';
    const isReceiver = settlement.to_member === member.id;
    const isPayer = settlement.from_member === member.id;
    const allowed =
      settlement.status === 'pending'
        ? isAdmin || isReceiver || isPayer || settlement.created_by === user.id
        : isAdmin || isReceiver;
    if (!allowed) {
      throw HttpError.forbidden(
        settlement.status === 'pending'
          ? 'You can only withdraw payments you are part of.'
          : 'Only the receiver or an admin can undo a confirmed payment.',
      );
    }
    await repo.remove(settlement.id, db);
  });
}
