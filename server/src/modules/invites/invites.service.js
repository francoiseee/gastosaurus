// Invite rules.
//
//   • Any active member can invite an email address.
//   • An invite may point at a GUEST spot ("Bea", added by name). Accepting it
//     links Bea's new account to that spot, so everything already split with
//     "Bea" becomes hers. Otherwise accepting adds a new member.
//   • Only the person whose login email matches can accept or decline.
//   • The inviter or a group admin can cancel a pending invite.
import { withTransaction } from '../../db/pool.js';
import { HttpError } from '../../utils/HttpError.js';
import { assertMember, assertUuid } from '../groups/membership.js';
import * as groupsRepo from '../groups/groups.repository.js';
import * as profiles from '../profile/profile.repository.js';
import * as notify from '../notifications/notify.js';
import * as repo from './invites.repository.js';

/**
 * Create an invite inside an existing transaction (also used when a group is
 * created with emails). Returns the invite id.
 */
export async function createInviteTx(db, { groupId, email, memberId = null, invitedBy }) {
  const existingMember = await groupsRepo.findActiveMemberByEmail(groupId, email, db);
  if (existingMember) {
    throw HttpError.conflict(`${email} is already in this group.`, { email: 'Already a member.' });
  }
  if (await repo.findPending(groupId, email, db)) {
    throw HttpError.conflict(`${email} already has a pending invite.`, { email: 'Already invited.' });
  }

  if (memberId) {
    const guest = await groupsRepo.findMember(groupId, memberId, db);
    if (!guest || guest.left_at) throw HttpError.badRequest('That member is not in this group.', { memberId: 'Not found.' });
    if (guest.user_id) {
      throw HttpError.badRequest('That member already has an account.', { memberId: 'Pick a guest member.' });
    }
    if (await repo.findPendingForMember(memberId, db)) {
      throw HttpError.conflict('That guest already has a pending invite.', { memberId: 'Already invited.' });
    }
  }

  const inviteId = await repo.insertInvite({ groupId, email, memberId, invitedBy }, db);
  await notify.inviteSent(db, { groupId, actorId: invitedBy, email, inviteId });
  return inviteId;
}

// POST /api/groups/:groupId/invites  { email, memberId? }
export async function createInvite(user, member, { email, memberId }) {
  const id = await withTransaction((db) =>
    createInviteTx(db, { groupId: member.group_id, email, memberId, invitedBy: user.id }),
  );
  return repo.toInvite(await repo.findWithInviter(id));
}

// GET /api/invites — invites waiting for the logged-in user's email
export async function listMyInvites(user) {
  if (!user.email) return [];
  const rows = await repo.listPendingForEmail(user.email.toLowerCase());
  return rows.map(repo.toInvite);
}

/** Load a pending invite addressed to this user, locked for the transaction. */
async function lockOwnPendingInvite(db, user, inviteId) {
  assertUuid(inviteId, 'Invite');
  const invite = await repo.findById(inviteId, db, { forUpdate: true });
  // Someone else's invite looks exactly like a missing one.
  if (!invite || !user.email || invite.email !== user.email.toLowerCase()) {
    throw HttpError.notFound('Invite not found.');
  }
  if (invite.status !== 'pending') {
    throw HttpError.conflict(`This invite was already ${invite.status}.`);
  }
  return invite;
}

// POST /api/invites/:id/accept → the group summary
export async function acceptInvite(user, inviteId) {
  const groupId = await withTransaction(async (db) => {
    const invite = await lockOwnPendingInvite(db, user, inviteId);
    const profile = await profiles.getOrCreate(user);

    const previous = await groupsRepo.findMemberByUser(invite.group_id, user.id, db);
    if (previous && !previous.left_at) {
      // Already in the group (e.g. joined through another invite) — nothing to add.
    } else if (previous) {
      await groupsRepo.reactivate(previous.id, db); // welcome back: same row, same history
    } else {
      const guest = invite.member_id ? await groupsRepo.findMember(invite.group_id, invite.member_id, db) : null;
      if (guest && !guest.user_id && !guest.left_at) {
        await groupsRepo.linkGuestToUser(guest.id, user.id, db); // claim the guest spot
      } else {
        await groupsRepo.insertMember({ groupId: invite.group_id, userId: user.id, displayName: profile.name }, db);
      }
    }

    await repo.setStatus(invite.id, 'accepted', db);
    await groupsRepo.touchGroup(invite.group_id, db);
    if (!previous || previous.left_at) await notify.memberJoined(db, { groupId: invite.group_id, userId: user.id });
    return invite.group_id;
  });

  return groupsRepo.toGroupSummary(await groupsRepo.findSummaryForUser(groupId, user.id));
}

/**
 * POST /api/invites/join  { code } — join through a share link.
 * Already a member → nothing changes. Left before → your old spot comes back.
 */
export async function joinByCode(user, code) {
  const groupId = await withTransaction(async (db) => {
    const id = await groupsRepo.findIdByInviteCode(code.toLowerCase(), db);
    if (!id) throw HttpError.notFound('That invite link is not valid any more. Ask for a new one.');

    const profile = await profiles.getOrCreate(user);
    const previous = await groupsRepo.findMemberByUser(id, user.id, db);
    if (previous && !previous.left_at) return id; // already in

    if (previous) await groupsRepo.reactivate(previous.id, db);
    else await groupsRepo.insertMember({ groupId: id, userId: user.id, displayName: profile.name }, db);

    // An email invite for this person is now redundant.
    if (user.email) {
      const pending = await repo.findPending(id, user.email.toLowerCase(), db);
      if (pending) await repo.setStatus(pending.id, 'accepted', db);
    }
    await groupsRepo.touchGroup(id, db);
    await notify.memberJoined(db, { groupId: id, userId: user.id });
    return id;
  });

  return groupsRepo.toGroupSummary(await groupsRepo.findSummaryForUser(groupId, user.id));
}

// POST /api/invites/:id/decline
export async function declineInvite(user, inviteId) {
  await withTransaction(async (db) => {
    const invite = await lockOwnPendingInvite(db, user, inviteId);
    await repo.setStatus(invite.id, 'declined', db);
  });
}

// DELETE /api/invites/:id — inviter or group admin cancels
export async function cancelInvite(user, inviteId) {
  assertUuid(inviteId, 'Invite');
  await withTransaction(async (db) => {
    const invite = await repo.findById(inviteId, db, { forUpdate: true });
    if (!invite) throw HttpError.notFound('Invite not found.');
    const member = await assertMember(invite.group_id, user.id, db).catch(() => {
      throw HttpError.notFound('Invite not found.');
    });
    if (invite.invited_by !== user.id && member.role !== 'admin') {
      throw HttpError.forbidden('Only the person who sent the invite or a group admin can cancel it.');
    }
    if (invite.status !== 'pending') throw HttpError.conflict(`This invite was already ${invite.status}.`);
    await repo.setStatus(invite.id, 'cancelled', db);
  });
}
