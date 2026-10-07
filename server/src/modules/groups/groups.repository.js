// SQL for groups and group members. Repositories only run queries and shape
// rows; rules live in groups.service.js.
// Every function takes an optional `db` (a pool or a transaction client).
import { pool } from '../../db/pool.js';
import { toCentavos, fromCentavos, statusFor } from '../../lib/money.js';

// ─── Shapes sent to the frontend ────────────────────────────────────────────

export function toGroupSummary(row) {
  const myNet = toCentavos(row.my_net ?? '0');
  return {
    id: row.id,
    name: row.name,
    note: row.note,
    category: row.category,
    iconId: row.icon_id,
    iconBg: row.icon_bg,
    iconColor: row.icon_color,
    inviteCode: row.invite_code, // for the share link: <app>/?join=<code>
    membersCount: Number(row.members_count),
    myMemberId: row.my_member_id,
    myRole: row.my_role,
    balance: fromCentavos(myNet), // > 0 you are owed, < 0 you owe
    statusType: statusFor(myNet), // 'owed' | 'owe' | 'settled'
    totalSpending: Number(row.total_spending ?? 0),
    recentExpense: row.recent_expense ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toMember(row, currentUserId) {
  const net = toCentavos(row.net ?? '0');
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email ?? null,
    avatarEmoji: row.avatar_emoji ?? '🙂',
    role: row.role,
    isGuest: row.user_id === null,
    isCurrentUser: row.user_id !== null && row.user_id === currentUserId,
    joinedAt: row.joined_at,
    spentAmount: Number(row.total_paid ?? 0), // paid on behalf of the group
    shareAmount: Number(row.total_share ?? 0), // own share of the group's bills
    net: fromCentavos(net),
    statusType: statusFor(net),
  };
}

// ─── Groups ─────────────────────────────────────────────────────────────────

const GROUP_SUMMARY_SQL = `
  SELECT g.*,
         me.id   AS my_member_id,
         me.role AS my_role,
         (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id AND m.left_at IS NULL) AS members_count,
         (SELECT b.net FROM public.group_balances b WHERE b.member_id = me.id) AS my_net,
         (SELECT coalesce(sum(e.total_amount), 0) FROM public.expenses e WHERE e.group_id = g.id) AS total_spending,
         (SELECT e.description FROM public.expenses e WHERE e.group_id = g.id
           ORDER BY e.spent_on DESC, e.created_at DESC LIMIT 1) AS recent_expense
    FROM public.group_members me
    JOIN public.groups g ON g.id = me.group_id
   WHERE me.user_id = $1 AND me.left_at IS NULL`;

export async function listForUser(userId, db = pool) {
  const { rows } = await db.query(`${GROUP_SUMMARY_SQL} ORDER BY g.updated_at DESC, g.created_at DESC`, [userId]);
  return rows;
}

export async function findSummaryForUser(groupId, userId, db = pool) {
  const { rows } = await db.query(`${GROUP_SUMMARY_SQL} AND g.id = $2`, [userId, groupId]);
  return rows[0] ?? null;
}

const GROUP_COLUMNS = {
  name: 'name',
  note: 'note',
  category: 'category',
  iconId: 'icon_id',
  iconBg: 'icon_bg',
  iconColor: 'icon_color',
};

export async function insertGroup(fields, createdBy, db = pool) {
  const cols = ['created_by'];
  const values = [createdBy];
  for (const [key, column] of Object.entries(GROUP_COLUMNS)) {
    if (fields[key] !== undefined) {
      cols.push(column);
      values.push(fields[key]);
    }
  }
  const params = values.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await db.query(
    `INSERT INTO public.groups (${cols.join(', ')}) VALUES (${params}) RETURNING id`,
    values,
  );
  return rows[0].id;
}

export async function updateGroup(groupId, fields, db = pool) {
  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(GROUP_COLUMNS)) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  if (!sets.length) return;
  values.push(groupId);
  await db.query(`UPDATE public.groups SET ${sets.join(', ')} WHERE id = $${values.length}`, values);
}

/** Bump updated_at so the group floats to the top of "my groups". */
export async function touchGroup(groupId, db = pool) {
  await db.query('UPDATE public.groups SET updated_at = now() WHERE id = $1', [groupId]);
}

/** Group id for a join-link code, or null. */
export async function findIdByInviteCode(code, db = pool) {
  const { rows } = await db.query('SELECT id FROM public.groups WHERE invite_code = $1', [code]);
  return rows[0]?.id ?? null;
}

/** New random join code; old links stop working. */
export async function rotateInviteCode(groupId, db = pool) {
  await db.query(
    `UPDATE public.groups SET invite_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 10) WHERE id = $1`,
    [groupId],
  );
}

export async function deleteGroup(groupId, db = pool) {
  await db.query('DELETE FROM public.groups WHERE id = $1', [groupId]);
}

