// Shared setup for API integration tests:
//   • a LOCAL throwaway Postgres with a tiny stand-in for Supabase's auth schema
//     plus our real migrations from ../supabase/migrations
//   • a fake Supabase Auth server that publishes a JWKS and signs tokens
//   • the Express app on a random port
//
// Usage (in a *.test.js file):
//   const h = setupHarness();
//   test('...', async () => { const alex = await h.login('alex@example.com', 'Alex'); await h.call('GET', '/me', { token: alex.token }); });
import { before, after } from 'node:test';
import http from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { pool } from '../../src/db/pool.js';
import { createApp } from '../../src/app.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
export const ISSUER = `${SUPABASE_URL}/auth/v1`;
const migrationsDir = new URL('../../../supabase/migrations/', import.meta.url);

export function setupHarness() {
  const h = { pool, hsTokens: new Map(), api: null, privateKey: null };
  let apiServer;
  let fakeAuth;

  h.signToken = (sub, { email, name, expiresIn = '1h', issuer = ISSUER } = {}) =>
    new SignJWT({ email, role: 'authenticated', user_metadata: { name } })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
      .setSubject(sub)
      .setIssuer(issuer)
      .setAudience('authenticated')
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(h.privateKey);

  h.createAuthUser = async (email, name) => {
    const { rows } = await pool.query(
      `INSERT INTO auth.users (email, raw_user_meta_data) VALUES ($1, $2) RETURNING id`,
      [email, JSON.stringify(name ? { name } : {})],
    );
    return rows[0].id;
  };

  /** Sign up + log in: returns { id, email, name, token }. */
  h.login = async (email, name) => {
    const id = await h.createAuthUser(email, name);
    return { id, email, name, token: await h.signToken(id, { email, name }) };
  };

  h.call = async (method, path, { token, body } = {}) => {
    const res = await fetch(h.api + path, {
      method,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(body && { 'Content-Type': 'application/json' }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  };

  before(async () => {
    if (!/test/i.test(new URL(process.env.DATABASE_URL).pathname)) {
      throw new Error('Refusing to run: the DATABASE_URL database name must contain "test" (tests wipe it).');
    }

    // Fresh schema: auth stub + every migration, in order
    await pool.query(
      'DROP SCHEMA IF EXISTS auth CASCADE; DROP SCHEMA IF EXISTS private CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;',
    );
    await pool.query(await readFile(new URL('../fixtures/supabase-auth-stub.sql', import.meta.url), 'utf8'));
    for (const file of (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()) {
      await pool.query(await readFile(new URL(file, migrationsDir), 'utf8'));
    }

    // Fake Supabase Auth
    const keys = await generateKeyPair('ES256');
    h.privateKey = keys.privateKey;
    const publicJwk = { ...(await exportJWK(keys.publicKey)), kid: 'test-key', alg: 'ES256', use: 'sig' };
    fakeAuth = http
      .createServer((req, res) => {
        if (req.url === '/auth/v1/.well-known/jwks.json') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ keys: [publicJwk] }));
        }
        if (req.url === '/auth/v1/user') {
          const user = h.hsTokens.get((req.headers.authorization ?? '').replace('Bearer ', ''));
          res.writeHead(user ? 200 : 401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(user ?? { msg: 'invalid JWT' }));
        }
        res.writeHead(404).end();
      })
      .listen(Number(new URL(SUPABASE_URL).port));

    apiServer = createApp().listen(0);
    h.api = `http://localhost:${apiServer.address().port}/api`;
  });

  after(async () => {
    apiServer?.close();
    fakeAuth?.close();
    await pool.end();
  });

  return h;
}
