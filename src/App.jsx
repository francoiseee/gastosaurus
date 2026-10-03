import { useCallback, useEffect, useRef, useState } from 'react';
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
import PersonalBalanceModal from './components/PersonalBalanceModal';
import GroupDetailModal from './components/GroupDetailModal';
import CreateGroupModal from './components/CreateGroupModal';
import AuthModal from './components/AuthModal';
import { supabase } from './lib/supabase';
import { profileApi, groupsApi, meApi, invitesApi, settlementsApi } from './lib/api';
import { useAsync } from './hooks/useAsync';
import { useNotifications } from './hooks/useNotifications';
import './App.css';

// Screens that draw their own header (everything else gets the Navbar).
const FULL_SCREEN_VIEWS = new Set([
  'landing',
  'group-members',
  'invite-member',
  'expenses-detail',
  'payment',
  'add-expense-calculator',
  'item-split',
  'notifications',
]);

const JOIN_KEY = 'gastosaurus-join-code';

/** The ?join=<code> from the URL (moved into sessionStorage), or one saved earlier. */
function readJoinCode() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('join');
    if (fromUrl) {
      sessionStorage.setItem(JOIN_KEY, fromUrl);
      window.history.replaceState({}, '', window.location.pathname);
    }
    return sessionStorage.getItem(JOIN_KEY);
  } catch {
    return null; // storage blocked: the link simply won't auto-join
  }
}

function clearJoinCode() {
  try {
    sessionStorage.removeItem(JOIN_KEY);
  } catch {
    /* ignore */
  }
}

