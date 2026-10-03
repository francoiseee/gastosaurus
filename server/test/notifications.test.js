// Phase 5: who gets notified about what, the inbox endpoints, and reminders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './helpers/harness.js';

const h = setupHarness();
const s = {};

const ok = (res, status = 200) => {
  assert.equal(res.status, status, JSON.stringify(res.body));
  return res.body;
};
const inbox = async (who) => ok(await h.call('GET', '/notifications', { token: who.token }));
const titles = async (who) => (await inbox(who)).notifications.map((n) => n.title);

test('signing up creates a welcome notification', async () => {
  s.alex = await h.login('alex@example.com', 'Alex');
  s.bea = await h.login('bea@example.com', 'Bea');
  const { notifications, unreadCount } = await inbox(s.alex);
  assert.equal(unreadCount, 1);
  assert.equal(notifications[0].type, 'welcome');
  assert.match(notifications[0].title, /Welcome to Gastosaurus, Alex/);
});

test('an invite notifies the invitee if they already have an account', async () => {
  const body = ok(
    await h.call('POST', '/groups', {
      token: s.alex.token,
      body: { name: 'Siargao', members: [{ name: 'Bea', email: 'bea@example.com' }, { name: 'Miguel' }] },
    }),
    201,
  );
  s.groupId = body.group.id;
  s.m = Object.fromEntries(body.members.map((m) => [m.name.toLowerCase(), m.id]));

  const { notifications } = await inbox(s.bea);
  assert.equal(notifications[0].type, 'invite');
  assert.equal(notifications[0].title, 'Alex invited you to "Siargao"');
  assert.ok(notifications[0].data.inviteId);
  assert.equal(notifications[0].groupId, s.groupId);
  // The inviter isn't notified about their own action
  assert.equal((await inbox(s.alex)).unreadCount, 1);

  ok(await h.call('POST', `/invites/${notifications[0].data.inviteId}/accept`, { token: s.bea.token }));
  assert.equal((await titles(s.alex))[0], 'Bea joined "Siargao"');
});

test('adding an expense tells each person their own share (but not the person who added it)', async () => {
  const { expense } = ok(
    await h.call('POST', `/groups/${s.groupId}/expenses`, {
      token: s.alex.token,
      body: { description: 'Island hopping', splitType: 'equal', totalAmount: 1500, memberIds: [s.m.alex, s.m.bea, s.m.miguel] },
    }),
    201,
  );
  s.expenseId = expense.id;
  const [latest] = (await inbox(s.bea)).notifications;
  assert.equal(latest.type, 'expense');
  assert.equal(latest.title, 'Alex added "Island hopping" (₱1,500.00) in Siargao');
  assert.equal(latest.body, 'Your share: ₱500.00');
  assert.equal(latest.data.expenseId, expense.id);
  assert.notEqual((await titles(s.alex))[0], latest.title);
});

test('payments: the receiver is asked to confirm, and the payer hears when they do', async () => {
  // Bea pays Alex ₱500 by GCash → pending, Alex is asked to confirm
  const { settlement } = ok(
    await h.call('POST', `/groups/${s.groupId}/settlements`, {
      token: s.bea.token,
      body: { toMemberId: s.m.alex, amount: 500, method: 'gcash' },
    }),
    201,
  );
  const [ask] = (await inbox(s.alex)).notifications;
  assert.equal(ask.title, 'Bea says they paid you ₱500.00 via GCash');

  // While it's pending, Settle Up no longer tells Bea to pay that debt again
  const beaSettle = ok(await h.call('GET', '/me/settle-up', { token: s.bea.token }));
  assert.deepEqual(beaSettle.toPay, []);
  assert.equal(beaSettle.awaitingTheirConfirmation.length, 1);
  assert.equal(ask.data.action, 'confirm');
  assert.equal(ask.data.settlementId, settlement.id);

  ok(await h.call('PATCH', `/settlements/${settlement.id}`, { token: s.alex.token, body: { status: 'completed' } }));
  assert.equal((await titles(s.bea))[0], 'Alex confirmed your ₱500.00 payment');
});

