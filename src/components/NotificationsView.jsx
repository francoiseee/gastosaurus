import React from 'react';
import mascotImg from '../assets/mascot.png';
import { ArrowLeft, Bell } from './CustomIcons';

export const NotificationsView = ({ onBack, notifications = [] }) => {
  const timelineItems = [
    {
      id: 'notif-1',
      category: 'PAYMENT RECEIVED',
      categoryClass: 'badge-payment',
      nodeColorClass: 'node-green',
      text: 'Sam Taylor paid you ₱420.00 for Dinner',
      time: '2 hours ago',
      position: 'right'
    },
    {
      id: 'notif-2',
      category: 'NEW EXPENSE',
      categoryClass: 'badge-expense',
      nodeColorClass: 'node-purple',
      text: 'Alex added "Grocery Run" in Paris Trip 2024',
      time: '5 hours ago',
      position: 'left'
    },
    {
      id: 'notif-3',
      category: 'ACTION REQUIRED',
      categoryClass: 'badge-action',
      nodeColorClass: 'node-amber',
      text: 'Reminder: Settle your share for Weekend Getaway',
      subtext: 'You owe ₱1,250.00 to the group.',
      time: 'Yesterday',
      position: 'right'
    },
    {
      id: 'notif-4',
      category: 'GROUP UPDATE',
      categoryClass: 'badge-group',
      nodeColorClass: 'node-blue',
      text: 'Jamie Doe joined the "Boracay Crew"',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      time: 'Yesterday',
      position: 'left'
    }
  ];

  return (
    <div className="notifications-page-container animate-fade-in">
      {/* Top Header Bar */}
      <header className="notif-page-header-bar">
        <button 
          className="btn-header-back" 
          onClick={onBack}
          aria-label="Go back"
          id="btn-back-from-notifications"
        >
          <ArrowLeft size={20} color="#1E2026" strokeWidth={2.2} />
        </button>

        <h2 className="notif-page-title">Notifications</h2>

        <div className="notif-header-placeholder" aria-hidden="true" />
      </header>

      {/* Main Timeline View with Center Mascot Watermark */}
      <div className="notif-timeline-container">
        {/* Background Mascot Watermark */}
        <div className="notif-mascot-watermark" aria-hidden="true">
          <img src={mascotImg} alt="" className="notif-watermark-img" />
        </div>

        {/* Vertical Center Line */}
        <div className="notif-vertical-line" />

        {/* Timeline Items List */}
        <div className="notif-timeline-list">
          {timelineItems.map((item) => (
            <div 
              key={item.id} 
              className={`notif-timeline-row ${item.position === 'right' ? 'row-right' : 'row-left'}`}
            >
              {/* Left Side (Card on left OR Timestamp on left) */}
              <div className="timeline-side side-left">
                {item.position === 'left' ? (
                  <div className="notif-bubble-card animate-fade-in">
                    <div className="notif-card-tag-row">
                      <span className={`notif-tag-pill ${item.categoryClass}`}>
                        {item.category}
                      </span>
                    </div>
                    <p className="notif-card-text">{item.text}</p>
                    {item.subtext && (
                      <p className="notif-card-subtext">{item.subtext}</p>
                    )}
                    {item.avatarUrl && (
                      <div className="notif-card-avatar-wrapper">
                        <img 
                          src={item.avatarUrl} 
                          alt="Member avatar" 
                          className="notif-member-avatar"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="notif-timestamp-label">{item.time}</span>
                )}
              </div>

              {/* Center Color-Coded Node (Without Icons) */}
              <div className="timeline-center-node">
                <div className={`color-coded-circle ${item.nodeColorClass}`} />
              </div>

              {/* Right Side (Card on right OR Timestamp on right) */}
              <div className="timeline-side side-right">
                {item.position === 'right' ? (
                  <div className="notif-bubble-card animate-fade-in">
                    <div className="notif-card-tag-row">
                      <span className={`notif-tag-pill ${item.categoryClass}`}>
                        {item.category}
                      </span>
                    </div>
                    <p className="notif-card-text">{item.text}</p>
                    {item.subtext && (
                      <p className="notif-card-subtext">{item.subtext}</p>
                    )}
                    {item.avatarUrl && (
                      <div className="notif-card-avatar-wrapper">
                        <img 
                          src={item.avatarUrl} 
                          alt="Member avatar" 
                          className="notif-member-avatar"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="notif-timestamp-label">{item.time}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;
