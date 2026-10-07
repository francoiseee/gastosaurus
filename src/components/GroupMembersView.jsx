import { useState } from 'react';
import { ArrowLeft, CreditCard, UserPlus, LogOut, Mail, X, Calendar, Wallet, Settings, ReceiptText } from './CustomIcons';
import PageHeader from './PageHeader';
import LeaveGroupModal from './LeaveGroupModal';
import Avatar from './Avatar';
import { groupsApi, invitesApi } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { peso, formatDate } from '../lib/format';

// Donut chart colors, in member order.
const SEGMENT_COLORS = ['#1E2026', '#6B4F75', '#C48CCF', '#D94668', '#E26D24', '#059669', '#4F67D8', '#D97706'];
const CIRCUMFERENCE = 2 * Math.PI * 56;

/** Each member's share of the group's bills, as donut segments. */
function splitSegments(members) {
  const total = members.reduce((sum, m) => sum + m.shareAmount, 0);
  if (!total) return [];
  let offset = 0;
  return members
    .filter((m) => m.shareAmount > 0)
    .map((m, i) => {
      const length = (m.shareAmount / total) * CIRCUMFERENCE;
      const segment = {
        id: m.id,
        name: m.name,
        percent: Math.round((m.shareAmount / total) * 100),
        color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
        dasharray: `${length} ${CIRCUMFERENCE - length}`,
        dashoffset: -offset,
      };
      offset += length;
      return segment;
    });
}

