// Settlements (payments between members).
//   groupSettlementsRouter → /api/groups/:groupId/settlements (caller already checked as a member)
//   settlementsRouter      → /api/settlements/:settlementId
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import { paging } from '../../lib/validators.js';
import { recordSchema, confirmSchema } from './settlements.validation.js';
import * as service from './settlements.service.js';

export const groupSettlementsRouter = Router({ mergeParams: true });

groupSettlementsRouter.get('/', async (req, res) => {
  res.json({ settlements: await service.listForGroup(req.user, req.member, paging.parse(req.query)) });
});

groupSettlementsRouter.post('/', validateBody(recordSchema), async (req, res) => {
  res.status(201).json({ settlement: await service.recordSettlement(req.user, req.member, req.body) });
});

export const settlementsRouter = Router();

settlementsRouter.use(requireAuth);

settlementsRouter.patch('/:settlementId', validateBody(confirmSchema), async (req, res) => {
  res.json({ settlement: await service.confirmSettlement(req.user, req.params.settlementId) });
});

settlementsRouter.delete('/:settlementId', async (req, res) => {
  await service.deleteSettlement(req.user, req.params.settlementId);
  res.status(204).end();
});
