import React, { useState } from 'react';
import { Check, ArrowUp, ArrowDown, Handshake, Sparkles } from './CustomIcons';

export const SettlementsView = ({ settlements, onSettleItem }) => {
  const [filter, setFilter] = useState('all');
  const [settledList, setSettledList] = useState([]);

  const handleSettle = (id) => {
    if (onSettleItem) {
      onSettleItem(id);
    }
    setSettledList((prev) => [...prev, id]);
  };

  const filtered = settlements.filter(s => {
    if (filter === 'owe') return s.type === 'owe';
    if (filter === 'owed') return s.type === 'owed';
    return true;
  });

  return (
    <div className="settlements-view-container animate-fade-in">
      <div className="settlements-header">
        <div>
          <h1 className="overview-title">Settlements</h1>
          <p className="overview-subtitle">
            Alamin agad kung sino may utang, isang tap lang. Settle balances with GCash, Maya, or cash.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="settlement-filter-tabs">
        <button 
          className={`filter-tab-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Settlements
        </button>
        <button 
          className={`filter-tab-btn ${filter === 'owe' ? 'active' : ''}`}
          onClick={() => setFilter('owe')}
        >
          You Owe
        </button>
        <button 
          className={`filter-tab-btn ${filter === 'owed' ? 'active' : ''}`}
          onClick={() => setFilter('owed')}
        >
          You Are Owed
        </button>
      </div>

      {/* Settlement Cards List */}
      <div className="settlements-list">
        {filtered.map((item) => {
          const isSettled = settledList.includes(item.id) || item.status === 'Completed';
          const isOwe = item.type === 'owe';

          return (
            <div key={item.id} className={`settlement-card ${isSettled ? 'settled' : ''}`}>
              <div className="settlement-person-col">
                <span className="person-avatar-circle">{item.avatar}</span>
                <div className="person-details">
                  <h3 className="person-name">{item.person}</h3>
                  <span className="person-group-tag">{item.group} • {item.gcashNumber}</span>
                </div>
              </div>

              <div className="settlement-amount-col">
                <div className="settlement-amount-box">
                  <span className="settle-direction-tag">
                    {isOwe ? 'You pay' : 'You receive'}
                  </span>
                  <span className={`settle-amount-num ${isOwe ? 'negative' : 'positive'}`}>
                    {isOwe ? `-₱${item.amount.toFixed(2)}` : `+₱${item.amount.toFixed(2)}`}
                  </span>
                </div>

                <div className="settlement-action-box">
                  {isSettled ? (
                    <span className="settled-badge">
                      <Check size={16} /> Settled
                    </span>
                  ) : isOwe ? (
                    <button 
                      className="btn-settle-action pay-now"
                      onClick={() => handleSettle(item.id)}
                    >
                      Pay via GCash
                    </button>
                  ) : (
                    <button 
                      className="btn-settle-action send-reminder"
                      onClick={() => handleSettle(item.id)}
                    >
                      Send Reminder
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SettlementsView;
