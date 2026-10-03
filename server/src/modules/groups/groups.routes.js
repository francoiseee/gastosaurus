// /api/groups — groups, members, and everything that hangs off a group.
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import { requireGroupMember } from './membership.js';
import * as schemas from './groups.validation.js';
import * as service from './groups.service.js';
import { inviteCreateSchema } from '../invites/invites.validation.js';
import * as invites from '../invites/invites.service.js';
import { groupExpensesRouter } from '../expenses/expenses.routes.js';
import { groupSettlementsRouter } from '../settlements/settlements.routes.js';
import { groupBalancesRouter } from '../balances/balances.routes.js';

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

// My groups (with my balance in each)
groupsRouter.get('/', async (req, res) => {
  res.json({ groups: await service.listMyGroups(req.user) });
});

// Create a group; I become admin. Body: { name, category?, iconId?, iconBg?, iconColor?, note?, members?: [{ name, email? }] }
groupsRouter.post('/', validateBody(schemas.createGroupSchema), async (req, res) => {
  res.status(201).json(await service.createGroup(req.user, req.body));
});

// Everything below needs the caller to be a member of :groupId (sets req.member).
groupsRouter.use('/:groupId', requireGroupMember);

groupsRouter.get('/:groupId', async (req, res) => {
  res.json(await service.getGroup(req.user, req.member));
});

groupsRouter.patch('/:groupId', validateBody(schemas.updateGroupSchema), async (req, res) => {
  res.json(await service.updateGroup(req.user, req.member, req.body));
});

groupsRouter.delete('/:groupId', async (req, res) => {
  await service.deleteGroup(req.member);
  res.status(204).end();
});

// Members
groupsRouter.post('/:groupId/members', validateBody(schemas.addMemberSchema), async (req, res) => {
  res.status(201).json({ member: await service.addGuest(req.user, req.member, req.body) });
});

groupsRouter.delete('/:groupId/members/me', async (req, res) => {
  await service.leaveGroup(req.member);
  res.status(204).end();
});

groupsRouter.patch('/:groupId/members/:memberId', validateBody(schemas.updateMemberSchema), async (req, res) => {
  res.json({ member: await service.updateMember(req.user, req.member, req.params.memberId, req.body) });
});

groupsRouter.delete('/:groupId/members/:memberId', async (req, res) => {
  await service.removeMember(req.member, req.params.memberId);
  res.status(204).end();
});

// Invites
groupsRouter.post('/:groupId/invites', validateBody(inviteCreateSchema), async (req, res) => {
  res.status(201).json({ invite: await invites.createInvite(req.user, req.member, req.body) });
});

// Expenses, balances, settlements
groupsRouter.use('/:groupId/expenses', groupExpensesRouter);
groupsRouter.use('/:groupId/balances', groupBalancesRouter);
groupsRouter.use('/:groupId/settlements', groupSettlementsRouter);
