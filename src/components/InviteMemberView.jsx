import { useState } from 'react';
import mascotImg from '../assets/mascot.png';
import { ArrowLeft, ArrowRight, Link2, Copy, ClipboardCheck, Mail, CheckCircle2, RefreshCw } from './CustomIcons';
import { groupsApi, invitesApi, inviteLinkFor } from '../lib/api';
import { useAsync } from '../hooks/useAsync';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const InviteMemberView = ({ groupId, onBack, onContinue, onChanged, showToast }) => {
  const [linkVersion, setLinkVersion] = useState(0);
  const { data } = useAsync(() => groupsApi.get(groupId), [groupId, linkVersion]);
  const group = data?.group;
  const inviteLink = group ? inviteLinkFor(group.inviteCode) : 'Loading…';

  const [copied, setCopied] = useState(false);
  const [emailsText, setEmailsText] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (!group) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setToastMessage('Invite link copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      document.getElementById('squad-invite-link-field')?.select();
      setToastMessage('Press Ctrl+C (or ⌘C) to copy the selected link.');
    }
  };

  const handleResetLink = async () => {
    if (!window.confirm('Make a new link? People with the old link will no longer be able to join.')) return;
    try {
      await groupsApi.resetInviteLink(groupId);
      setLinkVersion((v) => v + 1);
      setToastMessage('New invite link ready. The old one no longer works.');
    } catch (err) {
      setToastMessage(err.message);
    }
  };

  // Send email invites (if any were typed), then continue to the group.
  const handleContinueAction = async () => {
    const emails = [...new Set(emailsText.split(/[,\s;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
    if (!emails.length) return onContinue();

    const invalid = emails.filter((e) => !EMAIL.test(e));
    if (invalid.length) {
      setToastMessage(`Check these emails: ${invalid.join(', ')}`);
      return undefined;
    }

    setIsSending(true);
    const results = await Promise.allSettled(emails.map((email) => invitesApi.send(groupId, { email })));
    setIsSending(false);
    const failed = results
      .map((r, i) => (r.status === 'rejected' ? `${emails[i]} (${r.reason.message})` : null))
      .filter(Boolean);
    const sent = emails.length - failed.length;

    if (sent) onChanged();
    if (failed.length) {
      setEmailsText(failed.map((f) => f.split(' ')[0]).join(', '));
      setToastMessage(`${sent ? `Sent ${sent}. ` : ''}Couldn't invite: ${failed.join('; ')}`);
      return undefined;
    }
    showToast(`Sent ${sent} invite${sent === 1 ? '' : 's'} 📬`);
    return onContinue();
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
                <p className="squad-card-subtitle">
                  Anyone with this link can join {group ? `"${group.name}"` : 'the group'} directly.
                </p>
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
            {group?.myRole === 'admin' && (
              <button type="button" className="btn-squad-copy" onClick={handleResetLink} style={{ marginTop: 10 }}>
                <RefreshCw size={16} />
                <span>Reset link</span>
              </button>
            )}
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
                Separate multiple emails with commas. People who already have an account get a notification;
                everyone else sees the invite when they sign up with that email.
              </span>
            </div>
          </div>

          {/* Bottom Action CTA Button */}
          <div className="squad-continue-btn-wrap">
            <button 
              type="button" 
              className="btn-squad-continue"
              onClick={handleContinueAction}
              disabled={isSending}
              id="btn-squad-continue-action"
            >
              <span>{isSending ? 'Sending…' : emailsText.trim() ? 'Send & Continue' : 'Continue'}</span>
              <ArrowRight size={17} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberView;
