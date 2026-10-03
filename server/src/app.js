// Builds the Express app (no .listen() here, so tests can start it on any port).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { profileRouter } from './modules/profile/profile.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  if (env.isProduction) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/me', profileRouter);
  // Next phases (see docs/ARCHITECTURE.md):
  // app.use('/api/groups', groupsRouter);
  // app.use('/api/groups/:groupId/expenses', expensesRouter);
  // app.use('/api/groups/:groupId/settlements', settlementsRouter);
  // app.use('/api/notifications', notificationsRouter);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
