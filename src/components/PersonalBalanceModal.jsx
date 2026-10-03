import { useState } from 'react';
import { ShoppingBag, UtensilsCrossed, Building2, Plane, Coffee, Users } from './CustomIcons';
import { profileApi } from '../lib/api';
import { peso } from '../lib/format';

// Icon + color per group category (anything else falls back to the last one).
const CATEGORY_STYLE = {
  'Food & Dining': [UtensilsCrossed, '#E26D24'],
  'Rent & Utilities': [Building2, '#D94668'],
  'Travel & Trips': [Plane, '#7C4DFF'],
  'Supplies & Groceries': [ShoppingBag, '#059669'],
  Household: [ShoppingBag, '#059669'],
  'Work & Cafe': [Coffee, '#B45309'],
  other: [Users, '#4F67D8'],
};

/** "Personal Balance": your own share of group spending this month, by category, vs your budget. */
export const PersonalBalanceModal = ({ isOpen, onClose, summary, onChanged, showToast }) => {
  const [budgetInput, setBudgetInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const totalSpent = summary?.personalSpending ?? 0;
  const budget = summary?.monthlyBudget ?? null;
  const percentUsed = budget ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;
  const categories = summary?.spendingByCategory ?? [];
  const monthLabel = summary?.month
    ? new Date(`${summary.month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'this month';

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const value = budgetInput.trim() === '' ? null : Number(budgetInput);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      showToast('Enter a budget of ₱0 or more.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await profileApi.update({ monthlyBudget: value === null ? null : Math.round(value * 100) / 100 });
      showToast(value === null ? 'Monthly budget removed.' : `Monthly budget set to ${peso(value)}.`);
      setBudgetInput('');
      onChanged();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <h3>Personal Spending Breakdown</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="personal-balance-overview">
          <div className="personal-budget-stat">
            <span className="stat-label">YOUR SHARE OF SPENDING · {monthLabel.toUpperCase()}</span>
            <h2 className="stat-amount">{peso(totalSpent)}</h2>
            <p className="budget-sub">
              {budget !== null
                ? `Budget: ${peso(budget)} (${percentUsed}% used${summary.budgetRemaining < 0 ? ' — over budget!' : ''})`
                : 'No monthly budget set yet.'}
            </p>
          </div>

          {budget !== null && (
            <div className="budget-meter-track">
              <div className="budget-meter-fill" style={{ width: `${percentUsed}%` }} />
            </div>
          )}
        </div>

        <div className="personal-categories-list">
          {categories.length === 0 && <p className="budget-sub">No shared expenses yet this month.</p>}
          {categories.map((cat) => {
            const [Icon, color] = CATEGORY_STYLE[cat.category] ?? CATEGORY_STYLE.other;
            const share = totalSpent ? Math.round((cat.amount / totalSpent) * 100) : 0;
            return (
              <div key={cat.category} className="cat-spending-item">
                <div className="cat-item-left">
                  <div className="cat-icon-badge" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <h4 className="cat-name">{cat.category}</h4>
                    <span className="cat-budget-text">{share}% of your spending</span>
                  </div>
                </div>

                <div className="cat-item-right">
                  <span className="cat-spent-amount">{peso(cat.amount)}</span>
                  <div className="cat-mini-bar">
                    <div className="cat-mini-fill" style={{ width: `${share}%`, backgroundColor: color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form className="add-member-input-row" onSubmit={handleSaveBudget}>
          <input
            type="number"
            min="0"
            step="0.01"
            className="form-input member-quick-input"
            placeholder={budget !== null ? `Monthly budget (now ${peso(budget)})` : 'Set a monthly budget, e.g. 20000'}
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
          />
          <button type="submit" className="btn-add-member" disabled={isSaving}>
            {budgetInput.trim() === '' && budget !== null ? 'Remove' : 'Save'}
          </button>
        </form>

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
