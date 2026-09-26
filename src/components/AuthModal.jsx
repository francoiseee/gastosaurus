import React, { useState } from 'react';
import mascotImg from '../assets/mascot.png';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight
} from './CustomIcons';

export const AuthModal = ({ isOpen, initialMode = 'login', onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Form fields
  const [name, setName] = useState('Francoise');
  const [email, setEmail] = useState('francoise@gastosaurus.app');
  const [password, setPassword] = useState('DinoSaver2026!');
  
  // Submission & redirect state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const displayName = mode === 'signup' ? (name || 'Budget Dino') : (name || 'Francoise');
    const message = mode === 'signup' 
      ? `Welcome to the herd, ${displayName}!` 
      : `Welcome back, ${displayName}!`;

    setSuccessMessage(message);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        if (onAuthSuccess) {
          onAuthSuccess({
            name: displayName,
            email: email
          });
        }
      }, 1100);
    }, 500);
  };

  const handleQuickSocial = (provider) => {
    setIsSubmitting(true);
    setSuccessMessage(`Welcome back, Francoise!`);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        if (onAuthSuccess) {
          onAuthSuccess({
            name: 'Francoise',
            email: 'francoise@gastosaurus.app'
          });
        }
      }, 1000);
    }, 500);
  };

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
          <h2 className="auth-title">
            {mode === 'login' ? 'Welcome Back!' : 'Join Gastosaurus'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login' 
              ? 'Track expenses, auto-balance ambagan, and save smarter.' 
              : 'Create your account to master your budget effortlessly.'}
          </p>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="auth-mode-switch">
          <button 
            type="button"
            className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Log In
          </button>
          <button 
            type="button"
            className={`auth-mode-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

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
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="auth-name">Your Name / Nickname</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    placeholder="e.g. Francoise"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">Email or Mobile Number</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="auth-email"
                  type="text"
                  required
                  placeholder="name@email.com or 0917..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="auth-password">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    className="forgot-link-btn"
                    onClick={() => alert("Password reset link sent to your email! 🦕")}
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
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
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
            </div>

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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Logging in... 🦕</span>
              ) : mode === 'login' ? (
                <>
                  <span>Log In to Gastosaurus</span>
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <span>Create Dino Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            {/* Social Google Login Button (Full Width) */}
            <div className="auth-social-single">
              <button
                type="button"
                className="social-btn google-btn full-width"
                onClick={() => handleQuickSocial('Google')}
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
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
