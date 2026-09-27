import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRight,
  CheckCircle2, 
  CreditCard
} from 'lucide-react';

export const SettlementsView = ({ 
  settlements = [], 
  onSettleItem, 
  onViewGroupMembers,
  onSettleAllDebts,
  onNavigatePayment,
  onSendReminders
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'owed' | 'owe' | 'paid'
  const [toastMessage, setToastMessage] = useState(null);

  // Initial settlements data matching Screenshot 3 & 4
  const [items, setItems] = useState([
    {
      id: 'settle-1',
      person: 'Sarah M.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      avatarEmoji: '🦊',
      avatarBg: '#FEF3C7',
      description: 'Team Lunch',
      status: 'owe', // 'owe' => 'YOU OWE'
      statusLabel: 'YOU OWE',
      amount: 45.00,
      unpaid: 10.00,
      totalPayment: 35.00,
      isPaid: false
    },
    {
      id: 'settle-2',
      person: 'David K.',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
      avatarEmoji: '🐻',
      avatarBg: '#EDE9FE',
      description: 'Weekend Rental',
      status: 'owed', // 'owed' => 'OWED TO YOU'
      statusLabel: 'OWED TO YOU',
      amount: 120.00,
      unpaid: 0.00,
      totalPayment: 120.00,
      isPaid: false
    },
    {
      id: 'settle-3',
      person: 'Alex T.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      avatarEmoji: '🐨',
      avatarBg: '#E0E7FF',
      description: 'Coffee Run',
      status: 'paid', // 'paid' => 'PAID'
      statusLabel: 'PAID',
      amount: 12.50,
      unpaid: 0.00,
      totalPayment: 12.50,
      isPaid: true
    }
  ]);

  // Handle paying a specific item: navigate to payment or settle directly
  const handlePay = (item) => {
    if (item.isPaid) return;

    if (onNavigatePayment) {
      onNavigatePayment([
        {
          id: item.id,
          person: item.person,
          avatarUrl: item.avatarUrl,
          description: item.description,
          category: item.status === 'owe' ? 'FOOD' : 'SHARED',
          categoryType: item.status === 'owe' ? 'food' : 'travel',
          date: 'Oct 12, 2023',
          amount: item.amount
        }
      ]);
      return;
    }

    setItems(prev => prev.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          isPaid: true,
          status: 'paid',
          statusLabel: 'PAID',
          unpaid: 0.00
        };
      }
      return i;
    }));

    if (onSettleItem) {
      onSettleItem(item.id);
    }

    setToastMessage(`Payment of ₱${item.totalPayment.toFixed(2)} to ${item.person} completed! 🎉`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Settle All Debts -> Navigate to Payment Page
  const handleSettleAll = () => {
    if (onNavigatePayment) {
      onNavigatePayment();
      return;
    }

    setItems(prev => prev.map(i => {
      if (i.status === 'owe' && !i.isPaid) {
        return {
          ...i,
          isPaid: true,
          status: 'paid',
          statusLabel: 'PAID',
          unpaid: 0.00
        };
      }
      return i;
    }));

    if (onSettleAllDebts) {
      onSettleAllDebts();
    }

    setToastMessage('All outstanding debts have been settled successfully! 🦖');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Send Reminders
  const handleSendReminderAction = () => {
    if (onSendReminders) {
      onSendReminders();
    }
    setToastMessage('Reminders dispatched to all members with open balances! 📬');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'owed') return item.status === 'owed' && !item.isPaid;
    if (filter === 'owe') return item.status === 'owe' && !item.isPaid;
    if (filter === 'paid') return item.isPaid || item.status === 'paid';
    return true;
  });

  return (
    <div className="settlements-page-container animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="settlements-toast-banner animate-fade-in">
          <CheckCircle2 size={18} color="#059669" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="settlements-header-section">
        <h1 className="settlements-page-title">Balances & Settlement</h1>
        <p className="settlements-page-subtitle">
          Manage your shared expenses and open tabs seamlessly.
        </p>
      </div>

      {/* Top 2 Balance Summary Cards (Matching Screenshot 3 & 4) */}
      <div className="settlements-summary-grid">
        {/* TOTAL YOU OWE Card */}
        <div className="settlement-stat-card card-owe">
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">TOTAL YOU OWE</span>
              <div className="stat-card-amount owe-amount">₱1,250</div>
            </div>
            <div className="stat-card-icon-wrap owe-arrow">
              <div className="arrow-circle-badge owe">
                <ArrowUpRight size={24} strokeWidth={2.4} />
              </div>
            </div>
          </div>

          <button 
            className="btn-settle-debts-action"
            onClick={handleSettleAll}
            id="btn-settle-all-debts"
          >
            Settle All Debts
          </button>
        </div>

        {/* TOTAL YOU ARE OWED Card */}
        <div className="settlement-stat-card card-owed">
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">TOTAL YOU ARE OWED</span>
              <div className="stat-card-amount owed-amount">₱800</div>
            </div>
            <div className="stat-card-icon-wrap owed-arrow">
              <div className="arrow-circle-badge owed">
                <ArrowDownLeft size={24} strokeWidth={2.4} />
              </div>
            </div>
          </div>

          <button 
            className="btn-send-reminders-action"
            onClick={handleSendReminderAction}
            id="btn-send-reminders"
          >
            Send Reminders
          </button>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="settlements-filter-bar">
        <div className="filter-pills-group">
          <button 
            className={`filter-pill-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            id="filter-pill-all"
          >
            All
          </button>
          <button 
            className={`filter-pill-btn ${filter === 'owed' ? 'active' : ''}`}
            onClick={() => setFilter('owed')}
            id="filter-pill-owed"
          >
            Owed
          </button>
          <button 
            className={`filter-pill-btn ${filter === 'owe' ? 'active' : ''}`}
            onClick={() => setFilter('owe')}
            id="filter-pill-owe"
          >
            Owe
          </button>
          <button 
            className={`filter-pill-btn ${filter === 'paid' ? 'active' : ''}`}
            onClick={() => setFilter('paid')}
            id="filter-pill-paid"
          >
            Paid
          </button>
        </div>

        {/* See Group Members Link Button with Arrow */}
        <div className="group-members-link-wrap">
          <button 
            className="btn-see-group-members"
            onClick={onViewGroupMembers}
            id="btn-see-group-members"
          >
            <span>See Group Members</span>
            <ArrowRight size={14} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Settlements Table Container (Web View - Screenshot 3) */}
      <div className="settlements-table-card desktop-table-view">
        <table className="settlements-data-table">
          <thead>
            <tr>
              <th className="th-person">Person</th>
              <th className="th-desc">Description</th>
              <th className="th-status">Status</th>
              <th className="th-amount">Amount</th>
              <th className="th-unpaid">Unpaid</th>
              <th className="th-total">Total Payment</th>
              <th className="th-action"></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((row) => {
              const isPaid = row.isPaid || row.status === 'paid';
              return (
                <tr key={row.id} className={`settlement-table-row ${isPaid ? 'row-paid' : ''}`}>
                  {/* Person Column */}
                  <td className="td-person">
                    <div className="person-cell-wrapper">
                      <div 
                        className="person-emoji-avatar"
                        style={{ backgroundColor: row.avatarBg || '#FFE8EE' }}
                      >
                        {row.avatarEmoji || '🐱'}
                      </div>
                      <span className="person-table-name">{row.person}</span>
                    </div>
                  </td>

                  {/* Description Column */}
                  <td className={`td-desc ${isPaid ? 'text-dimmed' : ''}`}>
                    {row.description}
                  </td>

                  {/* Status Badge Column */}
                  <td className="td-status">
                    {row.status === 'owe' && !isPaid && (
                      <span className="status-badge-pill badge-owe">
                        YOU OWE
                      </span>
                    )}
                    {row.status === 'owed' && !isPaid && (
                      <span className="status-badge-pill badge-owed">
                        OWED TO YOU
                      </span>
                    )}
                    {isPaid && (
                      <span className="status-badge-pill badge-paid">
                        PAID
                      </span>
                    )}
                  </td>

                  {/* Amount Column */}
                  <td className={`td-amount ${isPaid ? 'text-dimmed' : ''}`}>
                    ₱{row.amount.toFixed(2)}
                  </td>

                  {/* Unpaid Column */}
                  <td className={`td-unpaid ${isPaid ? 'text-dimmed' : row.unpaid > 0 ? 'text-unpaid-red' : ''}`}>
                    ₱{row.unpaid.toFixed(2)}
                  </td>

                  {/* Total Payment Column */}
                  <td className={`td-total ${isPaid ? 'text-dimmed' : ''}`}>
                    ₱{row.totalPayment.toFixed(2)}
                  </td>

                  {/* Action Button Column */}
                  <td className="td-action">
                    <button 
                      className={`btn-table-pay ${isPaid ? 'btn-paid-disabled' : ''}`}
                      onClick={() => handlePay(row)}
                      disabled={isPaid}
                      id={`btn-pay-${row.id}`}
                    >
                      Pay
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan="7" className="table-empty-message">
                  No settlements found in this filter category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Settlements Mobile Card View (Matching Screenshot 4 exactly) */}
      <div className="settlements-mobile-cards-list mobile-only">
        {filteredItems.map((row) => {
          const isPaid = row.isPaid || row.status === 'paid';
          return (
            <div key={row.id} className={`settlement-mobile-card ${isPaid ? 'card-paid' : ''}`}>
              <div className="settlement-mobile-header">
                <div className="person-cell-wrapper">
                  <div 
                    className="person-emoji-avatar"
                    style={{ backgroundColor: row.avatarBg || '#FFE8EE' }}
                  >
                    {row.avatarEmoji || '🐱'}
                  </div>
                  <div>
                    <span className="person-table-name">{row.person}</span>
                    <span className={`mobile-desc ${isPaid ? 'text-dimmed' : ''}`}>
                      {row.description}
                    </span>
                  </div>
                </div>

                <div className="mobile-status-wrap">
                  {row.status === 'owe' && !isPaid && (
                    <span className="status-badge-pill badge-owe">YOU OWE</span>
                  )}
                  {row.status === 'owed' && !isPaid && (
                    <span className="status-badge-pill badge-owed">OWED TO YOU</span>
                  )}
                  {isPaid && (
                    <span className="status-badge-pill badge-paid">PAID</span>
                  )}
                </div>
              </div>

              {/* 3-column stats box matching Screenshot 4 */}
              <div className="settlement-mobile-amounts-grid">
                <div className="mobile-amount-item">
                  <span className="mobile-amount-label">AMOUNT</span>
                  <span className={`mobile-amount-val ${isPaid ? 'text-dimmed' : ''}`}>
                    ₱{row.amount.toFixed(2)}
                  </span>
                </div>
                <div className="mobile-amount-item">
                  <span className="mobile-amount-label">UNPAID</span>
                  <span className={`mobile-amount-val ${row.unpaid > 0 ? 'text-unpaid-red' : ''} ${isPaid ? 'text-dimmed' : ''}`}>
                    ₱{row.unpaid.toFixed(2)}
                  </span>
                </div>
                <div className="mobile-amount-item">
                  <span className="mobile-amount-label">TOTAL PAID</span>
                  <span className={`mobile-amount-val highlight ${isPaid ? 'text-dimmed' : ''}`}>
                    ₱{row.totalPayment.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="settlement-mobile-action">
                <button 
                  className={`btn-table-pay ${isPaid ? 'btn-paid-disabled' : ''}`}
                  onClick={() => handlePay(row)}
                  disabled={isPaid}
                  id={`btn-mobile-pay-${row.id}`}
                >
                  Pay
                </button>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="mobile-empty-message">
            No settlements found in this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementsView;

