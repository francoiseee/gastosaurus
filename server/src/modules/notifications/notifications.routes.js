// Notifications.
//   notificationsRouter   → /api/notifications (the bell / inbox)
//   groupRemindersRouter  → /api/groups/:groupId/reminders (caller already checked as a member)
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import { listQuery, remindersSchema } from './notifications.validation.js';
import * as service from './notifications.service.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', async (req, res) => {
  const { limit, before, unread } = listQuery.parse(req.query);
  res.json(await service.list(req.user, { limit, before, unreadOnly: unread }));
});

notificationsRouter.post('/read-all', async (req, res) => {
  res.json(await service.markAllRead(req.user));
});

notificationsRouter.patch('/:notificationId/read', async (req, res) => {
  res.json({ notification: await service.markRead(req.user, req.params.notificationId) });
});

notificationsRouter.delete('/:notificationId', async (req, res) => {
  await service.remove(req.user, req.params.notificationId);
  res.status(204).end();
});

export const groupRemindersRouter = Router({ mergeParams: true });

groupRemindersRouter.post('/', validateBody(remindersSchema), async (req, res) => {
  res.json(await service.sendReminders(req.user, req.member, req.body));
});