// ─── Members ────────────────────────────────────────────────────────────────

const MEMBER_SELECT = `
  SELECT m.id, m.group_id, m.user_id, m.role, m.joined_at, m.left_at,
         coalesce(p.name, m.display_name) AS name,
         p.avatar_emoji,
         u.email,
         b.net, b.total_paid, b.total_share
    FROM public.group_members m
    LEFT JOIN public.profiles p ON p.id = m.user_id
    LEFT JOIN auth.users u      ON u.id = m.user_id
    LEFT JOIN public.group_balances b ON b.member_id = m.id`;

/** Active members, oldest first (the creator is first). */
export async function listActiveMembers(groupId, db = pool) {
  const { rows } = await db.query(
    `${MEMBER_SELECT} WHERE m.group_id = $1 AND m.left_at IS NULL ORDER BY m.joined_at, m.seq`,
    [groupId],
  );
  return rows;
}

/** Every member who ever belonged (for balances and expense history). */
export async function listAllMembers(groupId, db = pool) {
  const { rows } = await db.query(`${MEMBER_SELECT} WHERE m.group_id = $1 ORDER BY m.joined_at, m.seq`, [groupId]);
  return rows;
}

export async function findMember(groupId, memberId, db = pool) {
  const { rows } = await db.query(`${MEMBER_SELECT} WHERE m.group_id = $1 AND m.id = $2`, [groupId, memberId]);
  return rows[0] ?? null;
}

export async function findMemberByUser(groupId, userId, db = pool) {
  const { rows } = await db.query(`${MEMBER_SELECT} WHERE m.group_id = $1 AND m.user_id = $2`, [groupId, userId]);
  return rows[0] ?? null;
}

/** Active member whose linked account has this email (case-insensitive). */
export async function findActiveMemberByEmail(groupId, email, db = pool) {
  const { rows } = await db.query(
    `${MEMBER_SELECT} WHERE m.group_id = $1 AND m.left_at IS NULL AND lower(u.email) = $2`,
    [groupId, email],
  );
  return rows[0] ?? null;
}

export async function insertMember({ groupId, userId = null, displayName, role = 'member' }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO public.group_members (group_id, user_id, display_name, role)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [groupId, userId, displayName, role],
  );
  return rows[0].id;
}

export async function updateMember(memberId, { displayName, role }, db = pool) {
  await db.query(
    `UPDATE public.group_members
        SET display_name = coalesce($2, display_name),
            role         = coalesce($3, role)
      WHERE id = $1`,
    [memberId, displayName ?? null, role ?? null],
  );
}

export async function markLeft(memberId, db = pool) {
  await db.query(`UPDATE public.group_members SET left_at = now(), role = 'member' WHERE id = $1`, [memberId]);
}

/** Bring a returning member back (keeps their old history). */
export async function reactivate(memberId, db = pool) {
  await db.query(`UPDATE public.group_members SET left_at = NULL, joined_at = now() WHERE id = $1`, [memberId]);
}

/** A guest row becomes a real account's row ("claiming" it). */
export async function linkGuestToUser(memberId, userId, db = pool) {
  await db.query(`UPDATE public.group_members SET user_id = $2 WHERE id = $1 AND user_id IS NULL`, [memberId, userId]);
}

export async function countActiveAdmins(groupId, db = pool) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS n FROM public.group_members WHERE group_id = $1 AND role = 'admin' AND left_at IS NULL`,
    [groupId],
  );
  return rows[0].n;
}

/** How many active members still have an account (guests don't count). */
export async function countActiveAccountMembers(groupId, db = pool) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS n FROM public.group_members WHERE group_id = $1 AND user_id IS NOT NULL AND left_at IS NULL`,
    [groupId],
  );
  return rows[0].n;
}

/** Longest-standing active member with an account (to inherit admin). */
export async function findSuccessorAdmin(groupId, excludingMemberId, db = pool) {
  const { rows } = await db.query(
    `SELECT id FROM public.group_members
      WHERE group_id = $1 AND id <> $2 AND left_at IS NULL AND user_id IS NOT NULL
      ORDER BY joined_at, seq LIMIT 1`,
    [groupId, excludingMemberId],
  );
  return rows[0]?.id ?? null;
}

/** Live net balance of one member, in centavos. */
export async function memberNetCentavos(memberId, db = pool) {
  const { rows } = await db.query('SELECT net FROM public.group_balances WHERE member_id = $1', [memberId]);
  return toCentavos(rows[0]?.net ?? '0');
}

/** True when every member's balance in the group is zero. */
export async function isGroupSettled(groupId, db = pool) {
  const { rows } = await db.query(
    'SELECT NOT EXISTS (SELECT 1 FROM public.group_balances WHERE group_id = $1 AND net <> 0) AS settled',
    [groupId],
  );
  return rows[0].settled;
}
