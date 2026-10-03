// Calls to our own Express API (server/). Every request carries the user's
// Supabase access token so the server knows who is asking.
import { supabase } from './supabase';

const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export class ApiError extends Error {
  constructor(status, { code, message, fields } = {}) {
    super(message || 'Something went wrong. Please try again.');
    this.status = status;
    this.code = code;
    this.fields = fields || {};
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const { data } = (await supabase?.auth.getSession()) ?? { data: {} };
  const token = data?.session?.access_token;

  let res;
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(body && { 'Content-Type': 'application/json' }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: "Can't reach the Gastosaurus server. Is the backend running? (cd server && npm run dev)",
    });
  }

  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.error ?? { message: `Request failed (${res.status}).` });
  return json;
}

export const profileApi = {
  /** The logged-in user's profile: { id, email, name, avatarEmoji, monthlyBudget, createdAt } */
  get: () => apiRequest('/me').then((d) => d.user),
  update: (fields) => apiRequest('/me', { method: 'PATCH', body: fields }).then((d) => d.user),
};
