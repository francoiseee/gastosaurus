// Request bodies for expenses. Amounts arrive in pesos (JSON numbers) and
// leave validation as integer centavos.
//
// The shape depends on splitType:
//
//   equal     { totalAmount: 1850, memberIds: [a, b, c] }
//   custom    { totalAmount: 1000, shares: [{ memberId: a, amount: 700 }, { memberId: b, amount: 300 }] }
//   itemized  { items:   [{ name: 'Sake', price: 25, memberIds: [a, b] }, ...],
//               charges: [{ name: 'Service charge', amount: 10 }, { name: 'Promo', amount: -5 }],
//               totalAmount?: 115 }   ← optional; if sent it must match items + charges
//
// Common to all: description, paidBy? (member id; defaults to you), spentOn? (YYYY-MM-DD), note?
import { z } from 'zod';
import { peso, isoDate } from '../../lib/validators.js';

const memberId = z.uuid('Pick a member from the list.');
const memberIds = z.array(memberId).min(1, 'Pick at least one person.').max(50);

const common = {
  description: z.string().trim().min(1, 'What was this expense for?').max(120, 'Keep it under 120 characters.'),
  paidBy: memberId.optional(),
  spentOn: isoDate.optional(),
  note: z.string().trim().max(280, 'Notes can be up to 280 characters.').nullable().optional(),
};

const equal = z
  .object({
    ...common,
    splitType: z.literal('equal'),
    totalAmount: peso({ label: 'Total' }),
    memberIds,
  })
  .strict();

const custom = z
  .object({
    ...common,
    splitType: z.literal('custom'),
    totalAmount: peso({ label: 'Total' }),
    shares: z
      .array(z.object({ memberId, amount: peso({ min: 0, label: 'Share' }) }).strict())
      .min(1, 'Enter at least one share.')
      .max(50),
  })
  .strict();

const itemized = z
  .object({
    ...common,
    splitType: z.literal('itemized'),
    totalAmount: peso({ label: 'Total' }).optional(),
    items: z
      .array(
        z
          .object({
            name: z.string().trim().min(1, 'Name this item.').max(80),
            price: peso({ min: 0, label: 'Price' }),
            memberIds,
          })
          .strict(),
      )
      .min(1, 'Add at least one item.')
      .max(200),
    charges: z
      .array(
        z
          .object({
            name: z.string().trim().min(1, 'Name this charge.').max(80),
            amount: peso({ allowNegative: true, label: 'Charge' }),
          })
          .strict(),
      )
      .max(10)
      .default([]),
  })
  .strict();

export const expenseSchema = z.discriminatedUnion('splitType', [equal, custom, itemized], {
  error: 'Choose how to split: equal, itemized or custom.',
});

/** PATCH without splitType: only the details change, not the money. */
export const expenseDetailsSchema = z
  .object({
    description: common.description,
    spentOn: isoDate,
    note: common.note,
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });
