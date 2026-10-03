import { useState } from 'react';
import GroupIcon from './GroupIcon';
import ribbonIcon from '../assets/ribbon.png';
import { ArrowLeft, Bell, Plus, ReceiptText, CreditCard, Users, Calendar, DollarSign, TrendingUp, ChevronRight, UserCheck, Trash2 } from './CustomIcons';
import Avatar from './Avatar';
import { groupsApi, expensesApi } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { peso, signedPeso, formatDate } from '../lib/format';

const FILTERS = {
  all: () => true,
  'split-equal': (e) => e.splitType === 'equal',
  itemized: (e) => e.splitType === 'itemized',
};

export const ExpensesDetailView = ({
  groupId,
  refreshKey,
  onBack,
  onAddExpense,
  onViewSettlements,
  onChanged,
  showToast,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({}); // expenseId → full expense (items, shares)

  const groupQuery = useAsync(() => groupsApi.get(groupId), [groupId, refreshKey]);
  const expensesQuery = useAsync(() => expensesApi.list(groupId, { limit: 100 }), [groupId, refreshKey]);

  const detail = groupQuery.data;
  if (!detail) {
    return (
      <div className="expenses-detail-page-container animate-fade-in">
        <div className="expenses-page-content">
          <p className="expenses-subheading">{groupQuery.error ? groupQuery.error.message : 'Loading expenses…'}</p>
        </div>
      </div>
    );
  }

  const { group, members } = detail;
  const expenses = expensesQuery.data ?? [];
  const nameOf = Object.fromEntries(members.map((m) => [m.id, m.name]));
  const filteredExpenses = expenses.filter(FILTERS[activeFilter]);
  const yourPaidTotal = expenses
    .filter((e) => e.paidBy.memberId === group.myMemberId)
    .reduce((sum, e) => sum + e.totalAmount, 0);
  const yourShareTotal = expenses.reduce((sum, e) => sum + e.myShare, 0);

  const toggleExpand = async (expenseId) => {
    const next = expandedId === expenseId ? null : expenseId;
    setExpandedId(next);
    if (next && !details[next]) {
      try {
        const full = await expensesApi.get(next);
        setDetails((d) => ({ ...d, [next]: full }));
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete "${expense.description}"? Everyone's balance will be recalculated.`)) return;
    try {
      await expensesApi.remove(expense.id);
      showToast(`Deleted "${expense.description}".`);
      setExpandedId(null);
      onChanged();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="expenses-detail-page-container animate-fade-in">
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
          <button className="header-notif-btn" aria-label="Notifications" onClick={onOpenNotifications}>
            <Bell size={20} color="#1E2026" />
            {unreadCount > 0 && <span className="header-notif-dot" />}
          </button>
        </div>
      </header>

      <div className="expenses-page-content">
        <div className="expenses-page-header-row">
          <div className="expenses-title-group">
            <div className="expenses-group-icon-badge" style={{ backgroundColor: group.iconBg }}>
              <GroupIcon iconId={group.iconId} size={32} alt={group.name} />
            </div>
            <div>
              <h1 className="expenses-main-heading">Expenses Breakdown</h1>
              <p className="expenses-subheading">
                Recent expenses, split shares and totals for <strong>{group.name}</strong>
              </p>
            </div>
          </div>

          <div className="expenses-header-btn-group desktop-only">
            <button className="btn-outline-pill" onClick={onViewSettlements}>
              <CreditCard size={16} /> View Settlements
            </button>
            <button className="btn-primary-add-expense" onClick={onAddExpense} id="btn-add-expense-header">
              <img src={ribbonIcon} alt="Add" className="btn-ribbon-icon-inline" /> Add Expense
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <section className="expenses-summary-cards-grid">
          <div className="expenses-hero-spending-card">
            <div className="hero-card-left">
              <span className="hero-stat-label">TOTAL SHARED SPENDING</span>
              <div className="hero-amount-display">
                <span className="hero-currency-symbol">₱</span>
                <span className="hero-amount-number">{peso(group.totalSpending).slice(1)}</span>
              </div>
              <p className="hero-subtext">
                Shared across <strong>{group.membersCount} members</strong>
              </p>
            </div>

            <div className="hero-card-actions">
              <button className="btn-hero-add-expense" onClick={onAddExpense}>
                <Plus size={16} /> Add Expense
              </button>
            </div>
          </div>

          <div className="expenses-mini-stats-grid">
            <div className="stat-card expense-mini-card">
              <div className="mini-card-top">
                <span className="stat-label">YOU PAID</span>
                <div className="mini-icon-circle paid-circle">
                  <TrendingUp size={16} color="#10B981" />
                </div>
              </div>
              <h3 className="mini-card-amount">{peso(yourPaidTotal)}</h3>
              <span className="mini-card-subtext">Total you covered</span>
            </div>

            <div className="stat-card expense-mini-card">
              <div className="mini-card-top">
                <span className="stat-label">YOUR SHARE</span>
                <div className="mini-icon-circle share-circle">
                  <Users size={16} color="#7E57C2" />
                </div>
              </div>
              <h3 className="mini-card-amount">{peso(yourShareTotal)}</h3>
              <span className="mini-card-subtext">Your part of every bill</span>
            </div>

            <div className="stat-card expense-mini-card">
              <div className="mini-card-top">
                <span className="stat-label">YOUR GROUP BALANCE</span>
                <div className={`mini-icon-circle ${group.balance >= 0 ? 'owed-circle' : 'owe-circle'}`}>
                  <DollarSign size={16} color={group.balance >= 0 ? '#7E57C2' : '#D32F2F'} />
                </div>
              </div>
              <h3 className={`mini-card-amount ${group.balance >= 0 ? 'positive-text' : 'negative-text'}`}>
                {signedPeso(group.balance)}
              </h3>
              <span className="mini-card-subtext">
                {group.statusType === 'owe' ? 'You owe the group' : group.statusType === 'owed' ? 'You are owed' : 'All settled'}
              </span>
            </div>
          </div>
        </section>

        {/* Expense list */}
        <section className="expenses-list-full-section">
          <div className="expenses-section-toolbar">
            <div className="toolbar-left">
              <h2 className="expenses-section-heading">
                Group Expenses <span className="expenses-count-pill">{filteredExpenses.length}</span>
              </h2>
            </div>

            <div className="expenses-filter-pills">
              <button className={`filter-pill-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
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

          <div className="expenses-cards-stack">
            {filteredExpenses.length === 0 ? (
              <div className="expenses-empty-card">
                <div className="empty-icon-circle">
                  <ReceiptText size={32} color="#D94668" />
                </div>
                <h3>{expensesQuery.loading ? 'Loading…' : expenses.length ? 'No expenses for this filter' : 'No expenses yet'}</h3>
                <p>Click "Add Expense" to log bills, items, or meals for this group.</p>
                <button className="btn-primary-action" onClick={onAddExpense}>
                  <Plus size={16} /> Add Expense
                </button>
              </div>
            ) : (
              filteredExpenses.map((exp) => {
                const isExpanded = expandedId === exp.id;
                const isItemized = exp.splitType === 'itemized';
                const full = details[exp.id];
                return (
                  <div key={exp.id} className="expense-detailed-card animate-fade-in">
                    <div className="expense-detailed-main-row" onClick={() => toggleExpand(exp.id)}>
                      <div className="expense-detailed-left">
                        <div className="expense-receipt-icon-box">
                          <ReceiptText size={22} color="#E2486E" />
                        </div>
                        <div className="expense-detailed-titles">
                          <div className="expense-title-and-badge">
                            <h3 className="expense-item-name">{exp.description}</h3>
                            <span className={`expense-type-badge ${isItemized ? 'badge-itemized' : 'badge-equal'}`}>
                              {exp.splitLabel}
                            </span>
                          </div>
                          <div className="expense-metadata-row">
                            <span className="exp-meta-item">
                              <UserCheck size={13} className="meta-icon" /> Paid by <strong>{exp.paidBy.name}</strong>
                            </span>
                            <span className="meta-dot">•</span>
                            <span className="exp-meta-item">
                              <Calendar size={13} className="meta-icon" /> {formatDate(exp.spentOn)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="expense-detailed-right">
                        <div className="expense-amount-column">
                          <span className="expense-main-price">{peso(exp.totalAmount)}</span>
                          <span className="expense-per-person-note">
                            {exp.myShare > 0 ? `Your share ${peso(exp.myShare)}` : `${exp.peopleCount} people`}
                          </span>
                        </div>
                        <div className={`expand-chevron-icon ${isExpanded ? 'rotated' : ''}`}>
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="expense-expanded-breakdown animate-fade-in">
                        <div className="expanded-divider" />
                        <div className="expanded-header">
                          <h4>Itemized Breakdown & Participants</h4>
                          <span className="split-summary-badge">
                            {isItemized ? 'Pay for what you had' : `${exp.splitLabel} ÷ ${exp.peopleCount}`}
                          </span>
                        </div>

                        {!full && <p className="expenses-subheading">Loading…</p>}

                        {full && full.items.length > 0 && (
                          <div className="expanded-items-list">
                            {[...full.items, ...full.charges.map((c) => ({ ...c, price: c.amount, memberIds: [] }))].map((item) => (
                              <div key={item.id} className="expanded-item-row">
                                <div className="expanded-item-info">
                                  <span className="expanded-item-name">{item.name}</span>
                                  <div className="item-split-members-tags">
                                    <span className="split-for-label">For:</span>
                                    {item.memberIds.length ? (
                                      item.memberIds.map((id) => (
                                        <span key={id} className="member-split-pill">
                                          {nameOf[id] ?? 'Former member'}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="member-split-pill">Everyone, by what they ordered</span>
                                    )}
                                  </div>
                                </div>
                                <span className="expanded-item-price">{peso(item.price)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {full && (
                          <div className="expanded-equal-members-grid">
                            {full.shares.map((share) => (
                              <div key={share.memberId} className="equal-member-share-chip">
                                <Avatar person={share} className="chip-avatar-mini" />
                                <span className="chip-member-name">{share.name}</span>
                                <span className="chip-member-share">{peso(share.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {full && (
                          <div className="expenses-header-btn-group" style={{ marginTop: 14 }}>
                            <button className="btn-outline-pill" onClick={() => handleDelete(exp)}>
                              <Trash2 size={16} /> Delete expense
                            </button>
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

        <div className="expenses-page-bottom-bar">
          <button className="btn-bottom-back-members" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Group Members
          </button>
          <button className="btn-bottom-add-expense" onClick={onAddExpense}>
            <img src={ribbonIcon} alt="Add" className="btn-ribbon-icon-inline" /> Add New Expense
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpensesDetailView;
