import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Bell, 
  Plus, 
  Check, 
  CheckCircle2, 
  Utensils, 
  Wine, 
  GripVertical, 
  Inbox, 
  X,
  Sparkles,
  Users
} from './CustomIcons';

export const ItemizedAmbaganView = ({
  expenseData = null,
  group = null,
  onBack,
  onCompleteSplit,
  onNavigateAddExpense,
  notifications = [],
  unreadCount = 1
}) => {
  const expenseTitle = expenseData?.itemName || 'Yabu Dinner';

  // Unassigned items list (matching Screenshot 3)
  const [unassignedItems, setUnassignedItems] = useState([
    {
      id: 'unassigned-1',
      name: 'Wagyu Tacos',
      category: 'Appetizer',
      categoryIcon: 'appetizer',
      price: 32.00
    },
    {
      id: 'unassigned-2',
      name: 'Sake Carafe',
      category: 'Drinks',
      categoryIcon: 'drinks',
      price: 25.00
    },
    {
      id: 'unassigned-3',
      name: 'Black Cod Miso',
      category: 'Main',
      categoryIcon: 'main',
      price: 45.00
    }
  ]);

  // Member buckets (matching Screenshot 3: Sarah has items, Mike has drop container)
  const [memberBuckets, setMemberBuckets] = useState([
    {
      id: 'bucket-sarah',
      name: 'Sarah',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      avatarEmoji: '🐱',
      avatarBg: '#FFE8EE',
      assignedItems: [
        { id: 'sarah-item-1', name: 'Spicy Tuna Roll', price: 18.00 },
        { id: 'sarah-item-2', name: 'Matcha Mochi', price: 27.00 }
      ]
    },
    {
      id: 'bucket-mike',
      name: 'Mike',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
      avatarEmoji: 'M',
      avatarBg: '#6B4075',
      assignedItems: []
    }
  ]);

  const [toastMessage, setToastMessage] = useState(null);
  const [lastProcessedExpenseKey, setLastProcessedExpenseKey] = useState(null);

  // Drag and Drop State
  const [draggedItemData, setDraggedItemData] = useState(null);
  const [dragOverTargetId, setDragOverTargetId] = useState(null);

  // Reassign Quick Menu State: { bucketId, itemId } or null
  const [activeReassignMenu, setActiveReassignMenu] = useState(null);

  // Split Modal State
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [selectedSplitBucketId, setSelectedSplitBucketId] = useState('bucket-sarah');
  const [selectedSplitItemId, setSelectedSplitItemId] = useState('');
  const [selectedSplitMemberIds, setSelectedSplitMemberIds] = useState([]);

  // Integrate expenseData from Calculator when user assigned who bought it
  useEffect(() => {
    if (!expenseData || !expenseData.amount) return;

    const expenseKey = `${expenseData.itemName}-${expenseData.amount}-${(expenseData.selectedMembers || []).map(m => m.name).join(',')}`;
    if (expenseKey === lastProcessedExpenseKey) return;
    setLastProcessedExpenseKey(expenseKey);

    const amount = Number(expenseData.amount) || 0;
    const itemName = expenseData.itemName || 'New Expense Item';
    const selectedMems = expenseData.selectedMembers || [];

    if (selectedMems.length === 1) {
      // Single person assigned
      const assignedPersonName = selectedMems[0].name.toLowerCase();
      setMemberBuckets(prev => prev.map(bucket => {
        if (bucket.name.toLowerCase().includes(assignedPersonName) || assignedPersonName.includes(bucket.name.toLowerCase())) {
          return {
            ...bucket,
            assignedItems: [
              ...bucket.assignedItems,
              { id: `calc-item-${Date.now()}`, name: itemName, price: amount }
            ]
          };
        }
        return bucket;
      }));
      setToastMessage(`Assigned "${itemName}" (₱${amount.toFixed(2)}) to ${selectedMems[0].name}! ✨`);
      setTimeout(() => setToastMessage(null), 3000);
    } else if (selectedMems.length > 1) {
      // Multiple people assigned -> Split evenly among them
      const splitEach = amount / selectedMems.length;
      const memNames = selectedMems.map(m => m.name.toLowerCase());

      setMemberBuckets(prev => prev.map(bucket => {
        const isSelected = memNames.some(mName => bucket.name.toLowerCase().includes(mName) || mName.includes(bucket.name.toLowerCase()));
        if (isSelected) {
          return {
            ...bucket,
            assignedItems: [
              ...bucket.assignedItems,
              { id: `calc-split-${Date.now()}-${bucket.id}`, name: `${itemName} (Split)`, price: splitEach }
            ]
          };
        }
        return bucket;
      }));
      setToastMessage(`Split "${itemName}" (₱${splitEach.toFixed(2)} each) across selected members! 🤝`);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      // Unassigned
      setUnassignedItems(prev => [
        ...prev,
        {
          id: `unassigned-${Date.now()}`,
          name: itemName,
          category: 'Main',
          categoryIcon: 'main',
          price: amount
        }
      ]);
    }
  }, [expenseData]);

  // Calculate dynamic totals
  const totalAssignedAmount = memberBuckets.reduce((sum, bucket) => {
    return sum + bucket.assignedItems.reduce((bSum, item) => bSum + Number(item.price), 0);
  }, 0);

  const totalUnassignedAmount = unassignedItems.reduce((sum, item) => sum + Number(item.price), 0);
  const overallTotal = totalAssignedAmount + totalUnassignedAmount;
  const remainingAmount = Math.max(0, overallTotal - totalAssignedAmount);
  const assignedPercentage = overallTotal > 0 ? (totalAssignedAmount / overallTotal) * 100 : 0;

  // Drag Handlers
  const handleDragStart = (e, item, sourceBucketId = null) => {
    const payload = { item, sourceBucketId };
    setDraggedItemData(payload);
    try {
      e.dataTransfer.setData('application/json', JSON.stringify(payload));
      e.dataTransfer.setData('text/plain', item.name);
      e.dataTransfer.effectAllowed = 'move';
    } catch (err) {}
  };

  const handleDragEnd = () => {
    setDraggedItemData(null);
    setDragOverTargetId(null);
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch (err) {}
    if (dragOverTargetId !== targetId) {
      setDragOverTargetId(targetId);
    }
  };

  const handleDragLeave = (e, targetId) => {
    e.preventDefault();
    if (dragOverTargetId === targetId) {
      setDragOverTargetId(null);
    }
  };

  // Drop on Member Bucket
  const handleDropOnBucket = (e, targetBucketId) => {
    e.preventDefault();
    setDragOverTargetId(null);

    let data = draggedItemData;
    if (!data) {
      try {
        const jsonStr = e.dataTransfer.getData('application/json');
        if (jsonStr) data = JSON.parse(jsonStr);
      } catch (err) {}
    }

    if (!data || !data.item) {
      setDraggedItemData(null);
      return;
    }

    const { item, sourceBucketId } = data;

    if (sourceBucketId === targetBucketId) {
      setDraggedItemData(null);
      return;
    }

    if (!sourceBucketId) {
      // From Unassigned to Bucket
      setUnassignedItems(prev => prev.filter(i => i.id !== item.id));
      setMemberBuckets(prev => prev.map(bucket => {
        if (bucket.id === targetBucketId) {
          return {
            ...bucket,
            assignedItems: [
              ...bucket.assignedItems,
              { id: `assigned-${Date.now()}-${item.id}`, name: item.name, price: item.price }
            ]
          };
        }
        return bucket;
      }));
    } else {
      // From one Bucket to another Bucket
      setMemberBuckets(prev => prev.map(bucket => {
        if (bucket.id === sourceBucketId) {
          return {
            ...bucket,
            assignedItems: bucket.assignedItems.filter(i => i.id !== item.id)
          };
        }
        if (bucket.id === targetBucketId) {
          return {
            ...bucket,
            assignedItems: [
              ...bucket.assignedItems,
              { id: `moved-${Date.now()}-${item.id}`, name: item.name, price: item.price }
            ]
          };
        }
        return bucket;
      }));
    }

    const targetName = memberBuckets.find(b => b.id === targetBucketId)?.name || 'member';
    setToastMessage(`Assigned "${item.name}" to ${targetName}! ✨`);
    setTimeout(() => setToastMessage(null), 2500);
    setDraggedItemData(null);
  };

  // Drop back to Unassigned Items pool
  const handleDropOnUnassigned = (e) => {
    e.preventDefault();
    setDragOverTargetId(null);

    let data = draggedItemData;
    if (!data) {
      try {
        const jsonStr = e.dataTransfer.getData('application/json');
        if (jsonStr) data = JSON.parse(jsonStr);
      } catch (err) {}
    }

    if (!data || !data.item || !data.sourceBucketId) {
      setDraggedItemData(null);
      return;
    }

    handleUnassignItem(data.sourceBucketId, data.item.id);
    setDraggedItemData(null);
  };

  // Quick Assign from Unassigned
  const handleAssignItem = (item, targetBucketId) => {
    setUnassignedItems(prev => prev.filter(i => i.id !== item.id));
    setMemberBuckets(prev => prev.map(bucket => {
      if (bucket.id === targetBucketId) {
        return {
          ...bucket,
          assignedItems: [...bucket.assignedItems, { id: `assigned-${Date.now()}-${item.id}`, name: item.name, price: item.price }]
        };
      }
      return bucket;
    }));

    const targetName = memberBuckets.find(b => b.id === targetBucketId)?.name || 'member';
    setToastMessage(`Assigned "${item.name}" to ${targetName}! ✨`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Reassign / Move an assigned item from one person to another person directly
  const handleReassignItemToPerson = (sourceBucketId, itemId, targetBucketId) => {
    setActiveReassignMenu(null);
    const sourceBucket = memberBuckets.find(b => b.id === sourceBucketId);
    const item = sourceBucket?.assignedItems.find(i => i.id === itemId);
    if (!item) return;

    if (targetBucketId === 'unassigned') {
      handleUnassignItem(sourceBucketId, itemId);
      return;
    }

    if (sourceBucketId === targetBucketId) return;

    setMemberBuckets(prev => prev.map(b => {
      if (b.id === sourceBucketId) {
        return {
          ...b,
          assignedItems: b.assignedItems.filter(i => i.id !== itemId)
        };
      }
      if (b.id === targetBucketId) {
        return {
          ...b,
          assignedItems: [...b.assignedItems, { id: `reassigned-${Date.now()}-${item.id}`, name: item.name, price: item.price }]
        };
      }
      return b;
    }));

    const targetName = memberBuckets.find(b => b.id === targetBucketId)?.name || 'member';
    setToastMessage(`Moved "${item.name}" to ${targetName}! ⇄`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Unassign an item back to pool
  const handleUnassignItem = (bucketId, itemId) => {
    const bucket = memberBuckets.find(b => b.id === bucketId);
    const item = bucket?.assignedItems.find(i => i.id === itemId);
    if (!item) return;

    setMemberBuckets(prev => prev.map(b => {
      if (b.id === bucketId) {
        return {
          ...b,
          assignedItems: b.assignedItems.filter(i => i.id !== itemId)
        };
      }
      return b;
    }));

    setUnassignedItems(prev => [
      ...prev,
      {
        id: `unassigned-${Date.now()}`,
        name: item.name,
        category: 'Shared',
        categoryIcon: 'main',
        price: item.price
      }
    ]);
  };

  // Open Split Item dialog
  const handleOpenSplitModal = (bucketId) => {
    setSelectedSplitBucketId(bucketId);
    const bucket = memberBuckets.find(b => b.id === bucketId);
    if (bucket && bucket.assignedItems.length > 0) {
      setSelectedSplitItemId(bucket.assignedItems[0].id);
    }
    // Default select all member buckets for split
    setSelectedSplitMemberIds(memberBuckets.map(b => b.id));
    setIsSplitModalOpen(true);
  };

  // Toggle member selection in split modal
  const handleToggleSplitMember = (bId) => {
    setSelectedSplitMemberIds(prev => {
      if (prev.includes(bId)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(id => id !== bId);
      }
      return [...prev, bId];
    });
  };

  // Execute Split of selected item among chosen members
  const handleExecuteSplitItem = () => {
    const sourceBucket = memberBuckets.find(b => b.id === selectedSplitBucketId);
    if (!sourceBucket) {
      setIsSplitModalOpen(false);
      return;
    }

    const itemToSplit = sourceBucket.assignedItems.find(i => i.id === selectedSplitItemId) || sourceBucket.assignedItems[0];
    if (!itemToSplit) {
      setIsSplitModalOpen(false);
      return;
    }

    const splitCount = selectedSplitMemberIds.length;
    if (splitCount === 0) return;

    const splitPrice = itemToSplit.price / splitCount;

    setMemberBuckets(prev => prev.map(b => {
      // Remove original item from source bucket
      let newItems = b.id === selectedSplitBucketId 
        ? b.assignedItems.filter(i => i.id !== itemToSplit.id)
        : [...b.assignedItems];

      // If this bucket is in the split recipients, add split share
      if (selectedSplitMemberIds.includes(b.id)) {
        newItems.push({
          id: `split-share-${Date.now()}-${b.id}`,
          name: `${itemToSplit.name} (Split)`,
          price: splitPrice
        });
      }

      return {
        ...b,
        assignedItems: newItems
      };
    }));

    setIsSplitModalOpen(false);
    setToastMessage(`Split "${itemToSplit.name}" (₱${splitPrice.toFixed(2)} each) across ${splitCount} members! 🤝`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handler for Add Item button -> Redirect to Calculator / Add Expense page
  const handleAddItemClick = () => {
    if (onNavigateAddExpense) {
      onNavigateAddExpense();
    } else if (onBack) {
      onBack();
    }
  };

  // Complete split flow
  const handleFinishContinue = () => {
    if (onCompleteSplit) {
      onCompleteSplit({
        title: expenseTitle,
        totalAmount: overallTotal,
        assignedTotal: totalAssignedAmount,
        buckets: memberBuckets
      });
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="item-split-page-container animate-fade-in" onClick={() => setActiveReassignMenu(null)}>
      {/* Top Header Bar */}
      <header className="item-split-header-bar">
        <button 
          className="btn-header-back" 
          onClick={onBack}
          aria-label="Back to calculator"
          id="btn-back-to-calculator"
        >
          <ArrowLeft size={20} color="#1E2026" strokeWidth={2.2} />
        </button>

        <h2 className="item-split-header-title">Item Split</h2>

        <div className="item-split-header-actions">
          <button className="header-notif-btn" aria-label="Notifications">
            <Bell size={20} color="#1E2026" />
            {unreadCount > 0 && <span className="header-notif-dot" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="item-split-content-wrapper">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="item-split-toast-banner animate-fade-in">
            <CheckCircle2 size={18} color="#7C4DFF" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Title & Total Subtitle */}
        <div className="item-split-page-header">
          <h1 className="item-split-main-title">Itemized Ambagan</h1>
          <p className="item-split-main-subtitle">
            {expenseTitle} • Total: ₱{overallTotal.toFixed(2)}
          </p>
        </div>

        {/* Allocation Progress Bar */}
        <div className="split-progress-section">
          <div className="split-progress-bar-track">
            <div 
              className="split-progress-bar-fill" 
              style={{ width: `${Math.min(100, assignedPercentage)}%` }}
            />
          </div>
          <div className="split-progress-labels-row">
            <span className="label-assigned">₱{totalAssignedAmount.toFixed(2)} Assigned</span>
            <span className="label-remaining">₱{remainingAmount.toFixed(2)} Remaining</span>
          </div>
        </div>

        {/* Main Grid: Left Unassigned Items & Right Member Buckets */}
        <div className="split-main-grid">
          {/* Left Column: Unassigned Items */}
          <div className="unassigned-items-col">
            <div className="unassigned-strip-header">
              <span className="unassigned-strip-title">Unassigned Items</span>
            </div>

            <div 
              className={`unassigned-cards-list ${dragOverTargetId === 'unassigned' ? 'drag-over-active' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'unassigned')}
              onDragLeave={(e) => handleDragLeave(e, 'unassigned')}
              onDrop={(e) => handleDropOnUnassigned(e)}
            >
              {unassignedItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`unassigned-item-card ${draggedItemData?.item?.id === item.id ? 'is-dragging' : ''}`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, item, null)}
                  onDragEnd={handleDragEnd}
                  title="Drag and drop onto a member, or use the quick assign buttons"
                >
                  <div className="unassigned-item-info">
                    <div className="unassigned-title-row">
                      <GripVertical size={14} className="drag-handle-unassigned" />
                      <h3 className="unassigned-item-name">{item.name}</h3>
                    </div>
                    <div className="unassigned-item-category">
                      {item.categoryIcon === 'drinks' ? (
                        <Wine size={13} color="#7E8492" />
                      ) : (
                        <Utensils size={13} color="#7E8492" />
                      )}
                      <span>{item.category}</span>
                    </div>
                  </div>

                  <div className="unassigned-item-right">
                    <span className="unassigned-item-price">₱{item.price.toFixed(2)}</span>
                    {/* Quick Assign Buttons */}
                    <div className="quick-assign-buttons">
                      {memberBuckets.map((bucket) => (
                        <button
                          key={bucket.id}
                          type="button"
                          className="btn-quick-assign-member"
                          onClick={() => handleAssignItem(item, bucket.id)}
                          title={`Assign to ${bucket.name}`}
                        >
                          +{bucket.name.charAt(0)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {unassignedItems.length === 0 && (
                <div className="unassigned-empty-box">
                  <CheckCircle2 size={24} color="#059669" />
                  <span>All items have been assigned! 🎉</span>
                </div>
              )}

              {/* + Add Item Button -> Redirects to Add Expense Calculator */}
              <button 
                type="button" 
                className="btn-add-unassigned-item"
                onClick={handleAddItemClick}
                id="btn-open-add-item-calc"
                title="Add an expense with calculator and assign to squad members"
              >
                <Plus size={16} strokeWidth={2.4} />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Right Columns: Member Buckets */}
          <div className="member-buckets-col">
            <div className="member-buckets-grid">
              {memberBuckets.map((bucket) => (
                <div 
                  key={bucket.id} 
                  className={`member-bucket-card ${dragOverTargetId === bucket.id ? 'bucket-drag-hover' : ''}`}
                >
                  {/* Bucket Header */}
                  <div className="bucket-card-header">
                    <div className="bucket-avatar-wrapper">
                      {bucket.avatarEmoji === 'M' ? (
                        <div className="bucket-letter-avatar">{bucket.avatarEmoji}</div>
                      ) : (
                        <img 
                          src={bucket.avatarUrl} 
                          alt={bucket.name} 
                          className="bucket-avatar-img" 
                        />
                      )}
                    </div>
                    <h3 className="bucket-member-name">{bucket.name}</h3>
                  </div>

                  {/* Bucket Dropzone / Assigned List */}
                  <div 
                    className={`bucket-items-dropzone ${dragOverTargetId === bucket.id ? 'drag-over-active' : ''}`}
                    onDragOver={(e) => handleDragOver(e, bucket.id)}
                    onDragLeave={(e) => handleDragLeave(e, bucket.id)}
                    onDrop={(e) => handleDropOnBucket(e, bucket.id)}
                  >
                    {bucket.assignedItems.map((assigned) => {
                      const isMenuOpen = activeReassignMenu?.bucketId === bucket.id && activeReassignMenu?.itemId === assigned.id;
                      return (
                        <div 
                          key={assigned.id} 
                          className={`bucket-assigned-item-row ${draggedItemData?.item?.id === assigned.id ? 'is-dragging' : ''}`}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, assigned, bucket.id)}
                          onDragEnd={handleDragEnd}
                          title="Drag to move to another person, or use the reassign menu"
                        >
                          <div className="assigned-item-left">
                            <GripVertical size={14} className="drag-handle-icon" />
                            <span className="assigned-item-title">{assigned.name}</span>
                          </div>

                          <div className="assigned-item-right">
                            <span className="assigned-item-amount">₱{Number(assigned.price).toFixed(2)}</span>
                            
                            {/* Reassign / Move action button */}
                            <div className="reassign-btn-wrapper" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="btn-reassign-item"
                                onClick={() => setActiveReassignMenu(isMenuOpen ? null : { bucketId: bucket.id, itemId: assigned.id })}
                                title="Reassign to another person"
                              >
                                ⇄
                              </button>

                              {/* Reassign Dropdown Menu */}
                              {isMenuOpen && (
                                <div className="reassign-dropdown-menu animate-fade-in">
                                  <span className="reassign-menu-title">Reassign to:</span>
                                  {memberBuckets
                                    .filter(b => b.id !== bucket.id)
                                    .map(targetB => (
                                      <button
                                        key={targetB.id}
                                        type="button"
                                        className="reassign-menu-item"
                                        onClick={() => handleReassignItemToPerson(bucket.id, assigned.id, targetB.id)}
                                      >
                                        → {targetB.name}
                                      </button>
                                    ))}
                                  <button
                                    type="button"
                                    className="reassign-menu-item unassign-opt"
                                    onClick={() => handleReassignItemToPerson(bucket.id, assigned.id, 'unassigned')}
                                  >
                                    ↩ Unassign Item
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Remove button */}
                            <button 
                              type="button" 
                              className="btn-remove-assigned-item"
                              onClick={() => handleUnassignItem(bucket.id, assigned.id)}
                              title="Unassign item"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {bucket.assignedItems.length === 0 && (
                      <div className="bucket-empty-drop-placeholder">
                        <Inbox size={26} strokeWidth={1.8} className="drop-inbox-icon" />
                        <span>Drop items here</span>
                      </div>
                    )}
                  </div>

                  {/* Split Item Action Button */}
                  <div className="bucket-action-footer">
                    <button 
                      type="button" 
                      className="btn-split-bucket-item"
                      onClick={() => handleOpenSplitModal(bucket.id)}
                      disabled={bucket.assignedItems.length === 0}
                    >
                      Split Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Continue Action */}
        <div className="item-split-bottom-action">
          <button 
            type="button" 
            className="btn-item-split-continue"
            onClick={handleFinishContinue}
            id="btn-item-split-continue-action"
          >
            <span>Continue</span>
            <ArrowRight size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Modal: Interactive Split Item Dialog */}
      {isSplitModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsSplitModalOpen(false)}>
          <div className="modal-card split-item-modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <div className="modal-icon-badge" style={{ backgroundColor: '#F3E8FF' }}>
                  <Users size={20} color="#7C3AED" />
                </div>
                <div>
                  <h3 className="modal-title-heading">Split Item with Squad</h3>
                  <span className="modal-sub">
                    Divide this item evenly or assign among selected friends
                  </span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsSplitModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body split-modal-body">
              {/* Select Item to Split */}
              <div className="form-group">
                <label className="form-label">Select Item to Split</label>
                <div className="custom-select-wrapper">
                  <select 
                    value={selectedSplitItemId} 
                    onChange={(e) => setSelectedSplitItemId(e.target.value)}
                    className="form-select custom-select-input"
                  >
                    {memberBuckets
                      .find(b => b.id === selectedSplitBucketId)
                      ?.assignedItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} — ₱{Number(item.price).toFixed(2)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Split Among Members Selection */}
              <div className="form-group">
                <label className="form-label">
                  Split Among ({selectedSplitMemberIds.length} members selected)
                </label>
                <div className="split-members-picker-row">
                  {memberBuckets.map(b => {
                    const isSelected = selectedSplitMemberIds.includes(b.id);
                    return (
                      <div 
                        key={b.id} 
                        className={`split-member-pill-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleSplitMember(b.id)}
                      >
                        <div className="split-member-avatar-circle">
                          {b.avatarEmoji === 'M' ? (
                            <span>{b.avatarEmoji}</span>
                          ) : (
                            <img src={b.avatarUrl} alt={b.name} />
                          )}
                        </div>
                        <span className="split-member-name">{b.name}</span>
                        {isSelected && <Check size={14} color="#7C3AED" strokeWidth={3} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Computed Split Preview */}
              {(() => {
                const sourceB = memberBuckets.find(b => b.id === selectedSplitBucketId);
                const itemToSplit = sourceB?.assignedItems.find(i => i.id === selectedSplitItemId) || sourceB?.assignedItems[0];
                const count = selectedSplitMemberIds.length;
                const pricePerHead = (itemToSplit?.price || 0) / (count || 1);

                return (
                  <div className="split-preview-summary-box">
                    <div className="split-preview-header">
                      <span className="split-preview-item-name">{itemToSplit?.name || 'Selected Item'}</span>
                      <span className="split-preview-item-total">Total: ₱{(itemToSplit?.price || 0).toFixed(2)}</span>
                    </div>
                    <div className="split-preview-calc-row">
                      <span className="split-calc-math">
                        ₱{(itemToSplit?.price || 0).toFixed(2)} ÷ {count} person{count > 1 ? 's' : ''}
                      </span>
                      <span className="split-calc-result">
                        = <strong>₱{pricePerHead.toFixed(2)}</strong> each
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsSplitModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleExecuteSplitItem}>
                Confirm Split
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemizedAmbaganView;
