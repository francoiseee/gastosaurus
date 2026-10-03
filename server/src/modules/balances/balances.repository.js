// SQL for balances across groups and monthly spending.
import { pool } from '../../db/pool.js';

/**
 * Every member's balance in every group the user is active in.
 * (Departed members are included so the numbers always add up to zero.)
 */
export async function balancesInMyGroups(userId, db = pool) {
  const { rows } = await db.query(
    `SELECT m.group_id, g.name AS group_name, g.icon_id,
            m.id AS member_id, m.user_id, m.left_at,
            coalesce(p.name, m.display_name) AS name, p.avatar_emoji,
            b.net
       FROM public.group_members me
       JOIN public.groups g         ON g.id = me.group_id
       JOIN public.group_members m  ON m.group_id = me.group_id
       LEFT JOIN public.profiles p  ON p.id = m.user_id
       JOIN public.group_balances b ON b.member_id = m.id
      WHERE me.user_id = $1 AND me.left_at IS NULL
      ORDER BY g.updated_at DESC, m.joined_at, m.seq`,
    [userId],
  );
  return rows;
}

/**
 * What the user's own shares added up to between two dates (inclusive start,
 * exclusive end), across all their groups — "personal spending".
 */
export async function shareTotalBetween(userId, fromDate, toDate, db = pool) {
  const { rows } = await db.query(
    `SELECT coalesce(sum(s.amount), 0) AS total
       FROM public.expense_shares s
       JOIN public.expenses e      ON e.id = s.expense_id
       JOIN public.group_members m ON m.id = s.member_id
      WHERE m.user_id = $1 AND e.spent_on >= $2::date AND e.spent_on < $3::date`,
    [userId, fromDate, toDate],
  );
  return rows[0].total;
}
