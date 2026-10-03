import React, { useEffect, useRef, useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import GroupsView from './components/GroupsView';
import GroupMembersView from './components/GroupMembersView';
import ExpensesDetailView from './components/ExpensesDetailView';
import SettlementsView from './components/SettlementsView';
import InviteMemberView from './components/InviteMemberView';
import PaymentView from './components/PaymentView';
import AddExpenseCalculatorView from './components/AddExpenseCalculatorView';
import ItemizedAmbaganView from './components/ItemizedAmbaganView';
import NotificationsView from './components/NotificationsView';
import SettleUpModal from './components/SettleUpModal';
import PersonalBalanceModal from './components/PersonalBalanceModal';
import GroupDetailModal from './components/GroupDetailModal';
import AddExpenseModal from './components/AddExpenseModal';
import CreateGroupModal from './components/CreateGroupModal';
import AuthModal from './components/AuthModal';
import { mockUserData, mockGroups, mockSettlements, mockNotifications } from './data/mockData';
import { supabase } from './lib/supabase';
import { profileApi } from './lib/api';
import './App.css';

function App() {
  // Current view: 'landing' | 'dashboard' | 'groups' | 'settlements' | 'payment' | 'group-members' | 'invite-member' | 'expenses-detail' | 'notifications'
  const [requestedView, setCurrentView] = useState('landing');

  // Auth — the logged-in user's profile (null = logged out).
  // Supabase keeps the session; our API (/api/me) returns the profile.
  const [authUser, setAuthUser] = useState(null);
  const welcomedUserId = useRef(null);

  // Everything except the landing page requires a logged-in user.
  const currentView = authUser ? requestedView : 'landing';
  const [previousView, setPreviousView] = useState('dashboard');
  
  // App state
  const [userData, setUserData] = useState(mockUserData);
  const [groups, setGroups] = useState(mockGroups);
  const [settlements, setSettlements] = useState(mockSettlements);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [selectedGroup, setSelectedGroup] = useState(mockGroups[0]);
  const [customPaymentItems, setCustomPaymentItems] = useState(null);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'login' | 'signup'
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [isPersonalBalanceOpen, setIsPersonalBalanceOpen] = useState(false);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Listen to Supabase Auth: restores "Keep me logged in" sessions on load,
  // finishes Google sign-in / email-link redirects, and reacts to log out.
  useEffect(() => {
    if (!supabase) return undefined;

    const loadProfile = async (session) => {
      try {
        return await profileApi.get();
      } catch (err) {
        // API not running? Still let the user in using what Supabase knows.
        console.warn('[auth] Could not load profile from /api/me:', err.message);
        const meta = session.user.user_metadata || {};
        return {
          id: session.user.id,
          email: session.user.email,
          name: meta.name || meta.full_name || session.user.email?.split('@')[0] || 'Budget Dino',
        };
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update-password');
        setIsAuthOpen(true);
      }

      if (!session) {
        setAuthUser(null);
        return;
      }

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Supabase recommends not awaiting other Supabase calls inside this callback.
        setTimeout(async () => {
          const profile = await loadProfile(session);
          setAuthUser(profile);
          setUserData(prev => ({ ...prev, name: profile.name }));

          // Returning visitor (or back from Google): skip the landing page.
          if (event === 'INITIAL_SESSION') {
            setCurrentView(view => (view === 'landing' ? 'dashboard' : view));
          }

          if (welcomedUserId.current !== profile.id) {
            welcomedUserId.current = profile.id;
            setNotifications(prev => [
              {
                id: `notif-${Date.now()}`,
                title: `Welcome to Gastosaurus, ${profile.name}! 🦖`,
                time: 'Just now',
                read: false,
                type: 'auth'
              },
              ...prev
            ]);
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Trigger Auth Modal from Landing Page
  const handleStartSaving = (mode = 'signup') => {
    if (authUser) {
      setCurrentView('dashboard');
      return;
    }
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Auth Success -> Redirect to Dashboard!
  // (The Supabase listener above loads the profile and adds the welcome notification.)
  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    setAuthUser(null);
    welcomedUserId.current = null;
    setUserData(mockUserData);
    setNotifications(mockNotifications);
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabSelect = (tabId) => {
    setCurrentView(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for opening a group's members page (GastoFriends)
  const handleOpenGroupMembers = (group) => {
    setSelectedGroup(group);
    setCurrentView('group-members');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [currentExpenseData, setCurrentExpenseData] = useState(null);

  // Handler for creating a new active group -> Opens Build Your Squad (Invite Member) view
  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [newGroup, ...prev]);
    setSelectedGroup(newGroup);
    
    // Push notification
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `Created active group "${newGroup.name}" 🎉`,
        time: 'Just now',
        read: false,
        type: 'group'
      },
      ...prev
    ]);

    // Navigate to Build Your Squad (Screenshot 1)
    setCurrentView('invite-member');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for opening the Add Expense Calculator view (Screenshot 2)
  const handleOpenAddExpenseCalculator = (initialItem = null) => {
    setCurrentExpenseData(initialItem || { amount: 145.00, itemName: 'Yabu Dinner' });
    setCurrentView('add-expense-calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for continuing from Calculator to Itemized Split (Screenshot 3)
  const handleContinueToItemSplit = (calcData) => {
    setCurrentExpenseData(calcData);
    setCurrentView('item-split');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for completing Itemized Split
  const handleFinishItemSplit = ({ title, totalAmount, buckets }) => {
    setUserData(prev => ({
      ...prev,
      youOwe: prev.youOwe + 45.00
    }));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `Itemized ambagan "${title}" added — Total ₱${totalAmount.toFixed(2)} 🎉`,
        time: 'Just now',
        read: false,
        type: 'expense'
      },
      ...prev
    ]);

    if (selectedGroup) {
      setCurrentView('group-members');
    } else {
      setCurrentView('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for inviting a member to a group
  const handleInviteMember = (groupId, { name, email }) => {
    const newInvite = {
      id: `inv-${Date.now()}`,
      name: name || 'Pending Invite',
      email: email,
      status: 'Waiting for response...',
      date: 'Just now'
    };

    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          pendingInvites: [...(g.pendingInvites || []), newInvite]
        };
      }
      return g;
    }));

    if (selectedGroup && selectedGroup.id === groupId) {
      setSelectedGroup(prev => ({
        ...prev,
        pendingInvites: [...(prev.pendingInvites || []), newInvite]
      }));
    }

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `Sent invite to ${email}`,
        time: 'Just now',
        read: false,
        type: 'group'
      },
      ...prev
    ]);
  };

  // Handler for resending invite
  const handleResendInvite = (groupId, inviteId, email) => {
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `Invitation reminder sent to ${email}`,
        time: 'Just now',
        read: false,
        type: 'group'
      },
      ...prev
    ]);
  };

  // Handler for canceling invite
  const handleCancelInvite = (groupId, inviteId) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          pendingInvites: (g.pendingInvites || []).filter(inv => inv.id !== inviteId)
        };
      }
      return g;
    }));

    if (selectedGroup && selectedGroup.id === groupId) {
      setSelectedGroup(prev => ({
        ...prev,
        pendingInvites: (prev.pendingInvites || []).filter(inv => inv.id !== inviteId)
      }));
    }
  };

  // Handler for leaving group
  const handleLeaveGroup = (groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `Left group`,
        time: 'Just now',
        read: false,
        type: 'group'
      },
      ...prev
    ]);
    setCurrentView('groups');
  };

  // Handler for changing icon of an existing group
  const handleUpdateGroupIcon = (groupId, newIconId) => {
    setGroups(prevGroups =>
      prevGroups.map(g => (g.id === groupId ? { ...g, iconId: newIconId } : g))
    );
    if (selectedGroup && selectedGroup.id === groupId) {
      setSelectedGroup(prev => ({ ...prev, iconId: newIconId }));
    }
    if (selectedGroupDetail && selectedGroupDetail.id === groupId) {
      setSelectedGroupDetail(prev => ({ ...prev, iconId: newIconId }));
    }
  };

  // Handler for settling an item
  const handleConfirmSettle = () => {
    setUserData(prev => ({
      ...prev,
      youOwe: Math.max(0, prev.youOwe - 45.00),
      netBalance: prev.netBalance + 45.00
    }));

    setGroups(prevGroups => 
      prevGroups.map(g => {
        if (g.id === 'apartment-bills' || g.id === 'apt-4b') {
          return { ...g, balance: 0.00, statusText: 'Settled', statusType: 'settled' };
        }
        return g;
      })
    );

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'You settled ₱1,200.00 with Miguel Tan',
        time: 'Just now',
        read: false,
        type: 'payment'
      },
      ...prev
    ]);
  };

  // Handler for navigating to Payment / Settle Balances Page
  const handleNavigateToPayment = (customItems = null) => {
    setCustomPaymentItems(customItems);
    setCurrentView('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for completing payment from PaymentView
  const handleConfirmPaymentFromView = ({ selectedIds, totalAmount, paymentMethod }) => {
    setUserData(prev => ({
      ...prev,
      youOwe: Math.max(0, prev.youOwe - totalAmount),
      netBalance: prev.netBalance + totalAmount
    }));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `Settled ₱${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} via ${paymentMethod} 🎉`,
        time: 'Just now',
        read: false,
        type: 'payment'
      },
      ...prev
    ]);

    setCurrentView('settlements');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSettleItemFromView = (settlementId) => {
    setSettlements(prev => 
      prev.map(s => s.id === settlementId ? { ...s, status: 'Completed' } : s)
    );
  };

  const handleExpenseAdded = ({ description, total }) => {
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `Added "${description}" — ₱${total.toFixed(2)}`,
        time: 'Just now',
        read: false,
        type: 'expense'
      },
      ...prev
    ]);
  };

  const handleOpenNotifications = () => {
    setPreviousView(currentView);
    setCurrentView('notifications');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* If in app views (dashboard, groups, settlements), render full navbar.
          Note: GroupMembersView, InviteMemberView, ExpensesDetailView, PaymentView, AddExpenseCalculatorView, ItemizedAmbaganView & NotificationsView have their own specialized headers */}
      {currentView !== 'landing' && 
       currentView !== 'group-members' && 
       currentView !== 'invite-member' && 
       currentView !== 'expenses-detail' && 
       currentView !== 'payment' && 
       currentView !== 'add-expense-calculator' && 
       currentView !== 'item-split' && 
       currentView !== 'notifications' && (
        <Navbar
          currentTab={currentView}
          onSelectTab={handleTabSelect}
          onNavigateHome={handleNavigateHome}
          notifications={notifications}
          unreadCount={notifications.filter(n => !n.read).length}
          userName={authUser?.name}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Area */}
      <main className="main-content-area">
        {currentView === 'landing' && (
          <LandingPage
            onStartSaving={() => handleStartSaving('signup')}
            onOpenAuth={handleOpenAuth}
            onOpenDashboard={() => (authUser ? setCurrentView('dashboard') : handleOpenAuth('login'))}
            isLoggedIn={!!authUser}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            userData={userData}
            groups={groups}
            onSettleUpClick={() => handleNavigateToPayment()}
            onPersonalBalanceClick={() => setIsPersonalBalanceOpen(true)}
            onViewGroupClick={(group) => handleOpenGroupMembers(group)}
            onViewAllGroups={() => setCurrentView('groups')}
            onCreateGroupClick={() => setIsCreateGroupOpen(true)}
            onAddAmbaganClick={() => handleOpenAddExpenseCalculator()}
          />
        )}

        {currentView === 'groups' && (
          <GroupsView
            groups={groups}
            onViewGroupClick={(group) => handleOpenGroupMembers(group)}
            onAddGroup={() => setIsCreateGroupOpen(true)}
          />
        )}

        {currentView === 'group-members' && (
          <GroupMembersView
            group={selectedGroup}
            onBack={() => setCurrentView('groups')}
            onViewSettlements={() => setCurrentView('settlements')}
            onViewExpensesDetail={() => {
              setCurrentView('expenses-detail');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddExpense={() => handleOpenAddExpenseCalculator()}
            onLeaveGroup={handleLeaveGroup}
            onInviteMember={handleInviteMember}
            onNavigateInviteMember={() => {
              setCurrentView('invite-member');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onResendInvite={handleResendInvite}
            onCancelInvite={handleCancelInvite}
            onOpenNotifications={handleOpenNotifications}
            notifications={notifications}
            unreadCount={notifications.filter(n => !n.read).length}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsView
            notifications={notifications}
            onBack={() => {
              setCurrentView(previousView || 'dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'invite-member' && (
          <InviteMemberView
            group={selectedGroup}
            onBack={() => {
              if (selectedGroup) {
                setCurrentView('group-members');
              } else {
                setCurrentView('groups');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onContinue={() => {
              if (selectedGroup) {
                setCurrentView('group-members');
              } else {
                setCurrentView('dashboard');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onInviteMember={handleInviteMember}
            notifications={notifications}
            unreadCount={notifications.filter(n => !n.read).length}
          />
        )}

        {currentView === 'add-expense-calculator' && (
          <AddExpenseCalculatorView
            group={selectedGroup}
            onBack={() => {
              if (selectedGroup) {
                setCurrentView('group-members');
              } else {
                setCurrentView('dashboard');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onContinue={handleContinueToItemSplit}
            notifications={notifications}
            unreadCount={notifications.filter(n => !n.read).length}
          />
        )}

        {currentView === 'item-split' && (
          <ItemizedAmbaganView
            expenseData={currentExpenseData}
            group={selectedGroup}
            onBack={() => {
              setCurrentView('add-expense-calculator');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCompleteSplit={handleFinishItemSplit}
            onNavigateAddExpense={() => {
              setCurrentView('add-expense-calculator');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            notifications={notifications}
            unreadCount={notifications.filter(n => !n.read).length}
          />
        )}

        {currentView === 'expenses-detail' && (
          <ExpensesDetailView
            group={selectedGroup}
            onBack={() => {
              setCurrentView('group-members');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddExpense={() => handleOpenAddExpenseCalculator()}
            onViewSettlements={() => {
              setCurrentView('settlements');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onViewMembers={() => {
              setCurrentView('group-members');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            notifications={notifications}
            unreadCount={notifications.filter(n => !n.read).length}
          />
        )}

        {currentView === 'settlements' && (
          <SettlementsView
            settlements={settlements}
            onSettleItem={handleSettleItemFromView}
            onViewGroupMembers={() => {
              if (selectedGroup) {
                setCurrentView('group-members');
              } else {
                setCurrentView('groups');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSettleAllDebts={handleNavigateToPayment}
            onNavigatePayment={handleNavigateToPayment}
            onSendReminders={() => {
              setNotifications(prev => [
                {
                  id: `notif-${Date.now()}`,
                  title: 'Payment reminders sent to group members with pending balances! 📬',
                  time: 'Just now',
                  read: false,
                  type: 'settlement'
                },
                ...prev
              ]);
            }}
          />
        )}

        {currentView === 'payment' && (
          <PaymentView
            initialOwedItems={customPaymentItems}
            onBack={() => {
              setCurrentView('settlements');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onConfirmSettle={handleConfirmPaymentFromView}
            notifications={notifications}
            unreadCount={notifications.filter(n => !n.read).length}
          />
        )}
      </main>

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Create Active Group Modal with 3-set Circular Icon Choice */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      {/* Other Modals */}
      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        onConfirmSettle={handleConfirmSettle}
      />

      <PersonalBalanceModal
        isOpen={isPersonalBalanceOpen}
        onClose={() => setIsPersonalBalanceOpen(false)}
      />

      <GroupDetailModal
        group={selectedGroupDetail}
        isOpen={!!selectedGroupDetail}
        onClose={() => setSelectedGroupDetail(null)}
        onUpdateGroupIcon={handleUpdateGroupIcon}
        onAddExpenseToGroup={() => setIsAddExpenseOpen(true)}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onExpenseAdded={handleExpenseAdded}
        group={selectedGroup}
      />
    </div>
  );
}

export default App;
