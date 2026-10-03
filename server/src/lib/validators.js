// Reusable zod building blocks for money and dates.
import { z } from 'zod';
import { toCentavos } from './money.js';

const MAX_PESOS = 9_999_999_999.99; // numeric(12,2)

const hasAtMostTwoDecimals = (v) => Math.abs(Math.round(v * 100) - v * 100) < 1e-6;

/**
 * A peso amount sent as a JSON number (e.g. 1850.5). Parsed into integer
 * CENTAVOS (185050) so the service layer never touches floating point.
 *   peso()                 → > 0
 *   peso({ min: 0 })       → ≥ 0
 *   peso({ allowNegative }) → any sign (e.g. a discount line)
 */
export function peso({ min = 'positive', allowNegative = false, label = 'Amount' } = {}) {
  let schema = z
    .number({ error: `${label} must be a number.` })
    .refine(Number.isFinite, `${label} must be a number.`)
    .refine(hasAtMostTwoDecimals, `${label} can have at most 2 decimal places.`)
    .refine((v) => Math.abs(v) <= MAX_PESOS, `${label} is too large.`);
  if (!allowNegative) {
    schema =
      min === 'positive'
        ? schema.refine((v) => v > 0, `${label} must be more than ₱0.00.`)
        : schema.refine((v) => v >= 0, `${label} cannot be negative.`);
  }
  return schema.transform((v) => toCentavos(v));
}

/** 'YYYY-MM-DD' calendar date. */
export const isoDate = z.iso.date('Use a date like 2026-10-03.');
