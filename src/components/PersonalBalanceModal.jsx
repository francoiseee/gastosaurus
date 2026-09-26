import React from 'react';
import { ShoppingBag, UtensilsCrossed, Building2, Plane } from './CustomIcons';

export const PersonalBalanceModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = [
    { name: 'Food & Dining', spent: 4850.00, budget: 6000.00, icon: <UtensilsCrossed size={18} color="#E26D24" />, color: '#E26D24' },
    { name: 'Rent & Utilities', spent: 5200.00, budget: 7000.00, icon: <Building2 size={18} color="#D94668" />, color: '#D94668' },
    { name: 'Travel & Trips', spent: 1400.00, budget: 3000.00, icon: <Plane size={18} color="#7C4DFF" />, color: '#7C4DFF' },
    { name: 'Groceries & Household', spent: 1000.00, budget: 4000.00, icon: <ShoppingBag size={18} color="#059669" />, color: '#059669' },
  ];

  const totalSpent = categories.reduce((sum, item) => sum + item.spent, 0);
  const totalBudget = categories.reduce((sum, item) => sum + item.budget, 0);
  const percentUsed = Math.round((totalSpent / totalBudget) * 100);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <h3>Personal Spending Breakdown</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="personal-balance-overview">
          <div className="personal-budget-stat">
            <span className="stat-label">TOTAL SPENT THIS MONTH</span>
            <h2 className="stat-amount">₱{totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            <p className="budget-sub">Budget: ₱{totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({percentUsed}% utilized)</p>
          </div>

          <div className="budget-meter-track">
            <div className="budget-meter-fill" style={{ width: `${percentUsed}%` }} />
          </div>
        </div>

        <div className="personal-categories-list">
          {categories.map((cat) => {
            const catPercent = Math.round((cat.spent / cat.budget) * 100);
            return (
              <div key={cat.name} className="cat-spending-item">
                <div className="cat-item-left">
                  <div className="cat-icon-badge" style={{ backgroundColor: `${cat.color}15` }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h4 className="cat-name">{cat.name}</h4>
                    <span className="cat-budget-text">Budget: ₱{cat.budget.toFixed(2)}</span>
                  </div>
                </div>

                <div className="cat-item-right">
                  <span className="cat-spent-amount">₱{cat.spent.toFixed(2)}</span>
                  <div className="cat-mini-bar">
                    <div className="cat-mini-fill" style={{ width: `${catPercent}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button className="btn-primary-action" style={{ width: '100%' }} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalBalanceModal;
