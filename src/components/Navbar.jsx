import React, { useState } from 'react';
import mascotImg from '../assets/mascot.png';
import { Bell, Check, ArrowRight } from './CustomIcons';

export const Navbar = ({ 
  currentTab, 
  onSelectTab, 
  onNavigateHome, 
  notifications = [],
  unreadCount = 2,
  onOpenNotifs,
  userName,
  onLogout
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'groups', label: 'Groups' },
    { id: 'settlements', label: 'Settlements' }
  ];

  return (
    <header className="gastosaurus-navbar-container">
      <div className="navbar-content">
        {/* Brand / Logo */}
        <div 
          className="navbar-brand" 
          onClick={onNavigateHome}
          role="button"
          tabIndex={0}
          title="Return to Welcome / Landing Page"
        >
          <div className="mascot-avatar-wrapper">
            <img src={mascotImg} alt="Gastosaurus Mascot" className="mascot-avatar-img" />
          </div>
          <span className="brand-name">Gastosaurus</span>
        </div>

        {/* Center Segmented Pill Switcher (Web & Desktop) */}
        <nav className="nav-pill-wrapper desktop-only" aria-label="Main Navigation">
          <div className="nav-pill-track">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
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

        {/* Right Actions: Notifications & Switch View */}
        <div className="navbar-actions">
          {onLogout && (
            <button
              type="button"
              className="navbar-logout-btn"
              onClick={onLogout}
              title={userName ? `Logged in as ${userName}` : 'Log out'}
            >
              Log out
            </button>
          )}
          <div className="notif-dropdown-wrapper">
            <button 
              className={`notif-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              aria-label="View notifications"
              title="Notifications"
            >
              <Bell size={20} color="#21252D" />
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>

            {/* Notification Popover */}
            {isNotifOpen && (
              <div className="notif-popover animate-fade-in">
                <div className="notif-header">
                  <h4>Notifications</h4>
                  <span className="badge-pill">{unreadCount} new</span>
                </div>
                <div className="notif-list">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`notif-item ${notif.read ? 'read' : 'unread'}`}>
                      <div className="notif-content">
                        <p className="notif-title">{notif.title}</p>
                        <span className="notif-time">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  className="notif-footer-btn"
                  onClick={() => setIsNotifOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Segmented Switcher (Visible on Mobile) */}
      <div className="mobile-pill-container mobile-only">
        <div className="nav-pill-track">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
