// Builds the Express app (no .listen() here, so tests can start it on any port).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { profileRouter } from './modules/profile/profile.routes.js';
import { meBalancesRouter } from './modules/balances/balances.routes.js';
import { groupsRouter } from './modules/groups/groups.routes.js';
import { invitesRouter } from './modules/invites/invites.routes.js';
import { expensesRouter } from './modules/expenses/expenses.routes.js';
import { settlementsRouter } from './modules/settlements/settlements.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  if (env.isProduction) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/me', profileRouter); // GET/PATCH /api/me
  app.use('/api/me', meBalancesRouter); // /api/me/summary, /api/me/settle-up
  app.use('/api/groups', groupsRouter); // groups, members, invites, + nested expenses/balances/settlements
  app.use('/api/invites', invitesRouter);
  app.use('/api/expenses', expensesRouter);
  app.use('/api/settlements', settlementsRouter);
  app.use('/api/notifications', notificationsRouter);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
