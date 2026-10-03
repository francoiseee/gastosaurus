
/**
 * A round avatar showing the member's emoji, or their initials if they have
 * none (guests). Pass the screen's own avatar class so it keeps its size.
 *
 *   <Avatar person={{ name: 'Bea', avatarEmoji: '🦕' }} className="avatar-face-img" />
 */
export const Avatar = ({ person, className = '', size, background = '#FFE8EE' }) => {
  const emoji = person?.isGuest ? null : person?.avatarEmoji;
  const name = person?.name || '?';
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={className}
      title={name}
      aria-label={name}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background,
        color: '#4A3550',
        fontWeight: 700,
        fontSize: size ? Math.round(size * 0.45) : undefined,
        width: size,
        height: size,
        borderRadius: '50%',
        userSelect: 'none',
      }}
    >
      {emoji || letters}
    </div>
  );
};

export default Avatar;
