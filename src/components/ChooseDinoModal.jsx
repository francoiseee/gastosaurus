import { useState } from 'react';
import { DINO_AVATARS, getDinoAvatar, getRandomDino } from '../data/dinos';
import { profileApi } from '../lib/api';
import { Sparkles, Check, RefreshCw, User, ArrowRight, X } from './CustomIcons';

export const ChooseDinoModal = ({
  isOpen,
  onClose,
  user,
  onDinoSaved,
  isInitialOnboarding = false,
  showToast,
}) => {
  const initialDino =
    getDinoAvatar(user?.avatarEmoji || user?.avatar) ||
    DINO_AVATARS[0];

  const [selectedId, setSelectedId] = useState(initialDino.id);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [animatingId, setAnimatingId] = useState(null);

  // Re-sync with fresh user data each time the modal opens (adjusting state
  // during render instead of in an effect avoids an extra render pass).
  const [syncedFor, setSyncedFor] = useState(null);
  const syncKey = isOpen ? user : null;
  if (syncKey !== syncedFor) {
    setSyncedFor(syncKey);
    if (isOpen) {
      setSelectedId(initialDino.id);
      setDisplayName(user?.name || '');
    }
  }

  if (!isOpen) return null;

  const activeDino = DINO_AVATARS.find((d) => d.id === selectedId) || DINO_AVATARS[0];

  const handleSelectDino = (dino) => {
    setSelectedId(dino.id);
    setAnimatingId(dino.id);
    setTimeout(() => setAnimatingId(null), 400);
  };

  const handleRandomize = () => {
    const random = getRandomDino(selectedId);
    setSelectedId(random.id);
    setAnimatingId(random.id);
    setTimeout(() => setAnimatingId(null), 400);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) {
      showToast?.('Please enter your name or nickname.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Backend takes avatarEmoji (<=16 chars) and name
      const updated = await profileApi.update({
        avatarEmoji: activeDino.id,
        name: cleanName,
      });

      showToast?.(
        isInitialOnboarding
          ? `Welcome aboard! You picked ${activeDino.name} the ${activeDino.species}! 🦕✨`
          : `Avatar updated to ${activeDino.name}! 🦖✨`
      );

      if (onDinoSaved) {
        onDinoSaved(updated || { ...user, avatarEmoji: activeDino.id, name: cleanName });
      }
      onClose();
    } catch (err) {
      console.error('Failed to update dino avatar:', err);
      showToast?.(err.message || 'Could not save profile picture. Try again!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card dino-picker-modal-card animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dino-picker-title"
      >
        {/* Close Button */}
        <button
          type="button"
          className="dino-picker-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="dino-picker-header">
          {isInitialOnboarding && (
            <div className="dino-step-pill">
              <Sparkles size={13} className="sparkle-icon" />
              <span>Step 2 of 2 · Welcome to the Herd!</span>
            </div>
          )}
          <h2 id="dino-picker-title" className="dino-picker-title">
            {isInitialOnboarding ? 'Choose Your Dino Avatar!' : 'Customize Your Dino Avatar'}
          </h2>
          <p className="dino-picker-subtitle">
            Pick the prehistoric buddy that matches your personality &amp; budget style.
          </p>
        </div>

        {/* Hero Spotlight Preview (SHAREit style animated avatar circle) */}
        <div
          className="dino-hero-spotlight"
          style={{
            background: `radial-gradient(circle at center, ${activeDino.cardBg} 0%, #FFFFFF 100%)`,
            borderColor: activeDino.border,
          }}
        >
          {/* Ambient Glow Aura */}
          <div
            className="dino-spotlight-aura"
            style={{ backgroundColor: activeDino.accent }}
          />

          {/* Large Dino Disc */}
          <div
            className={`dino-spotlight-disc ${animatingId === activeDino.id ? 'dino-pop-bounce' : ''}`}
            style={{ backgroundColor: activeDino.bg, borderColor: activeDino.border }}
          >
            <img
              src={activeDino.image}
              alt={activeDino.name}
              className="dino-spotlight-img"
            />
          </div>

          {/* Species Badge & Tag */}
          <div className="dino-hero-info">
            <div className="dino-hero-title-row">
              <h3 className="dino-hero-name" style={{ color: activeDino.textDark }}>
                {activeDino.name}
              </h3>
              <span
                className="dino-badge-pill"
                style={{
                  backgroundColor: `${activeDino.accent}18`,
                  color: activeDino.accent,
                  borderColor: `${activeDino.accent}33`,
                }}
              >
                {activeDino.badge}
              </span>
            </div>
            <span className="dino-hero-species">{activeDino.species} · {activeDino.tagline}</span>
            <p className="dino-hero-desc">{activeDino.description}</p>
          </div>

          {/* Randomize / Surprise Me Button */}
          <button
            type="button"
            className="btn-dino-randomize"
            onClick={handleRandomize}
            title="Surprise me with a random Dino!"
            aria-label="Pick a random dino"
          >
            <RefreshCw size={15} className="spin-on-hover" />
            <span>Shuffle</span>
          </button>
        </div>

        {/* Display Name Editor */}
        <div className="dino-name-field-row">
          <label htmlFor="dino-profile-name" className="dino-name-label">
            <User size={15} />
            <span>Display Name in Herd</span>
          </label>
          <input
            id="dino-profile-name"
            type="text"
            maxLength={60}
            className="dino-name-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Budget Dino"
          />
        </div>

        {/* Dino Grid Selector */}
        <div className="dino-grid-section">
          <span className="eyebrow">Choose from the herd ({DINO_AVATARS.length})</span>
          <div className="dino-avatar-grid">
            {DINO_AVATARS.map((dino) => {
              const isSelected = dino.id === selectedId;
              return (
                <button
                  key={dino.id}
                  type="button"
                  className={`dino-grid-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectDino(dino)}
                  style={{
                    backgroundColor: isSelected ? dino.cardBg : '#FFFFFF',
                    borderColor: isSelected ? dino.accent : '#F1E9ED',
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${dino.name}, ${dino.species} - ${dino.tagline}`}
                >
                  <div
                    className="dino-card-avatar-wrap"
                    style={{ backgroundColor: dino.bg }}
                  >
                    <img
                      src={dino.image}
                      alt={dino.name}
                      className="dino-card-img"
                    />
                    {isSelected && (
                      <div
                        className="dino-selected-check"
                        style={{ backgroundColor: dino.accent }}
                      >
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className="dino-card-name" style={{ color: isSelected ? dino.textDark : '#21252D' }}>
                    {dino.name}
                  </span>
                  <span className="dino-card-tag">{dino.species}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="dino-modal-actions">
          {isInitialOnboarding ? (
            <button
              type="button"
              className="btn btn-muted btn-lg"
              onClick={onClose}
              disabled={isSaving}
            >
              Skip for now
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-muted btn-lg"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            className="btn btn-lg btn-dino-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: activeDino.accent,
              boxShadow: `0 8px 20px -4px ${activeDino.accent}66`,
            }}
          >
            {isSaving ? (
              <span>Saving Dino... 🦕</span>
            ) : (
              <>
                <span>Adopt {activeDino.name}! 🦖</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseDinoModal;
