// Expenses.
//   groupExpensesRouter → mounted at /api/groups/:groupId/expenses (caller already checked as a member)
//   expensesRouter      → mounted at /api/expenses/:expenseId
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import { expenseSchema, expenseDetailsSchema } from './expenses.validation.js';
import * as service from './expenses.service.js';

const paging = z.object({
  limit: z.coerce.number().int().min(1).max(100).catch(50),
  offset: z.coerce.number().int().min(0).catch(0),
});

export const groupExpensesRouter = Router({ mergeParams: true });

groupExpensesRouter.get('/', async (req, res) => {
  res.json({ expenses: await service.listExpenses(req.member, paging.parse(req.query)) });
});

groupExpensesRouter.post('/', validateBody(expenseSchema), async (req, res) => {
  res.status(201).json({ expense: await service.createExpense(req.user, req.member, req.body) });
});

export const expensesRouter = Router();

expensesRouter.use(requireAuth);

expensesRouter.get('/:expenseId', async (req, res) => {
  res.json({ expense: await service.getExpense(req.user, req.params.expenseId) });
});

// With splitType → re-split the whole bill. Without → just description/date/note.
expensesRouter.patch(
  '/:expenseId',
  (req, res, next) => validateBody(req.body?.splitType ? expenseSchema : expenseDetailsSchema)(req, res, next),
  async (req, res) => {
    res.json({ expense: await service.updateExpense(req.user, req.params.expenseId, req.body) });
  },
);

expensesRouter.delete('/:expenseId', async (req, res) => {
  await service.deleteExpense(req.user, req.params.expenseId);
  res.status(204).end();
});
