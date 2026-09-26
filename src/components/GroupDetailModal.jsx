import React, { useState } from 'react';
import GroupIcon from './GroupIcon';
import { GROUP_ICONS, ICON_SETS } from '../data/groupIcons';
import { Users, Plus, Check, Sparkles } from './CustomIcons';

export const GroupDetailModal = ({ 
  group, 
  isOpen, 
  onClose, 
  onUpdateGroupIcon,
  onAddExpenseToGroup 
}) => {
  const [isChangingIcon, setIsChangingIcon] = useState(false);
  const [activeSet, setActiveSet] = useState('all');

  if (!isOpen || !group) return null;

  const currentIconId = group.iconId || 'set2_2_1';

  const filteredIcons = GROUP_ICONS.filter(i => activeSet === 'all' || i.set === activeSet);

  const handleSelectIcon = (iconId) => {
    if (onUpdateGroupIcon) {
      onUpdateGroupIcon(group.id, iconId);
    }
    setIsChangingIcon(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card group-detail-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <div 
              className="modal-icon-badge group-detail-icon-wrap" 
              style={{ backgroundColor: group.iconBg || '#FFEBEF' }}
              title="Click to change icon"
              onClick={() => setIsChangingIcon(!isChangingIcon)}
            >
              <GroupIcon 
                iconId={group.iconId} 
                iconType={group.iconType} 
                size={36} 
                alt={group.name} 
              />
            </div>
            <div>
              <div className="group-title-row">
                <h3>{group.name}</h3>
                <button 
                  type="button" 
                  className="change-icon-tag-btn"
                  onClick={() => setIsChangingIcon(!isChangingIcon)}
                >
                  {isChangingIcon ? 'Close Icons' : 'Change Icon'}
                </button>
              </div>
              <span className="modal-sub">
                {group.membersCount} members • {group.category || 'Shared Expenses'}
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Change Icon Drawer */}
        {isChangingIcon && (
          <div className="quick-change-icon-drawer animate-fade-in">
            <div className="drawer-header">
              <span className="drawer-title">Choose from 3 Icon Sets:</span>
              <div className="drawer-tabs">
                <button 
                  className={`drawer-tab-btn ${activeSet === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveSet('all')}
                >
                  All (54)
                </button>
                {ICON_SETS.map(s => (
                  <button 
                    key={s.id}
                    className={`drawer-tab-btn ${activeSet === s.id ? 'active' : ''}`}
                    onClick={() => setActiveSet(s.id)}
                  >
                    {s.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="drawer-icons-grid">
              {filteredIcons.map(icon => (
                <button
                  key={icon.id}
                  className={`drawer-icon-btn ${currentIconId === icon.id ? 'active' : ''}`}
                  onClick={() => handleSelectIcon(icon.id)}
                  title={icon.name}
                >
                  <img src={icon.src} alt={icon.name} className="drawer-icon-img" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Balance Status Banner */}
        <div className="group-detail-balance-banner">
          <div>
            <span className="stat-label">YOUR STATUS IN THIS GROUP</span>
            <h3 className={`balance-value ${group.balance < 0 ? 'negative' : 'positive'}`}>
              {group.balance < 0 
                ? `You owe ₱${Math.abs(group.balance).toFixed(2)}` 
                : group.balance > 0 
                  ? `You get back ₱${group.balance.toFixed(2)}`
                  : 'All settled up! (₱0.00)'}
            </h3>
          </div>
          {group.recentExpense && (
            <div className="group-detail-recent-chip">
              <span className="recent-label">Latest:</span>
              <span className="recent-val">{group.recentExpense}</span>
            </div>
          )}
        </div>

        {/* Members Breakdown */}
        <div className="group-members-section">
          <div className="section-mini-header">
            <h4 className="section-mini-title">Members Breakdown ({group.members?.length || group.membersCount})</h4>
          </div>
          <div className="members-list">
            {group.members && group.members.map((m, idx) => (
              <div key={idx} className="member-row">
                <div className="member-info">
                  <span className="member-avatar">{m.avatar || '🦖'}</span>
                  <span className="member-name">{m.name}</span>
                </div>
                <span className={`member-balance ${m.owes < 0 ? 'negative' : m.owes > 0 ? 'positive' : 'neutral'}`}>
                  {m.owes < 0 
                    ? `-₱${Math.abs(m.owes).toFixed(2)}` 
                    : m.owes > 0 
                      ? `+₱${m.owes.toFixed(2)}`
                      : '₱0.00 (Settled)'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions group-detail-actions">
          {onAddExpenseToGroup && (
            <button 
              className="btn-secondary" 
              onClick={() => {
                onClose();
                onAddExpenseToGroup(group);
              }}
            >
              <Plus size={16} /> Add Ambagan
            </button>
          )}
          <button className="btn-primary-action" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailModal;
