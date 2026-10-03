// Settlements (payments between members).
//   groupSettlementsRouter → /api/groups/:groupId/settlements (caller already checked as a member)
//   settlementsRouter      → /api/settlements/:settlementId
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import { peso } from '../../lib/validators.js';
import * as service from './settlements.service.js';

const recordSchema = z
  .object({
    toMemberId: z.uuid('Pick who received the payment.'),
    fromMemberId: z.uuid('Pick who paid.').optional(), // defaults to you
    amount: peso({ label: 'Amount' }),
    method: z.enum(['cash', 'gcash', 'maya', 'bank'], { error: 'Pick cash, GCash, Maya or bank transfer.' }).default('cash'),
    note: z.string().trim().max(280).nullable().optional(),
  })
  .strict();

const confirmSchema = z.object({ status: z.literal('completed', { error: 'Only "completed" is allowed.' }) }).strict();

const paging = z.object({
  limit: z.coerce.number().int().min(1).max(100).catch(50),
  offset: z.coerce.number().int().min(0).catch(0),
});

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
