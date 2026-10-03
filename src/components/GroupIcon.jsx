import { getGroupIconSrc, GROUP_ICONS } from '../data/groupIcons';

/**
 * GroupIcon Component
 * Renders a circular-cut icon selected from the 3 uploaded icon sets.
 */
export const GroupIcon = ({
  iconId,
  iconType,
  src,
  size = 48,
  alt = 'Group icon',
  className = '',
  bgColor,
  borderColor
}) => {
  // Determine source image
  let imageSrc = src;
  if (!imageSrc) {
    if (iconId) {
      imageSrc = getGroupIconSrc(iconId);
    } else if (iconType) {
      imageSrc = getGroupIconSrc(iconType);
    } else {
      imageSrc = GROUP_ICONS[0].src;
    }
  }

  return (
    <div
      className={`group-circle-icon-container ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: bgColor || 'transparent',
        borderColor: borderColor || 'transparent'
      }}
    >
      <img
        src={imageSrc}
        alt={alt}
        className="group-circle-icon-img"
        loading="lazy"
      />
    </div>
  );
};

export default GroupIcon;
