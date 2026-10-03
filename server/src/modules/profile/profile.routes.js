// /api/me — the logged-in user's profile.
// Login, sign-up, logout, Google and password reset are handled by Supabase Auth
// in the browser; this API only ever sees an already-verified user (req.user).
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError } from '../../utils/HttpError.js';
import * as profiles from './profile.repository.js';

const updateSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name or nickname.').max(60, 'Name must be 60 characters or fewer.'),
    avatarEmoji: z.string().trim().min(1).max(16),
    monthlyBudget: z.number().nonnegative('Budget cannot be negative.').max(9_999_999_999).nullable(),
  })
  .partial()
  .strict();

export const profileRouter = Router();

profileRouter.use(requireAuth);

// GET /api/me
profileRouter.get('/', async (req, res) => {
  const row = await profiles.getOrCreate(req.user);
  res.json({ user: profiles.toProfile(row, req.user.email) });
});

// PATCH /api/me   { name?, avatarEmoji?, monthlyBudget? }
profileRouter.patch('/', validateBody(updateSchema), async (req, res) => {
  const row = await profiles.update(req.user.id, req.body);
  if (!row) throw HttpError.notFound('Profile not found.');
  res.json({ user: profiles.toProfile(row, req.user.email) });
});
