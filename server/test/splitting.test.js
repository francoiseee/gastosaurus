// Unit tests for the ambagan engine (no database needed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  apportion,
  equalSplit,
  itemizedSplit,
  customSplit,
  suggestSettlements,
  SplitError,
} from '../src/lib/splitting.js';
import { toCentavos, fromCentavos, centavosToNumeric, statusFor } from '../src/lib/money.js';

const sum = (shares) => shares.reduce((a, s) => a + s.amount, 0);

test('money: pesos ↔ centavos without floating-point drift', () => {
  assert.equal(toCentavos('123.45'), 12345);
  assert.equal(toCentavos('0.1'), 10);
  assert.equal(toCentavos(0.1 + 0.2), 30);
  assert.equal(toCentavos('-5.5'), -550);
  assert.equal(fromCentavos(12345), 123.45);
  assert.equal(centavosToNumeric(5), '0.05');
  assert.equal(centavosToNumeric(-12345), '-123.45');
  assert.throws(() => toCentavos('1.234'));
  assert.equal(statusFor(1), 'owed');
  assert.equal(statusFor(-1), 'owe');
  assert.equal(statusFor(0), 'settled');
});

test('equal: ₱100 among 3 → 33.34 + 33.33 + 33.33 (extra centavo to the first person)', () => {
  assert.deepEqual(equalSplit(10000, ['a', 'b', 'c']), [
    { memberId: 'a', amount: 3334 },
    { memberId: 'b', amount: 3333 },
    { memberId: 'c', amount: 3333 },
  ]);
});

test('equal: ₱0.05 among 3 → 2 + 2 + 1 centavos', () => {
  assert.deepEqual(equalSplit(5, ['a', 'b', 'c']).map((s) => s.amount), [2, 2, 1]);
});

test('equal: always adds up exactly, for many totals and group sizes', () => {
  for (let n = 1; n <= 12; n++) {
    const ids = Array.from({ length: n }, (_, i) => `m${i}`);
    for (const total of [1, 7, 99, 10000, 123457, 99999999]) {
      const shares = equalSplit(total, ids);
      assert.equal(sum(shares), total);
      const amounts = shares.map((s) => s.amount);
      assert.ok(Math.max(...amounts) - Math.min(...amounts) <= 1, 'nobody pays more than 1 centavo extra');
    }
  }
});

test('equal: rejects empty, duplicate and zero splits', () => {
  assert.throws(() => equalSplit(100, []), SplitError);
  assert.throws(() => equalSplit(100, ['a', 'a']), SplitError);
  assert.throws(() => equalSplit(0, ['a']), SplitError);
});

test('itemized: each person pays only for what they had', () => {
  // Samgyup night: Sarah had tuna roll + mochi, Mike had black cod, both shared sake.
  const result = itemizedSplit([
    { name: 'Spicy Tuna Roll', price: 1800, memberIds: ['sarah'] },
    { name: 'Matcha Mochi', price: 2700, memberIds: ['sarah'] },
    { name: 'Black Cod Miso', price: 4500, memberIds: ['mike'] },
    { name: 'Sake Carafe', price: 2500, memberIds: ['sarah', 'mike'] },
  ]);
  assert.equal(result.total, 11500);
  assert.deepEqual(result.shares, [
    { memberId: 'sarah', amount: 5750, itemsSubtotal: 5750 }, // 18 + 27 + 12.50
    { memberId: 'mike', amount: 5750, itemsSubtotal: 5750 }, //  45 + 12.50
  ]);
});

test('itemized: a ₱100 item shared by 3 rounds once per person, not once per item', () => {
  // Two ₱100 items each shared by the same 3 people: exact share is 66.666…
  // Rounding per item would give one person 33.34 + 33.34 = 66.68.
  const { shares } = itemizedSplit([
    { name: 'Pizza', price: 10000, memberIds: ['a', 'b', 'c'] },
    { name: 'Pasta', price: 10000, memberIds: ['a', 'b', 'c'] },
  ]);
  assert.deepEqual(shares.map((s) => s.amount), [6667, 6667, 6666]);
  assert.equal(sum(shares), 20000);
});

test('itemized: service charge is spread in proportion to what each person ordered', () => {
  // A ordered ₱300, B ordered ₱100; 10% service charge (₱40) → A +30, B +10.
  const { total, shares } = itemizedSplit(
    [
      { name: 'Steak', price: 30000, memberIds: ['a'] },
      { name: 'Salad', price: 10000, memberIds: ['b'] },
    ],
    [{ name: 'Service charge 10%', amount: 4000 }],
  );
  assert.equal(total, 44000);
  assert.deepEqual(shares.map((s) => [s.memberId, s.amount, s.itemsSubtotal]), [
    ['a', 33000, 30000],
    ['b', 11000, 10000],
  ]);
});

