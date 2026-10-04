import { useState } from 'react';
import GroupCard from './GroupCard';
import { Plus, Search, X } from './CustomIcons';

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
      <div className="page-intro">
        <div className="page-intro-text">
          <h1 className="page-title">Active Groups</h1>
          <p className="page-subtitle">Manage your shared expenses and collaborative spaces.</p>
        </div>
      </div>

      {/* Search Input Bar (Fixed Icon & Text Padding!) */}
      <div className="groups-search-bar-wrap">
        <div className="groups-search-input-box">
          <Search size={18} className="search-leading-icon" aria-hidden="true" />
          <input 
            type="text" 
            className="groups-main-search-input"
            placeholder="Search groups, recent expenses, or categories…"
            aria-label="Search groups"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="icon-btn icon-btn-sm icon-btn-ghost clear-search-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Active Groups Grid (Matching Screenshot 2 & 3) */}
      <div className="groups-grid">
        {filteredGroups.map((group) => (
          <GroupCard key={group.id} group={group} onOpen={onViewGroupClick} />
        ))}

        {/* Create New Group Card (Dashed Pink Border - Matching Screenshot 2 & 3) */}
        <div 
          className="create-new-group-dashed-card"
          onClick={onAddGroup}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAddGroup();
            }
          }}
          role="button"
          tabIndex={0}
          title="Create a new group"
        >
          <div className="create-group-plus-badge">
            <Plus size={22} strokeWidth={2.5} />
          </div>
          <h3 className="create-group-dashed-title">Create New Group</h3>
          <span className="create-group-dashed-sub">Start sharing expenses</span>
        </div>
      </div>
    </div>
  );
};

export default GroupsView;
