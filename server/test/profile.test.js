// Integration tests for /api/me (Phase 1). Setup lives in helpers/harness.js:
// a LOCAL throwaway Postgres + a fake Supabase Auth server.
//
//   cp .env.test.example .env.test     # then: createdb gastosaurus_test
//   npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { setupHarness, ISSUER } from './helpers/harness.js';

const h = setupHarness();
const { pool } = h;
const createAuthUser = (...a) => h.createAuthUser(...a);
const signToken = (...a) => h.signToken(...a);
const call = (...a) => h.call(...a);
const hsTokens = h.hsTokens;

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
