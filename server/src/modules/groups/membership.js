// "Is this user in this group?" — checked before EVERY group read or write.
// The API connects to Postgres as the database owner (RLS does not apply), so
// this guard is what keeps one barkada out of another's money.
import { pool } from '../../db/pool.js';
import { HttpError } from '../../utils/HttpError.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value) => typeof value === 'string' && UUID.test(value);

/** The caller's active member row in a group, or null. */
export async function findActiveMembership(groupId, userId, db = pool) {
  const { rows } = await db.query(
    `SELECT id, group_id, user_id, display_name, role, joined_at
       FROM public.group_members
      WHERE group_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [groupId, userId],
  );
  return rows[0] ?? null;
}

/**
 * Throws 404 unless the user is an active member. (404, not 403, so outsiders
 * can't even tell whether a group id exists.) Returns the member row.
 */
export async function assertMember(groupId, userId, db = pool) {
  if (!isUuid(groupId)) throw HttpError.notFound('Group not found.');
  const member = await findActiveMembership(groupId, userId, db);
  if (!member) throw HttpError.notFound('Group not found.');
  return member;
}

export function assertAdmin(member, message = 'Only a group admin can do that.') {
  if (member.role !== 'admin') throw HttpError.forbidden(message);
}

/** Express middleware for /api/groups/:groupId/* — sets req.member. */
export async function requireGroupMember(req, _res, next) {
  req.member = await assertMember(req.params.groupId, req.user.id);
  next();
}

/** 404 for ids that aren't UUIDs, so Postgres never sees malformed input. */
export function assertUuid(value, what = 'Item') {
  if (!isUuid(value)) throw HttpError.notFound(`${what} not found.`);
}