test('reminders nudge people who owe, say whom to pay, and respect a 12-hour cooldown', async () => {
  // Miguel (guest) paid ₱900 for Alex and Bea → both owe Miguel ₱300 (+ the earlier bill)
  ok(
    await h.call('POST', `/groups/${s.groupId}/expenses`, {
      token: s.alex.token,
      body: { description: 'Lechon', splitType: 'equal', totalAmount: 900, paidBy: s.m.miguel, memberIds: [s.m.alex, s.m.bea, s.m.miguel] },
    }),
    201,
  );

  const first = ok(await h.call('POST', `/groups/${s.groupId}/reminders`, { token: s.alex.token, body: {} }));
  // Balances now: Alex +200, Bea −300, Miguel +100 → only Bea owes
  assert.deepEqual(first.sent, [{ memberId: s.m.bea, name: 'Bea', amount: 300 }]);
  assert.deepEqual(first.skipped, []);

  const [reminder] = (await inbox(s.bea)).notifications;
  assert.equal(reminder.type, 'reminder');
  assert.equal(reminder.title, 'Reminder from Alex: settle your share in "Siargao"');
  assert.equal(reminder.body, 'You owe ₱300.00 — pay Alex ₱200.00, Miguel ₱100.00.');

  const again = ok(await h.call('POST', `/groups/${s.groupId}/reminders`, { token: s.alex.token, body: {} }));
  assert.deepEqual(again.sent, []);
  assert.ok(again.skipped.some((x) => x.name === 'Bea' && x.reason === 'recently_reminded'));
});

test('editing and deleting an expense notifies the people on it', async () => {
  ok(
    await h.call('PATCH', `/expenses/${s.expenseId}`, {
      token: s.alex.token,
      body: { description: 'Island hopping', splitType: 'equal', totalAmount: 1500, memberIds: [s.m.alex, s.m.miguel] },
    }),
  );
  const [edited] = (await inbox(s.bea)).notifications;
  assert.equal(edited.title, 'Alex updated "Island hopping" (₱1,500.00) in Siargao');
  assert.equal(edited.body, 'You\'re no longer part of this bill.');

  ok(await h.call('DELETE', `/expenses/${s.expenseId}`, { token: s.alex.token }), 204);
  // Bea was already taken off the bill, so only people still on it hear about the delete
  assert.equal((await titles(s.bea))[0], edited.title);
});

test('inbox: unread count, mark one / all read, delete, and nobody else can touch yours', async () => {
  const before = await inbox(s.bea);
  assert.ok(before.unreadCount >= 4);

  const target = before.notifications[0];
  const read = ok(await h.call('PATCH', `/notifications/${target.id}/read`, { token: s.bea.token }));
  assert.equal(read.notification.read, true);
  assert.equal((await inbox(s.bea)).unreadCount, before.unreadCount - 1);

  // Alex can't read or delete Bea's notifications
  assert.equal((await h.call('PATCH', `/notifications/${target.id}/read`, { token: s.alex.token })).status, 404);
  assert.equal((await h.call('DELETE', `/notifications/${target.id}`, { token: s.alex.token })).status, 404);

  const unreadOnly = ok(await h.call('GET', '/notifications?unread=true', { token: s.bea.token }));
  assert.ok(unreadOnly.notifications.every((n) => !n.read));

  ok(await h.call('POST', '/notifications/read-all', { token: s.bea.token }));
  assert.equal((await inbox(s.bea)).unreadCount, 0);

  assert.equal((await h.call('DELETE', `/notifications/${target.id}`, { token: s.bea.token })).status, 204);
  assert.ok(!(await inbox(s.bea)).notifications.some((n) => n.id === target.id));
});

test('being removed from a group notifies you', async () => {
  // Settle Bea up first (she can't be removed while money is owed either way).
  // Alex is admin, so he can record and confirm on everyone's behalf.
  const b = ok(await h.call('GET', `/groups/${s.groupId}/balances`, { token: s.alex.token }));
  const involvingBea = b.suggestedSettlements.filter((x) => x.from.memberId === s.m.bea || x.to.memberId === s.m.bea);
  assert.ok(involvingBea.length > 0);
  for (const p of involvingBea) {
    ok(
      await h.call('POST', `/groups/${s.groupId}/settlements`, {
        token: s.alex.token,
        body: { fromMemberId: p.from.memberId, toMemberId: p.to.memberId, amount: p.amount },
      }),
      201,
    );
  }
  const pending = ok(await h.call('GET', `/groups/${s.groupId}/settlements`, { token: s.alex.token })).settlements.filter(
    (x) => x.status === 'pending',
  );
  for (const p of pending) ok(await h.call('PATCH', `/settlements/${p.id}`, { token: s.alex.token, body: { status: 'completed' } }));

  ok(await h.call('DELETE', `/groups/${s.groupId}/members/${s.m.bea}`, { token: s.alex.token }), 204);
  assert.equal((await titles(s.bea))[0], 'Alex removed you from "Siargao"');
});