export const GroupMembersView = ({
  groupId,
  refreshKey,
  onBack,
  onViewSettlements,
  onViewExpensesDetail,
  onAddExpense,
  onNavigateInviteMember,
  onOpenDetails,
  onLeft,
  onChanged,
  showToast,
}) => {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [inviteFor, setInviteFor] = useState(null); // guest member id whose invite form is open
  const [inviteEmail, setInviteEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, error, loading } = useAsync(() => groupsApi.get(groupId), [groupId, refreshKey]);

  if (!data) {
    return (
      <div className="group-members-page-container animate-fade-in">
        <PageHeader
          title="Group"
          onBack={onBack}
          backLabel="Back to groups"
        />
        <div className="page-state">
          <p className="page-subtitle">{error ? error.message : loading ? 'Loading group…' : ''}</p>
          {error && (
            <button className="btn btn-outline" onClick={onBack}>
              <ArrowLeft size={16} /> Back to groups
            </button>
          )}
        </div>
      </div>
    );
  }

  const { group, members, pendingInvites } = data;
  const isAdmin = group.myRole === 'admin';
  const segments = splitSegments(members);

  const run = async (action, successMessage) => {
    setBusy(true);
    try {
      await action();
      if (successMessage) showToast(successMessage);
      onChanged();
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmLeave = async () => {
    setIsLeaveModalOpen(false);
    setBusy(true);
    try {
      await groupsApi.leave(group.id);
      onLeft(group.name);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // "Resend" = cancel the old invite and send a fresh one (and a fresh notification).
  const handleResend = (invite) =>
    run(async () => {
      await invitesApi.cancel(invite.id);
      await invitesApi.send(group.id, { email: invite.email, memberId: invite.memberId ?? undefined });
    }, `Invite re-sent to ${invite.email} 📬`);

  const handleCancelInvite = (invite) => run(() => invitesApi.cancel(invite.id), 'Invite cancelled.');

  const handleInviteGuest = async (e, member) => {
    e.preventDefault();
    const ok = await run(
      () => invitesApi.send(group.id, { email: inviteEmail.trim(), memberId: member.id }),
      `Invited ${member.name} — they'll keep their spot and history when they join.`,
    );
    if (ok) {
      setInviteFor(null);
      setInviteEmail('');
    }
  };

  const handleRemoveMember = (member) => {
    if (!window.confirm(`Remove ${member.name} from "${group.name}"?`)) return;
    run(() => groupsApi.removeMember(group.id, member.id), `${member.name} was removed.`);
  };

  return (
    <div className="group-members-page-container animate-fade-in">
      <PageHeader
        title={group.name}
        onBack={onBack}
        backLabel="Back to groups"
        backId="btn-back-to-groups"
      />

      <div className="members-view-content">
        {/* Total spending, note, and who carries how much of it */}
        <div className="ambagan-tracker-section">
          <div className="ambagan-left-card-box">
            <div className="ambagan-total-box">
              <span className="eyebrow">Total amount</span>
              <h1 className="ambagan-total-amount">{peso(group.totalSpending)}</h1>
            </div>

            <div className="ambagan-note-card">
              <h3 className="ambagan-note-title">Note</h3>
              <p className="ambagan-note-body">{group.note || 'No note yet. Admins can add one in Group Details.'}</p>
            </div>
          </div>

          <div className="ambagan-breakdown-card">
            <div className="breakdown-card-header">
              <span className="eyebrow">Split breakdown</span>
            </div>

            <div className="breakdown-chart-wrapper">
              <div className="donut-chart-box">
                <svg className="donut-svg" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="56" className="donut-bg-ring" />
                  {segments.map((seg) => (
                    <circle
                      key={seg.id}
                      cx="80"
                      cy="80"
                      r="56"
                      className="donut-segment"
                      style={{ stroke: seg.color }}
                      strokeDasharray={seg.dasharray}
                      strokeDashoffset={seg.dashoffset}
                    />
                  ))}
                </svg>
                <div className="donut-center-info">
                  <span className="donut-count">{group.membersCount}</span>
                  <span className="donut-label">Members</span>
                </div>
              </div>

              <div className="breakdown-legend-row">
                {segments.length === 0 && <span className="legend-text">No expenses yet</span>}
                {segments.map((seg) => (
                  <div className="legend-item" key={seg.id}>
                    <span className="legend-bullet" style={{ backgroundColor: seg.color }} />
                    <span className="legend-text">
                      {seg.name} ({seg.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Page Title & Top Actions Row */}
        <div className="page-intro">
          <div className="page-intro-text">
            <h1 className="page-title">Group Members</h1>
            <p className="page-subtitle">Manage members for &lsquo;{group.name}&rsquo;</p>
          </div>

          <div className="page-actions desktop-only">
            <button className="btn btn-outline" onClick={onOpenDetails} id="btn-desktop-group-details">
              <Settings size={16} /> Group Details
            </button>
            <button className="btn btn-outline" onClick={onViewSettlements} id="btn-desktop-view-settlements">
              <CreditCard size={16} /> View Settlements
            </button>
            <button className="btn btn-outline" onClick={onNavigateInviteMember} id="btn-desktop-invite-member">
              <UserPlus size={16} /> Invite Member
            </button>
            <button
              className="btn btn-danger-outline"
              onClick={() => setIsLeaveModalOpen(true)}
              disabled={busy}
              id="btn-desktop-leave-group"
            >
              <LogOut size={16} /> Leave Group
            </button>
          </div>
        </div>

        {/* Mobile actions (2×2 grid + leave) */}
        <div className="members-mobile-actions mobile-only">
          <button className="btn btn-outline" onClick={onNavigateInviteMember} id="btn-mobile-invite-member">
            <UserPlus size={16} /> Invite
          </button>
          <button className="btn btn-outline" onClick={onViewExpensesDetail} id="btn-mobile-expenses-detail">
            <ReceiptText size={16} /> Expenses
          </button>
          <button className="btn btn-outline" onClick={onOpenDetails} id="btn-mobile-group-details">
            <Settings size={16} /> Details
          </button>
          <button className="btn btn-outline" onClick={onViewSettlements} id="btn-mobile-view-settlements">
            <CreditCard size={16} /> Settlements
          </button>
          <button
            className="btn btn-danger-outline members-mobile-leave"
            onClick={() => setIsLeaveModalOpen(true)}
            disabled={busy}
            id="btn-mobile-leave-group"
          >
            <LogOut size={16} /> Leave Group
          </button>
        </div>

        {/* Members Cards Grid */}
        <div className="members-cards-grid">
          {members.map((member) => (
            <div key={member.id} className="member-profile-card">
              <div className="member-profile-left">
                <div className="member-avatar-wrapper">
                  <Avatar person={member} className="member-initials-badge" />
                </div>

                <div className="member-profile-info">
                  <div className="member-name-row">
                    <span className="profile-name">{member.name}</span>
                    {member.isCurrentUser && <span className="member-you">(you)</span>}
                  </div>
                  <span className="profile-email">{member.email || 'Guest — no account yet'}</span>
                  <div className="profile-meta-row">
                    <span className="meta-spent" title="Paid on behalf of the group">
                      <Wallet size={13} className="meta-svg" /> {peso(member.spentAmount)}
                    </span>
                    <span className="meta-date">
                      <Calendar size={13} className="meta-svg" /> {formatDate(member.joinedAt)}
                    </span>
                  </div>

                  {inviteFor === member.id && (
                    <form className="add-member-input-row" onSubmit={(e) => handleInviteGuest(e, member)}>
                      <input
                        type="email"
                        className="form-input member-quick-input"
                        placeholder={`${member.name}'s email`}
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        autoFocus
                        required
                      />
                      <button type="submit" className="btn btn-soft btn-sm" disabled={busy}>
                        Send
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="member-profile-right">
                <span className={`tag-text ${member.role === 'admin' ? 'tag-pink' : 'tag-muted'}`}>
                  {member.role === 'admin' ? 'Admin' : member.isGuest ? 'Guest' : 'Member'}
                </span>
                {member.isGuest && !pendingInvites.some((i) => i.memberId === member.id) && (
                  <button
                    className="btn btn-text"
                    onClick={() => setInviteFor(inviteFor === member.id ? null : member.id)}
                    title="Invite this guest by email so they can claim their spot"
                  >
                    {inviteFor === member.id ? 'Close' : 'Invite'}
                  </button>
                )}
                {isAdmin && !member.isCurrentUser && (
                  <button
                    className="icon-btn icon-btn-sm icon-btn-ghost"
                    onClick={() => handleRemoveMember(member)}
                    aria-label={`Remove ${member.name}`}
                    title="Remove from group (only when settled)"
                    disabled={busy}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Pending Invites */}
          {pendingInvites.map((invite) => {
            const guest = members.find((m) => m.id === invite.memberId);
            return (
              <div key={invite.id} className="pending-invite-card">
                <div className="pending-invite-left">
                  <div className="pending-icon-wrap">
                    <Mail size={20} />
                  </div>
                  <div className="pending-info">
                    <h4 className="pending-title">{guest ? `${guest.name} (invited)` : 'Pending Invite'}</h4>
                    <span className="pending-email">{invite.email}</span>
                    <span className="pending-status">🕒 Sent {formatDate(invite.createdAt)} · waiting for response</span>
                  </div>
                </div>

                <div className="pending-invite-actions">
                  <button className="btn btn-text" onClick={() => handleResend(invite)} disabled={busy}>
                    Resend
                  </button>
                  <button
                    className="icon-btn icon-btn-sm icon-btn-ghost"
                    onClick={() => handleCancelInvite(invite)}
                    aria-label="Cancel invite"
                    title="Cancel invite"
                    disabled={busy}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="page-bottom-actions">
          <button className="btn btn-outline desktop-only" onClick={onViewExpensesDetail} id="btn-desktop-expenses-detail">
            <ReceiptText size={16} /> Expenses Detail
          </button>
          <button className="btn btn-primary btn-mobile-block" onClick={onAddExpense} id="btn-add-expenses">
            Add Expenses
          </button>
        </div>
      </div>

      <LeaveGroupModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleConfirmLeave}
        groupName={group.name}
      />
    </div>
  );
};

export default GroupMembersView;
