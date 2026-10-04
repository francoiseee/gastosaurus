import { getDinoAvatar } from '../data/dinos';

/**
 * A round avatar showing the member's Dino avatar picture, their emoji,
 * or their initials if they have none (guests).
 *
 *   <Avatar person={{ name: 'Bea', avatarEmoji: 'dino-1' }} className="avatar-face-img" />
 */
export const Avatar = ({ person, className = '', size, background }) => {
  const isGuest = Boolean(person?.isGuest);
  const avatarKey = isGuest ? null : person?.avatarEmoji || person?.avatar;
  const dino = getDinoAvatar(avatarKey);
  const emoji = (!isGuest && !dino) ? avatarKey : null;
  const name = person?.name || '?';
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const effectiveBg = background || (dino ? dino.bg : '#FFE8EE');

  return (
    <div
      className={`dino-avatar-bubble ${className}`}
      title={name}
      aria-label={name}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: effectiveBg,
        color: dino ? dino.textDark : '#4A3550',
        fontWeight: 700,
        fontSize: size ? Math.round(size * 0.42) : undefined,
        width: size,
        height: size,
        borderRadius: '50%',
        userSelect: 'none',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {dino ? (
        <img
          src={dino.image}
          alt={dino.name}
          className="dino-avatar-img"
          style={{
            width: '84%',
            height: '84%',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <span>{emoji || letters}</span>
      )}
    </div>
  );
};

export default Avatar;
