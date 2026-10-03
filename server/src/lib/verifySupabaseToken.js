// Verifies the Supabase access token that the React app sends as
//   Authorization: Bearer <access_token>
//
// Supabase projects sign tokens one of two ways (Dashboard → Settings → JWT Keys):
//   • Asymmetric keys (ES256/RS256) — verified locally against the project's
//     public JWKS. Fast: no network call per request after the keys are cached.
//   • Legacy shared secret (HS256) — Supabase recommends asking the Auth server
//     (GET /auth/v1/user), which we do, with a short in-memory cache.
// This follows https://supabase.com/docs/guides/auth/jwts
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';
import { env } from '../config/env.js';

const issuer = `${env.supabase.url}/auth/v1`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

const CACHE_MS = 60 * 1000;
const cache = new Map(); // token -> { user, expiresAt }

/** Shape every route sees as req.user */
function toAuthUser({ sub, email, user_metadata: meta = {} }) {
  return { id: sub, email: email ?? null, name: meta.name ?? meta.full_name ?? null };
}

async function verifyWithAuthServer(token) {
  const hit = cache.get(token);
  if (hit && hit.expiresAt > Date.now()) return hit.user;

  const res = await fetch(`${issuer}/user`, {
    headers: { apikey: env.supabase.publishableKey, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const u = await res.json();
  const user = toAuthUser({ sub: u.id, email: u.email, user_metadata: u.user_metadata });
  cache.set(token, { user, expiresAt: Date.now() + CACHE_MS });
  if (cache.size > 1000) cache.delete(cache.keys().next().value);
  return user;
}

/** Returns { id, email, name } for a valid token, or null. */
export async function verifySupabaseToken(token) {
  if (!token) return null;

  let header;
  try {
    header = decodeProtectedHeader(token);
  } catch {
    return null; // not a JWT at all
  }

  if (header.alg === 'HS256') return verifyWithAuthServer(token);

  try {
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: 'authenticated' });
    return toAuthUser(payload);
  } catch {
    return null; // expired, wrong signature, wrong project...
  }
}
