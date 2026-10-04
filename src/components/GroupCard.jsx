import GroupIcon from './GroupIcon';
import { Users, Check } from './CustomIcons';
import { balanceText } from '../lib/format';

/**
 * One group tile — used on the Dashboard and on the Groups page so both
 * screens show groups the same way.
 */
export const GroupCard = ({ group, onOpen }) => {
  const status = group.statusType; // 'owe' | 'owed' | 'settled'
  const open = () => onOpen?.(group);

  return (
    <div
      className="group-card"
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${group.name}`}
    >
      <div className="group-card-top">
        <div className="group-icon-circle" style={{ backgroundColor: group.iconBg || 'var(--pink-badge-bg)' }}>
          <GroupIcon iconId={group.iconId} size={42} alt="" />
        </div>
        <div className="group-info">
          <h3 className="group-name">{group.name}</h3>
          <span className="group-members">
            <Users size={14} aria-hidden="true" />
            {group.membersCount} {group.membersCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>

      <div className="group-card-footer">
        {status === 'settled' ? (
          <span className="group-settled">
            <span className="group-settled-icon">
              <Check size={13} strokeWidth={3} />
            </span>
            All settled
          </span>
        ) : (
          <>
            <span className="balance-label">Your balance</span>
            <span className={`balance-value ${status === 'owe' ? 'negative' : 'positive'}`}>
              {balanceText(group.balance, status)}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
