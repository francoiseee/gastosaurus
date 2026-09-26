import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import GroupsView from './components/GroupsView';
import GroupMembersView from './components/GroupMembersView';
import ExpensesDetailView from './components/ExpensesDetailView';
import SettlementsView from './components/SettlementsView';
import SettleUpModal from './components/SettleUpModal';
import PersonalBalanceModal from './components/PersonalBalanceModal';
import GroupDetailModal from './components/GroupDetailModal';
import AddExpenseModal from './components/AddExpenseModal';
import CreateGroupModal from './components/CreateGroupModal';
import AuthModal from './components/AuthModal';
import { mockUserData, mockGroups, mockSettlements, mockNotifications } from './data/mockData';
import './App.css';

function App() {
  // Current view: 'landing' | 'dashboard' | 'groups' | 'settlements' | 'group-members'
  const [currentView, setCurrentView] = useState('landing');
  
  // App state
  const [userData, setUserData] = useState(mockUserData);
  const [groups, setGroups] = useState(mockGroups);
  const [settlements, setSettlements] = useState(mockSettlements);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [selectedGroup, setSelectedGroup] = useState(mockGroups[0]);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'login' | 'signup'
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [isPersonalBalanceOpen, setIsPersonalBalanceOpen] = useState(false);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Trigger Auth Modal from Landing Page
  const handleStartSaving = (mode = 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Auth Success -> Redirect to Dashboard!
  const handleAuthSuccess = (loggedUser) => {
    setIsAuthOpen(false);
    
    if (loggedUser && loggedUser.name) {
      setUserData(prev => ({
        ...prev,
        name: loggedUser.name
      }));
    }

    // Add welcome notification
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `Welcome to Gastosaurus, ${loggedUser?.name || 'Budget Dino'}! 🦖`,
        time: 'Just now',
        read: false,
        type: 'auth'
      },
      ...prev
    ]);

    // Seamless redirect to dashboard
    setCurrentView('dashboard');
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

  // Handler for creating a new active group
  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [newGroup, ...prev]);
    
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

    // Open the new group's members view
    handleOpenGroupMembers(newGroup);
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

  return (
    <div className="app-container">
      {/* If in app views (dashboard, groups, settlements), render full navbar.
          Note: GroupMembersView & ExpensesDetailView have their own specialized headers */}
      {currentView !== 'landing' && currentView !== 'group-members' && currentView !== 'expenses-detail' && (
        <Navbar
          currentTab={currentView}
          onSelectTab={handleTabSelect}
          onNavigateHome={handleNavigateHome}
          notifications={notifications}
          unreadCount={notifications.filter(n => !n.read).length}
        />
      )}

      {/* Main Content Area */}
      <main className="main-content-area">
        {currentView === 'landing' && (
          <LandingPage
            onStartSaving={() => handleStartSaving('signup')}
            onOpenAuth={handleOpenAuth}
            onOpenDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            userData={userData}
            groups={groups}
            onSettleUpClick={() => setIsSettleUpOpen(true)}
            onPersonalBalanceClick={() => setIsPersonalBalanceOpen(true)}
            onViewGroupClick={(group) => handleOpenGroupMembers(group)}
            onViewAllGroups={() => setCurrentView('groups')}
            onCreateGroupClick={() => setIsCreateGroupOpen(true)}
            onAddAmbaganClick={() => setIsAddExpenseOpen(true)}
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
            onAddExpense={() => setIsAddExpenseOpen(true)}
            onLeaveGroup={handleLeaveGroup}
            onInviteMember={handleInviteMember}
            onResendInvite={handleResendInvite}
            onCancelInvite={handleCancelInvite}
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
            onAddExpense={() => setIsAddExpenseOpen(true)}
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
