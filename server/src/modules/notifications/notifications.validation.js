import { z } from 'zod';

// GET /api/notifications?limit=&before=&unread=true
export const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).catch(30),
  before: z.iso.datetime({ offset: true }).optional().catch(undefined),
  unread: z
    .enum(['true', 'false'])
    .optional()
    .catch(undefined)
    .transform((v) => v === 'true'),
});

// POST /api/groups/:groupId/reminders  — empty body = remind everyone who owes
export const remindersSchema = z
  .object({ memberIds: z.array(z.uuid('Pick members from the list.')).min(1).max(50).optional() })
  .strict();
