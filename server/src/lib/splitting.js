// The ambagan engine: turns an expense into "who owes what", and a group's
// balances into the fewest payments that settle everyone.
//
// Pure functions only: no database, no Express. Every amount here is an
// integer number of CENTAVOS (₱1.00 = 100), so the results always add up to
// the exact total. See test/splitting.test.js for worked examples.
//
// ─── The one rounding rule (used by every split type) ───────────────────────
// 1. Work out each person's EXACT share as a fraction (e.g. ₱100 ÷ 3 = 33⅓).
// 2. Give everyone the whole centavos of their share (33.33).
// 3. The few centavos left over go, one each, to the people whose dropped
//    fraction was biggest. Ties go to whoever is listed first.
// This is the "largest remainder" method. It never creates or loses a
// centavo, and nobody's share moves by more than ₱0.01 from the exact value.

export class SplitError extends Error {
  /** field: which input to highlight in the form, e.g. "shares" or "items.2.memberIds" */
  constructor(message, field = 'form') {
    super(message);
    this.field = field;
  }
}

const big = (n) => BigInt(n);
const gcd = (a, b) => (b === 0n ? a : gcd(b, a % b));
const lcm = (a, b) => (a / gcd(a, b)) * b;

/**
 * Round exact fractional shares (numerators[i] / denominator) to whole
 * centavos that add up to exactly `totalCentavos` (largest remainder method).
 * numerators and denominator are BigInt; returns plain integers.
 */
export function apportion(numerators, denominator, totalCentavos) {
  const floors = numerators.map((n) => n / denominator);
  const remainders = numerators.map((n) => n % denominator);
  let leftover = big(totalCentavos) - floors.reduce((a, b) => a + b, 0n);

  // Biggest remainder first; on ties keep the original order (stable sort).
  const order = remainders
    .map((r, i) => ({ r, i }))
    .sort((a, b) => (a.r === b.r ? a.i - b.i : a.r > b.r ? -1 : 1));

  const result = floors.slice();
  for (const { i } of order) {
    if (leftover <= 0n) break;
    result[i] += 1n;
    leftover -= 1n;
  }
  if (leftover !== 0n) throw new Error('apportion: shares do not add up to the total'); // programming error
  return result.map(Number);
}

function assertPositiveTotal(totalCentavos, field = 'totalAmount') {
  if (!Number.isInteger(totalCentavos) || totalCentavos <= 0) {
    throw new SplitError('The total must be more than ₱0.00.', field);
  }
}

function assertUnique(ids, field) {
  if (new Set(ids).size !== ids.length) throw new SplitError('Each person can only be picked once.', field);
}

/**
 * EQUAL split ("Split Equally").
 *   equalSplit(10000, ['a','b','c'])
 *   → [{ memberId:'a', amount:3334 }, { memberId:'b', amount:3333 }, { memberId:'c', amount:3333 }]
 */
export function equalSplit(totalCentavos, memberIds) {
  assertPositiveTotal(totalCentavos);
  if (!memberIds.length) throw new SplitError('Pick at least one person to split with.', 'memberIds');
  assertUnique(memberIds, 'memberIds');

  const amounts = apportion(memberIds.map(() => big(totalCentavos)), big(memberIds.length), totalCentavos);
  return memberIds.map((memberId, i) => ({ memberId, amount: amounts[i] }));
}

/**
 * ITEMIZED split ("Itemized Ambagan"): people pay only for what they had.
 *
 *   items:   [{ name, price, memberIds }]   price in centavos; an item shared by
 *                                           3 people costs each of them price ÷ 3
 *   charges: [{ name, amount }]             service charge, delivery fee, tip
 *                                           (positive) or a discount (negative).
 *                                           Spread in proportion to what each
 *                                           person ordered, so whoever ordered
 *                                           more carries more of the charge.
 *
 * Returns { total, subtotal, shares: [{ memberId, amount, itemsSubtotal }] }.
 * People appear in the order they first show up in the items list.
 */
