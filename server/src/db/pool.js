import pg from 'pg';
import { env } from '../config/env.js';

// Return NUMERIC columns (money) as strings so we never lose cents to floating point.
// Convert them deliberately in the service layer when needed.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => value);

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error', err);
});

/** Run a parameterized query: query('SELECT * FROM users WHERE id = $1', [id]) */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run several queries in one transaction. The callback receives a client;
 * if it throws, everything is rolled back.
 *   await withTransaction(async (client) => { await client.query(...); });
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
