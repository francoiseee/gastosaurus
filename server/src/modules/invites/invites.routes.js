// /api/invites — invites addressed to the logged-in user, and cancelling.
// (Sending an invite is POST /api/groups/:groupId/invites.)
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import * as service from './invites.service.js';

export const invitesRouter = Router();

invitesRouter.use(requireAuth);

invitesRouter.get('/', async (req, res) => {
  res.json({ invites: await service.listMyInvites(req.user) });
});

invitesRouter.post('/:inviteId/accept', async (req, res) => {
  res.json({ group: await service.acceptInvite(req.user, req.params.inviteId) });
});

invitesRouter.post('/:inviteId/decline', async (req, res) => {
  await service.declineInvite(req.user, req.params.inviteId);
  res.status(204).end();
});

invitesRouter.delete('/:inviteId', async (req, res) => {
  await service.cancelInvite(req.user, req.params.inviteId);
  res.status(204).end();
});
