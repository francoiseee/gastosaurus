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

// POST /api/invites/join  — the code from a share link (<app>/?join=<code>)
export const joinSchema = z
  .object({ code: z.string().trim().regex(/^[0-9a-f]{6,16}$/i, 'That invite link is not valid.') })
  .strict();
