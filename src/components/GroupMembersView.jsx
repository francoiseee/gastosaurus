import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Bell, 
  CreditCard, 
  UserPlus, 
  LogOut, 
  Mail, 
  X, 
  Plus, 
  Check, 
  ReceiptText, 
  Calendar, 
  DollarSign, 
  Sparkles,
  Users
} from './CustomIcons';

export const GroupMembersView = ({ 
  group, 
  onBack, 
  onViewSettlements, 
  onViewExpensesDetail,
  onAddExpense, 
  onLeaveGroup, 
  onInviteMember, 
  onResendInvite, 
  onCancelInvite,
  notifications = [],
  unreadCount = 1
}) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isExpensesDetailOpen, setIsExpensesDetailOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [resendStatus, setResendStatus] = useState({});

  if (!group) return null;

  const members = group.members || [];
  const pendingInvites = group.pendingInvites || [];

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    if (onInviteMember) {
      onInviteMember(group.id, {
        name: inviteName.trim() || inviteEmail.split('@')[0],
        email: inviteEmail.trim()
      });
    }
    setInviteName('');
    setInviteEmail('');
    setIsInviteModalOpen(false);
  };

  const handleResend = (inviteId, email) => {
    setResendStatus(prev => ({ ...prev, [inviteId]: 'Sent!' }));
    if (onResendInvite) {
      onResendInvite(group.id, inviteId, email);
    }
    setTimeout(() => {
      setResendStatus(prev => ({ ...prev, [inviteId]: null }));
    }, 2500);
  };

  const handleLeave = () => {
    if (window.confirm(`Are you sure you want to leave "${group.name}"?`)) {
      if (onLeaveGroup) {
        onLeaveGroup(group.id);
      }
      onBack();
    }
  };

  return (
    <div className="group-members-page-container animate-fade-in">
      {/* Top GastoFriends Header Bar */}
      <header className="gastofriends-header-bar">
        <button 
          className="btn-header-back"
          onClick={onBack}
          aria-label="Back to groups"
          title="Back to Active Groups"
        >
          <ArrowLeft size={20} color="#1E2026" strokeWidth={2.2} />
        </button>

        <h2 className="gastofriends-title">GastoFriends</h2>

        <div className="gastofriends-actions">
          <button className="header-notif-btn" aria-label="Notifications">
            <Bell size={20} color="#1E2026" />
            {unreadCount > 0 && <span className="header-notif-dot" />}
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <div className="members-view-content">
        {/* Page Title & Top Actions Row */}
        <div className="members-page-header">
          <div className="members-header-text">
            <h1 className="members-main-title">Group Members</h1>
            <p className="members-subtitle">Manage members for '{group.name}'</p>
          </div>

          {/* Desktop Top Actions */}
          <div className="members-top-actions desktop-only">
            <button 
              className="btn-outline-pill"
              onClick={onViewSettlements}
            >
              <CreditCard size={16} /> View Settlements
            </button>
            <button 
              className="btn-outline-pill"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <UserPlus size={16} /> Invite Member
            </button>
            <button 
              className="btn-danger-pill"
              onClick={handleLeave}
            >
              <LogOut size={16} /> Leave Group
            </button>
          </div>
        </div>

        {/* Mobile Top Actions Stack (Matching Screenshot 5) */}
        <div className="members-mobile-actions-stack mobile-only">
          <button 
            className="btn-mobile-action-card"
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite Member
          </button>
          <button 
            className="btn-mobile-action-card"
            onClick={() => onViewExpensesDetail ? onViewExpensesDetail() : setIsExpensesDetailOpen(true)}
            id="btn-mobile-expenses-detail"
          >
            Expenses Detail
          </button>
          <div className="mobile-action-row-split">
            <button 
              className="btn-mobile-action-pill"
              onClick={onViewSettlements}
            >
              <CreditCard size={16} /> View Settlements
            </button>
            <button 
              className="btn-mobile-action-pill danger"
              onClick={handleLeave}
            >
              <LogOut size={16} /> Leave Group
            </button>
          </div>
        </div>

        {/* Members Cards Grid */}
        <div className="members-cards-grid">
          {members.map((member) => {
            const isAdmin = member.role === 'Admin';
            return (
              <div key={member.id || member.name} className="member-profile-card">
                <div className="member-profile-left">
                  {/* Avatar with optional online dot */}
                  <div className="member-avatar-wrapper">
                    {member.avatarType === 'image' && member.avatarUrl ? (
                      <img 
                        src={member.avatarUrl} 
                        alt={member.name} 
                        className="member-avatar-img" 
                      />
                    ) : (
                      <div className="member-initials-badge">
                        {member.initials || (member.name ? member.name.substring(0, 2).toUpperCase() : 'ME')}
                      </div>
                    )}
                    {member.isOnline && <span className="online-indicator-dot" />}
                  </div>

                  {/* Details */}
                  <div className="member-profile-info">
                    <div className="member-name-row">
                      <span className="profile-name">{member.name}</span>
                      {member.isCurrentUser && (
                        <span className="badge-you-pill">YOU</span>
                      )}
                    </div>
                    <span className="profile-email">{member.email || `${member.name.toLowerCase()}@example.com`}</span>
                    <div className="profile-meta-row">
                      <span className="meta-spent">
                        <DollarSign size={13} className="meta-svg" /> ₱{Number(member.spentAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="meta-date">
                        <Calendar size={13} className="meta-svg" /> {member.joinedDate || 'Jan 12, 2024'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="member-profile-right">
                  <span className={`role-badge ${isAdmin ? 'admin' : 'member'}`}>
                    {member.role || 'Member'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Pending Invites Card (Dashed Pink Border) */}
          {pendingInvites.map((invite) => (
            <div key={invite.id || invite.email} className="pending-invite-card">
              <div className="pending-invite-left">
                <div className="pending-icon-wrap">
                  <Mail size={20} color="#7E8492" />
                </div>
                <div className="pending-info">
                  <h4 className="pending-title">{invite.name || 'Pending Invite'}</h4>
                  <span className="pending-email">{invite.email}</span>
                  <span className="pending-status">
                    🕒 {invite.status || 'Waiting for response...'}
                  </span>
                </div>
              </div>

              <div className="pending-invite-actions">
                <button 
                  className="btn-resend-invite"
                  onClick={() => handleResend(invite.id, invite.email)}
                >
                  {resendStatus[invite.id] || 'Resend'}
                </button>
                <button 
                  className="btn-dismiss-invite"
                  onClick={() => onCancelInvite && onCancelInvite(group.id, invite.id)}
                  aria-label="Cancel invite"
                  title="Cancel invite"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Bottom Action Dock (Matching Screenshot 4) */}
        <div className="desktop-bottom-actions-dock desktop-only">
          <button 
            className="btn-expenses-detail-dock"
            onClick={() => onViewExpensesDetail ? onViewExpensesDetail() : setIsExpensesDetailOpen(true)}
            id="btn-desktop-expenses-detail"
          >
            Expenses Detail
          </button>
          <button 
            className="btn-add-expenses-dock"
            onClick={onAddExpense}
          >
            Add Expenses
          </button>
        </div>

        {/* Mobile Bottom Fixed Action (Matching Screenshot 5) */}
        <div className="mobile-bottom-dock mobile-only">
          <button 
            className="btn-mobile-add-expenses"
            onClick={onAddExpense}
          >
            Add Expenses
          </button>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsInviteModalOpen(false)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <div className="modal-icon-badge">
                  <UserPlus size={20} color="#E2486E" />
                </div>
                <div>
                  <h3>Invite to {group.name}</h3>
                  <span className="modal-sub">Send an email invite to collaborate on expenses.</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsInviteModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSendInvite}>
              <div className="form-group">
                <label>Friend's Name (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Chris Wong"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email Address <span className="required-star">*</span></label>
                <input 
                  type="email"
                  placeholder="e.g. chris.w@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary-action"
                  disabled={!inviteEmail.trim()}
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses Detail Modal (Matching Reference Breakdown) */}
      {isExpensesDetailOpen && (
        <div className="modal-backdrop" onClick={() => setIsExpensesDetailOpen(false)}>
          <div className="expenses-breakdown-modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <div className="modal-icon-badge">
                  <ReceiptText size={20} color="#E2486E" />
                </div>
                <div>
                  <h3 className="modal-title-heading">Expenses Breakdown</h3>
                  <span className="modal-sub">Recent expenses and totals for {group.name}</span>
                </div>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setIsExpensesDetailOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="expenses-breakdown-content">
              {/* Total Shared Spending Card */}
              <div className="expenses-total-card">
                <span className="stat-label">TOTAL SHARED SPENDING</span>
                <h2 className="stat-amount">
                  ₱{(group.totalSpending !== undefined ? group.totalSpending : (group.expenses && group.expenses.length > 0 ? group.expenses.reduce((a, c) => a + Number(c.amount || 0), 0) : 2510.50)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <span className="stat-subtext">
                  Split automatically across {group.membersCount || (group.members ? group.members.length : 2)} members
                </span>
              </div>

              {/* Recent Group Expenses Card */}
              <div className="expenses-recent-card">
                <span className="expenses-recent-title">Recent Group Expenses</span>
                <div className="expenses-list-container">
                  {(group.expenses && group.expenses.length > 0 ? group.expenses : [
                    {
                      id: 'exp-default-1',
                      name: group.recentExpense || 'Meralco Bill & Water',
                      amount: 1850.00,
                      splitType: 'Split Equally'
                    },
                    {
                      id: 'exp-default-2',
                      name: 'Snacks, Drinks & Extra Rice',
                      amount: 660.50,
                      splitType: 'Itemized'
                    }
                  ]).map((exp, idx) => (
                    <div key={exp.id || idx} className="expense-row-item">
                      <div className="expense-row-info">
                        <span className="expense-item-title">{exp.name || exp.title}</span>
                        <span className="expense-split-badge">{exp.splitType || 'Split Equally'}</span>
                      </div>
                      <span className="expense-item-amount">
                        ₱{Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions-full">
              <button 
                className="btn-expenses-close" 
                onClick={() => setIsExpensesDetailOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupMembersView;
