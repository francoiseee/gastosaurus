// The one Supabase client for the whole app. Handles sign-up, login, Google,
// password reset, and keeping the session fresh (auto refresh).
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

// ---- "Keep me logged in" -------------------------------------------------
// Checked   -> session saved in localStorage (survives closing the browser)
// Unchecked -> session saved in sessionStorage (gone when the tab closes)
const REMEMBER_KEY = 'gastosaurus-remember-me';

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function setRememberMe(remember) {
  safe(() => localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false'));
}

function shouldRemember() {
  return safe(() => localStorage.getItem(REMEMBER_KEY), 'true') !== 'false';
}

const authStorage = {
  getItem: (key) => safe(() => localStorage.getItem(key) ?? sessionStorage.getItem(key)),
  setItem: (key, value) =>
    safe(() => {
      // PKCE verifiers must survive the trip to Google / an email link (which may
      // open in a new tab), so they always go to localStorage. Only the session
      // itself follows the "Keep me logged in" choice.
      const persistent = shouldRemember() || key.includes('code-verifier');
      const [keep, drop] = persistent ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
      keep.setItem(key, value);
      drop.removeItem(key);
    }),
  removeItem: (key) =>
    safe(() => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }),
};
// --------------------------------------------------------------------------

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        storage: authStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // finishes Google login / email links on return
        flowType: 'pkce',
      },
    })
  : null;

/** Turn Supabase Auth errors into friendly, Gastosaurus-style messages. */
export function friendlyAuthError(error) {
  const msg = (error?.message || '').toLowerCase();
  const code = error?.code || '';

  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for the link.';
  }
  if (code === 'user_already_exists' || msg.includes('already registered')) {
    return 'An account with this email already exists. Try logging in.';
  }
  if (code === 'weak_password' || msg.includes('password should')) {
    return error.message;
  }
  if (code === 'over_email_send_rate_limit' || msg.includes('rate limit')) {
    return 'Too many emails sent. Please wait a bit and try again.';
  }
  if (msg.includes('provider is not enabled') || (code === 'validation_failed' && msg.includes('provider'))) {
    return 'Google sign-in isn’t switched on yet for this project.';
  }
  if (msg.includes('error sending') || (msg.includes('email address') && msg.includes('not authorized'))) {
    return 'We couldn’t send the email. (Project owner: set up email in Supabase → Authentication.)';
  }
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Can’t reach Supabase. Check your internet connection.';
  }
  return error?.message || 'Something went wrong. Please try again.';
}
