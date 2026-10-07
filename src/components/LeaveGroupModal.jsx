import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export const LeaveGroupModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  groupName = 'this group' 
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="modal-backdrop animate-backdrop-fade" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-group-title"
    >
      <div 
        className="modal-card leave-group-modal-card animate-scale-up" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="leave-group-title" className="leave-group-modal-title">
          Leave &lsquo;{groupName}&rsquo;?
        </h2>

        <p className="leave-group-modal-desc">
          You need to be settled up first. Once you leave, this group disappears from your groups, your dashboard
          totals and your personal spending, and its notifications are cleared from your inbox. If you&rsquo;re the last
          member with an account, the group and all its expenses are deleted.
        </p>

        <div className="leave-group-modal-actions">
          <button 
            type="button" 
            className="btn btn-outline btn-lg" 
            onClick={onClose}
            id="btn-cancel-leave-group"
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger btn-lg" 
            onClick={onConfirm}
            id="btn-confirm-leave-group"
          >
            Leave group
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LeaveGroupModal;
