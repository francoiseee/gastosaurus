import { z } from 'zod';

const name = z
  .string()
  .trim()
  .min(1, 'Give your group a name.')
  .max(60, 'Group names can be up to 60 characters.');
const hexColor = z.string().trim().regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/, 'Use a hex color like #FFEBEF.');
const memberName = z.string().trim().min(1, 'Enter a name.').max(60, 'Names can be up to 60 characters.');
export const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.'))
  .pipe(z.string().max(254));

const groupFields = {
  name,
  note: z.string().trim().max(280, 'Notes can be up to 280 characters.').nullable(),
  category: z.string().trim().min(1).max(40),
  iconId: z.string().trim().regex(/^set\d_\d_\d$/, 'Pick one of the group icons.'),
  iconBg: hexColor,
  iconColor: hexColor,
};

// POST /api/groups
// members: friends to add right away. With an email they also get an invite
// that lets them claim their spot once they have an account.
export const createGroupSchema = z
  .object({
    ...groupFields,
    name, // required
    members: z
      .array(z.object({ name: memberName, email: email.optional() }).strict())
      .max(49, 'A group can have up to 50 members.')
      .default([]),
  })
  .partial({ note: true, category: true, iconId: true, iconBg: true, iconColor: true })
  .strict();

// PATCH /api/groups/:groupId
export const updateGroupSchema = z
  .object(groupFields)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });

// POST /api/groups/:groupId/members   (add a friend by name; email optional)
export const addMemberSchema = z.object({ name: memberName, email: email.optional() }).strict();

// PATCH /api/groups/:groupId/members/:memberId   (admin)
export const updateMemberSchema = z
  .object({ name: memberName, role: z.enum(['admin', 'member']) })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });
