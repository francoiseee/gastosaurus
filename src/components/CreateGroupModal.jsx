import { useState, useMemo } from 'react';
import GroupIcon from './GroupIcon';
import { GROUP_ICONS, PICKER_ICONS, ICON_SETS, DINO_ICON_ID, DEFAULT_ICON_ID } from '../data/groupIcons';
import { Plus, Check, Search, ChevronDown, X } from './CustomIcons';
import { groupsApi } from '../lib/api';

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
  'Events & Parties',
  'Other'
];

// Picking "Other" reveals a text box for the user's own category name.
const OTHER_CATEGORY = 'Other';
const CUSTOM_CATEGORY_MAX = 40; // matches the server's category limit

const SUGGESTIONS = [
  'Condo Roommates',
  'Baguio Roadtrip 2024',
  'Friday Dinner Club',
  'Weekly Grocery Run',
  'Badminton / Gym',
  'Netflix / Spotify Sub'
];

export const CreateGroupModal = ({ isOpen, onClose, onGroupCreated, currentUserName }) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Travel & Trips');
  const [customCategory, setCustomCategory] = useState('');
  const [selectedIconId, setSelectedIconId] = useState(DEFAULT_ICON_ID); // default: flight
  const [iconTouched, setIconTouched] = useState(false); // true once the user picks an icon themselves
  const [selectedTheme, setSelectedTheme] = useState(COLOR_THEMES[0]);
  const [activeSetTab, setActiveSetTab] = useState('all');
  const [iconSearch, setIconSearch] = useState('');
  // Friends added here become guest members (no account needed yet).
  // You are always in the group as its admin, so you're not in this list.
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter icons based on Set tab and Search query
  const filteredIcons = useMemo(() => {
    return PICKER_ICONS.filter((icon) => {
      const matchesSet = activeSetTab === 'all' || icon.set === activeSetTab;
      const matchesSearch =
        !iconSearch.trim() ||
        icon.name.toLowerCase().includes(iconSearch.toLowerCase()) ||
        icon.setLabel.toLowerCase().includes(iconSearch.toLowerCase());
      return matchesSet && matchesSearch;
    });
  }, [activeSetTab, iconSearch]);

  if (!isOpen) return null;

  const isOtherCategory = category === OTHER_CATEGORY;
  // What actually gets saved: the typed name for "Other", or "Other" if left blank.
  const finalCategory = isOtherCategory ? customCategory.trim() || OTHER_CATEGORY : category;

  const handleCategoryChange = (value) => {
    setCategory(value);
    // "Other" defaults to the GastoSaurus dino — unless the user already chose an icon.
    if (iconTouched) return;
    setSelectedIconId(value === OTHER_CATEGORY ? DINO_ICON_ID : DEFAULT_ICON_ID);
  };

  const handlePickIcon = (iconId) => {
    setSelectedIconId(iconId);
    setIconTouched(true);
  };

  const handleAddMember = (e) => {
    e?.preventDefault();
    const friend = newMemberName.trim();
    if (!friend) return;
    if (!members.some((m) => m.toLowerCase() === friend.toLowerCase())) {
      setMembers([...members, friend]);
    }
    setNewMemberName('');
  };

  const handleRemoveMember = (idxToRemove) => {
    setMembers(members.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      const created = await groupsApi.create({
        name: name.trim(),
        note: note.trim() || null,
        category: finalCategory,
        iconId: selectedIconId,
        iconBg: selectedTheme.bg,
        iconColor: selectedTheme.color,
        members: members.map((friend) => ({ name: friend })),
      });
      setName('');
      setNote('');
      setCustomCategory('');
      setMembers([]);
      onGroupCreated(created);
    } catch (err) {
      const fieldMessages = Object.values(err.fields || {});
      setErrorMsg(fieldMessages[0] || err.message);
    } finally {
      setIsSaving(false);
    }
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
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
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
                <div className={`category-field-row ${isOtherCategory ? 'has-custom' : ''}`}>
                  <div className="custom-select-wrapper">
                    <select
                      id="create-group-category-select"
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
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

                  {isOtherCategory && (
                    <input
                      id="create-group-custom-category"
                      type="text"
                      className="form-input custom-category-input animate-fade-in"
                      placeholder="e.g. Wedding Fund"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      maxLength={CUSTOM_CATEGORY_MAX}
                      aria-label="Custom category name"
                      autoFocus
                    />
                  )}
                </div>
                {isOtherCategory && (
                  <span className="custom-category-hint">
                    Name your own category. Leave it blank and we&apos;ll just call it &quot;Other&quot;.
                  </span>
                )}
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
                <label className="form-label">Members ({members.length + 1})</label>
                <div className="members-chips-container">
                  <span className="member-tag-chip">{currentUserName ? `${currentUserName} (You, Admin)` : 'You (Admin)'}</span>
                  {members.map((mem, idx) => (
                    <span key={mem} className="member-tag-chip">
                      {mem}
                      <button type="button" className="remove-chip-btn" onClick={() => handleRemoveMember(idx)} aria-label={`Remove ${mem}`}>
                        <X size={12} strokeWidth={2.6} />
                      </button>
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
                    className="btn btn-soft"
                    onClick={handleAddMember}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="group-live-preview-box">
                <span className="eyebrow preview-label">Live card preview</span>
                <div className="group-card preview-card">
                  <div className="group-card-top">
                    <div
                      className="group-icon-circle"
                      style={{ backgroundColor: selectedTheme.bg }}
                    >
                      <GroupIcon iconId={selectedIconId} size={42} />
                    </div>
                    <div className="group-info">
                      <h4 className="group-name">{name || 'Your New Group'}</h4>
                      <span className="group-members">
                        {members.length + 1} members • {finalCategory}
                      </span>
                    </div>
                  </div>
                  <div className="group-card-footer">
                    <span className="balance-label">Your balance</span>
                    <span className="balance-value">₱0.00</span>
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
                    Pick one that fits your group.
                  </p>
                </div>
              </div>

              {/* Set Tabs */}
              <div className="chip-group icon-sets-tab-bar">
                <button
                  type="button"
                  className={`chip ${activeSetTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveSetTab('all')}
                >
                  All ({PICKER_ICONS.length})
                </button>
                {ICON_SETS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip ${activeSetTab === s.id ? 'active' : ''}`}
                    onClick={() => setActiveSetTab(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="icon-search-bar">
                <Search size={15} className="icon-search-svg" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search icons (coffee, luggage, house…)"
                  aria-label="Search icons"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="icon-search-input"
                />
                {iconSearch && (
                  <button
                    type="button"
                    className="icon-btn icon-btn-sm icon-btn-ghost clear-search-btn"
                    onClick={() => setIconSearch('')}
                    aria-label="Clear icon search"
                  >
                    <X size={14} />
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
                        onClick={() => handlePickIcon(icon.id)}
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
                      className="btn btn-text"
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

          {errorMsg && (
            <div className="form-error-banner animate-fade-in" role="alert">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-actions modal-footer-actions">
            <button type="button" className="btn btn-muted" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || isSaving}
            >
              <Plus size={18} /> {isSaving ? 'Creating…' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
