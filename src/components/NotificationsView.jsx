import { useEffect } from 'react';
import mascotImg from '../assets/mascot.png';
import { ArrowLeft } from './CustomIcons';
import { timeAgo } from '../lib/format';

// How each notification type looks on the timeline.
const TYPE_STYLE = {
  payment: { category: 'PAYMENT', categoryClass: 'badge-payment', nodeColorClass: 'node-green' },
  expense: { category: 'NEW EXPENSE', categoryClass: 'badge-expense', nodeColorClass: 'node-purple' },
  reminder: { category: 'ACTION REQUIRED', categoryClass: 'badge-action', nodeColorClass: 'node-amber' },
  invite: { category: 'INVITE', categoryClass: 'badge-action', nodeColorClass: 'node-amber' },
  group: { category: 'GROUP UPDATE', categoryClass: 'badge-group', nodeColorClass: 'node-blue' },
  welcome: { category: 'WELCOME', categoryClass: 'badge-group', nodeColorClass: 'node-blue' },
};

/**
 * Timeline of notifications. Pending group invites are pinned on top with
 * Accept / Decline; "X says they paid you" items get a Confirm button.
 * Opening this screen marks everything as read.
 */
export const NotificationsView = ({
  notifications = [],
  invites = [],
  onBack,
  onMarkAllRead,
  onAcceptInvite,
  onDeclineInvite,
  onConfirmPayment,
  onOpenGroup,
}) => {
  useEffect(() => {
    onMarkAllRead?.();
  }, [onMarkAllRead]);

  const pendingInviteIds = new Set(invites.map((i) => i.id));

  const timelineItems = [
    ...invites.map((invite) => ({
      id: `invite-${invite.id}`,
      ...TYPE_STYLE.invite,
      text: `${invite.invitedBy?.name ?? 'Someone'} invited you to "${invite.group?.name}"`,
      subtext: 'Join to see the group and split expenses together.',
      time: timeAgo(invite.createdAt),
      invite,
    })),
    ...notifications
      // Invite notifications are shown above (while pending) — skip duplicates.
      .filter((n) => !(n.type === 'invite' && pendingInviteIds.has(n.data?.inviteId)))
      .map((n) => ({
        id: n.id,
        ...(TYPE_STYLE[n.type] ?? TYPE_STYLE.group),
        text: n.title,
        subtext: n.body,
        time: timeAgo(n.createdAt),
        notification: n,
      })),
  ].map((item, index) => ({ ...item, position: index % 2 === 0 ? 'right' : 'left' }));

  const renderActions = (item) => {
    if (item.invite) {
      return (
        <div className="notif-card-actions">
          <button type="button" className="notif-action-btn primary" onClick={() => onAcceptInvite(item.invite)}>
            Accept
          </button>
          <button type="button" className="notif-action-btn" onClick={() => onDeclineInvite(item.invite)}>
            Decline
          </button>
        </div>
      );
    }
    const n = item.notification;
    if (n?.data?.action === 'confirm' && n.data.settlementId) {
      return (
        <div className="notif-card-actions">
          <button type="button" className="notif-action-btn primary" onClick={() => onConfirmPayment(n.data.settlementId)}>
            Confirm received
          </button>
        </div>
      );
    }
    if (n?.groupId && n.type !== 'invite') {
      return (
        <div className="notif-card-actions">
          <button type="button" className="notif-action-btn" onClick={() => onOpenGroup(n.groupId)}>
            Open group
          </button>
        </div>
      );
    }
    return null;
  };

  const renderCard = (item) => (
    <div className="notif-bubble-card animate-fade-in">
      <div className="notif-card-tag-row">
        <span className={`notif-tag-pill ${item.categoryClass}`}>{item.category}</span>
      </div>
      <p className="notif-card-text">{item.text}</p>
      {item.subtext && <p className="notif-card-subtext">{item.subtext}</p>}
      {renderActions(item)}
    </div>
  );

  return (
    <div className="notifications-page-container animate-fade-in">
      <header className="notif-page-header-bar">
        <button className="btn-header-back" onClick={onBack} aria-label="Go back" id="btn-back-from-notifications">
          <ArrowLeft size={20} color="#1E2026" strokeWidth={2.2} />
        </button>
        <h2 className="notif-page-title">Notifications</h2>
        <div className="notif-header-placeholder" aria-hidden="true" />
      </header>

      <div className="notif-timeline-container">
        <div className="notif-mascot-watermark" aria-hidden="true">
          <img src={mascotImg} alt="" className="notif-watermark-img" />
        </div>

        <div className="notif-vertical-line" />

        <div className="notif-timeline-list">
          {timelineItems.length === 0 && (
            <div className="notif-timeline-row row-right">
              <div className="timeline-side side-left" />
              <div className="timeline-center-node">
                <div className="color-coded-circle node-blue" />
              </div>
              <div className="timeline-side side-right">
                <div className="notif-bubble-card">
                  <p className="notif-card-text">You're all caught up. 🦖</p>
                </div>
              </div>
            </div>
          )}

          {timelineItems.map((item) => (
            <div key={item.id} className={`notif-timeline-row ${item.position === 'right' ? 'row-right' : 'row-left'}`}>
              <div className="timeline-side side-left">
                {item.position === 'left' ? renderCard(item) : <span className="notif-timestamp-label">{item.time}</span>}
              </div>
              <div className="timeline-center-node">
                <div className={`color-coded-circle ${item.nodeColorClass}`} />
              </div>
              <div className="timeline-side side-right">
                {item.position === 'right' ? renderCard(item) : <span className="notif-timestamp-label">{item.time}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;
