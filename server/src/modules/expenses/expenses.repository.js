// SQL for expenses, their receipt lines, and the per-person shares.
import { pool } from '../../db/pool.js';
import { centavosToNumeric } from '../../lib/money.js';

const memberName = (alias) => `(SELECT coalesce(p.name, m.display_name)
    FROM public.group_members m LEFT JOIN public.profiles p ON p.id = m.user_id
   WHERE m.id = ${alias})`;

/** Newest first. Includes the caller's own share so the list can say "your share ₱…". */
export async function listForGroup(groupId, myMemberId, { limit = 50, offset = 0 } = {}, db = pool) {
  const { rows } = await db.query(
    `SELECT e.id, e.group_id, e.description, e.total_amount, e.paid_by, e.split_type, e.spent_on,
            e.note, e.created_by, e.created_at, e.updated_at,
            ${memberName('e.paid_by')} AS paid_by_name,
            (SELECT s.amount FROM public.expense_shares s WHERE s.expense_id = e.id AND s.member_id = $2) AS my_share,
            (SELECT count(*) FROM public.expense_shares s WHERE s.expense_id = e.id)::int AS people_count
       FROM public.expenses e
      WHERE e.group_id = $1
      ORDER BY e.spent_on DESC, e.created_at DESC
      LIMIT $3 OFFSET $4`,
    [groupId, myMemberId, limit, offset],
  );
  return rows;
}

export async function findById(expenseId, db = pool, { forUpdate = false } = {}) {
  const { rows } = await db.query(
    `SELECT e.*, ${memberName('e.paid_by')} AS paid_by_name
       FROM public.expenses e WHERE e.id = $1${forUpdate ? ' FOR UPDATE OF e' : ''}`,
    [expenseId],
  );
  return rows[0] ?? null;
}

/** Receipt lines (items and charges) with who had each item. */
export async function listItems(expenseId, db = pool) {
  const { rows } = await db.query(
    `SELECT i.id, i.kind, i.name, i.price, i.position,
            coalesce(array_agg(a.member_id ORDER BY a.member_id) FILTER (WHERE a.member_id IS NOT NULL), '{}') AS member_ids
       FROM public.expense_items i
       LEFT JOIN public.expense_item_assignees a ON a.item_id = i.id
      WHERE i.expense_id = $1
      GROUP BY i.id
      ORDER BY i.kind DESC, i.position`, // items first, then charges
    [expenseId],
  );
  return rows;
}

export async function listShares(expenseId, db = pool) {
  const { rows } = await db.query(
    `SELECT s.member_id, s.amount, coalesce(p.name, m.display_name) AS name, p.avatar_emoji, m.user_id
       FROM public.expense_shares s
       JOIN public.group_members m ON m.id = s.member_id
       LEFT JOIN public.profiles p ON p.id = m.user_id
      WHERE s.expense_id = $1
      ORDER BY s.amount DESC, name`,
    [expenseId],
  );
  return rows;
}

export async function insertExpense(e, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO public.expenses (group_id, description, total_amount, paid_by, split_type, spent_on, note, created_by)
     VALUES ($1, $2, $3, $4, $5, coalesce($6::date, current_date), $7, $8)
     RETURNING id`,
    [
      e.groupId,
      e.description,
      centavosToNumeric(e.totalCentavos),
      e.paidBy,
      e.splitType,
      e.spentOn ?? null,
      e.note ?? null,
      e.createdBy,
    ],
  );
  return rows[0].id;
}

export async function updateDetails(expenseId, { description, spentOn, note }, db = pool) {
  await db.query(
    `UPDATE public.expenses
        SET description = coalesce($2, description),
            spent_on    = coalesce($3::date, spent_on),
            note        = CASE WHEN $4::boolean THEN $5 ELSE note END
      WHERE id = $1`,
    [expenseId, description ?? null, spentOn ?? null, note !== undefined, note ?? null],
  );
}

export async function updateMoney(expenseId, e, db = pool) {
  await db.query(
    `UPDATE public.expenses
        SET description = $2, total_amount = $3, paid_by = $4, split_type = $5,
            spent_on = coalesce($6::date, spent_on),
            note = CASE WHEN $7::boolean THEN $8 ELSE note END
      WHERE id = $1`,
    [
      expenseId,
      e.description,
      centavosToNumeric(e.totalCentavos),
      e.paidBy,
      e.splitType,
      e.spentOn ?? null,
      e.note !== undefined,
      e.note ?? null,
    ],
  );
}

/** Remove the old receipt lines and shares before writing new ones. */
export async function clearSplit(expenseId, db = pool) {
  await db.query('DELETE FROM public.expense_items WHERE expense_id = $1', [expenseId]);
  await db.query('DELETE FROM public.expense_shares WHERE expense_id = $1', [expenseId]);
}

/** items: [{ name, price (centavos), memberIds }], charges: [{ name, amount (centavos) }] */
export async function insertItems(expenseId, items, charges, db = pool) {
  const lines = [
    ...items.map((it, i) => ({ kind: 'item', name: it.name, cents: it.price, memberIds: it.memberIds, position: i })),
    ...charges.map((c, i) => ({ kind: 'charge', name: c.name, cents: c.amount, memberIds: [], position: i })),
  ];
  for (const line of lines) {
    const { rows } = await db.query(
      `INSERT INTO public.expense_items (expense_id, kind, name, price, position)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [expenseId, line.kind, line.name, centavosToNumeric(line.cents), line.position],
    );
    if (line.memberIds.length) {
      await db.query(
        `INSERT INTO public.expense_item_assignees (item_id, member_id) SELECT $1, unnest($2::uuid[])`,
        [rows[0].id, line.memberIds],
      );
    }
  }
}

/** shares: [{ memberId, amount (centavos) }] */
export async function insertShares(expenseId, shares, db = pool) {
  await db.query(
    `INSERT INTO public.expense_shares (expense_id, member_id, amount)
     SELECT $1, unnest($2::uuid[]), unnest($3::numeric[])`,
    [expenseId, shares.map((s) => s.memberId), shares.map((s) => centavosToNumeric(s.amount))],
  );
}

export async function deleteExpense(expenseId, db = pool) {
  await db.query('DELETE FROM public.expenses WHERE id = $1', [expenseId]);
}
