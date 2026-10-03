import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { notificationsApi, invitesApi } from '../lib/api';

/**
 * The logged-in user's notifications and pending group invites.
 *
 * Loads them when the user logs in, then listens to Supabase Realtime: when
 * the API inserts a notification for this user, the list reloads and
 * `onIncoming` runs (App uses it to refresh balances, since a new notification
 * usually means someone added an expense or a payment).
 */
const EMPTY = { userId: null, notifications: [], unreadCount: 0, invites: [] };

async function fetchInbox(userId) {
  const [list, invites] = await Promise.all([notificationsApi.list(), invitesApi.mine()]);
  return { userId, notifications: list.notifications, unreadCount: list.unreadCount, invites };
}

export function useNotifications(userId, { onIncoming } = {}) {
  // Tagged with the user it belongs to, so a logout/login never shows stale data.
  const [inbox, setInbox] = useState(EMPTY);
  const onIncomingRef = useRef(onIncoming);
  useEffect(() => {
    onIncomingRef.current = onIncoming;
  }, [onIncoming]);

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      setInbox(await fetchInbox(userId));
    } catch (err) {
      console.warn('[notifications] could not load:', err.message);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    fetchInbox(userId)
      .then((data) => !cancelled && setInbox(data))
      .catch((err) => console.warn('[notifications] could not load:', err.message));

    if (!supabase) {
      return () => {
        cancelled = true;
      };
    }
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => {
          reload();
          onIncomingRef.current?.();
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, reload]);

  const current = inbox.userId === userId ? inbox : EMPTY;

  const markAllRead = useCallback(async () => {
    setInbox((s) => (s.unreadCount ? { ...s, unreadCount: 0, notifications: s.notifications.map((n) => ({ ...n, read: true })) } : s));
    try {
      await notificationsApi.markAllRead();
    } catch (err) {
      console.warn('[notifications] could not mark read:', err.message);
    }
  }, []);

  return {
    notifications: current.notifications,
    unreadCount: current.unreadCount,
    invites: current.invites,
    reload,
    markAllRead,
  };
}
