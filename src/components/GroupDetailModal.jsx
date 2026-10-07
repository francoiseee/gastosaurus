import { useState } from 'react';
import GroupIcon from './GroupIcon';
import Avatar from './Avatar';
import { GROUP_ICONS, ICON_SETS } from '../data/groupIcons';
import { Plus, Trash2, X } from './CustomIcons';
import { groupsApi } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { peso, signedPeso } from '../lib/format';

/** Group settings + everyone's balance. Admins can rename, change icon/note, or delete. */
export const GroupDetailModal = ({ groupId, refreshKey, isOpen, onClose, onChanged, onDeleted, showToast, onAddExpenseToGroup }) => {
  const [isChangingIcon, setIsChangingIcon] = useState(false);
  const [activeSet, setActiveSet] = useState('all');
  const [editing, setEditing] = useState(null); // { name, note } while editing
  const [busy, setBusy] = useState(false);

  const { data } = useAsync(() => Promise.all([groupsApi.get(groupId), groupsApi.balances(groupId)]), [groupId, refreshKey], {
    enabled: isOpen && !!groupId,
  });

  if (!isOpen || !data) return null;

  const [{ group }, balances] = data;
  const isAdmin = group.myRole === 'admin';
  const filteredIcons = GROUP_ICONS.filter((i) => activeSet === 'all' || i.set === activeSet);

  const save = async (fields, message) => {
    setBusy(true);
    try {
      await groupsApi.update(group.id, fields);
      showToast(message);
      onChanged();
      return true;
    } catch (err) {
      showToast(Object.values(err.fields || {})[0] || err.message, 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSelectIcon = async (iconId) => {
    if (await save({ iconId }, 'Group icon updated.')) setIsChangingIcon(false);
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (await save({ name: editing.name.trim(), note: editing.note.trim() || null }, 'Group details saved.')) setEditing(null);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${group.name}" and all its expenses? This can't be undone.`)) return;
    setBusy(true);
    try {
      await groupsApi.remove(group.id);
      showToast(`Deleted "${group.name}".`);
      onDeleted();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRemind = async () => {
    try {
      const { sent } = await groupsApi.sendReminders(group.id);
      showToast(sent.length ? `Reminded ${sent.map((s) => s.name).join(', ')} 📬` : 'Nobody to remind right now.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card group-detail-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <div
              className="modal-icon-badge group-detail-icon-wrap"
              style={{ backgroundColor: group.iconBg }}
              title={isAdmin ? 'Click to change icon' : group.name}
              onClick={() => isAdmin && setIsChangingIcon(!isChangingIcon)}
            >
              <GroupIcon iconId={group.iconId} size={36} alt={group.name} />
            </div>
            <div className="modal-title-text">
              <h3>{group.name}</h3>
              <span className="modal-sub">
                {group.membersCount} members • {group.category}
              </span>
              {isAdmin && (
                <div className="group-title-row">
                  <button type="button" className="change-icon-tag-btn" onClick={() => setIsChangingIcon(!isChangingIcon)}>
                    {isChangingIcon ? 'Close icons' : 'Change icon'}
                  </button>
                  {!editing && (
                    <button
                      type="button"
                      className="change-icon-tag-btn"
                      onClick={() => setEditing({ name: group.name, note: group.note ?? '' })}
                    >
                      Edit details
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {editing && (
          <form className="modal-form" onSubmit={handleSaveDetails}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-group-name">Group Name</label>
              <input
                id="edit-group-name"
                className="form-input"
                value={editing.name}
                maxLength={60}
                required
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-group-note">Note</label>
              <textarea
                id="edit-group-note"
                className="form-input group-note-textarea"
                rows={2}
                maxLength={280}
                value={editing.note}
                onChange={(e) => setEditing({ ...editing, note: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-muted" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                Save
              </button>
            </div>
          </form>
        )}

        {isChangingIcon && (
          <div className="quick-change-icon-drawer animate-fade-in">
            <div className="drawer-header">
              <span className="drawer-title">Choose an icon</span>
              <div className="chip-group drawer-tabs">
                <button className={`chip chip-sm ${activeSet === 'all' ? 'active' : ''}`} onClick={() => setActiveSet('all')}>
                  All ({GROUP_ICONS.length})
                </button>
                {ICON_SETS.map((s) => (
                  <button
                    key={s.id}
                    className={`chip chip-sm ${activeSet === s.id ? 'active' : ''}`}
                    onClick={() => setActiveSet(s.id)}
                  >
                    {s.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="drawer-icons-grid">
              {filteredIcons.map((icon) => (
                <button
                  key={icon.id}
                  className={`drawer-icon-btn ${group.iconId === icon.id ? 'active' : ''}`}
                  onClick={() => handleSelectIcon(icon.id)}
                  disabled={busy}
                  title={icon.name}
                >
                  <img src={icon.src} alt={icon.name} className="drawer-icon-img" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="group-detail-balance-banner">
          <div>
            <span className="eyebrow">Your status in this group</span>
            <h3 className={`balance-value ${group.statusType === 'owe' ? 'negative' : 'positive'}`}>
              {group.statusType === 'owe'
                ? `You owe ${peso(group.balance)}`
                : group.statusType === 'owed'
                  ? `You get back ${peso(group.balance)}`
                  : 'All settled up! (₱0.00)'}
            </h3>
          </div>
          {group.recentExpense && (
            <p className="group-detail-recent">
              <span className="recent-label">Latest:</span> <span className="recent-val">{group.recentExpense}</span>
            </p>
          )}
        </div>

        <div className="group-members-section">
          <div className="section-mini-header">
            <h4 className="section-mini-title">Members Breakdown ({balances.members.length})</h4>
          </div>
          <div className="members-list">
            {balances.members.map((m) => (
              <div key={m.id} className="member-row">
                <div className="member-info">
                  <Avatar person={m} className="member-avatar" size={28} />
                  <span className="member-name">
                    {m.name}
                    {m.isCurrentUser ? ' (You)' : ''}
                  </span>
                </div>
                <span className={`member-balance ${m.net < 0 ? 'negative' : m.net > 0 ? 'positive' : 'neutral'}`}>
                  {m.net === 0 ? '₱0.00 (Settled)' : signedPeso(m.net)}
                </span>
              </div>
            ))}
          </div>
          {balances.suggestedSettlements.length > 0 && (
            <div className="settle-suggestions">
              <span className="eyebrow">Suggested payments</span>
              <ul>
                {balances.suggestedSettlements.map((p) => (
                  <li key={`${p.from.memberId ?? p.from.name}-${p.to.memberId ?? p.to.name}`}>
                    <span>
                      {p.from.name} <span aria-hidden="true">→</span> {p.to.name}
                    </span>
                    <strong>{peso(p.amount)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="modal-actions group-detail-actions">
          {isAdmin && (
            <button
              className="btn btn-danger-outline group-detail-delete"
              onClick={handleDelete}
              disabled={busy || !balances.isSettled}
              title={balances.isSettled ? 'Delete group' : 'Settle all balances first'}
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
          {!balances.isSettled && (
            <button className="btn btn-muted" onClick={handleRemind}>
              Remind
            </button>
          )}
          <button className="btn btn-muted" onClick={onAddExpenseToGroup}>
            <Plus size={16} /> Add Ambagan
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailModal;
