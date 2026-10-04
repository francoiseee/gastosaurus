import { useState } from 'react';
import { Check, Landmark, QrCode, Banknote, CreditCard, CheckCircle2 } from 'lucide-react';
import PageHeader from './PageHeader';
import Avatar from './Avatar';
import { settlementsApi } from '../lib/api';
import { formatDate, todayISO, peso } from '../lib/format';

/**
 * Pay one or more suggested settlements (rows from SettlementsView with
 * kind 'owe': { id, person, group, amount }). Each selected row is recorded
 * as a payment. Payments to someone with an account wait for them to
 * confirm; payments to guests count right away.
 */
export const PaymentView = ({ items = [], onBack, onDone, showToast, onOpenNotifications, unreadCount = 0 }) => {
  const [selectedIds, setSelectedIds] = useState(items.map((i) => i.id));
  const [paymentMethod, setPaymentMethod] = useState('gcash'); // 'bank' | 'gcash' | 'cash'
  const [toastMessage, setToastMessage] = useState(items.length ? null : 'Nothing to pay right now. 🎉');
  const [isProcessing, setIsProcessing] = useState(false);

  // Toggle selection of an owed item
  const toggleItemSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Select all / Deselect all helper
  const handleToggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  // Compute total of selected items
  const totalSelectedAmount = items
    .filter(i => selectedIds.includes(i.id))
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const [whole, cents] = totalSelectedAmount.toFixed(2).split('.');
  const formattedWholeAmount = Number(whole).toLocaleString('en-US');
  const formattedDecimalAmount = `.${cents}`;

  const handleConfirmAction = async () => {
    if (selectedIds.length === 0) {
      setToastMessage('Please select at least one item to settle.');
      return;
    }

    setIsProcessing(true);
    const selected = items.filter((i) => selectedIds.includes(i.id));
    try {
      const recorded = [];
      for (const item of selected) {
        recorded.push(
          await settlementsApi.record(item.group.id, {
            toMemberId: item.person.memberId,
            amount: item.amount,
            method: paymentMethod,
          }),
        );
      }
      const waiting = recorded.filter((s) => s.status === 'pending').length;
      showToast(
        waiting
          ? `Payment recorded 🎉 ${waiting === 1 ? 'The receiver' : `${waiting} receivers`} will confirm it.`
          : 'Payment recorded and settled 🎉',
      );
      onDone();
    } catch (err) {
      setToastMessage(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-page-container animate-fade-in">
      <PageHeader
        title="Payment"
        onBack={onBack}
        backLabel="Back to settlements"
        backId="btn-back-to-settlements"
        unreadCount={unreadCount}
        onOpenNotifications={onOpenNotifications}
      />

      {/* Main Payment Content Grid */}
      <div className="payment-content-wrapper">
        {/* Left Column: Settle Balances & Owed Items */}
        <div className="payment-main-col">
          {/* Page Heading */}
          <div className="page-intro">
            <div className="page-intro-text">
              <h1 className="page-title">Settle Balances</h1>
              <p className="page-subtitle">
                Review your outstanding amounts and complete the settlement process to clear your balances.
              </p>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="banner banner-success payment-toast-banner animate-fade-in">
              <CheckCircle2 size={18} />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Owed Items Section Header */}
          <div className="owed-items-section-header">
            <span className="eyebrow">Owed items</span>
            <button 
              type="button" 
              className="owed-items-count-btn"
              onClick={handleToggleSelectAll}
              title="Click to toggle all items"
            >
              {selectedIds.length} of {items.length} Selected
            </button>
          </div>

          {/* Owed Items List */}
          <div className="owed-items-list">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div 
                  key={item.id} 
                  className={`owed-item-card ${isSelected ? 'selected' : 'unselected'}`}
                  onClick={() => toggleItemSelection(item.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  id={`owed-item-${item.id}`}
                >
                  <div className="owed-item-left">
                    {/* Avatar with Circular Black Checkmark Overlay Badge */}
                    <div className="owed-avatar-wrapper">
                      <Avatar person={item.person} className="owed-avatar-img" />
                      <div className={`owed-check-badge ${isSelected ? 'checked' : 'unchecked'}`}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="owed-item-info">
                      <h3 className="owed-person-name">{item.person.name}</h3>
                      <p className="owed-item-desc">{item.group.name}</p>
                      <div className="owed-tags-row">
                        <span className="owed-category-badge travel">SETTLE UP</span>
                        <span className="owed-item-date">{formatDate(todayISO())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount on Right */}
                  <div className="owed-item-right">
                    <span className="owed-amount-value">{peso(item.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column / Mobile Bottom Card: Total Settlement Card */}
        <aside className="payment-summary-col">
          <div className="total-settlement-card">
            <h2 className="total-settlement-title desktop-only">Total Settlement</h2>

            {/* Amount Summary */}
            <div className="about-to-pay-box">
              <span className="about-to-pay-label">You are about to pay</span>
              <div className="about-to-pay-amount">
                <span className="amount-symbol">₱</span>
                <span className="amount-number">{formattedWholeAmount}</span>
                <span className="amount-cents">{formattedDecimalAmount}</span>
              </div>
            </div>

            {/* Divider Line */}
            <div className="settlement-card-divider" />

            {/* Payment Method Used */}
            <div className="payment-methods-section">
              <span className="eyebrow payment-methods-label">Payment method</span>

              <div className="payment-methods-grid">
                {/* 1. Bank Transfer */}
                <button
                  type="button"
                  className={`payment-method-btn ${paymentMethod === 'bank' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('bank')}
                  id="btn-method-bank"
                >
                  <Landmark size={22} className="method-icon" />
                  <span className="method-name">Bank</span>
                </button>

                {/* 2. GCash */}
                <button
                  type="button"
                  className={`payment-method-btn ${paymentMethod === 'gcash' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('gcash')}
                  id="btn-method-gcash"
                >
                  <QrCode size={22} className="method-icon" />
                  <span className="method-name">GCash</span>
                </button>

                {/* 3. Cash */}
                <button
                  type="button"
                  className={`payment-method-btn ${paymentMethod === 'cash' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                  id="btn-method-cash"
                >
                  <CreditCard size={22} className="method-icon" />
                  <span className="method-name">Cash</span>
                </button>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={handleConfirmAction}
              disabled={isProcessing || selectedIds.length === 0}
              id="btn-confirm-and-settle"
            >
              <Banknote size={20} />
              <span>{isProcessing ? 'Processing Settlement...' : 'Confirm & Settle'}</span>
            </button>

            {/* Footnote */}
            <p className="settlement-footnote">
              By confirming, you agree to record these balances as settled. Ensure physical transfers are completed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PaymentView;