function App() {
  // ─── Auth ────────────────────────────────────────────────────────────────
  // Supabase keeps the session; our API (/api/me) returns the profile.
  const [authUser, setAuthUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'login' | 'signup' | 'update-password'

  // ─── Navigation ──────────────────────────────────────────────────────────
  const [requestedView, setRequestedView] = useState('landing');
  const currentView = authUser ? requestedView : 'landing'; // everything but the landing page needs a login
  const [previousView, setPreviousView] = useState('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const go = useCallback((view) => {
    setRequestedView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ─── Data ────────────────────────────────────────────────────────────────
  // Bumping refreshKey makes every screen re-fetch. Call refresh() after any save.
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const userId = authUser?.id;
  const groupsQuery = useAsync(() => groupsApi.list(), [userId, refreshKey], { enabled: !!userId });
  const summaryQuery = useAsync(() => meApi.summary(), [userId, refreshKey], { enabled: !!userId });
  const groups = groupsQuery.data ?? [];
  const inbox = useNotifications(userId, { onIncoming: refresh });

  // ─── Toast ───────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = useCallback((message, tone = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);
  const showError = useCallback((err) => showToast(err?.message || 'Something went wrong.', 'error'), [showToast]);

  // ─── Modals and in-progress flows ────────────────────────────────────────
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isPersonalBalanceOpen, setIsPersonalBalanceOpen] = useState(false);
  const [isGroupDetailOpen, setIsGroupDetailOpen] = useState(false);
  const [expenseDraft, setExpenseDraft] = useState(null); // { groupId, members, items, description, paidBy }
  const [paymentItems, setPaymentItems] = useState([]); // suggested payments chosen on Settlements

  // Supabase Auth: restores "Keep me logged in" sessions, finishes Google /
  // email-link sign-ins, and reacts to log out.
  useEffect(() => {
    if (!supabase) return undefined;

    const loadProfile = async (session) => {
      try {
        return await profileApi.get();
      } catch (err) {
        console.warn('[auth] Could not load profile from /api/me:', err.message);
        const meta = session.user.user_metadata || {};
        return {
          id: session.user.id,
          email: session.user.email,
          name: meta.name || meta.full_name || session.user.email?.split('@')[0] || 'Budget Dino',
        };
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update-password');
        setIsAuthOpen(true);
      }
      if (!session) {
        setAuthUser(null);
        // Opened an invite link while logged out → ask them to sign up / log in first.
        if (event === 'INITIAL_SESSION' && readJoinCode()) {
          setAuthMode('signup');
          setIsAuthOpen(true);
        }
        return;
      }
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Supabase recommends not awaiting other Supabase calls inside this callback.
        setTimeout(async () => {
          setAuthUser(await loadProfile(session));
          if (event === 'INITIAL_SESSION') setRequestedView((v) => (v === 'landing' ? 'dashboard' : v));
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Join-by-link: <app>/?join=<code>. The code is kept in sessionStorage
  // so it survives the sign-up / log-in step.
  const [joinCode, setJoinCode] = useState(readJoinCode);

  useEffect(() => {
    if (!joinCode || !authUser) return;
    invitesApi
      .join(joinCode)
      .then((group) => {
        showToast(`You're in "${group.name}"! 🦖`);
        setSelectedGroupId(group.id);
        go('group-members');
        refresh();
      })
      .catch(showError)
      .finally(() => {
        clearJoinCode();
        setJoinCode(null);
      });
  }, [joinCode, authUser, go, refresh, showToast, showError]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const openAuth = (mode = 'login') => {
    if (authUser) return go('dashboard');
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
    go('dashboard');
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    setAuthUser(null);
    setSelectedGroupId(null);
    setExpenseDraft(null);
    go('landing');
  };

  const openGroup = (group) => {
    setSelectedGroupId(group.id);
    go('group-members');
  };

  const openNotifications = () => {
    setPreviousView(currentView);
    go('notifications');
  };

  const handleGroupCreated = (detail) => {
    setIsCreateGroupOpen(false);
    setSelectedGroupId(detail.group.id);
    showToast(`Created "${detail.group.name}" 🎉 Now invite your squad.`);
    refresh();
    go('invite-member');
  };

  // Add expense: calculator (one item at a time) → item split → save.
  const startExpense = (groupId = selectedGroupId ?? groups[0]?.id) => {
    if (!groupId) {
      showToast('Create a group first, then add expenses to it.', 'error');
      setIsCreateGroupOpen(true);
      return;
    }
    setSelectedGroupId(groupId);
    setExpenseDraft({ groupId, members: [], items: [], description: '', paidBy: null });
    go('add-expense-calculator');
  };

  const handleCalculatorContinue = (item, members) => {
    setExpenseDraft((d) => ({
      ...d,
      members,
      description: d.description || item.name,
      items: [...d.items, { ...item, id: `item-${Date.now()}` }],
    }));
    go('item-split');
  };

  const handleExpenseSaved = (expense) => {
    showToast(`Added "${expense.description}" — ₱${expense.totalAmount.toFixed(2)} 🎉`);
    setExpenseDraft(null);
    setSelectedGroupId(expense.groupId);
    refresh();
    go('group-members');
  };

  const handleLeftGroup = (groupName) => {
    showToast(`You left "${groupName}".`);
    setSelectedGroupId(null);
    refresh();
    go('groups');
  };

  const openPayment = (items) => {
    setPaymentItems(items);
    go('payment');
  };

  const handleAcceptInvite = async (invite) => {
    try {
      const group = await invitesApi.accept(invite.id);
      showToast(`You joined "${group.name}" 🦖`);
      inbox.reload();
      refresh();
      openGroup(group);
    } catch (err) {
      showError(err);
    }
  };

  const handleDeclineInvite = async (invite) => {
    try {
      await invitesApi.decline(invite.id);
      showToast('Invite declined.');
      inbox.reload();
    } catch (err) {
      showError(err);
    }
  };

  const handleConfirmPayment = async (settlementId) => {
    try {
      const s = await settlementsApi.confirm(settlementId);
      showToast(`Confirmed ₱${s.amount.toFixed(2)} from ${s.from.name} ✅`);
      refresh();
    } catch (err) {
      showError(err);
    }
  };

  // Props every screen with its own header needs for the bell.
  const bell = { unreadCount: inbox.unreadCount, onOpenNotifications: openNotifications };
  const backToGroup = () => (selectedGroupId ? go('group-members') : go('groups'));

  return (
    <div className="app-container">
      {!FULL_SCREEN_VIEWS.has(currentView) && (
        <Navbar
          currentTab={currentView}
          onSelectTab={go}
          onNavigateHome={() => go('landing')}
          notifications={inbox.notifications}
          unreadCount={inbox.unreadCount}
          onOpenNotifs={openNotifications}
          userName={authUser?.name}
          onLogout={handleLogout}
        />
      )}

      <main className="main-content-area">
        {currentView === 'landing' && (
          <LandingPage
            onStartSaving={() => openAuth('signup')}
            onOpenAuth={openAuth}
            onOpenDashboard={() => openAuth('login')}
            isLoggedIn={!!authUser}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            summary={summaryQuery.data}
            groups={groups}
            isLoading={groupsQuery.loading && !groupsQuery.data}
            onSettleUpClick={() => go('settlements')}
            onPersonalBalanceClick={() => setIsPersonalBalanceOpen(true)}
            onViewGroupClick={openGroup}
            onViewAllGroups={() => go('groups')}
            onCreateGroupClick={() => setIsCreateGroupOpen(true)}
          />
        )}

        {currentView === 'groups' && (
          <GroupsView groups={groups} onViewGroupClick={openGroup} onAddGroup={() => setIsCreateGroupOpen(true)} />
        )}

        {currentView === 'group-members' && selectedGroupId && (
          <GroupMembersView
            groupId={selectedGroupId}
            refreshKey={refreshKey}
            onBack={() => go('groups')}
            onViewSettlements={() => go('settlements')}
            onViewExpensesDetail={() => go('expenses-detail')}
            onAddExpense={() => startExpense(selectedGroupId)}
            onNavigateInviteMember={() => go('invite-member')}
            onOpenDetails={() => setIsGroupDetailOpen(true)}
            onLeft={handleLeftGroup}
            onChanged={refresh}
            showToast={showToast}
            {...bell}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsView
            notifications={inbox.notifications}
            invites={inbox.invites}
            onMarkAllRead={inbox.markAllRead}
            onAcceptInvite={handleAcceptInvite}
            onDeclineInvite={handleDeclineInvite}
            onConfirmPayment={handleConfirmPayment}
            onOpenGroup={(groupId) => openGroup({ id: groupId })}
            onBack={() => go(previousView || 'dashboard')}
          />
        )}

        {currentView === 'invite-member' && selectedGroupId && (
          <InviteMemberView
            groupId={selectedGroupId}
            onBack={backToGroup}
            onContinue={backToGroup}
            onChanged={refresh}
            showToast={showToast}
          />
        )}

        {currentView === 'add-expense-calculator' && expenseDraft && (
          <AddExpenseCalculatorView
            groups={expenseDraft.items.length ? [] : groups} // switching groups only before the first item
            groupId={expenseDraft.groupId}
            onChangeGroup={(groupId) => startExpense(groupId)}
            onBack={() => {
              if (expenseDraft.items.length) go('item-split');
              else {
                setExpenseDraft(null);
                backToGroup();
              }
            }}
            onContinue={handleCalculatorContinue}
            showToast={showToast}
            {...bell}
          />
        )}

        {currentView === 'item-split' && expenseDraft && (
          <ItemizedAmbaganView
            draft={expenseDraft}
            onDraftChange={setExpenseDraft}
            onBack={() => go('add-expense-calculator')}
            onNavigateAddExpense={() => go('add-expense-calculator')}
            onSaved={handleExpenseSaved}
            showToast={showToast}
            {...bell}
          />
        )}

        {currentView === 'expenses-detail' && selectedGroupId && (
          <ExpensesDetailView
            groupId={selectedGroupId}
            refreshKey={refreshKey}
            onBack={() => go('group-members')}
            onAddExpense={() => startExpense(selectedGroupId)}
            onViewSettlements={() => go('settlements')}
            onChanged={refresh}
            showToast={showToast}
            {...bell}
          />
        )}

        {currentView === 'settlements' && (
          <SettlementsView
            refreshKey={refreshKey}
            onNavigatePayment={openPayment}
            onViewGroupMembers={backToGroup}
            onChanged={refresh}
            showToast={showToast}
          />
        )}

        {currentView === 'payment' && (
          <PaymentView
            items={paymentItems}
            onBack={() => go('settlements')}
            onDone={() => {
              refresh();
              go('settlements');
            }}
            showToast={showToast}
            {...bell}
          />
        )}
      </main>

      {toast && (
        <div className={`app-toast app-toast-${toast.tone}`} role="status" onClick={() => setToast(null)}>
          {toast.message}
        </div>
      )}

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        currentUserName={authUser?.name}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      <PersonalBalanceModal
        isOpen={isPersonalBalanceOpen}
        summary={summaryQuery.data}
        onClose={() => setIsPersonalBalanceOpen(false)}
        onChanged={refresh}
        showToast={showToast}
      />

      <GroupDetailModal
        groupId={selectedGroupId}
        refreshKey={refreshKey}
        isOpen={isGroupDetailOpen && !!selectedGroupId}
        onClose={() => setIsGroupDetailOpen(false)}
        onChanged={refresh}
        onDeleted={() => {
          setIsGroupDetailOpen(false);
          setSelectedGroupId(null);
          refresh();
          go('groups');
        }}
        showToast={showToast}
        onAddExpenseToGroup={() => {
          setIsGroupDetailOpen(false);
          startExpense(selectedGroupId);
        }}
      />
    </div>
  );
}

export default App;
