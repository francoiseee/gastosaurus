// Central place for every setting the server reads from the environment.
// Values come from server/.env in development (loaded by `node --env-file`).

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} (see server/.env.example)`);
  }
  return value;
}

// On Vercel, NODE_ENV isn't always set at runtime, so treat a Vercel deployment as production.
const nodeEnv = process.env.NODE_ENV ?? (process.env.VERCEL ? 'production' : 'development');

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT ?? 4000),

  // Supabase Postgres connection string (Dashboard → Connect → "Session pooler").
  databaseUrl: required('DATABASE_URL'),
  // Supabase requires SSL. Set DATABASE_SSL=false only for a local Postgres.
  databaseSsl: process.env.DATABASE_SSL !== 'false',

  supabase: {
    // e.g. https://oieupqfsmnbcoatoicef.supabase.co
    url: required('SUPABASE_URL').replace(/\/+$/, ''),
    // The *publishable* key (safe to share). Only used to ask Supabase Auth
    // to validate a token when the project signs tokens with a shared secret.
    publishableKey: required('SUPABASE_PUBLISHABLE_KEY'),
  },

  // Where the React app runs. Only needed when the frontend calls the API
  // from a different origin; the Vite dev proxy makes local dev same-origin.
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
};
