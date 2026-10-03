// Balances.
//   groupBalancesRouter → /api/groups/:groupId/balances (caller already checked as a member)
//   meBalancesRouter    → /api/me/summary and /api/me/settle-up
import { Router } from 'express';
import { HttpError } from '../../utils/HttpError.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import * as service from './balances.service.js';

export const groupBalancesRouter = Router({ mergeParams: true });

groupBalancesRouter.get('/', async (req, res) => {
  res.json(await service.groupBalances(req.user, req.member));
});

export const meBalancesRouter = Router();

meBalancesRouter.use(requireAuth);

meBalancesRouter.get('/summary', async (req, res) => {
  const { month } = req.query;
  if (month !== undefined && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw HttpError.badRequest('Use a month like 2026-10.', { month: 'Use YYYY-MM.' });
  }
  res.json({ summary: await service.mySummary(req.user, month) });
});

meBalancesRouter.get('/settle-up', async (req, res) => {
  res.json(await service.mySettleUp(req.user));
});
