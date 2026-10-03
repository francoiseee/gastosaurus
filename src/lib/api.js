// Calls to our own Express API (server/). Every request carries the user's
// Supabase access token so the server knows who is asking.
import { supabase } from './supabase';

const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export class ApiError extends Error {
  constructor(status, { code, message, fields } = {}) {
    super(message || 'Something went wrong. Please try again.');
    this.status = status;
    this.code = code;
    this.fields = fields || {};
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const { data } = (await supabase?.auth.getSession()) ?? { data: {} };
  const token = data?.session?.access_token;

  let res;
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(body && { 'Content-Type': 'application/json' }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: "Can't reach the Gastosaurus server. Is the backend running? (cd server && npm run dev)",
    });
  }

  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.error ?? { message: `Request failed (${res.status}).` });
  return json;
}

export const profileApi = {
  /** The logged-in user's profile: { id, email, name, avatarEmoji, monthlyBudget, createdAt } */
  get: () => apiRequest('/me').then((d) => d.user),
  update: (fields) => apiRequest('/me', { method: 'PATCH', body: fields }).then((d) => d.user),
};

// ─── Groups, expenses, balances, settlements, notifications ─────────────────
// Money is sent and received in pesos (e.g. 1850.5); the server does all the
// splitting math in centavos. Errors throw ApiError with .fields for forms.
const q = (params = {}) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined)).toString();
  return s ? `?${s}` : '';
};

export const groupsApi = {
  /** My groups with my balance in each: [{ id, name, balance, statusType, membersCount, ... }] */
  list: () => apiRequest('/groups').then((d) => d.groups),
  /** { name, category?, iconId?, iconBg?, iconColor?, note?, members?: [{ name, email? }] } → { group, members, pendingInvites } */
  create: (body) => apiRequest('/groups', { method: 'POST', body }),
  /** → { group, members, pendingInvites } */
  get: (groupId) => apiRequest(`/groups/${groupId}`),
  update: (groupId, fields) => apiRequest(`/groups/${groupId}`, { method: 'PATCH', body: fields }),
  remove: (groupId) => apiRequest(`/groups/${groupId}`, { method: 'DELETE' }),
  leave: (groupId) => apiRequest(`/groups/${groupId}/members/me`, { method: 'DELETE' }),
  /** Add a friend by name (guest); with email they also get an invite. → member */
  addMember: (groupId, { name, email }) =>
    apiRequest(`/groups/${groupId}/members`, { method: 'POST', body: { name, email } }).then((d) => d.member),
  updateMember: (groupId, memberId, fields) =>
    apiRequest(`/groups/${groupId}/members/${memberId}`, { method: 'PATCH', body: fields }).then((d) => d.member),
  removeMember: (groupId, memberId) => apiRequest(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' }),
  /** → { me, members, suggestedSettlements: [{ from, to, amount }], isSettled } */
  balances: (groupId) => apiRequest(`/groups/${groupId}/balances`),
  /** Admin: new join-link code (old links stop working). → { group, members, pendingInvites } */
  resetInviteLink: (groupId) => apiRequest(`/groups/${groupId}/invite-code`, { method: 'POST' }),
  /** Nudge everyone who owes (or just memberIds). → { sent: [...], skipped: [...] } */
  sendReminders: (groupId, memberIds) =>
    apiRequest(`/groups/${groupId}/reminders`, { method: 'POST', body: memberIds ? { memberIds } : {} }),
};

/** The share link for a group's invite code. Opening it joins the group. */
export const inviteLinkFor = (inviteCode) => `${window.location.origin}/?join=${inviteCode}`;

export const invitesApi = {
  /** Invite by email; memberId = a guest spot they will claim. */
  send: (groupId, { email, memberId }) =>
    apiRequest(`/groups/${groupId}/invites`, { method: 'POST', body: { email, memberId } }).then((d) => d.invite),
  /** Invites waiting for me */
  mine: () => apiRequest('/invites').then((d) => d.invites),
  accept: (inviteId) => apiRequest(`/invites/${inviteId}/accept`, { method: 'POST' }).then((d) => d.group),
  /** Join with the code from a share link. → group summary */
  join: (code) => apiRequest('/invites/join', { method: 'POST', body: { code } }).then((d) => d.group),
  decline: (inviteId) => apiRequest(`/invites/${inviteId}/decline`, { method: 'POST' }),
  cancel: (inviteId) => apiRequest(`/invites/${inviteId}`, { method: 'DELETE' }),
};

export const expensesApi = {
  list: (groupId, { limit, offset } = {}) =>
    apiRequest(`/groups/${groupId}/expenses${q({ limit, offset })}`).then((d) => d.expenses),
  /**
   * equal:    { description, splitType: 'equal', totalAmount, memberIds, paidBy?, spentOn? }
   * custom:   { description, splitType: 'custom', totalAmount, shares: [{ memberId, amount }] }
   * itemized: { description, splitType: 'itemized', items: [{ name, price, memberIds }], charges?: [{ name, amount }] }
   */
  create: (groupId, body) => apiRequest(`/groups/${groupId}/expenses`, { method: 'POST', body }).then((d) => d.expense),
  get: (expenseId) => apiRequest(`/expenses/${expenseId}`).then((d) => d.expense),
  /** Details only ({ description?, spentOn?, note? }) or a full re-split (same body as create). */
  update: (expenseId, body) => apiRequest(`/expenses/${expenseId}`, { method: 'PATCH', body }).then((d) => d.expense),
  remove: (expenseId) => apiRequest(`/expenses/${expenseId}`, { method: 'DELETE' }),
};

export const settlementsApi = {
  list: (groupId) => apiRequest(`/groups/${groupId}/settlements`).then((d) => d.settlements),
  /** { toMemberId, amount, method: 'cash'|'gcash'|'maya'|'bank', fromMemberId?, note? } */
  record: (groupId, body) =>
    apiRequest(`/groups/${groupId}/settlements`, { method: 'POST', body }).then((d) => d.settlement),
  confirm: (settlementId) =>
    apiRequest(`/settlements/${settlementId}`, { method: 'PATCH', body: { status: 'completed' } }).then((d) => d.settlement),
  remove: (settlementId) => apiRequest(`/settlements/${settlementId}`, { method: 'DELETE' }),
};

export const meApi = {
  /** Dashboard cards: { netBalance, youOwe, youAreOwed, personalSpending, monthlyBudget, ... } */
  summary: (month) => apiRequest(`/me/summary${q({ month })}`).then((d) => d.summary),
  /** { toPay, toReceive, awaitingMyConfirmation, awaitingTheirConfirmation, recent } */
  settleUp: () => apiRequest('/me/settle-up'),
};

export const notificationsApi = {
  /** → { notifications: [{ id, type, title, body, data, read, createdAt }], unreadCount } */
  list: ({ limit, before, unread } = {}) => apiRequest(`/notifications${q({ limit, before, unread })}`),
  markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }).then((d) => d.notification),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),
  remove: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
};
