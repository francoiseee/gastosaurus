import React, { useState } from 'react';
import GroupIcon from './GroupIcon';
import netBalanceMascot from '../assets/net-balance-mascot.png';
import { 
  ArrowUp, 
  ArrowDown, 
  ChevronRight, 
  Plus
} from './CustomIcons';

export const Dashboard = ({ 
  userData, 
  groups, 
  onSettleUpClick, 
  onPersonalBalanceClick, 
  onViewGroupClick,
  onViewAllGroups,
  onCreateGroupClick,
  onAddAmbaganClick
}) => {
  const [activeFilter, setActiveFilter] = useState('all');

  // Format currency with Philippine Peso sign ₱
  const formatPesos = (val, prefix = false) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val).toFixed(2);
    if (prefix) {
      return isNegative ? `-₱${absVal}` : `+₱${absVal}`;
    }
    return `₱${absVal}`;
  };

  return (
    <div className="dashboard-page-container animate-fade-in">
      {/* Overview Header */}
      <section className="overview-header-section">
        <h1 className="overview-title">Overview</h1>
        <p className="overview-subtitle">Here's your financial snapshot for today.</p>
      </section>

      {/* Top Financial Stats Cards Grid */}
      <section className="dashboard-stats-grid">
        {/* 1. Net Balance Main Card */}
        <div className="stat-card net-balance-card">
          <div className="net-balance-content">
            <span className="stat-label">NET BALANCE</span>
            <div className="stat-main-amount">
              <span className="amount-sign">+₱</span>
              <span className="amount-whole">450</span>
              <span className="amount-decimal">.00</span>
            </div>

            <div className="net-balance-actions">
              <button 
                className="btn-settle-up"
                onClick={onSettleUpClick}
                id="btn-settle-up"
              >
                Settle Up
              </button>
              <button 
                className="btn-personal-balance"
                onClick={onPersonalBalanceClick}
                id="btn-personal-balance"
              >
                Personal Balance
              </button>
            </div>
          </div>

          <div className="net-balance-mascot-wrapper">
            <img 
              src={netBalanceMascot} 
              alt="Gastosaurus Net Balance Mascot" 
              className="net-balance-mascot-img"
            />
          </div>
        </div>

        {/* 2. YOU OWE Card */}
        <div className="stat-card owe-card">
          <div className="stat-card-top">
            <div className="stat-direction-badge owe-badge">
              <ArrowUp size={16} color="#D32F2F" strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="stat-card-mid">
            <span className="stat-label">YOU OWE</span>
            <h2 className="stat-amount amount-negative">-₱125.50</h2>
            <span className="stat-subtext">Across 3 groups</span>
          </div>

          <div className="stat-progress-track">
            <div className="progress-fill owe-progress-fill" style={{ width: '35%' }} />
          </div>
        </div>

        {/* 3. YOU ARE OWED Card */}
        <div className="stat-card owed-card">
          <div className="stat-card-top">
            <div className="stat-direction-badge owed-badge">
              <ArrowDown size={16} color="#7E57C2" strokeWidth={2.5} />
            </div>
          </div>

          <div className="stat-card-mid">
            <span className="stat-label">YOU ARE OWED</span>
            <h2 className="stat-amount amount-positive">+₱575.50</h2>
            <span className="stat-subtext">Across 5 groups</span>
          </div>

          <div className="stat-progress-track">
            <div className="progress-fill owed-progress-fill" style={{ width: '70%' }} />
          </div>
        </div>
      </section>

      {/* Active Groups Section */}
      <section className="active-groups-section">
        <div className="section-header-row">
          <div className="section-title-wrap">
            <h2 className="section-title">Active Groups</h2>
            <span className="section-count-badge">{groups.length} active</span>
          </div>
          <div className="section-actions-wrap">
            {onCreateGroupClick && (
              <button 
                className="btn-create-group-pill"
                onClick={onCreateGroupClick}
                title="Create a new active group"
              >
                <Plus size={16} /> New Group
              </button>
            )}
            <button 
              className="view-all-link-btn"
              onClick={onViewAllGroups}
            >
              View all <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="active-groups-grid">
          {groups.slice(0, 6).map((group) => {
            const isNegative = group.balance < 0;
            return (
              <div 
                key={group.id} 
                className="group-card"
                onClick={() => onViewGroupClick && onViewGroupClick(group)}
              >
                <div className="group-card-top">
                  <div 
                    className="group-icon-box"
                    style={{ backgroundColor: group.iconBg || '#FFEBEF' }}
                  >
                    <GroupIcon 
                      iconId={group.iconId} 
                      iconType={group.iconType} 
                      size={40} 
                      alt={group.name} 
                    />
                  </div>
                  <div className="group-info">
                    <h3 className="group-name">{group.name}</h3>
                    <span className="group-members">{group.membersCount} members</span>
                  </div>
                </div>

                <div className="group-card-footer">
                  <span className="balance-label">Your Balance</span>
                  <span className={`balance-value ${isNegative ? 'negative' : 'positive'}`}>
                    {isNegative 
                      ? `-₱${Math.abs(group.balance).toFixed(2)}` 
                      : `+₱${group.balance.toFixed(2)}`
                    }
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
