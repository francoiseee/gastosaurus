// Expense rules — where a bill becomes "who owes what".
//
//   1. Validate who's involved: the payer and everyone in the split must be
//      active members of THIS group.
//   2. Run the split (lib/splitting.js) in integer centavos:
//        equal     → total ÷ people, leftover centavos to the first people
//        itemized  → each item ÷ who had it, charges spread proportionally
//        custom    → typed amounts, must add up to the total exactly
//   3. Save the expense, its receipt lines, and one share per person in ONE
//      transaction. The database double-checks that shares = total at commit.
//
// Balances are never stored — they're recomputed from shares and payments
// (see the group_balances view), so editing or deleting an expense
// automatically fixes everyone's balance.
//
// Who can edit/delete: whoever added it, whoever paid, or a group admin.
import { withTransaction } from '../../db/pool.js';
import { HttpError } from '../../utils/HttpError.js';
import { fromCentavos } from '../../lib/money.js';
import { equalSplit, itemizedSplit, customSplit, SplitError } from '../../lib/splitting.js';
import { assertMember, assertUuid } from '../groups/membership.js';
import * as groupsRepo from '../groups/groups.repository.js';
import * as repo from './expenses.repository.js';

// ─── Shapes sent to the frontend ────────────────────────────────────────────

const SPLIT_LABELS = { equal: 'Split Equally', itemized: 'Itemized', custom: 'Custom' };

function toListItem(row) {
  return {
    id: row.id,
    groupId: row.group_id,
    description: row.description,
    totalAmount: Number(row.total_amount),
    splitType: row.split_type,
    splitLabel: SPLIT_LABELS[row.split_type],
    paidBy: { memberId: row.paid_by, name: row.paid_by_name },
    spentOn: row.spent_on,
    note: row.note,
    myShare: row.my_share === null ? 0 : Number(row.my_share),
    peopleCount: row.people_count,
    createdAt: row.created_at,
  };
}

async function loadDetail(expenseId, db) {
  const [expense, items, shares] = await Promise.all([
    repo.findById(expenseId, db),
    repo.listItems(expenseId, db),
    repo.listShares(expenseId, db),
  ]);
  return {
    id: expense.id,
    groupId: expense.group_id,
    description: expense.description,
    totalAmount: Number(expense.total_amount),
    splitType: expense.split_type,
    splitLabel: SPLIT_LABELS[expense.split_type],
    paidBy: { memberId: expense.paid_by, name: expense.paid_by_name },
    spentOn: expense.spent_on,
    note: expense.note,
    createdBy: expense.created_by,
    createdAt: expense.created_at,
    updatedAt: expense.updated_at,
    items: items
      .filter((i) => i.kind === 'item')
      .map((i) => ({ id: i.id, name: i.name, price: Number(i.price), memberIds: i.member_ids })),
    charges: items
      .filter((i) => i.kind === 'charge')
      .map((i) => ({ id: i.id, name: i.name, amount: Number(i.price) })),
    shares: shares.map((s) => ({
      memberId: s.member_id,
      name: s.name,
      avatarEmoji: s.avatar_emoji ?? '🙂',
      isGuest: s.user_id === null,
      amount: Number(s.amount),
    })),
  };
}

// ─── The split ──────────────────────────────────────────────────────────────

/** Every member id the body mentions (payer + split participants). */
function referencedMemberIds(body, payerId) {
  const ids = new Set([payerId]);
  if (body.splitType === 'equal') body.memberIds.forEach((id) => ids.add(id));
  if (body.splitType === 'custom') body.shares.forEach((s) => ids.add(s.memberId));
  if (body.splitType === 'itemized') body.items.forEach((it) => it.memberIds.forEach((id) => ids.add(id)));
  return ids;
}

/** Runs the right algorithm. Returns { totalCentavos, shares, items, charges }. */
export function computeSplit(body) {
  try {
    if (body.splitType === 'equal') {
      return { totalCentavos: body.totalAmount, shares: equalSplit(body.totalAmount, body.memberIds), items: [], charges: [] };
    }
    if (body.splitType === 'custom') {
      return { totalCentavos: body.totalAmount, shares: customSplit(body.totalAmount, body.shares), items: [], charges: [] };
    }
    // itemized
    const result = itemizedSplit(body.items, body.charges);
    if (body.totalAmount !== undefined && body.totalAmount !== result.total) {
      throw new SplitError(
        `Items and charges add up to ₱${fromCentavos(result.total).toFixed(2)}, not ₱${fromCentavos(body.totalAmount).toFixed(2)}.`,
        'totalAmount',
      );
    }
    return {
      totalCentavos: result.total,
      shares: result.shares.map(({ memberId, amount }) => ({ memberId, amount })),
      items: body.items,
      charges: body.charges,
    };
  } catch (err) {
    if (err instanceof SplitError) throw HttpError.badRequest(err.message, { [err.field]: err.message });
    throw err;
  }
}

