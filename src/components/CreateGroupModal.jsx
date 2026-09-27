import React, { useState, useMemo } from 'react';
import GroupIcon from './GroupIcon';
import { GROUP_ICONS, ICON_SETS } from '../data/groupIcons';
import { Users, Plus, Check, Search, Sparkles, ChevronDown } from './CustomIcons';

const COLOR_THEMES = [
  { name: 'Soft Pink', bg: '#FFEBEF', color: '#D94668' },
  { name: 'Lavender', bg: '#F1EBFC', color: '#7C4DFF' },
  { name: 'Warm Peach', bg: '#FFF1E6', color: '#E26D24' },
  { name: 'Mint Green', bg: '#ECFDF5', color: '#059669' },
  { name: 'Sky Blue', bg: '#EEF0FC', color: '#4F67D8' },
  { name: 'Honey Amber', bg: '#FEF3C7', color: '#D97706' },
  { name: 'Rose', bg: '#FCE7F3', color: '#DB2777' },
  { name: 'Slate', bg: '#F1F5F9', color: '#475569' }
];

const CATEGORIES = [
  'Rent & Utilities',
  'Travel & Trips',
  'Food & Dining',
  'Recreation & Fun',
  'Supplies & Groceries',
  'Work & Cafe',
  'Household',
  'Events & Parties'
];

const SUGGESTIONS = [
  'Condo Roommates',
  'Baguio Roadtrip 2024',
  'Friday Dinner Club',
  'Weekly Grocery Run',
  'Badminton / Gym',
  'Netflix / Spotify Sub'
];

