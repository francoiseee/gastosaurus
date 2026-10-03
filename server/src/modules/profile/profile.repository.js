// Data-access layer for public.profiles. Only SQL lives here.
import { query } from '../../db/pool.js';

const COLUMNS = 'id, name, avatar_emoji, monthly_budget, created_at, updated_at';

/** Shape sent to the frontend. */
export function toProfile(row, email = null) {
  return {
    id: row.id,
    email,
    name: row.name,
    avatarEmoji: row.avatar_emoji,
    monthlyBudget: row.monthly_budget === null ? null : Number(row.monthly_budget),
    createdAt: row.created_at,
  };
}

export async function findById(id) {
  const { rows } = await query(`SELECT ${COLUMNS} FROM public.profiles WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/**
 * Safety net: the on_auth_user_created trigger normally creates the profile.
 * If it's somehow missing (e.g. user existed before the trigger), create it.
 */
export async function ensureExists(id, name) {
  const { rows } = await query(
    `INSERT INTO public.profiles (id, name)
     VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
     RETURNING ${COLUMNS}`,
    [id, name],
  );
  return rows[0];
}

/** fields: any of { name, avatarEmoji, monthlyBudget } */
export async function update(id, fields) {
  const map = { name: 'name', avatarEmoji: 'avatar_emoji', monthlyBudget: 'monthly_budget' };
  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  if (sets.length === 0) return findById(id);

  values.push(id);
  const { rows } = await query(
    `UPDATE public.profiles SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING ${COLUMNS}`,
    values,
  );
  return rows[0] ?? null;
}
