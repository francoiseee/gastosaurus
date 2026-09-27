import React, { useState } from 'react';
import mascotImg from '../assets/mascot.png';
import { 
  ArrowLeft, 
  ArrowRight, 
  Link2, 
  Copy, 
  ClipboardCheck, 
  Mail, 
  CheckCircle2, 
  Sparkles,
  Users
} from './CustomIcons';

export const InviteMemberView = ({ 
  group, 
  onBack, 
  onContinue,
  onInviteMember,
  notifications = [], 
  unreadCount = 1 
}) => {
  const groupName = group?.name || 'Weekend Getaway';
  const inviteCode = group?.id ? group.id.replace('group-', '') : 'wg-92xj4';
  const inviteLink = `https://gastosaurus.app/join/${inviteCode}`;

  const [copied, setCopied] = useState(false);
  const [emailsText, setEmailsText] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard?.writeText(inviteLink).then(() => {
      setCopied(true);
      setToastMessage('Invite link copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setToastMessage(null), 3000);
    }).catch(() => {
      setCopied(true);
      setToastMessage('Invite link copied! 📋');
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setToastMessage(null), 3000);
    });
  };

  // Handle Continue action
  const handleContinueAction = () => {
    if (emailsText.trim()) {
      const emailList = emailsText
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      emailList.forEach(email => {
        if (onInviteMember && group) {
          onInviteMember(group.id, {
            name: email.split('@')[0],
            email: email,
            role: 'Member'
          });
        }
      });
    }

    if (onContinue) {
      onContinue();
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="build-squad-page-container animate-fade-in">
      {/* Top Back Navigation Bar */}
      <div className="build-squad-top-nav">
        <button 
          className="btn-build-squad-back" 
          onClick={onBack}
          id="btn-back-from-squad"
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
          <span>Back</span>
        </button>
      </div>

      {/* Main 2-Column Grid matching Screenshot 1 */}
      <div className="build-squad-grid-wrapper">
        {/* Left Column: Mascot & Squad Hero */}
        <div className="build-squad-left-col">
          <div className="squad-mascot-circle-backdrop animate-float">
            <img 
              src={mascotImg} 
              alt="Gastosaurus Mascot" 
              className="squad-mascot-img" 
            />
          </div>

          <div className="squad-hero-text">
            <h1 className="squad-hero-title">Build Your Squad</h1>
            <p className="squad-hero-subtitle">
              Create a shared space to manage expenses seamlessly. A soft approach to hard numbers.
            </p>
          </div>
        </div>

        {/* Right Column: Cards (Share Link & Invite via Email) */}
        <div className="build-squad-right-col">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="squad-toast-banner animate-fade-in">
              <CheckCircle2 size={18} color="#059669" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Card 1: Share Invite Link */}
          <div className="squad-action-card">
            <div className="squad-card-header">
              <div className="squad-icon-badge">
                <Link2 size={20} color="#D94668" strokeWidth={2.4} />
              </div>
              <div className="squad-card-titles">
                <h2 className="squad-card-title">Share Invite Link</h2>
                <p className="squad-card-subtitle">Anyone with this link can join the group directly.</p>
              </div>
            </div>

            <div className="squad-link-input-row">
              <input 
                type="text" 
                readOnly 
                value={inviteLink} 
                className="squad-link-input"
                id="squad-invite-link-field"
              />
              <button 
                type="button" 
                className={`btn-squad-copy ${copied ? 'copied' : ''}`}
                onClick={handleCopyLink}
                id="btn-copy-squad-link"
              >
                {copied ? (
                  <>
                    <ClipboardCheck size={16} />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Invite via Email */}
          <div className="squad-action-card">
            <div className="squad-card-header">
              <div className="squad-icon-badge">
                <Mail size={20} color="#D94668" strokeWidth={2.4} />
              </div>
              <div className="squad-card-titles">
                <h2 className="squad-card-title">Invite via Email</h2>
                <p className="squad-card-subtitle">We'll send them a personal invitation to join.</p>
              </div>
            </div>

            <div className="squad-email-area-wrapper">
              <textarea 
                className="squad-email-textarea"
                placeholder="friend1@example.com, friend2@example.com..."
                rows={3}
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                id="squad-email-textarea"
              />
              <span className="squad-email-helper-text">
                Separate multiple emails with commas.
              </span>
            </div>
          </div>

          {/* Bottom Action CTA Button */}
          <div className="squad-continue-btn-wrap">
            <button 
              type="button" 
              className="btn-squad-continue"
              onClick={handleContinueAction}
              id="btn-squad-continue-action"
            >
              <span>Continue</span>
              <ArrowRight size={17} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberView;
