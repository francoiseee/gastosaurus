// SQL for settlements (payments between members).
import { pool } from '../../db/pool.js';
import { centavosToNumeric } from '../../lib/money.js';

const SELECT = `
  SELECT s.*,
         g.name AS group_name,
         coalesce(fp.name, f.display_name) AS from_name, fp.avatar_emoji AS from_avatar, f.user_id AS from_user_id,
         coalesce(tp.name, t.display_name) AS to_name,   tp.avatar_emoji AS to_avatar,   t.user_id AS to_user_id
    FROM public.settlements s
    JOIN public.groups g         ON g.id = s.group_id
    JOIN public.group_members f  ON f.id = s.from_member
    LEFT JOIN public.profiles fp ON fp.id = f.user_id
    JOIN public.group_members t  ON t.id = s.to_member
    LEFT JOIN public.profiles tp ON tp.id = t.user_id`;

export function toSettlement(row, currentUserId) {
  const party = (prefix) => ({
    memberId: row[`${prefix}_member`],
    name: row[`${prefix}_name`],
    avatarEmoji: row[`${prefix}_avatar`] ?? '🙂',
    isGuest: row[`${prefix}_user_id`] === null,
    isCurrentUser: row[`${prefix}_user_id`] === currentUserId,
  });
  return {
    id: row.id,
    group: { id: row.group_id, name: row.group_name },
    from: party('from'),
    to: party('to'),
    amount: Number(row.amount),
    method: row.method,
    status: row.status,
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export async function listForGroup(groupId, { limit = 50, offset = 0 } = {}, db = pool) {
  const { rows } = await db.query(`${SELECT} WHERE s.group_id = $1 ORDER BY s.created_at DESC LIMIT $2 OFFSET $3`, [
    groupId,
    limit,
    offset,
  ]);
  return rows;
}

/** Payments where the user is the payer or receiver, in groups they're still in. */
export async function listForUser(userId, { status, limit = 50 } = {}, db = pool) {
  const { rows } = await db.query(
    `${SELECT}
      WHERE (f.user_id = $1 OR t.user_id = $1)
        AND EXISTS (SELECT 1 FROM public.group_members me
                     WHERE me.group_id = s.group_id AND me.user_id = $1 AND me.left_at IS NULL)
        AND ($2::text IS NULL OR s.status = $2)
      ORDER BY s.created_at DESC
      LIMIT $3`,
    [userId, status ?? null, limit],
  );
  return rows;
}

export async function findById(settlementId, db = pool, { forUpdate = false } = {}) {
  const { rows } = await db.query(`${SELECT} WHERE s.id = $1${forUpdate ? ' FOR UPDATE OF s' : ''}`, [settlementId]);
  return rows[0] ?? null;
}

export async function insert(s, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO public.settlements (group_id, from_member, to_member, amount, method, status, note, created_by, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $6 = 'completed' THEN now() END)
     RETURNING id`,
    [s.groupId, s.fromMember, s.toMember, centavosToNumeric(s.amountCentavos), s.method, s.status, s.note ?? null, s.createdBy],
  );
  return rows[0].id;
}

export async function markCompleted(settlementId, db = pool) {
  await db.query(`UPDATE public.settlements SET status = 'completed', completed_at = now() WHERE id = $1`, [
    settlementId,
  ]);
}

export async function remove(settlementId, db = pool) {
  await db.query('DELETE FROM public.settlements WHERE id = $1', [settlementId]);
}
