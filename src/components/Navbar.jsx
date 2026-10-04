import mascotImg from '../assets/mascot.png';
import { Bell, LogOut } from './CustomIcons';
import Avatar from './Avatar';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'groups', label: 'Groups' },
  { id: 'settlements', label: 'Settlements' },
];

/** The pill switcher between the three main screens (top bar on desktop, own row on mobile). */
const TabSwitcher = ({ currentTab, onSelectTab, className = '', label }) => (
  <nav className={`nav-pill-wrapper ${className}`} aria-label={label}>
    <div className="nav-pill-track">
      {TABS.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`nav-pill-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  </nav>
);

export const Navbar = ({
  currentTab,
  onSelectTab,
  onNavigateHome,
  unreadCount = 0,
  onOpenNotifs,
  authUser,
  userName,
  onOpenProfileModal,
  onLogout,
}) => {
  const currentPerson = authUser || (userName ? { name: userName } : null);

  return (
    <header className="gastosaurus-navbar-container">
      <div className="navbar-content">
        <button type="button" className="navbar-brand" onClick={onNavigateHome} title="Back to the welcome page">
          <span className="mascot-avatar-wrapper">
            <img src={mascotImg} alt="" className="mascot-avatar-img" />
          </span>
          <span className="brand-name">Gastosaurus</span>
        </button>

        <TabSwitcher currentTab={currentTab} onSelectTab={onSelectTab} className="desktop-only" label="Main navigation" />

        <div className="navbar-actions">
          {currentPerson && onOpenProfileModal && (
            <button
              type="button"
              className="navbar-profile-pill"
              onClick={onOpenProfileModal}
              title={`Logged in as ${currentPerson.name} · Customize your Dino avatar`}
              aria-label="Customize your Dino avatar"
            >
              <Avatar person={currentPerson} className="navbar-dino-avatar" size={30} />
              <span className="navbar-profile-name">{currentPerson.name}</span>
            </button>
          )}

          {onLogout && (
            <button type="button" className="btn btn-outline navbar-logout-btn" onClick={onLogout} aria-label="Log out" title="Log out">
              <LogOut size={16} className="navbar-logout-icon" />
              <span className="navbar-logout-label">Log out</span>
            </button>
          )}

          <button
            type="button"
            className="icon-btn"
            onClick={() => onOpenNotifs?.()}
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
            title="Notifications"
            id="navbar-notif-btn"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="icon-btn-dot" />}
          </button>
        </div>
      </div>

      <TabSwitcher currentTab={currentTab} onSelectTab={onSelectTab} className="mobile-pill-container mobile-only" label="Main navigation" />
    </header>
  );
};

export default Navbar;