export function itemizedSplit(items, charges = []) {
  if (!items.length) throw new SplitError('Add at least one item.', 'items');

  // Who took part, in first-appearance order (used for tie-breaks).
  const people = [];
  items.forEach((item, idx) => {
    if (!Number.isInteger(item.price) || item.price < 0) {
      throw new SplitError('Item prices cannot be negative.', `items.${idx}.price`);
    }
    if (!item.memberIds?.length) {
      throw new SplitError(`Choose who had "${item.name}".`, `items.${idx}.memberIds`);
    }
    assertUnique(item.memberIds, `items.${idx}.memberIds`);
    for (const id of item.memberIds) if (!people.includes(id)) people.push(id);
  });

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const chargesTotal = charges.reduce((sum, c) => sum + c.amount, 0);
  const total = subtotal + chargesTotal;
  if (subtotal <= 0) throw new SplitError('The items must cost more than ₱0.00.', 'items');
  assertPositiveTotal(total, 'charges');

  // Exact item shares as fractions over a common denominator D
  // (D = least common multiple of "how many people shared each item").
  const D = items.reduce((acc, item) => lcm(acc, big(item.memberIds.length)), 1n);
  const itemNumerators = new Map(people.map((id) => [id, 0n]));
  for (const item of items) {
    const perPerson = (big(item.price) * D) / big(item.memberIds.length); // exact: D is a multiple of the count
    for (const id of item.memberIds) itemNumerators.set(id, itemNumerators.get(id) + perPerson);
  }

  // Scale everyone by total / subtotal so charges and discounts are spread
  // proportionally:  share = (items share) × total ÷ subtotal.
  const numerators = people.map((id) => itemNumerators.get(id) * big(total));
  const amounts = apportion(numerators, D * big(subtotal), total);

  // Plain items subtotal per person (rounded the same way) for the receipt view.
  const itemsOnly = apportion(people.map((id) => itemNumerators.get(id)), D, subtotal);

  return {
    total,
    subtotal,
    shares: people.map((memberId, i) => ({ memberId, amount: amounts[i], itemsSubtotal: itemsOnly[i] })),
  };
}

/**
 * CUSTOM split: the user typed each person's amount. They must add up to the
 * total exactly; otherwise we say how far off they are.
 */
export function customSplit(totalCentavos, shares) {
  assertPositiveTotal(totalCentavos);
  if (!shares.length) throw new SplitError('Enter at least one person\'s share.', 'shares');
  assertUnique(shares.map((s) => s.memberId), 'shares');
  shares.forEach((s, idx) => {
    if (!Number.isInteger(s.amount) || s.amount < 0) {
      throw new SplitError('Shares cannot be negative.', `shares.${idx}.amount`);
    }
  });

  const sum = shares.reduce((acc, s) => acc + s.amount, 0);
  if (sum !== totalCentavos) {
    const diff = totalCentavos - sum;
    const peso = (Math.abs(diff) / 100).toFixed(2);
    throw new SplitError(
      diff > 0 ? `The shares are ₱${peso} short of the total.` : `The shares are ₱${peso} over the total.`,
      'shares',
    );
  }
  return shares.filter((s) => s.amount > 0).map(({ memberId, amount }) => ({ memberId, amount }));
}

/**
 * SETTLE UP: the fewest payments that bring every balance to zero (greedy).
 *
 *   balances: [{ memberId, net }]   net > 0 = is owed, net < 0 = owes (centavos)
 *   → [{ from, to, amount }]
 *
 * Repeatedly: the person who owes the most pays the person owed the most, as
 * much as one of them needs. Each payment clears at least one person, so a
 * group of n people never needs more than n − 1 payments.
 */
export function suggestSettlements(balances) {
  const sum = balances.reduce((acc, b) => acc + b.net, 0);
  if (sum !== 0) throw new Error(`suggestSettlements: balances must sum to zero (got ${sum})`);

  const byAmountDesc = (a, b) => b.amount - a.amount || a.order - b.order;
  const creditors = balances
    .map((b, order) => ({ memberId: b.memberId, amount: b.net, order }))
    .filter((b) => b.amount > 0)
    .sort(byAmountDesc);
  const debtors = balances
    .map((b, order) => ({ memberId: b.memberId, amount: -b.net, order }))
    .filter((b) => b.amount > 0)
    .sort(byAmountDesc);

  const payments = [];
  while (debtors.length && creditors.length) {
    const debtor = debtors[0];
    const creditor = creditors[0];
    const amount = Math.min(debtor.amount, creditor.amount);
    payments.push({ from: debtor.memberId, to: creditor.memberId, amount });

    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) debtors.shift();
    if (creditor.amount === 0) creditors.shift();
    // Keep "largest first" true after partial payments.
    debtors.sort(byAmountDesc);
    creditors.sort(byAmountDesc);
  }
  return payments;
}
