// SQL for notifications.
import { pool } from '../../db/pool.js';

export function toNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    groupId: row.group_id,
    data: row.data,
    read: row.read_at !== null,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

/**
 * Insert many notifications in one statement.
 * rows: [{ userId, type, title, body?, groupId?, actorId?, data? }]
 */
export async function insertMany(rows, db = pool) {
  if (!rows.length) return;
  const payload = rows.map((r) => ({
    user_id: r.userId,
    type: r.type,
    title: r.title.slice(0, 200),
    body: r.body?.slice(0, 400) ?? null,
    group_id: r.groupId ?? null,
    actor_id: r.actorId ?? null,
    data: r.data ?? {},
  }));
  await db.query(
    `INSERT INTO public.notifications (user_id, type, title, body, group_id, actor_id, data)
     SELECT user_id, type, title, body, group_id, actor_id, data
       FROM jsonb_to_recordset($1::jsonb)
         AS x(user_id uuid, type text, title text, body text, group_id uuid, actor_id uuid, data jsonb)`,
    [JSON.stringify(payload)],
  );
}

/** Newest first; `before` (ISO time) pages back through older ones. */
export async function listForUser(userId, { limit = 30, before = null, unreadOnly = false } = {}, db = pool) {
  const { rows } = await db.query(
    `SELECT * FROM public.notifications
      WHERE user_id = $1
        AND ($2::timestamptz IS NULL OR created_at < $2)
        AND (NOT $3::boolean OR read_at IS NULL)
      ORDER BY created_at DESC, id DESC
      LIMIT $4`,
    [userId, before, unreadOnly, limit],
  );
  return rows;
}

export async function countUnread(userId, db = pool) {
  const { rows } = await db.query(
    'SELECT count(*)::int AS n FROM public.notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId],
  );
  return rows[0].n;
}

/** Returns the row, or null if it isn't this user's. */
export async function markRead(userId, notificationId, db = pool) {
  const { rows } = await db.query(
    `UPDATE public.notifications SET read_at = coalesce(read_at, now())
      WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId],
  );
  return rows[0] ?? null;
}

export async function markAllRead(userId, db = pool) {
  const { rowCount } = await db.query(
    'UPDATE public.notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL',
    [userId],
  );
  return rowCount;
}

export async function remove(userId, notificationId, db = pool) {
  const { rowCount } = await db.query('DELETE FROM public.notifications WHERE id = $1 AND user_id = $2', [
    notificationId,
    userId,
  ]);
  return rowCount > 0;
}

/** Users (among `userIds`) already reminded about this group since `since`. */
export async function recentlyReminded(groupId, userIds, since, db = pool) {
  if (!userIds.length) return new Set();
  const { rows } = await db.query(
    `SELECT DISTINCT user_id FROM public.notifications
      WHERE type = 'reminder' AND group_id = $1 AND user_id = ANY($2::uuid[]) AND created_at >= $3`,
    [groupId, userIds, since],
  );
  return new Set(rows.map((r) => r.user_id));
}

/** Profile ids of a group's active members who have accounts. */
export async function activeMemberUserIds(groupId, db = pool) {
  const { rows } = await db.query(
    `SELECT user_id FROM public.group_members WHERE group_id = $1 AND left_at IS NULL AND user_id IS NOT NULL`,
    [groupId],
  );
  return rows.map((r) => r.user_id);
}

/** Profile ids behind a list of member ids (guests are skipped). */
export async function userIdsForMembers(memberIds, db = pool) {
  if (!memberIds.length) return [];
  const { rows } = await db.query(
    `SELECT DISTINCT user_id FROM public.group_members WHERE id = ANY($1::uuid[]) AND user_id IS NOT NULL`,
    [memberIds],
  );
  return rows.map((r) => r.user_id);
}

/** Profile id for an email address, if that person has an account. */
export async function userIdForEmail(email, db = pool) {
  const { rows } = await db.query(
    `SELECT p.id FROM auth.users u JOIN public.profiles p ON p.id = u.id WHERE lower(u.email) = $1 LIMIT 1`,
    [email],
  );
  return rows[0]?.id ?? null;
}
