import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

async function main() {
  // Fail fast with a clear message if the database isn't reachable.
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error(`Cannot connect to Supabase Postgres (check DATABASE_URL in server/.env): ${err.message}`);
    process.exit(1);
  }

  createApp().listen(env.port, () => {
    console.log(`🦖 Gastosaurus API listening on http://localhost:${env.port}`);
  });
}

main();
