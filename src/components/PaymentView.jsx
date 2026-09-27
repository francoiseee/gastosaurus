import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Bell, 
  Check, 
  Landmark, 
  QrCode, 
  Banknote, 
  CreditCard,
  CheckCircle2,
  Receipt
} from 'lucide-react';

export const PaymentView = ({ 
  onBack, 
  onConfirmSettle,
  initialOwedItems = null,
  notifications = [],
  unreadCount = 1
}) => {
  // Default items matching Screenshot 1 & 2 exactly
  const defaultItems = [
    {
      id: 'owed-1',
      person: 'Sarah M.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      description: 'Team Lunch at Manam',
      category: 'FOOD',
      categoryType: 'food',
      date: 'Oct 12, 2023',
      amount: 850.00
    },
    {
      id: 'owed-2',
      person: 'David K.',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
      description: 'Weekend Villa Rental',
      category: 'TRAVEL',
      categoryType: 'travel',
      date: 'Oct 08, 2023',
      amount: 3200.00
    }
  ];

  const [items, setItems] = useState(initialOwedItems || defaultItems);
  const [selectedIds, setSelectedIds] = useState(items.map(i => i.id));
  const [paymentMethod, setPaymentMethod] = useState('bank'); // 'bank' | 'gcash' | 'cash'
  const [toastMessage, setToastMessage] = useState(null);
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

  const formattedWholeAmount = Math.floor(totalSelectedAmount).toLocaleString('en-US');
  const formattedDecimalAmount = (totalSelectedAmount % 1).toFixed(2).substring(1); // e.g. ".00"

  // Confirm settlement handler
  const handleConfirmAction = () => {
    if (selectedIds.length === 0) {
      setToastMessage('Please select at least one item to settle.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsProcessing(true);

    const methodNames = {
      bank: 'Bank Transfer',
      gcash: 'GCash',
      cash: 'Cash'
    };

    const selectedMethodName = methodNames[paymentMethod] || 'Bank Transfer';

    setTimeout(() => {
      setIsProcessing(false);
      if (onConfirmSettle) {
        onConfirmSettle({
          selectedIds,
          totalAmount: totalSelectedAmount,
          paymentMethod: selectedMethodName
        });
      }
    }, 400);
  };

  return (
    <div className="payment-page-container animate-fade-in">
      {/* Top Header Bar (Matching Screenshots 1 & 2) */}
      <header className="payment-header-bar">
        <button 
          className="btn-header-back" 
          onClick={onBack}
          aria-label="Back to settlements"
          title="Back to Settlements"
          id="btn-back-to-settlements"
        >
          <ArrowLeft size={20} color="#1E2026" strokeWidth={2.2} />
        </button>

        <h2 className="payment-header-title">Payment</h2>

        <div className="payment-header-actions">
          <button className="header-notif-btn" aria-label="Notifications">
            <Bell size={20} color="#1E2026" />
            {unreadCount > 0 && <span className="header-notif-dot" />}
          </button>
        </div>
      </header>

      {/* Main Payment Content Grid */}
      <div className="payment-content-wrapper">
        {/* Left Column: Settle Balances & Owed Items */}
        <div className="payment-main-col">
          {/* Page Heading */}
          <div className="payment-page-header">
            <h1 className="payment-main-title">Settle Balances</h1>
            <p className="payment-main-subtitle">
              Review your outstanding amounts and complete the settlement process to clear your balances.
            </p>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="payment-toast-banner animate-fade-in">
              <CheckCircle2 size={18} color="#059669" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Owed Items Section Header */}
          <div className="owed-items-section-header">
            <span className="owed-items-label">OWED ITEMS</span>
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
                      <img 
                        src={item.avatarUrl} 
                        alt={item.person} 
                        className="owed-avatar-img" 
                      />
                      <div className={`owed-check-badge ${isSelected ? 'checked' : 'unchecked'}`}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="owed-item-info">
                      <h3 className="owed-person-name">{item.person}</h3>
                      <p className="owed-item-desc">{item.description}</p>
                      <div className="owed-tags-row">
                        <span className={`owed-category-badge ${item.categoryType || 'food'}`}>
                          {item.category}
                        </span>
                        <span className="owed-item-date">{item.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount on Right */}
                  <div className="owed-item-right">
                    <span className="owed-amount-value">
                      ₱ {Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
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
              <span className="payment-methods-label">PAYMENT METHOD USED</span>

              <div className="payment-methods-grid">
                {/* 1. Bank Transfer */}
                <button
                  type="button"
                  className={`payment-method-btn ${paymentMethod === 'bank' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('bank')}
                  id="btn-method-bank"
                >
                  <Landmark size={22} className="method-icon" />
                  <span className="method-name desktop-only">Bank Transfer</span>
                  <span className="method-name mobile-only">Bank Xfer</span>
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
              className="btn-confirm-settle-action"
              onClick={handleConfirmAction}
              disabled={isProcessing || selectedIds.length === 0}
              id="btn-confirm-and-settle"
            >
              <Banknote size={20} className="confirm-icon" />
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
