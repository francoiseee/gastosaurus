// Group rules.
//
//   • Whoever creates a group is its first admin.
//   • Friends can be added by NAME as guests (no account needed), so a barkada
//     can start splitting right away. Adding an email also sends an invite that
//     lets the friend claim the guest spot later.
//   • Any member can add guests and invite people. Only admins can rename the
//     group, change roles, remove members, or delete the group.
//   • Nobody can leave (or be removed) while they still owe or are owed money —
//     settle up first. Departed members keep their rows so history stays intact.
//   • If the last admin leaves, the longest-standing member with an account
//     becomes admin.
import { withTransaction } from '../../db/pool.js';
import { HttpError } from '../../utils/HttpError.js';
import { formatPeso } from '../../lib/money.js';
import * as profiles from '../profile/profile.repository.js';
import * as invitesRepo from '../invites/invites.repository.js';
import { createInviteTx } from '../invites/invites.service.js';
import { assertAdmin, assertUuid } from './membership.js';
import * as repo from './groups.repository.js';

async function ensureProfile(user) {
  const fallbackName = (user.name || user.email?.split('@')[0] || 'Budget Dino').slice(0, 60);
  return (await profiles.findById(user.id)) ?? (await profiles.ensureExists(user.id, fallbackName));
}

async function groupDetail(groupId, user) {
  const [summary, members, invites] = await Promise.all([
    repo.findSummaryForUser(groupId, user.id),
    repo.listActiveMembers(groupId),
    invitesRepo.listPendingForGroup(groupId),
  ]);
  return {
    group: repo.toGroupSummary(summary),
    members: members.map((m) => repo.toMember(m, user.id)),
    pendingInvites: invites.map(invitesRepo.toInvite),
  };
}

// GET /api/groups
export async function listMyGroups(user) {
  const rows = await repo.listForUser(user.id);
  return rows.map(repo.toGroupSummary);
}

// POST /api/groups
export async function createGroup(user, { members = [], ...fields }) {
  const profile = await ensureProfile(user);

  const seenNames = new Set([profile.name.toLowerCase()]);
  const seenEmails = new Set(user.email ? [user.email.toLowerCase()] : []);
  for (const [i, m] of members.entries()) {
    if (seenNames.has(m.name.toLowerCase())) {
      throw HttpError.badRequest('Each member needs a different name.', { [`members.${i}.name`]: 'Name already used.' });
    }
    if (m.email && seenEmails.has(m.email)) {
      throw HttpError.badRequest('Each email can only be used once.', { [`members.${i}.email`]: 'Email already used.' });
    }
    seenNames.add(m.name.toLowerCase());
    if (m.email) seenEmails.add(m.email);
  }

  const groupId = await withTransaction(async (db) => {
    const id = await repo.insertGroup(fields, user.id, db);
    await repo.insertMember({ groupId: id, userId: user.id, displayName: profile.name, role: 'admin' }, db);
    for (const m of members) {
      const memberId = await repo.insertMember({ groupId: id, displayName: m.name }, db);
      if (m.email) await createInviteTx(db, { groupId: id, email: m.email, memberId, invitedBy: user.id });
    }
    return id;
  });

  return groupDetail(groupId, user);
}

// GET /api/groups/:groupId
export async function getGroup(user, member) {
  return groupDetail(member.group_id, user);
}

// PATCH /api/groups/:groupId  (admin)
export async function updateGroup(user, member, fields) {
  assertAdmin(member, 'Only a group admin can edit the group.');
  await repo.updateGroup(member.group_id, fields);
  return groupDetail(member.group_id, user);
}

// DELETE /api/groups/:groupId  (admin, only when everyone is settled)
export async function deleteGroup(member) {
  assertAdmin(member, 'Only a group admin can delete the group.');
  await withTransaction(async (db) => {
    if (!(await repo.isGroupSettled(member.group_id, db))) {
      throw HttpError.conflict('Settle all balances before deleting this group.');
    }
    await repo.deleteGroup(member.group_id, db);
  });
}

// POST /api/groups/:groupId/members  { name, email? } — add a friend as a guest
export async function addGuest(user, member, { name, email }) {
  const groupId = member.group_id;
  const memberId = await withTransaction(async (db) => {
    const active = await repo.listActiveMembers(groupId, db);
    if (active.length >= 50) throw HttpError.conflict('A group can have up to 50 members.');
    if (active.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      throw HttpError.conflict(`Someone named "${name}" is already in this group.`, { name: 'Name already used.' });
    }
    const id = await repo.insertMember({ groupId, displayName: name }, db);
    if (email) await createInviteTx(db, { groupId, email, memberId: id, invitedBy: user.id });
    await repo.touchGroup(groupId, db);
    return id;
  });
  return repo.toMember(await repo.findMember(groupId, memberId), user.id);
}

// PATCH /api/groups/:groupId/members/:memberId  { name?, role? }  (admin)
export async function updateMember(user, member, targetId, { name, role }) {
  assertAdmin(member, 'Only a group admin can change members.');
  assertUuid(targetId, 'Member');
  const groupId = member.group_id;

  await withTransaction(async (db) => {
    const target = await repo.findMember(groupId, targetId, db);
    if (!target || target.left_at) throw HttpError.notFound('Member not found.');

    if (name !== undefined && target.user_id) {
      throw HttpError.badRequest('Members with an account set their own name.', { name: 'Only guests can be renamed.' });
    }
    if (role !== undefined && !target.user_id) {
      throw HttpError.badRequest('Guests cannot be admins.', { role: 'Invite them first so they have an account.' });
    }
    if (role === 'member' && target.role === 'admin' && (await repo.countActiveAdmins(groupId, db)) <= 1) {
      throw HttpError.conflict('A group needs at least one admin. Make someone else admin first.');
    }
    await repo.updateMember(targetId, { displayName: name, role }, db);
  });

  return repo.toMember(await repo.findMember(groupId, targetId), user.id);
}

async function assertSettled(memberId, who, db) {
  const net = await repo.memberNetCentavos(memberId, db);
  if (net !== 0) {
    const detail = net < 0 ? `still owes ${formatPeso(-net)}` : `is still owed ${formatPeso(net)}`;
    throw HttpError.conflict(`${who} ${detail}. Settle up first.`);
  }
}

// DELETE /api/groups/:groupId/members/:memberId  (admin removes someone)
export async function removeMember(member, targetId) {
  assertAdmin(member, 'Only a group admin can remove members.');
  assertUuid(targetId, 'Member');
  if (targetId === member.id) throw HttpError.badRequest('To leave the group, use "Leave group".');

  await withTransaction(async (db) => {
    const target = await repo.findMember(member.group_id, targetId, db);
    if (!target || target.left_at) throw HttpError.notFound('Member not found.');
    await assertSettled(targetId, target.name, db);
    await repo.markLeft(targetId, db);
    await invitesRepo.cancelPendingForMember(targetId, db);
  });
}

// DELETE /api/groups/:groupId/members/me  (leave)
export async function leaveGroup(member) {
  await withTransaction(async (db) => {
    await assertSettled(member.id, 'You', db);
    if (member.role === 'admin' && (await repo.countActiveAdmins(member.group_id, db)) <= 1) {
      const successor = await repo.findSuccessorAdmin(member.group_id, member.id, db);
      if (successor) await repo.updateMember(successor, { role: 'admin' }, db);
    }
    await repo.markLeft(member.id, db);
  });
}
