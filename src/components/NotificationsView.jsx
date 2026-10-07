import { useEffect } from 'react';
import mascotImg from '../assets/mascot.png';
import PageHeader from './PageHeader';
import { timeAgo } from '../lib/format';

// How each notification type looks on the timeline.
const TYPE_STYLE = {
  payment: { category: 'Payment received', categoryClass: 'tag-green', nodeColorClass: 'node-green' },
  expense: { category: 'New expense', categoryClass: 'tag-purple', nodeColorClass: 'node-purple' },
  reminder: { category: 'Action required', categoryClass: 'tag-amber', nodeColorClass: 'node-amber' },
  invite: { category: 'Action required', categoryClass: 'tag-amber', nodeColorClass: 'node-amber' },
  group: { category: 'Group update', categoryClass: 'tag-blue', nodeColorClass: 'node-blue' },
  welcome: { category: 'Group update', categoryClass: 'tag-blue', nodeColorClass: 'node-blue' },
};

/**
 * Timeline of notifications. Alternating layout with color nodes,
 * mascot watermark, and action buttons for invites / settlement confirmations.
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

  const realItems = [
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
  ];

  const timelineItems = realItems.map((item, index) => ({
    ...item,
    position: index % 2 === 0 ? 'right' : 'left',
  }));

  const renderActions = (item) => {
    if (item.invite) {
      return (
        <div className="notif-card-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onAcceptInvite(item.invite)}>
            Accept
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onDeclineInvite(item.invite)}>
            Decline
          </button>
        </div>
      );
    }
    const n = item.notification;
    if (n?.data?.action === 'confirm' && n.data.settlementId) {
      return (
        <div className="notif-card-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onConfirmPayment(n.data.settlementId)}>
            Confirm received
          </button>
        </div>
      );
    }
    if (n?.groupId && n.type !== 'invite') {
      return (
        <div className="notif-card-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onOpenGroup(n.groupId)}>
            Open group
          </button>
        </div>
      );
    }
    return null;
  };

  const renderCard = (item) => (
    <div className={`notif-bubble-card notif-card-${item.position} animate-fade-in`}>
      <div className="notif-card-tag-row">
        <span className={`tag-text ${item.categoryClass}`}>{item.category}</span>
        <span className="notif-card-time">{item.time}</span>
      </div>
      <p className="notif-card-text">{item.text}</p>
      {item.subtext && <p className="notif-card-subtext">{item.subtext}</p>}
      {renderActions(item)}
    </div>
  );

  return (
    <div className="notifications-page-container animate-fade-in">
      <PageHeader title="Notifications" onBack={onBack} backId="btn-back-from-notifications" />

      {timelineItems.length === 0 && (
        <div className="empty-state">
          <img src={mascotImg} alt="" className="empty-state-img" />
          <h3 className="empty-state-title">You&rsquo;re all caught up</h3>
          <p className="empty-state-text">New expenses, payments and group invites will show up here.</p>
        </div>
      )}

      {timelineItems.length > 0 && (
        <div className="notif-timeline-container">
          <div className="notif-mascot-watermark" aria-hidden="true">
            <img src={mascotImg} alt="" className="notif-watermark-img" />
          </div>

          <div className="notif-vertical-line" />

          <div className="notif-timeline-list">
            {timelineItems.map((item) => (
              <div key={item.id} className={`notif-timeline-row notif-row-${item.position}`}>
                <div className={`timeline-side side-left ${item.position === 'left' ? 'has-card' : ''}`}>
                  {item.position === 'left' ? (
                    renderCard(item)
                  ) : (
                    <span className="notif-timestamp-label">{item.time}</span>
                  )}
                </div>
                <div className="timeline-center-node">
                  <div className={`color-coded-circle ${item.nodeColorClass}`}>
                    <span className="color-coded-dot" />
                  </div>
                </div>
                <div className={`timeline-side side-right ${item.position === 'right' ? 'has-card' : ''}`}>
                  {item.position === 'right' ? (
                    renderCard(item)
                  ) : (
                    <span className="notif-timestamp-label">{item.time}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsView;

