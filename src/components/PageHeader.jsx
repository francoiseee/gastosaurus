import { ArrowLeft, Bell } from './CustomIcons';

/**
 * Sticky top bar for screens that don't show the main navbar:
 * back button · centered title (+ optional subtitle) · notifications bell.
 *
 *   <PageHeader title="Payment" onBack={goBack} unreadCount={3} onOpenNotifications={openInbox} />
 *
 * Leave out `onOpenNotifications` to show an empty spacer instead of the bell.
 */
export const PageHeader = ({
  title,
  subtitle,
  onBack,
  backLabel = 'Go back',
  backId,
  unreadCount = 0,
  onOpenNotifications,
}) => (
  <header className="page-header-bar">
    {onBack ? (
      <button type="button" className="icon-btn" onClick={onBack} aria-label={backLabel} title={backLabel} id={backId}>
        <ArrowLeft size={20} strokeWidth={2.2} />
      </button>
    ) : (
      <span className="page-header-spacer" aria-hidden="true" />
    )}

    <div className="page-header-center">
      <h2 className="page-header-title">{title}</h2>
      {subtitle && <span className="page-header-subtitle">{subtitle}</span>}
    </div>

    {onOpenNotifications ? (
      <button
        type="button"
        className="icon-btn"
        onClick={onOpenNotifications}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="icon-btn-dot" />}
      </button>
    ) : (
      <span className="page-header-spacer" aria-hidden="true" />
    )}
  </header>
);

export default PageHeader;
