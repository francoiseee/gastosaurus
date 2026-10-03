// Integration tests for the API, using:
//   • a LOCAL throwaway Postgres with a tiny stand-in for Supabase's auth schema
//     plus our real migrations from ../supabase/migrations
//   • a fake Supabase Auth server that publishes a JWKS and signs tokens
//
//   cp .env.test.example .env.test     # then: createdb gastosaurus_test
//   npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { pool } from '../src/db/pool.js';
import { createApp } from '../src/app.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const ISSUER = `${SUPABASE_URL}/auth/v1`;
const migrationsDir = new URL('../../supabase/migrations/', import.meta.url);

let api;
let apiServer;
let fakeAuth;
let privateKey;
const hsTokens = new Map(); // token -> user, for the HS256 (legacy secret) path

async function signToken(sub, { email, name, expiresIn = '1h', issuer = ISSUER } = {}) {
  return new SignJWT({ email, role: 'authenticated', user_metadata: { name } })
    .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
    .setSubject(sub)
    .setIssuer(issuer)
    .setAudience('authenticated')
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}

async function createAuthUser(email, name) {
  const { rows } = await pool.query(
    `INSERT INTO auth.users (email, raw_user_meta_data) VALUES ($1, $2) RETURNING id`,
    [email, JSON.stringify(name ? { name } : {})],
  );
  return rows[0].id;
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(api + path, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

before(async () => {
  if (!/test/i.test(new URL(process.env.DATABASE_URL).pathname)) {
    throw new Error('Refusing to run: the DATABASE_URL database name must contain "test" (tests wipe it).');
  }

  // Fresh schema: auth stub + every migration, in order
  await pool.query('DROP SCHEMA IF EXISTS auth CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await pool.query(await readFile(new URL('./fixtures/supabase-auth-stub.sql', import.meta.url), 'utf8'));
  for (const file of (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()) {
    await pool.query(await readFile(new URL(file, migrationsDir), 'utf8'));
  }

  // Fake Supabase Auth
  const keys = await generateKeyPair('ES256');
  privateKey = keys.privateKey;
  const publicJwk = { ...(await exportJWK(keys.publicKey)), kid: 'test-key', alg: 'ES256', use: 'sig' };
  fakeAuth = http
    .createServer((req, res) => {
      if (req.url === '/auth/v1/.well-known/jwks.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ keys: [publicJwk] }));
      }
      if (req.url === '/auth/v1/user') {
        const user = hsTokens.get((req.headers.authorization ?? '').replace('Bearer ', ''));
        res.writeHead(user ? 200 : 401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(user ?? { msg: 'invalid JWT' }));
      }
      res.writeHead(404).end();
    })
    .listen(Number(new URL(SUPABASE_URL).port));

  apiServer = createApp().listen(0);
  api = `http://localhost:${apiServer.address().port}/api`;
});

after(async () => {
  apiServer?.close();
  fakeAuth?.close();
  await pool.end();
});

test('sign-up trigger creates a profile with the name from sign-up metadata', async () => {
  const id = await createAuthUser('francoise@example.com', '  Francoise  ');
  const { rows } = await pool.query('SELECT name, avatar_emoji FROM public.profiles WHERE id = $1', [id]);
  assert.equal(rows[0].name, 'Francoise');
  assert.equal(rows[0].avatar_emoji, '🦖');
});

test('trigger falls back to the email prefix when no name is given', async () => {
  const id = await createAuthUser('nikko.p@example.com', null);
  const { rows } = await pool.query('SELECT name FROM public.profiles WHERE id = $1', [id]);
  assert.equal(rows[0].name, 'nikko.p');
});

test('GET /api/me returns the profile for a valid Supabase token', async () => {
  const id = await createAuthUser('allein@example.com', 'Allein');
  const token = await signToken(id, { email: 'allein@example.com', name: 'Allein' });
  const res = await call('GET', '/me', { token });
  assert.equal(res.status, 200);
  assert.deepEqual(
    { id: res.body.user.id, email: res.body.user.email, name: res.body.user.name },
    { id, email: 'allein@example.com', name: 'Allein' },
  );
});

test('GET /api/me rejects missing, forged, expired and wrong-project tokens', async () => {
  const id = await createAuthUser('lance@example.com', 'Lance');
  assert.equal((await call('GET', '/me')).status, 401);
  assert.equal((await call('GET', '/me', { token: 'not-a-jwt' })).status, 401);

  const expired = await signToken(id, { expiresIn: '-1m' });
  assert.equal((await call('GET', '/me', { token: expired })).status, 401);

  const otherProject = await signToken(id, { issuer: 'https://someone-else.supabase.co/auth/v1' });
  assert.equal((await call('GET', '/me', { token: otherProject })).status, 401);

  const { privateKey: attackerKey } = await generateKeyPair('ES256');
  const forged = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
    .setSubject(id)
    .setIssuer(ISSUER)
    .setAudience('authenticated')
    .setExpirationTime('1h')
    .sign(attackerKey);
  assert.equal((await call('GET', '/me', { token: forged })).status, 401);
});

test('HS256 (legacy secret) tokens are checked with the Auth server', async () => {
  const id = await createAuthUser('christine@example.com', 'Christine');
  // Any HS256-looking JWT; validity is decided by the (fake) Auth server.
  const good = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode('x'.repeat(32)));
  hsTokens.set(good, { id, email: 'christine@example.com', user_metadata: { name: 'Christine' } });
  const bad = await new SignJWT({ n: 1 }).setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode('y'.repeat(32)));

  assert.equal((await call('GET', '/me', { token: good })).body.user.name, 'Christine');
  assert.equal((await call('GET', '/me', { token: bad })).status, 401);
});

test('PATCH /api/me updates only the caller\'s own profile', async () => {
  const id = await createAuthUser('budget@example.com', 'Budget');
  const token = await signToken(id, { email: 'budget@example.com' });

  const res = await call('PATCH', '/me', { token, body: { name: 'Budget Dino', monthlyBudget: 20000, avatarEmoji: '🦕' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, 'Budget Dino');
  assert.equal(res.body.user.monthlyBudget, 20000);
  assert.equal(res.body.user.avatarEmoji, '🦕');
});

test('PATCH /api/me validates input per field and rejects unknown fields', async () => {
  const id = await createAuthUser('strict@example.com', 'Strict');
  const token = await signToken(id);

  const bad = await call('PATCH', '/me', { token, body: { name: '', monthlyBudget: -5 } });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.error.fields.name);
  assert.ok(bad.body.error.fields.monthlyBudget);

  const sneaky = await call('PATCH', '/me', { token, body: { id: 'someone-else' } });
  assert.equal(sneaky.status, 400);
});

test('a profile is created on the fly if the trigger row is missing', async () => {
  const id = await createAuthUser('orphan@example.com', 'Orphan');
  await pool.query('DELETE FROM public.profiles WHERE id = $1', [id]);
  const token = await signToken(id, { email: 'orphan@example.com', name: 'Orphan' });
  const res = await call('GET', '/me', { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, 'Orphan');
});
