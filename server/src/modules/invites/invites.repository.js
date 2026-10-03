// SQL for group invites.
import { pool } from '../../db/pool.js';

export function toInvite(row) {
  return {
    id: row.id,
    groupId: row.group_id,
    email: row.email,
    memberId: row.member_id, // guest spot this invite claims, if any
    status: row.status,
    invitedBy: row.invited_by ? { id: row.invited_by, name: row.invited_by_name } : null,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
    ...(row.group_name !== undefined && {
      group: { id: row.group_id, name: row.group_name, iconId: row.icon_id, category: row.category },
    }),
  };
}

const SELECT = `
  SELECT i.*, p.name AS invited_by_name
    FROM public.group_invites i
    LEFT JOIN public.profiles p ON p.id = i.invited_by`;

export async function insertInvite({ groupId, email, memberId = null, invitedBy }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO public.group_invites (group_id, email, member_id, invited_by)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [groupId, email, memberId, invitedBy],
  );
  return rows[0].id;
}

export async function findById(inviteId, db = pool, { forUpdate = false } = {}) {
  const { rows } = await db.query(
    `SELECT * FROM public.group_invites WHERE id = $1${forUpdate ? ' FOR UPDATE' : ''}`,
    [inviteId],
  );
  return rows[0] ?? null;
}

export async function findWithInviter(inviteId, db = pool) {
  const { rows } = await db.query(`${SELECT} WHERE i.id = $1`, [inviteId]);
  return rows[0] ?? null;
}

export async function findPending(groupId, email, db = pool) {
  const { rows } = await db.query(
    `SELECT * FROM public.group_invites WHERE group_id = $1 AND email = $2 AND status = 'pending'`,
    [groupId, email],
  );
  return rows[0] ?? null;
}

export async function findPendingForMember(memberId, db = pool) {
  const { rows } = await db.query(
    `SELECT * FROM public.group_invites WHERE member_id = $1 AND status = 'pending'`,
    [memberId],
  );
  return rows[0] ?? null;
}

export async function listPendingForGroup(groupId, db = pool) {
  const { rows } = await db.query(`${SELECT} WHERE i.group_id = $1 AND i.status = 'pending' ORDER BY i.created_at`, [
    groupId,
  ]);
  return rows;
}

/** Invites waiting for this email address, with the group's name and icon. */
export async function listPendingForEmail(email, db = pool) {
  const { rows } = await db.query(
    `SELECT i.*, p.name AS invited_by_name, g.name AS group_name, g.icon_id, g.category
       FROM public.group_invites i
       JOIN public.groups g ON g.id = i.group_id
       LEFT JOIN public.profiles p ON p.id = i.invited_by
      WHERE i.email = $1 AND i.status = 'pending'
      ORDER BY i.created_at DESC`,
    [email],
  );
  return rows;
}

export async function setStatus(inviteId, status, db = pool) {
  await db.query(`UPDATE public.group_invites SET status = $2, responded_at = now() WHERE id = $1`, [
    inviteId,
    status,
  ]);
}

/** When a guest spot disappears, its invite can't be claimed any more. */
export async function cancelPendingForMember(memberId, db = pool) {
  await db.query(
    `UPDATE public.group_invites SET status = 'cancelled', responded_at = now()
      WHERE member_id = $1 AND status = 'pending'`,
    [memberId],
  );
}
