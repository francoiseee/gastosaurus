import { useState } from 'react';
import { Check, Handshake, ChevronDown } from './CustomIcons';

export const SettleUpModal = ({ isOpen, onClose, onConfirmSettle }) => {
  const [selectedPerson, setSelectedPerson] = useState('Miguel Tan (Apartment 4B - ₱45.00)');
  const [amount, setAmount] = useState('45.00');
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSettleSubmit = (e) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      if (onConfirmSettle) onConfirmSettle();
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <div className="modal-icon-badge">
              <Handshake size={20} color="#E2486E" />
            </div>
            <h3>Settle Up</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {isSuccess ? (
          <div className="modal-success-state">
            <div className="success-check-circle">
              <Check size={32} color="#059669" />
            </div>
            <h4>Payment Successful!</h4>
            <p>You have settled ₱{amount} with Miguel Tan.</p>
          </div>
        ) : (
          <form onSubmit={handleSettleSubmit} className="modal-form">
            <div className="form-group">
              <label>Select Person & Balance</label>
              <div className="custom-select-wrapper">
                <select 
                  value={selectedPerson} 
                  onChange={(e) => {
                    setSelectedPerson(e.target.value);
                    if (e.target.value.includes('45.00')) setAmount('45.00');
                    else if (e.target.value.includes('80.50')) setAmount('80.50');
                  }}
                  className="form-select custom-select-input"
                >
                  <option value="Miguel Tan (Apartment 4B - ₱45.00)">Miguel Tan — Apartment 4B (₱45.00)</option>
                  <option value="Pamela Cruz (Work Cafe BGC - ₱80.50)">Pamela Cruz — Work Cafe BGC (₱80.50)</option>
                </select>
                <div className="custom-select-arrow" aria-hidden="true">
                  <ChevronDown size={18} strokeWidth={2.2} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Amount to Settle (₱)</label>
              <div className="input-with-symbol">
                <span className="peso-symbol">₱</span>
                <input 
                  type="number" 
                  step="0.01" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="form-input" 
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <div className="payment-method-selector">
                <button
                  type="button"
                  className={`payment-method-btn ${paymentMethod === 'gcash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('gcash')}
                >
                  <span className="pay-method-badge gcash">GCash</span>
                  <span>Instant 0% Fee</span>
                </button>
                <button
                  type="button"
                  className={`payment-method-btn ${paymentMethod === 'maya' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('maya')}
                >
                  <span className="pay-method-badge maya">Maya</span>
                  <span>QR Ph Ready</span>
                </button>
                <button
                  type="button"
                  className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <span className="pay-method-badge cash">Cash</span>
                  <span>Record in Person</span>
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary-action">
                Confirm Settlement
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SettleUpModal;
