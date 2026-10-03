import React, { useState } from 'react';
import mascotImg from '../assets/mascot.png';
import { supabase, isSupabaseConfigured, setRememberMe as saveRememberMe, friendlyAuthError } from '../lib/supabase';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight
} from './CustomIcons';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Modes:
//   'login' | 'signup'   – the two tabs
//   'forgot'             – ask for email, send reset link
//   'update-password'    – user came back from the reset link, choose a new password
//   'check-email'        – sign-up done, waiting for email confirmation
const HEADINGS = {
  login: ['Welcome Back!', 'Track expenses, auto-balance ambagan, and save smarter.'],
  signup: ['Join Gastosaurus', 'Create your account to master your budget effortlessly.'],
  forgot: ['Forgot your password?', "Enter your email and we'll send you a reset link."],
  'update-password': ['Set a new password', 'Choose a new password for your Gastosaurus account.'],
  'check-email': ['Check your email', 'One more step to join the herd.'],
};

function validate(mode, { name, email, password }) {
  const errors = {};
  if (mode === 'signup' && !name.trim()) errors.name = 'Enter your name or nickname.';
  if (mode === 'signup' && name.trim().length > 60) errors.name = 'Name must be 60 characters or fewer.';
  if (mode !== 'update-password') {
    if (!email.trim()) errors.email = 'Enter your email.';
    else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
  }
  if (mode !== 'forgot') {
    if (!password) errors.password = 'Enter your password.';
    else if (mode !== 'login' && password.length < 8) errors.password = 'Password must be at least 8 characters.';
  }
  return errors;
}

export const AuthModal = (props) => {
  if (!props.isOpen) return null;
  // Keyed by mode so every open starts with a clean form in the requested tab.
  return <AuthModalContent key={props.initialMode} {...props} />;
};