test('itemized: a discount (negative charge) lowers everyone proportionally and still adds up', () => {
  const { total, shares } = itemizedSplit(
    [
      { name: 'Wagyu Tacos', price: 3200, memberIds: ['a', 'b', 'c'] },
      { name: 'Sake', price: 2500, memberIds: ['b'] },
      { name: 'Cod', price: 4501, memberIds: ['c'] },
    ],
    [
      { name: 'Delivery', amount: 4900 },
      { name: 'Promo', amount: -1000 },
    ],
  );
  assert.equal(total, 3200 + 2500 + 4501 + 4900 - 1000);
  assert.equal(sum(shares), total);
});

test('itemized: rejects items with nobody assigned, negative prices, and totals ≤ 0', () => {
  assert.throws(() => itemizedSplit([]), SplitError);
  assert.throws(() => itemizedSplit([{ name: 'Rice', price: 100, memberIds: [] }]), /Choose who had "Rice"/);
  assert.throws(() => itemizedSplit([{ name: 'Rice', price: -100, memberIds: ['a'] }]), SplitError);
  assert.throws(() => itemizedSplit([{ name: 'Rice', price: 100, memberIds: ['a'] }], [{ amount: -100 }]), SplitError);
});

test('custom: shares must add up to the total, with a helpful message when they don\'t', () => {
  assert.deepEqual(
    customSplit(10000, [
      { memberId: 'a', amount: 7000 },
      { memberId: 'b', amount: 3000 },
      { memberId: 'c', amount: 0 }, // zero shares are dropped
    ]),
    [
      { memberId: 'a', amount: 7000 },
      { memberId: 'b', amount: 3000 },
    ],
  );
  assert.throws(() => customSplit(10000, [{ memberId: 'a', amount: 9950 }]), /₱0\.50 short/);
  assert.throws(() => customSplit(10000, [{ memberId: 'a', amount: 10100 }]), /₱1\.00 over/);
  assert.throws(() => customSplit(10000, [{ memberId: 'a', amount: 5000 }, { memberId: 'a', amount: 5000 }]), SplitError);
});

test('settle up: one person paid for everyone → everyone pays them', () => {
  // Alex paid ₱900 for 3 people: Alex +600, Sam −300, Jamie −300.
  const payments = suggestSettlements([
    { memberId: 'alex', net: 60000 },
    { memberId: 'sam', net: -30000 },
    { memberId: 'jamie', net: -30000 },
  ]);
  assert.deepEqual(payments, [
    { from: 'sam', to: 'alex', amount: 30000 },
    { from: 'jamie', to: 'alex', amount: 30000 },
  ]);
});

test('settle up: chains collapse (A owes B, B owes C → A pays C directly)', () => {
  const payments = suggestSettlements([
    { memberId: 'a', net: -10000 },
    { memberId: 'b', net: 0 },
    { memberId: 'c', net: 10000 },
  ]);
  assert.deepEqual(payments, [{ from: 'a', to: 'c', amount: 10000 }]);
});

test('settle up: never more than n − 1 payments and every balance ends at zero', () => {
  // Deterministic pseudo-random groups
  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  for (let round = 0; round < 200; round++) {
    const n = 2 + Math.floor(rand() * 9);
    const nets = Array.from({ length: n - 1 }, () => Math.floor(rand() * 200001) - 100000);
    nets.push(-nets.reduce((a, b) => a + b, 0));
    const balances = nets.map((net, i) => ({ memberId: `m${i}`, net }));

    const payments = suggestSettlements(balances);
    assert.ok(payments.length <= n - 1);
    const after = new Map(balances.map((b) => [b.memberId, b.net]));
    for (const p of payments) {
      assert.ok(p.amount > 0);
      after.set(p.from, after.get(p.from) + p.amount);
      after.set(p.to, after.get(p.to) - p.amount);
    }
    for (const value of after.values()) assert.equal(value, 0);
  }
});

test('settle up: everyone settled → no payments', () => {
  assert.deepEqual(suggestSettlements([{ memberId: 'a', net: 0 }, { memberId: 'b', net: 0 }]), []);
  assert.deepEqual(suggestSettlements([]), []);
});

test('apportion: largest remainder wins the leftover centavo', () => {
  // exact shares 1.6, 1.2, 1.2 (over denominator 5) of a total of 4
  assert.deepEqual(apportion([8n, 6n, 6n], 5n, 4), [2, 1, 1]);
});