export const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Travel & Trips');
  const [selectedIconId, setSelectedIconId] = useState('set1_2_3'); // default: flight
  const [selectedTheme, setSelectedTheme] = useState(COLOR_THEMES[0]);
  const [activeSetTab, setActiveSetTab] = useState('all');
  const [iconSearch, setIconSearch] = useState('');
  const [members, setMembers] = useState(['You (Admin)', 'Miguel', 'Bea']);
  const [newMemberName, setNewMemberName] = useState('');

  // Filter icons based on Set tab and Search query
  const filteredIcons = useMemo(() => {
    return GROUP_ICONS.filter((icon) => {
      const matchesSet = activeSetTab === 'all' || icon.set === activeSetTab;
      const matchesSearch =
        !iconSearch.trim() ||
        icon.name.toLowerCase().includes(iconSearch.toLowerCase()) ||
        icon.setLabel.toLowerCase().includes(iconSearch.toLowerCase());
      return matchesSet && matchesSearch;
    });
  }, [activeSetTab, iconSearch]);

  if (!isOpen) return null;

  const handleAddMember = (e) => {
    e?.preventDefault();
    if (!newMemberName.trim()) return;
    if (!members.includes(newMemberName.trim())) {
      setMembers([...members, newMemberName.trim()]);
    }
    setNewMemberName('');
  };

  const handleRemoveMember = (idxToRemove) => {
    if (idxToRemove === 0) return; // Keep Admin
    setMembers(members.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newGroup = {
      id: `group-${Date.now()}`,
      name: name.trim(),
      note: note.trim() || '“Birthday dinner for Mike! Such a great time, everyone’s share includes the automatic 20% gratuity.”',
      membersCount: members.length,
      balance: 0.00,
      totalExpense: 485.50,
      totalSpending: 485.50,
      iconId: selectedIconId,
      iconBg: selectedTheme.bg,
      iconColor: selectedTheme.color,
      category: category,
      recentExpense: 'Group created',
      members: members.map((m, idx) => ({
        id: `member-${Date.now()}-${idx}`,
        name: m,
        role: idx === 0 ? 'Admin' : 'Member',
        email: `${m.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
        spentAmount: idx === 0 ? 194.20 : (idx === 1 ? 169.90 : 121.40),
        joinedDate: 'Just now',
        isCurrentUser: idx === 0,
        owes: 0.00,
        avatar: idx === 0 ? '🦖' : ['👨‍💻', '👩‍🎨', '🧑‍🍳', '🏄‍♂️', '📸', '🎧', '🍜'][idx % 7]
      }))
    };

    if (onGroupCreated) {
      onGroupCreated(newGroup);
    }
    setName('');
    setNote('');
    onClose();
  };

  const selectedIconMeta = GROUP_ICONS.find((i) => i.id === selectedIconId) || GROUP_ICONS[0];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card create-group-modal-card animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <div className="modal-icon-badge" style={{ backgroundColor: selectedTheme.bg }}>
              <GroupIcon iconId={selectedIconId} size={28} />
            </div>
            <div>
              <h3>Create Active Group</h3>
              <span className="modal-sub">
                Choose an icon, add barkada members, and split expenses effortlessly.
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-group-form">
          <div className="create-group-body-grid">
            {/* Left Column: Form Details & Live Preview */}
            <div className="group-form-left-col">
              {/* Group Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="group-name-input">
                  Group Name <span className="required-star">*</span>
                </label>
                <input
                  id="group-name-input"
                  type="text"
                  placeholder="e.g. Siargao Getaway 2024"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
                {/* Suggestions chips */}
                <div className="group-suggestion-chips">
                  {SUGGESTIONS.slice(0, 4).map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      className="suggestion-chip"
                      onClick={() => setName(sugg)}
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Notes / Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="group-note-input">
                  Notes
                </label>
                <textarea
                  id="group-note-input"
                  rows={2}
                  placeholder="e.g. Birthday dinner for Mike! Such a great time, everyone's share includes the automatic 20% gratuity."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="form-input group-note-textarea"
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label" htmlFor="create-group-category-select">Category</label>
                <div className="custom-select-wrapper">
                  <select
                    id="create-group-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select custom-select-input"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="custom-select-arrow" aria-hidden="true">
                    <ChevronDown size={18} strokeWidth={2.2} />
                  </div>
                </div>
              </div>

              {/* Theme Color Selector */}
              <div className="form-group">
                <label className="form-label">Badge Accent Color</label>
                <div className="theme-color-palette">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.name}
                      type="button"
                      className={`color-swatch-btn ${selectedTheme.name === theme.name ? 'active' : ''}`}
                      style={{ backgroundColor: theme.bg, borderColor: theme.color }}
                      onClick={() => setSelectedTheme(theme)}
                      title={theme.name}
                    >
                      {selectedTheme.name === theme.name && (
                        <Check size={14} color={theme.color} strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Members input */}
              <div className="form-group">
                <label className="form-label">Members ({members.length})</label>
                <div className="members-chips-container">
                  {members.map((mem, idx) => (
                    <span key={idx} className="member-tag-chip">
                      {mem}
                      {idx > 0 && (
                        <button
                          type="button"
                          className="remove-chip-btn"
                          onClick={() => handleRemoveMember(idx)}
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="add-member-input-row">
                  <input
                    type="text"
                    placeholder="Add friend's name..."
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMember();
                      }
                    }}
                    className="form-input member-quick-input"
                  />
                  <button
                    type="button"
                    className="btn-add-member"
                    onClick={handleAddMember}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="group-live-preview-box">
                <span className="preview-label">Live Card Preview:</span>
                <div className="group-card preview-card">
                  <div className="group-card-top">
                    <div
                      className="group-icon-box"
                      style={{ backgroundColor: selectedTheme.bg }}
                    >
                      <GroupIcon iconId={selectedIconId} size={42} />
                    </div>
                    <div className="group-info">
                      <h4 className="group-name">{name || 'Your New Group'}</h4>
                      <span className="group-members">
                        {members.length} members • {category}
                      </span>
                    </div>
                  </div>
                  <div className="group-card-footer">
                    <span className="balance-label">Your Balance</span>
                    <span className="balance-value positive">₱0.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive 3-Set Icon Picker */}
            <div className="group-form-right-col">
              <div className="icon-picker-header">
                <div>
                  <label className="form-label">
                    Select Group Icon <span className="selected-icon-name">({selectedIconMeta.name})</span>
                  </label>
                  <p className="icon-picker-sub">
                    54 circular icons extracted from 3 uploaded icon sets
                  </p>
                </div>
              </div>

              {/* Set Tabs */}
              <div className="icon-sets-tab-bar">
                <button
                  type="button"
                  className={`icon-tab-btn ${activeSetTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveSetTab('all')}
                >
                  All ({GROUP_ICONS.length})
                </button>
                {ICON_SETS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`icon-tab-btn ${activeSetTab === s.id ? 'active' : ''}`}
                    onClick={() => setActiveSetTab(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="icon-search-bar">
                <Search size={15} color="#8E94A0" className="icon-search-svg" />
                <input
                  type="text"
                  placeholder="Search icons (e.g. coffee, luggage, house, bike, pet)..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="icon-search-input"
                />
                {iconSearch && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setIconSearch('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Grid of Circular Icons */}
              <div className="icon-picker-grid-wrapper">
                <div className="icon-picker-grid">
                  {filteredIcons.map((icon) => {
                    const isSelected = selectedIconId === icon.id;
                    return (
                      <button
                        key={icon.id}
                        type="button"
                        className={`icon-choice-tile ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedIconId(icon.id)}
                        title={`${icon.name} (${icon.setLabel})`}
                      >
                        <div className="icon-choice-circle-wrap">
                          <img
                            src={icon.src}
                            alt={icon.name}
                            className="icon-choice-img"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="icon-choice-check">
                              <Check size={12} color="#FFFFFF" strokeWidth={3.5} />
                            </div>
                          )}
                        </div>
                        <span className="icon-choice-name">{icon.name}</span>
                      </button>
                    );
                  })}
                </div>

                {filteredIcons.length === 0 && (
                  <div className="no-icons-found">
                    <p>No icons matching "{iconSearch}"</p>
                    <button
                      type="button"
                      className="btn-reset-filter"
                      onClick={() => {
                        setIconSearch('');
                        setActiveSetTab('all');
                      }}
                    >
                      View All Icons
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions modal-footer-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-action"
              disabled={!name.trim()}
            >
              <Plus size={18} /> Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
