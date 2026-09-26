import React, { useState } from 'react';
import GroupIcon from './GroupIcon';
import { 
  Plus, 
  Users, 
  Search,
  Check,
  ChevronRight,
  Sparkles
} from './CustomIcons';

export const GroupsView = ({ groups, onViewGroupClick, onAddGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = groups.filter(g => {
    const term = searchTerm.toLowerCase();
    return (
      g.name.toLowerCase().includes(term) || 
      (g.recentExpense && g.recentExpense.toLowerCase().includes(term)) ||
      (g.category && g.category.toLowerCase().includes(term))
    );
  });

  return (
    <div className="groups-view-container animate-fade-in">
      {/* Page Header (Matching Screenshot 2 & 3) */}
      <div className="groups-page-header-banner">
        <h1 className="active-groups-h1">Active Groups</h1>
        <p className="active-groups-lead">
          Manage your shared expenses and collaborative spaces.
        </p>
      </div>

      {/* Search Input Bar (Fixed Icon & Text Padding!) */}
      <div className="groups-search-bar-wrap">
        <div className="groups-search-input-box">
          <Search size={18} color="#8E94A0" className="search-leading-icon" />
          <input 
            type="text" 
            className="groups-main-search-input"
            placeholder="Search groups, recent expenses, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Active Groups Grid (Matching Screenshot 2 & 3) */}
      <div className="active-groups-gallery-grid">
        {filteredGroups.map((group) => {
          const isSettled = group.balance === 0 || group.statusType === 'settled';
          const isOwe = group.balance < 0 || group.statusType === 'owe';
          const isOwed = group.balance > 0 || group.statusType === 'owed';

          return (
            <div 
              key={group.id} 
              className="active-group-card"
              onClick={() => onViewGroupClick && onViewGroupClick(group)}
              role="button"
              tabIndex={0}
            >
              <div className="active-group-card-header">
                <div 
                  className="active-group-icon-circle"
                  style={{ backgroundColor: group.iconBg || '#FFEBEF' }}
                >
                  <GroupIcon 
                    iconId={group.iconId} 
                    iconType={group.iconType} 
                    size={42} 
                    alt={group.name} 
                  />
                </div>
                <div className="active-group-title-box">
                  <h3 className="active-group-card-name">{group.name}</h3>
                  <div className="active-group-members-count">
                    <Users size={14} className="users-count-icon" />
                    <span>{group.membersCount || group.members?.length || 2} Members</span>
                  </div>
                </div>
              </div>

              {/* Card Divider */}
              <div className="active-group-card-divider" />

              {/* Card Footer Balance Status */}
              <div className="active-group-card-footer">
                {isSettled ? (
                  <div className="settled-status-line">
                    <span className="settled-check-icon">
                      <Check size={15} strokeWidth={2.8} />
                    </span>
                    <span className="settled-text">Settled</span>
                  </div>
                ) : (
                  <>
                    <span className="group-balance-label">Your balance</span>
                    <span className={`group-balance-value ${isOwe ? 'owe' : 'owed'}`}>
                      {group.statusText || (isOwe 
                        ? `You owe ₱${Math.abs(group.balance).toLocaleString('en-US', { minimumFractionDigits: 0 })}` 
                        : `You are owed ₱${group.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Create New Group Card (Dashed Pink Border - Matching Screenshot 2 & 3) */}
        <div 
          className="create-new-group-dashed-card"
          onClick={onAddGroup}
          role="button"
          tabIndex={0}
          title="Create a new group"
        >
          <div className="create-group-plus-badge">
            <Plus size={22} color="#1E2026" strokeWidth={2.5} />
          </div>
          <h3 className="create-group-dashed-title">Create New Group</h3>
          <span className="create-group-dashed-sub">Start sharing expenses</span>
        </div>
      </div>
    </div>
  );
};

export default GroupsView;
