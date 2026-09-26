import React, { useState, useEffect } from 'react';
import { ReceiptIcon, Plus, Check, Trash2, X, Users, User } from './CustomIcons';
import ribbonIcon from '../assets/ribbon.png';

export const AddExpenseModal = ({ 
  isOpen, 
  onClose, 
  onExpenseAdded, 
  group = null,
  currentUser = 'Alex Rivera'
}) => {
  // Available members from current group or default list
  const defaultMemberList = ['Alex Rivera (You)', 'Sam Taylor', 'Jamie Doe'];
  
  const getGroupMemberList = () => {
    if (group && group.members && group.members.length > 0) {
      return group.members.map(m => m.isCurrentUser ? `${m.name} (You)` : m.name);
    }
    return defaultMemberList;
  };

  const memberList = getGroupMemberList();

  const [description, setDescription] = useState('Dinner at Manam');
  const [items, setItems] = useState([
    { 
      id: 'item-1', 
      name: 'Crispy Sisig Special', 
      price: 280, 
      assignedTo: [memberList[0] || 'Alex Rivera (You)', memberList[1] || 'Sam Taylor'] 
    },
    { 
      id: 'item-2', 
      name: 'Extra Garlic Rice', 
      price: 55, 
      assignedTo: [memberList[0] || 'Alex Rivera (You)'] 
    }
  ]);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([memberList[0] || 'Alex Rivera (You)']);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize members when group changes
  useEffect(() => {
    if (memberList.length > 0) {
      setSelectedMembers([memberList[0]]);
    }
  }, [group]);

  if (!isOpen) return null;

  // Toggle member checkbox in the multi-select
  const handleToggleMember = (memberName) => {
    setErrorMsg('');
    setSelectedMembers(prev => {
      if (prev.includes(memberName)) {
        // If it's the last selected member, keep at least one or allow uncheck with warning
        const next = prev.filter(m => m !== memberName);
        return next;
      } else {
        return [...prev, memberName];
      }
    });
  };

  const handleSelectAllMembers = () => {
    setSelectedMembers([...memberList]);
    setErrorMsg('');
  };

  const handleSelectMeOnly = () => {
    setSelectedMembers([memberList[0] || 'Alex Rivera (You)']);
    setErrorMsg('');
  };

  // Add Item to list
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      setErrorMsg('Please enter an item name');
      return;
    }
    const numPrice = parseFloat(newItemPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg('Please enter a valid price (greater than ₱0)');
      return;
    }
    if (selectedMembers.length === 0) {
      setErrorMsg('Please select at least one person who bought or shared this item');
      return;
    }

    const newItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      price: numPrice,
      assignedTo: [...selectedMembers]
    };

    setItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    setErrorMsg('');
  };

  // Remove Item
  const handleRemoveItem = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Calculations
  const total = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

  // Calculate per-member share automatically
  const memberShares = {};
  memberList.forEach(m => { memberShares[m] = 0; });

  items.forEach(item => {
    const assignedCount = item.assignedTo.length || 1;
    const splitAmount = item.price / assignedCount;
    item.assignedTo.forEach(member => {
      memberShares[member] = (memberShares[member] || 0) + splitAmount;
    });
  });

  // Handle Save
  const handleSave = () => {
    if (items.length === 0) {
      setErrorMsg('Please add at least one item before saving');
      return;
    }

    if (onExpenseAdded) {
      onExpenseAdded({
        description: description.trim() || 'Shared Expense',
        total,
        items,
        memberShares,
        splitType: 'Itemized'
      });
    }
    onClose();
  };

  const priceVal = parseFloat(newItemPrice) || 0;
  const countSelected = selectedMembers.length;
  const perPersonPreview = countSelected > 0 && priceVal > 0 ? (priceVal / countSelected) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="add-expense-modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <div className="modal-icon-badge ribbon-badge">
              <img src={ribbonIcon} alt="Add Expense Ribbon" className="modal-ribbon-icon" />
            </div>
            <div>
              <h3 className="modal-title-heading">Add Expense</h3>
              <span className="modal-sub">
                {group ? `Add items and split for ${group.name}` : 'Add items and select who shared them'}
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className="add-expense-modal-body">
          {/* Expense Title Input */}
          <div className="form-group">
            <label className="form-label-bold">Expense / Receipt Name</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="e.g. Dinner at Manam, Grocery run, Gas"
              className="form-input" 
            />
          </div>

          {/* Current Items List */}
          <div className="expense-items-section">
            <div className="section-label-row">
              <label className="form-label-bold">Ordered Items & Add-ons</label>
              <span className="items-count-badge">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            </div>

            {items.length === 0 ? (
              <div className="empty-items-notice">
                <span>No items added yet. Add an item below with who shared it.</span>
              </div>
            ) : (
              <div className="expense-items-scroll-list">
                {items.map((item) => {
                  const splitEach = item.price / (item.assignedTo.length || 1);
                  return (
                    <div key={item.id} className="expense-item-card-row">
                      <div className="item-main-details">
                        <div className="item-title-line">
                          <strong className="item-name-text">{item.name}</strong>
                          <span className="item-price-text">₱{Number(item.price).toFixed(2)}</span>
                        </div>

                        {/* Who bought / shared this item */}
                        <div className="item-members-row">
                          <span className="shared-by-label">Shared by:</span>
                          <div className="item-member-tags-wrap">
                            {item.assignedTo.map((person, pidx) => (
                              <span key={pidx} className="member-assigned-tag">
                                {person}
                              </span>
                            ))}
                          </div>
                          {item.assignedTo.length > 1 && (
                            <span className="item-split-calculation">
                              (₱{splitEach.toFixed(2)} each)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete Item Button */}
                      <button 
                        className="btn-remove-item"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        title="Remove item"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Additional Item Form */}
          <div className="add-item-box-container">
            <div className="add-item-box-header">
              <span className="add-item-box-title">+ Add Additional Item</span>
              <div className="quick-member-selection-toggles">
                <button 
                  type="button" 
                  className="btn-quick-toggle"
                  onClick={handleSelectAllMembers}
                >
                  All ({memberList.length})
                </button>
                <button 
                  type="button" 
                  className="btn-quick-toggle"
                  onClick={handleSelectMeOnly}
                >
                  Me Only
                </button>
              </div>
            </div>

            <form onSubmit={handleAddItem} className="add-item-form-content">
              {/* Inputs Row */}
              <div className="item-inputs-row">
                <input 
                  type="text" 
                  placeholder="Item name (e.g. Extra Rice, Drinks)" 
                  value={newItemName}
                  onChange={(e) => { setNewItemName(e.target.value); setErrorMsg(''); }}
                  className="form-input flex-input"
                />
                <div className="price-input-wrapper">
                  <span className="currency-prefix">₱</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00" 
                    value={newItemPrice}
                    onChange={(e) => { setNewItemPrice(e.target.value); setErrorMsg(''); }}
                    className="form-input item-price-input"
                  />
                </div>
              </div>

              {/* Who Bought / Shared this Item Checkbox Chips */}
              <div className="member-checkboxes-block">
                <label className="checkbox-section-title">
                  Who bought / consumed this item?
                  {countSelected > 0 && (
                    <span className="selected-count-pill">
                      {countSelected} {countSelected === 1 ? 'person' : 'people'} selected
                    </span>
                  )}
                </label>

                <div className="member-checkbox-grid">
                  {memberList.map((member) => {
                    const isChecked = selectedMembers.includes(member);
                    return (
                      <label 
                        key={member} 
                        className={`member-checkbox-chip ${isChecked ? 'is-checked' : ''}`}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMember(member)}
                          className="hidden-checkbox-input"
                        />
                        <span className="custom-check-box">
                          {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                        </span>
                        <span className="checkbox-member-name">{member}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Live Split Preview for this new item */}
                {priceVal > 0 && countSelected > 0 && (
                  <div className="live-item-split-note">
                    ⚡ <strong>₱{perPersonPreview.toFixed(2)}</strong> per person for this item
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="form-error-banner animate-fade-in">
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* + Add Item Button */}
              <button type="submit" className="btn-add-item-action">
                <Plus size={16} /> Add Item to Expense
              </button>
            </form>
          </div>

          {/* Per-Member Breakdown & Total Summary */}
          <div className="expense-total-summary-card">
            <div className="summary-total-header">
              <span className="total-label-text">Total Bill:</span>
              <span className="total-value-text">₱{total.toFixed(2)}</span>
            </div>

            {/* Split breakdown by person */}
            {items.length > 0 && (
              <div className="member-shares-breakdown-box">
                <span className="breakdown-mini-heading">Split Per Person:</span>
                <div className="member-shares-chips-list">
                  {Object.entries(memberShares)
                    .filter(([_, amount]) => amount > 0)
                    .map(([member, amount]) => (
                      <div key={member} className="member-share-chip">
                        <span className="share-member-name">{member}:</span>
                        <strong className="share-amount-pill">₱{amount.toFixed(2)}</strong>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions-full-row">
          <button type="button" className="btn-secondary-pill" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="button"
            className="btn-primary-pill" 
            onClick={handleSave}
            disabled={items.length === 0}
          >
            Save Expense
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
