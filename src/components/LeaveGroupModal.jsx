import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export const LeaveGroupModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  groupName = 'Paris Trip 2024' 
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
      className="modal-backdrop leave-group-backdrop animate-backdrop-fade" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-group-title"
    >
      <div 
        className="leave-group-modal-card animate-scale-up" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="leave-group-title" className="leave-group-modal-title">
          Leave '{groupName}'?
        </h2>

        <p className="leave-group-modal-desc">
          Are you sure you want to leave this group? You will no longer be able to track shared expenses or view the group's settlement history. Any outstanding balances should be settled before departing.
        </p>

        <div className="leave-group-modal-actions">
          <button 
            type="button" 
            className="btn-leave-cancel" 
            onClick={onClose}
            id="btn-cancel-leave-group"
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn-leave-confirm" 
            onClick={onConfirm}
            id="btn-confirm-leave-group"
          >
            Confirm & Leave
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LeaveGroupModal;
