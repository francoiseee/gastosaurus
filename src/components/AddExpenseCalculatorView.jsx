import React, { useState, useRef, useEffect } from 'react';
import mascotImg from '../assets/mascot.png';
import { 
  ArrowLeft, 
  ArrowRight, 
  Bell, 
  Delete, 
  Plus, 
  Check, 
  CheckCircle2,
  Users
} from './CustomIcons';

export const AddExpenseCalculatorView = ({
  group,
  onBack,
  onContinue,
  notifications = [],
  unreadCount = 1
}) => {
  // Keypad display state (string representation of number)
  const [amountStr, setAmountStr] = useState('0.00');
  const [itemName, setItemName] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const amountInputRef = useRef(null);

  // Default members matching Screenshot 2
  const [members, setMembers] = useState([
    {
      id: 'mem-you',
      name: 'You',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      avatarEmoji: '🦖',
      selected: true
    },
    {
      id: 'mem-sarah',
      name: 'Sarah',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      avatarEmoji: '🦊',
      selected: true
    },
    {
      id: 'mem-mike',
      name: 'Mike',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
      avatarEmoji: '🐻',
      selected: true
    },
    {
      id: 'mem-emma',
      name: 'Emma',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      avatarEmoji: '🐨',
      selected: false
    }
  ]);

  // Modal / Inline prompt to add new member
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  // Handle on-screen calculator keypad press
  const handleKeyPress = (key) => {
    setAmountStr((prev) => {
      // Backspace
      if (key === 'backspace') {
        if (prev.length <= 1 || prev === '0.00' || prev === '0') {
          return '0.00';
        }
        if (prev === '0.00') return '0.00';
        
        const next = prev.slice(0, -1);
        return next === '' || next === '.' ? '0.00' : next;
      }

      // If current is default '0.00', start fresh unless typing '.'
      if (prev === '0.00' || prev === '0') {
        if (key === '.') return '0.';
        return key;
      }

      // Decimal point handling
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }

      // Prevent more than 2 decimal places
      if (prev.includes('.')) {
        const parts = prev.split('.');
        if (parts[1] && parts[1].length >= 2) return prev;
      }

      // Limit length
      if (prev.length >= 8) return prev;

      return prev + key;
    });
  };

  // Handle direct keyboard typing in amount input
  const handleAmountInputChange = (e) => {
    let rawVal = e.target.value;
    // Keep only numbers and single decimal point
    rawVal = rawVal.replace(/[^0-9.]/g, '');

    const parts = rawVal.split('.');
    if (parts.length > 2) {
      rawVal = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length === 2 && parts[1].length > 2) {
      rawVal = parts[0] + '.' + parts[1].slice(0, 2);
    }
    if (rawVal.length > 9) {
      rawVal = rawVal.slice(0, 9);
    }

    setAmountStr(rawVal === '' ? '0' : rawVal);
  };

  // Handle amount blur formatting
  const handleAmountBlur = () => {
    if (!amountStr || amountStr === '' || amountStr === '.' || amountStr === '0') {
      setAmountStr('0.00');
    } else {
      const num = parseFloat(amountStr);
      if (!isNaN(num) && !amountStr.includes('.')) {
        setAmountStr(num.toFixed(2));
      }
    }
  };

  // Focus input when user clicks on total amount box
  const handleAmountBoxClick = () => {
    if (amountInputRef.current) {
      amountInputRef.current.focus();
      if (amountStr === '0.00' || amountStr === '0') {
        amountInputRef.current.select();
      }
    }
  };

  // Global physical keyboard listener when not typing in other inputs
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // If user is focused on another input (like item name), don't intercept
      const activeEl = document.activeElement;
      if (activeEl && activeEl !== amountInputRef.current && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      if (activeEl !== amountInputRef.current) {
        if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
          e.preventDefault();
          handleKeyPress(e.key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          handleKeyPress('backspace');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [amountStr]);

  // Toggle member selection
  const toggleMember = (id) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  // Select all / Deselect all
  const handleSelectAll = () => {
    const allSelected = members.every((m) => m.selected);
    setMembers((prev) => prev.map((m) => ({ ...m, selected: !allSelected })));
  };

  // Add new member
  const handleAddNewMember = (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    const newMem = {
      id: `mem-${Date.now()}`,
      name: newPersonName.trim(),
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`,
      avatarEmoji: '🐼',
      selected: true
    };

    setMembers([...members, newMem]);
    setNewPersonName('');
    setIsAddingPerson(false);
  };

  // Computed numeric amount
  const parsedAmount = parseFloat(amountStr) || 0;

  // Handle Continue action -> Pass to Itemized Split page
  const handleContinue = () => {
    const selectedList = members.filter((m) => m.selected);
    if (selectedList.length === 0) {
      setToastMessage('Please select at least one person for this expense.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (onContinue) {
      onContinue({
        amount: parsedAmount > 0 ? parsedAmount : 145.00,
        itemName: itemName.trim() || 'Yabu Dinner',
        selectedMembers: selectedList
      });
    }
  };

  return (
    <div className="add-expense-calculator-page animate-fade-in">
      {/* Top Header Bar */}
      <header className="calc-header-bar">
        <button 
          className="btn-header-back" 
          onClick={onBack}
          aria-label="Go back"
          id="btn-back-from-calculator"
        >
          <ArrowLeft size={20} color="#1E2026" strokeWidth={2.2} />
        </button>

        <h2 className="calc-header-title">Add Expenses</h2>

        <div className="calc-header-actions">
          <button className="header-notif-btn" aria-label="Notifications">
            <Bell size={20} color="#1E2026" />
            {unreadCount > 0 && <span className="header-notif-dot" />}
          </button>
        </div>
      </header>

      {/* Main Content Area with Center Mascot Watermark */}
      <div className="calc-main-container">
        {/* Background Mascot Watermark Illustration */}
        <div className="calc-mascot-watermark" aria-hidden="true">
          <img src={mascotImg} alt="" className="watermark-img" />
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="calc-toast-banner animate-fade-in">
            <CheckCircle2 size={18} color="#D94668" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="calc-grid-wrapper">
          {/* Left Column: Total Amount + Keypad + What Item */}
          <div className="calc-left-col">
            <div 
              className="calc-amount-display-box" 
              onClick={handleAmountBoxClick}
              title="Click to type with keyboard or use keypad below"
            >
              <span className="calc-amount-label">Total Amount</span>
              <div className="calc-amount-value">
                <span className="peso-sign">₱</span>
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  value={amountStr}
                  onChange={handleAmountInputChange}
                  onBlur={handleAmountBlur}
                  onFocus={(e) => {
                    if (amountStr === '0.00' || amountStr === '0') {
                      e.target.select();
                    }
                  }}
                  className="calc-amount-number-input"
                  id="input-total-amount-display"
                  aria-label="Total Amount"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* 4x3 Calculator Keypad */}
            <div className="calc-keypad-grid">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((val) => (
                <button
                  key={val}
                  type="button"
                  className="calc-key-btn"
                  onClick={() => handleKeyPress(val)}
                  id={`calc-key-${val === '.' ? 'dot' : val}`}
                >
                  {val}
                </button>
              ))}

              {/* Backspace Key */}
              <button
                type="button"
                className="calc-key-btn key-backspace"
                onClick={() => handleKeyPress('backspace')}
                aria-label="Delete last digit"
                id="calc-key-backspace"
              >
                <Delete size={22} strokeWidth={2.2} />
              </button>
            </div>

            {/* What Item Input */}
            <div className="calc-item-input-box">
              <input
                type="text"
                placeholder="What Item?"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="calc-item-name-input"
                id="input-calc-item-name"
              />
            </div>
          </div>

          {/* Right Column: For Whom? Card */}
          <div className="calc-right-col">
            <div className="for-whom-card">
              <div className="for-whom-header">
                <h3 className="for-whom-title">For Whom?</h3>
                <button 
                  type="button" 
                  className="btn-select-all" 
                  onClick={handleSelectAll}
                  id="btn-select-all-members"
                >
                  {members.every(m => m.selected) ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Avatars Row */}
              <div className="for-whom-avatars-row">
                {members.map((mem) => (
                  <div 
                    key={mem.id} 
                    className={`for-whom-avatar-item ${mem.selected ? 'selected' : 'unselected'}`}
                    onClick={() => toggleMember(mem.id)}
                    role="checkbox"
                    aria-checked={mem.selected}
                    tabIndex={0}
                    id={`avatar-item-${mem.id}`}
                  >
                    <div className="avatar-circle-wrapper">
                      <img 
                        src={mem.avatarUrl} 
                        alt={mem.name} 
                        className="avatar-face-img" 
                      />
                      {mem.selected && (
                        <div className="avatar-active-ring" />
                      )}
                    </div>
                    <span className="avatar-person-label">{mem.name}</span>
                  </div>
                ))}

                {/* + Add New Person Button */}
                <div 
                  className="for-whom-avatar-item add-new"
                  onClick={() => setIsAddingPerson(true)}
                  role="button"
                  tabIndex={0}
                  id="btn-add-for-whom-person"
                >
                  <div className="avatar-add-circle">
                    <Plus size={20} color="#7E8492" strokeWidth={2.4} />
                  </div>
                  <span className="avatar-person-label">Add</span>
                </div>
              </div>

              {/* Inline Add Person Form */}
              {isAddingPerson && (
                <form onSubmit={handleAddNewMember} className="inline-add-person-form animate-fade-in">
                  <input
                    type="text"
                    placeholder="Friend's name..."
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    className="inline-person-input"
                    autoFocus
                  />
                  <div className="inline-form-actions">
                    <button type="submit" className="btn-inline-add">Add</button>
                    <button type="button" className="btn-inline-cancel" onClick={() => setIsAddingPerson(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Continue Button */}
        <div className="calc-bottom-action-bar">
          <button
            type="button"
            className="btn-calc-continue"
            onClick={handleContinue}
            id="btn-calc-continue-action"
          >
            <span>Continue</span>
            <ArrowRight size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseCalculatorView;
