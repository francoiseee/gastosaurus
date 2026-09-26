import React, { useState } from 'react';
import GroupIcon from './GroupIcon';
import ribbonIcon from '../assets/ribbon.png';
import { 
  ArrowLeft, 
  Bell, 
  Plus, 
  ReceiptText, 
  CreditCard, 
  Users, 
  Calendar, 
  Check, 
  DollarSign,
  TrendingUp,
  Sparkles,
  ChevronRight,
  UserCheck
} from './CustomIcons';

export const ExpensesDetailView = ({ 
  group, 
  onBack, 
  onAddExpense, 
  onViewSettlements,
  onViewMembers,
  notifications = [],
  unreadCount = 1
}) => {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'split-equal' | 'itemized'
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);

  if (!group) return null;

  const membersCount = group.membersCount || (group.members ? group.members.length : 2);
  const members = group.members || [];
  
  // Default mock expenses if group doesn't have custom ones
  const expenses = (group.expenses && group.expenses.length > 0) ? group.expenses : [
    {
      id: 'exp-default-1',
      name: group.recentExpense || 'Meralco Bill & Water',
      category: 'Utilities',
      amount: 1850.00,
      splitType: 'Split Equally',
      paidBy: members[0]?.name || 'Alex Rivera (You)',
      date: 'Jan 28, 2024',
      items: [
        { name: 'Meralco Electric Bill', amount: 1450.00, splitBetween: ['Alex Rivera', 'Miguel Tan'] },
        { name: 'Maynilad Water Bill', amount: 400.00, splitBetween: ['Alex Rivera', 'Miguel Tan'] }
      ]
    },
    {
      id: 'exp-default-2',
      name: 'Snacks, Drinks & Extra Rice',
      category: 'Food & Dining',
      amount: 660.50,
      splitType: 'Itemized',
      paidBy: members[1]?.name || 'Miguel Tan',
      date: 'Jan 30, 2024',
      items: [
        { name: 'Korean Fried Chicken', amount: 380.00, splitBetween: ['Alex Rivera', 'Miguel Tan'] },
        { name: 'Iced Coffee & Boba', amount: 180.50, splitBetween: ['Alex Rivera'] },
        { name: 'Extra Rice & Sides', amount: 100.00, splitBetween: ['Miguel Tan'] }
      ]
    }
  ];

  // Calculate totals
  const totalSpending = group.totalSpending !== undefined 
    ? group.totalSpending 
    : expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const yourPaidTotal = expenses
    .filter(e => (e.paidBy || '').toLowerCase().includes('you') || (e.paidBy || '').toLowerCase().includes('alex'))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const yourEstimatedShare = totalSpending / (membersCount || 1);

  // Filtered expenses
  const filteredExpenses = expenses.filter(e => {
    if (activeFilter === 'split-equal') return (e.splitType || '').toLowerCase().includes('equal');
    if (activeFilter === 'itemized') return (e.splitType || '').toLowerCase().includes('item');
    return true;
  });

  const toggleExpand = (id) => {
    setExpandedExpenseId(prev => prev === id ? null : id);
  };

  return (
    <div className="expenses-detail-page-container animate-fade-in">
      {/* Top Header Bar */}
      <header className="expenses-header-bar">
        <button 
          className="btn-header-back"
          onClick={onBack}
          aria-label="Back to group members"
          title="Back to Group Members"
          id="btn-back-to-members"
        >
          <ArrowLeft size={20} color="#1E2026" strokeWidth={2.2} />
        </button>

        <div className="expenses-header-center">
          <h2 className="expenses-header-title">Expenses Breakdown</h2>
          <span className="expenses-header-group-name">{group.name}</span>
        </div>

        <div className="expenses-header-actions">
          <button className="header-notif-btn" aria-label="Notifications">
            <Bell size={20} color="#1E2026" />
            {unreadCount > 0 && <span className="header-notif-dot" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="expenses-page-content">
        
        {/* Page Title & Action Row */}
        <div className="expenses-page-header-row">
          <div className="expenses-title-group">
            <div className="expenses-group-icon-badge" style={{ backgroundColor: group.iconBg || '#FFEBEF' }}>
              <GroupIcon 
                iconId={group.iconId} 
                iconType={group.iconType} 
                size={32} 
                alt={group.name} 
              />
            </div>
            <div>
              <h1 className="expenses-main-heading">Expenses Breakdown</h1>
              <p className="expenses-subheading">Recent expenses, split shares and totals for <strong>{group.name}</strong></p>
            </div>
          </div>

          <div className="expenses-header-btn-group desktop-only">
            {onViewSettlements && (
              <button 
                className="btn-outline-pill"
                onClick={onViewSettlements}
              >
                <CreditCard size={16} /> View Settlements
              </button>
            )}
            <button 
              className="btn-primary-add-expense"
              onClick={onAddExpense}
              id="btn-add-expense-header"
            >
              <img src={ribbonIcon} alt="Add" className="btn-ribbon-icon-inline" /> Add Expense
            </button>
          </div>
        </div>

        {/* Top Summary Cards Grid */}
        <section className="expenses-summary-cards-grid">
          {/* Main Total Shared Spending Card */}
          <div className="expenses-hero-spending-card">
            <div className="hero-card-left">
              <span className="hero-stat-label">TOTAL SHARED SPENDING</span>
              <div className="hero-amount-display">
                <span className="hero-currency-symbol">₱</span>
                <span className="hero-amount-number">
                  {totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="hero-subtext">
                Split automatically across <strong>{membersCount} members</strong>
              </p>
            </div>

            <div className="hero-card-actions">
              <button 
                className="btn-hero-add-expense"
                onClick={onAddExpense}
              >
                <Plus size={16} /> Add Expense
              </button>
            </div>
          </div>

          {/* Mini Stat Cards */}
          <div className="expenses-mini-stats-grid">
            <div className="stat-card expense-mini-card">
              <div className="mini-card-top">
                <span className="stat-label">YOU PAID</span>
                <div className="mini-icon-circle paid-circle">
                  <TrendingUp size={16} color="#10B981" />
                </div>
              </div>
              <h3 className="mini-card-amount">
                ₱{yourPaidTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="mini-card-subtext">Total you covered</span>
            </div>

            <div className="stat-card expense-mini-card">
              <div className="mini-card-top">
                <span className="stat-label">YOUR ESTIMATED SHARE</span>
                <div className="mini-icon-circle share-circle">
                  <Users size={16} color="#7E57C2" />
                </div>
              </div>
              <h3 className="mini-card-amount">
                ₱{yourEstimatedShare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="mini-card-subtext">Equal 1/{membersCount} split portion</span>
            </div>

            <div className="stat-card expense-mini-card">
              <div className="mini-card-top">
                <span className="stat-label">YOUR GROUP BALANCE</span>
                <div className={`mini-icon-circle ${group.balance >= 0 ? 'owed-circle' : 'owe-circle'}`}>
                  <DollarSign size={16} color={group.balance >= 0 ? '#7E57C2' : '#D32F2F'} />
                </div>
              </div>
              <h3 className={`mini-card-amount ${group.balance >= 0 ? 'positive-text' : 'negative-text'}`}>
                {group.balance >= 0 ? `+₱${Math.abs(group.balance).toFixed(2)}` : `-₱${Math.abs(group.balance).toFixed(2)}`}
              </h3>
              <span className="mini-card-subtext">
                {group.balance >= 0 ? 'You are owed' : 'You owe the group'}
              </span>
            </div>
          </div>
        </section>

        {/* Expenses List Section */}
        <section className="expenses-list-full-section">
          <div className="expenses-section-toolbar">
            <div className="toolbar-left">
              <h2 className="expenses-section-heading">
                Group Expenses <span className="expenses-count-pill">{filteredExpenses.length}</span>
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="expenses-filter-pills">
              <button 
                className={`filter-pill-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All ({expenses.length})
              </button>
              <button 
                className={`filter-pill-btn ${activeFilter === 'split-equal' ? 'active' : ''}`}
                onClick={() => setActiveFilter('split-equal')}
              >
                Split Equally
              </button>
              <button 
                className={`filter-pill-btn ${activeFilter === 'itemized' ? 'active' : ''}`}
                onClick={() => setActiveFilter('itemized')}
              >
                Itemized
              </button>
            </div>
          </div>

          {/* Expenses Cards Container */}
          <div className="expenses-cards-stack">
            {filteredExpenses.length === 0 ? (
              <div className="expenses-empty-card">
                <div className="empty-icon-circle">
                  <ReceiptText size={32} color="#D94668" />
                </div>
                <h3>No expenses found for this filter</h3>
                <p>Click "Add Expense" to log bills, items, or meals for this group.</p>
                <button className="btn-primary-action" onClick={onAddExpense}>
                  <Plus size={16} /> Add Expense
                </button>
              </div>
            ) : (
              filteredExpenses.map((exp) => {
                const isExpanded = expandedExpenseId === exp.id;
                const isItemized = (exp.splitType || '').toLowerCase().includes('item');
                const perPersonShare = (Number(exp.amount) / membersCount).toFixed(2);

                return (
                  <div key={exp.id} className="expense-detailed-card animate-fade-in">
                    <div className="expense-detailed-main-row" onClick={() => toggleExpand(exp.id)}>
                      <div className="expense-detailed-left">
                        <div className="expense-receipt-icon-box">
                          <ReceiptText size={22} color="#E2486E" />
                        </div>
                        <div className="expense-detailed-titles">
                          <div className="expense-title-and-badge">
                            <h3 className="expense-item-name">{exp.name || exp.title}</h3>
                            <span className={`expense-type-badge ${isItemized ? 'badge-itemized' : 'badge-equal'}`}>
                              {exp.splitType || 'Split Equally'}
                            </span>
                          </div>
                          <div className="expense-metadata-row">
                            <span className="exp-meta-item">
                              <UserCheck size={13} className="meta-icon" /> Paid by <strong>{exp.paidBy || 'Alex Rivera'}</strong>
                            </span>
                            <span className="meta-dot">•</span>
                            <span className="exp-meta-item">
                              <Calendar size={13} className="meta-icon" /> {exp.date || 'Recent'}
                            </span>
                            {exp.category && (
                              <>
                                <span className="meta-dot">•</span>
                                <span className="exp-category-pill">{exp.category}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="expense-detailed-right">
                        <div className="expense-amount-column">
                          <span className="expense-main-price">
                            ₱{Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="expense-per-person-note">
                            ₱{perPersonShare}/person
                          </span>
                        </div>
                        <div className={`expand-chevron-icon ${isExpanded ? 'rotated' : ''}`}>
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </div>

                    {/* Expandable Itemized Breakdown or Breakdown Sub-list */}
                    {isExpanded && (
                      <div className="expense-expanded-breakdown animate-fade-in">
                        <div className="expanded-divider" />
                        <div className="expanded-header">
                          <h4>Itemized Breakdown & Participants</h4>
                          <span className="split-summary-badge">
                            {isItemized ? 'Custom Items Split' : `Equal Split ÷ ${membersCount} Members`}
                          </span>
                        </div>

                        {exp.items && exp.items.length > 0 ? (
                          <div className="expanded-items-list">
                            {exp.items.map((item, idx) => (
                              <div key={idx} className="expanded-item-row">
                                <div className="expanded-item-info">
                                  <span className="expanded-item-name">{item.name}</span>
                                  <div className="item-split-members-tags">
                                    <span className="split-for-label">For:</span>
                                    {(item.splitBetween || ['Alex Rivera']).map((m, mIdx) => (
                                      <span key={mIdx} className="member-split-pill">{m}</span>
                                    ))}
                                  </div>
                                </div>
                                <span className="expanded-item-price">
                                  ₱{Number(item.amount).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="expanded-equal-members-grid">
                            {members.map((m) => (
                              <div key={m.id} className="equal-member-share-chip">
                                <div className="chip-avatar-mini">
                                  {m.initials || m.name.charAt(0)}
                                </div>
                                <span className="chip-member-name">{m.name}</span>
                                <span className="chip-member-share">₱{perPersonShare}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Bottom Floating/Dock Action Bar for Mobile and Desktop */}
        <div className="expenses-page-bottom-bar">
          <button 
            className="btn-bottom-back-members"
            onClick={onBack}
          >
            <ArrowLeft size={16} /> Back to Group Members
          </button>
          <button 
            className="btn-bottom-add-expense"
            onClick={onAddExpense}
          >
            <img src={ribbonIcon} alt="Add" className="btn-ribbon-icon-inline" /> Add New Expense
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExpensesDetailView;