/**
 * Members allowed in this split: active members, plus (when editing) anyone
 * already on the expense — so fixing an old bill doesn't fail just because
 * someone has since left.
 */
async function assertParticipants(db, groupId, ids, alreadyOnExpense = new Set()) {
  const members = await groupsRepo.listAllMembers(groupId, db);
  const allowed = new Set(members.filter((m) => !m.left_at || alreadyOnExpense.has(m.id)).map((m) => m.id));
  const unknown = [...ids].filter((id) => !allowed.has(id));
  if (unknown.length) {
    throw HttpError.badRequest('Some people in this split are not members of the group.', {
      form: 'Refresh the member list and try again.',
    });
  }
}

// ─── Operations ─────────────────────────────────────────────────────────────

// GET /api/groups/:groupId/expenses?limit=&offset=
export async function listExpenses(member, { limit, offset }) {
  const rows = await repo.listForGroup(member.group_id, member.id, { limit, offset });
  return rows.map(toListItem);
}

// POST /api/groups/:groupId/expenses
export async function createExpense(user, member, body) {
  const paidBy = body.paidBy ?? member.id;
  const split = computeSplit(body);

  const id = await withTransaction(async (db) => {
    await assertParticipants(db, member.group_id, referencedMemberIds(body, paidBy));
    const expenseId = await repo.insertExpense(
      {
        groupId: member.group_id,
        description: body.description,
        totalCentavos: split.totalCentavos,
        paidBy,
        splitType: body.splitType,
        spentOn: body.spentOn,
        note: body.note,
        createdBy: user.id,
      },
      db,
    );
    await repo.insertItems(expenseId, split.items, split.charges, db);
    await repo.insertShares(expenseId, split.shares, db);
    await groupsRepo.touchGroup(member.group_id, db);
    return expenseId;
  });

  return loadDetail(id);
}

/** Load an expense and make sure the caller belongs to its group. */
async function loadForMember(expenseId, userId, db, opts) {
  assertUuid(expenseId, 'Expense');
  const expense = await repo.findById(expenseId, db, opts);
  if (!expense) throw HttpError.notFound('Expense not found.');
  const member = await assertMember(expense.group_id, userId, db).catch(() => {
    throw HttpError.notFound('Expense not found.');
  });
  return { expense, member };
}

function assertCanChange(expense, member) {
  const allowed = member.role === 'admin' || expense.created_by === member.user_id || expense.paid_by === member.id;
  if (!allowed) throw HttpError.forbidden('Only the person who added or paid this expense, or an admin, can change it.');
}

// GET /api/expenses/:id
export async function getExpense(user, expenseId) {
  await loadForMember(expenseId, user.id);
  return loadDetail(expenseId);
}

// PATCH /api/expenses/:id — details only, or a full re-split when splitType is sent
export async function updateExpense(user, expenseId, body) {
  await withTransaction(async (db) => {
    const { expense, member } = await loadForMember(expenseId, user.id, db, { forUpdate: true });
    assertCanChange(expense, member);

    if (!body.splitType) {
      await repo.updateDetails(expenseId, body, db);
      return;
    }

    const paidBy = body.paidBy ?? expense.paid_by;
    const split = computeSplit(body);
    const previous = new Set([expense.paid_by, ...(await repo.listShares(expenseId, db)).map((s) => s.member_id)]);
    await assertParticipants(db, expense.group_id, referencedMemberIds(body, paidBy), previous);

    await repo.clearSplit(expenseId, db);
    await repo.updateMoney(
      expenseId,
      { ...body, totalCentavos: split.totalCentavos, paidBy, splitType: body.splitType },
      db,
    );
    await repo.insertItems(expenseId, split.items, split.charges, db);
    await repo.insertShares(expenseId, split.shares, db);
  });
  return loadDetail(expenseId);
}

// DELETE /api/expenses/:id
export async function deleteExpense(user, expenseId) {
  await withTransaction(async (db) => {
    const { expense, member } = await loadForMember(expenseId, user.id, db, { forUpdate: true });
    assertCanChange(expense, member);
    await repo.deleteExpense(expenseId, db);
  });
}

