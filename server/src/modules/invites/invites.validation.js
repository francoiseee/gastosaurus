import { z } from 'zod';
import { email } from '../groups/groups.validation.js';

// POST /api/groups/:groupId/invites
// memberId (optional): a guest spot the invitee will claim when they accept.
export const inviteCreateSchema = z
  .object({
    email,
    memberId: z.uuid('Pick a member from the list.').optional(),
  })
  .strict();
