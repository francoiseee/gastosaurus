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
import LeaveGroupModal from './LeaveGroupModal';

export const GroupMembersView = ({ 
  group, 
  onBack, 
  onViewSettlements, 
  onViewExpensesDetail,
  onAddExpense, 
  onLeaveGroup, 
  onInviteMember, 
  onNavigateInviteMember,
  onResendInvite, 
  onCancelInvite,
  onOpenNotifications,
  notifications = [],
  unreadCount = 1
}) => {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isExpensesDetailOpen, setIsExpensesDetailOpen] = useState(false);
  const [resendStatus, setResendStatus] = useState({});

  if (!group) return null;

  const members = group.members || [];
  const pendingInvites = group.pendingInvites || [];
  const overallExpense = group.totalExpense || group.totalSpending || 485.50;
  const noteText = group.note || '“Birthday dinner for Mike! Such a great time, everyone’s share includes the automatic 20% gratuity.”';

  const handleOpenInvite = () => {
    if (onNavigateInviteMember) {
      onNavigateInviteMember();
    }
  };

  const handleOpenLeaveModal = () => {
    setIsLeaveModalOpen(true);
  };

  const handleConfirmLeave = () => {
    setIsLeaveModalOpen(false);
    if (onLeaveGroup) {
      onLeaveGroup(group.id);
    }
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

  return (
    <div className="group-members-page-container animate-fade-in">
      {/* Top GastoFriends Header Bar */}
      <header className="gastofriends-header-bar">
        <button 
          className="btn-header-back"
          onClick={onBack}
          aria-label="Back to groups"
          title="Back to Active Groups"
          id="btn-back-to-groups"
        >
          <ArrowLeft size={20} color="#1E2026" strokeWidth={2.2} />
        </button>

        <h2 className="gastofriends-title">GastoSaurus</h2>

        <div className="gastofriends-actions">
          <button 
            className="header-notif-btn" 
            onClick={onOpenNotifications} 
            aria-label="Notifications"
            id="btn-members-notif"
          >
            <Bell size={20} color="#1E2026" />
            {unreadCount > 0 && <span className="header-notif-dot" />}
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <div className="members-view-content">
        {/* Top Ambagan Tracker & Split Breakdown (Screenshot 1) */}
        <div className="ambagan-tracker-section">
          {/* Left Col: Total Amount & Note Card */}
          <div className="ambagan-left-card-box">
            <div className="ambagan-total-box">
              <span className="ambagan-total-label">TOTAL AMOUNT</span>
              <h1 className="ambagan-total-amount">
                ₱{Number(overallExpense).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h1>
            </div>

            <div className="ambagan-note-card">
              <h3 className="ambagan-note-title">Note</h3>
              <p className="ambagan-note-body">{noteText}</p>
            </div>
          </div>

          {/* Right Col: Split Breakdown Donut Card */}
          <div className="ambagan-breakdown-card">
            <div className="breakdown-card-header">
              <span className="breakdown-card-title">SPLIT BREAKDOWN</span>
            </div>

            <div className="breakdown-chart-wrapper">
              <div className="donut-chart-box">
                <svg className="donut-svg" viewBox="0 0 160 160">
                  {/* Background Ring Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r="56"
                    className="donut-bg-ring"
                  />
                  {/* Segment 1: Sarah 40% (#1E2026) -> 40% of 351.86 is 140.74 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="56"
                    className="donut-segment segment-sarah"
                    strokeDasharray="140.74 211.12"
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: Mike 35% (#6B4F75) -> 35% of 351.86 is 123.15 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="56"
                    className="donut-segment segment-mike"
                    strokeDasharray="123.15 228.71"
                    strokeDashoffset="-140.74"
                  />
                  {/* Segment 3: Alex 25% (#C48CCF) -> 25% of 351.86 is 87.96 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="56"
                    className="donut-segment segment-alex"
                    strokeDasharray="87.96 263.90"
                    strokeDashoffset="-263.89"
                  />
                </svg>

                {/* Center Counter */}
                <div className="donut-center-info">
                  <span className="donut-count">3</span>
                  <span className="donut-label">Members</span>
                </div>
              </div>

              {/* Breakdown Legend Row */}
              <div className="breakdown-legend-row">
                <div className="legend-item">
                  <span className="legend-bullet bullet-sarah" />
                  <span className="legend-text">Sarah (40%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-bullet bullet-mike" />
                  <span className="legend-text">Mike (35%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-bullet bullet-alex" />
                  <span className="legend-text">Alex (25%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
              id="btn-desktop-view-settlements"
            >
              <CreditCard size={16} /> View Settlements
            </button>
            <button 
              className="btn-outline-pill"
              onClick={handleOpenInvite}
              id="btn-desktop-invite-member"
            >
              <UserPlus size={16} /> Invite Member
            </button>
            <button 
              className="btn-danger-pill"
              onClick={handleOpenLeaveModal}
              id="btn-desktop-leave-group"
            >
              <LogOut size={16} /> Leave Group
            </button>
          </div>
        </div>

        {/* Mobile Top Actions Stack (Matching Screenshot 2 & 5) */}
        <div className="members-mobile-actions-stack mobile-only">
          <button 
            className="btn-mobile-action-card"
            onClick={handleOpenInvite}
            id="btn-mobile-invite-member"
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
              id="btn-mobile-view-settlements"
            >
              <CreditCard size={16} /> View Settlements
            </button>
            <button 
              className="btn-mobile-action-pill danger"
              onClick={handleOpenLeaveModal}
              id="btn-mobile-leave-group"
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

        {/* Desktop Bottom Action Dock */}
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
            id="btn-desktop-add-expenses"
          >
            Add Expenses
          </button>
        </div>

        {/* Mobile Bottom Fixed Action */}
        <div className="mobile-bottom-dock mobile-only">
          <button 
            className="btn-mobile-add-expenses"
            onClick={onAddExpense}
            id="btn-mobile-add-expenses"
          >
            Add Expenses
          </button>
        </div>
      </div>

      {/* Leave Group Modal (Matching Screenshots 1 & 2) */}
      <LeaveGroupModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleConfirmLeave}
        groupName={group.name}
      />

      {/* Expenses Detail Modal */}
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
