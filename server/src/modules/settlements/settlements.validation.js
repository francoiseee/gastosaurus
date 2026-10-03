import { z } from 'zod';
import { peso } from '../../lib/validators.js';

// POST /api/groups/:groupId/settlements
export const recordSchema = z
  .object({
    toMemberId: z.uuid('Pick who received the payment.'),
    fromMemberId: z.uuid('Pick who paid.').optional(), // defaults to you
    amount: peso({ label: 'Amount' }),
    method: z.enum(['cash', 'gcash', 'maya', 'bank'], { error: 'Pick cash, GCash, Maya or bank transfer.' }).default('cash'),
    note: z.string().trim().max(280).nullable().optional(),
  })
  .strict();

// PATCH /api/settlements/:id — the receiver confirms
export const confirmSchema = z.object({ status: z.literal('completed', { error: 'Only "completed" is allowed.' }) }).strict();