const AuthModalContent = ({ initialMode = 'login', onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Submission & redirect state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Messages
  const [formError, setFormError] = useState(
    isSupabaseConfigured ? '' : 'Supabase isn’t configured. Copy .env.example to .env.local and restart `npm run dev`.'
  );
  const [formInfo, setFormInfo] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [title, subtitle] = HEADINGS[mode];
  const isTabMode = mode === 'login' || mode === 'signup';

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFormError('');
    setFormInfo('');
    setFieldErrors({});
    setPassword('');
  };

  const clearFieldError = (field) => {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const finishWithSuccess = (message) => {
    setSuccessMessage(message);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      if (onAuthSuccess) onAuthSuccess();
    }, 1100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormInfo('');

    const errors = validate(mode, { name, email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !supabase) return;

    setIsSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();
    const returnUrl = window.location.origin;

    try {
      if (mode === 'login') {
        saveRememberMe(rememberMe);
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        const displayName = data.user?.user_metadata?.name || 'Budget Dino';
        finishWithSuccess(`Welcome back, ${displayName}!`);
      }

      if (mode === 'signup') {
        saveRememberMe(true);
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { name: name.trim() }, emailRedirectTo: returnUrl },
        });
        if (error) throw error;

        // With "Confirm email" ON, Supabase hides whether the email is taken:
        // it returns a user with no identities instead of an error.
        if (data.user && data.user.identities?.length === 0) {
          setFieldErrors({ email: 'This email is already registered.' });
          setFormError('An account with this email already exists. Try logging in.');
        } else if (!data.session) {
          switchMode('check-email');
        } else {
          finishWithSuccess(`Welcome to the herd, ${name.trim()}!`);
        }
      }

      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: returnUrl });
        if (error) throw error;
        setFormInfo('If an account exists for that email, a reset link is on its way. 🦕');
      }

      if (mode === 'update-password') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        finishWithSuccess('Password updated!');
      }
    } catch (err) {
      setFormError(friendlyAuthError(err));
    } finally {
      setPassword((p) => (mode === 'forgot' ? p : ''));
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (!supabase) return;
    setFormError('');
    setFormInfo('');
    setIsSubmitting(true);
    saveRememberMe(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    // On success the browser leaves for Google, so we only get here on error.
    if (error) {
      setFormError(friendlyAuthError(error));
      setIsSubmitting(false);
    }
  };

  const submitLabel = {
    login: ['Log In to Gastosaurus', 'Logging in... 🦕'],
    signup: ['Create Dino Account', 'Creating your account... 🦕'],
    forgot: ['Send Reset Link', 'Sending... 🦕'],
    'update-password': ['Save New Password', 'Saving... 🦕'],
  }[mode];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="auth-modal-card animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Mascot Header */}
        <div className="auth-header-visual">
          <div className="auth-mascot-circle">
            <img src={mascotImg} alt="Gastosaurus Mascot" className="auth-mascot-img" />
          </div>
          <h2 className="auth-title">{title}</h2>
          <p className="auth-subtitle">{subtitle}</p>
        </div>

        {/* Segmented Mode Switcher */}
        {isTabMode && !isSuccess && (
          <div className="auth-mode-switch">
            <button
              type="button"
              className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Log In
            </button>
            <button
              type="button"
              className={`auth-mode-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Success State */}
        {isSuccess ? (
          <div className="auth-success-screen animate-fade-in">
            <div className="auth-success-icon-wrap">
              <span className="auth-dino-success-emoji">🦖</span>
            </div>
            <h3 className="auth-success-title">{successMessage}</h3>
            <p className="auth-success-sub">Redirecting you to your dashboard...</p>
            <div className="auth-loading-bar">
              <div className="auth-loading-fill" />
            </div>
          </div>
        ) : mode === 'check-email' ? (
          <div className="auth-success-screen animate-fade-in">
            <div className="auth-success-icon-wrap">
              <span className="auth-dino-success-emoji">📬</span>
            </div>
            <h3 className="auth-success-title">Almost there!</h3>
            <p className="auth-success-sub">
              We sent a link to <strong>{email.trim().toLowerCase()}</strong>. Open it to activate your account,
              then come back and log in.
            </p>
            <button type="button" className="btn-auth-submit" onClick={() => switchMode('login')}>
              <span>Back to Log In</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {formError && (
              <div className="auth-alert auth-alert-error" role="alert">{formError}</div>
            )}
            {formInfo && (
              <div className="auth-alert auth-alert-info" role="status">{formInfo}</div>
            )}

            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="auth-name">Your Name / Nickname</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="e.g. Francoise"
                    autoComplete="nickname"
                    maxLength={60}
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
                    className={`auth-input ${fieldErrors.name ? 'has-error' : ''}`}
                    aria-invalid={!!fieldErrors.name}
                  />
                </div>
                {fieldErrors.name && <p className="auth-field-error">{fieldErrors.name}</p>}
              </div>
            )}

            {mode !== 'update-password' && (
              <div className="form-group">
                <label htmlFor="auth-email">Email</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="name@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                    className={`auth-input ${fieldErrors.email ? 'has-error' : ''}`}
                    aria-invalid={!!fieldErrors.email}
                  />
                </div>
                {fieldErrors.email && <p className="auth-field-error">{fieldErrors.email}</p>}
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="form-group">
                <div className="label-with-action">
                  <label htmlFor="auth-password">
                    {mode === 'update-password' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="forgot-link-btn"
                      onClick={() => switchMode('forgot')}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                    className={`auth-input ${fieldErrors.password ? 'has-error' : ''}`}
                    aria-invalid={!!fieldErrors.password}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}
              </div>
            )}

            {mode === 'login' && (
              <div className="auth-form-extra">
                <label className="remember-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Keep me logged in</span>
                </label>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              className="btn-auth-submit"
              disabled={isSubmitting || !isSupabaseConfigured}
            >
              {isSubmitting ? (
                <span>{submitLabel[1]}</span>
              ) : (
                <>
                  <span>{submitLabel[0]}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button type="button" className="auth-back-link" onClick={() => switchMode('login')}>
                ← Back to Log In
              </button>
            )}

            {isTabMode && (
              <>
                {/* Divider */}
                <div className="auth-divider">
                  <span>or continue with</span>
                </div>

                {/* Social Google Login Button (Full Width) */}
                <div className="auth-social-single">
                  <button
                    type="button"
                    className="social-btn google-btn full-width"
                    onClick={handleGoogle}
                    disabled={isSubmitting || !isSupabaseConfigured}
                  >
                    <svg className="social-icon" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
