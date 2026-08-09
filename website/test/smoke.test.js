// Chhota sanity check — real API keys ke baghair chal jata hai.
// `node test/smoke.test.js` — koi bhi assertion fail ho to non-zero exit code.

import assert from 'node:assert/strict';
import { getPlan, publicPlans } from '../lib/plans.js';
import { normalizeEmail, addDays, toDateString, parseDateString, randomId } from '../lib/util.js';
import { secureHash } from '../lib/providers/jazzcash.js';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

test('getPlan is case-insensitive and rejects unknown ids', () => {
  assert.equal(getPlan('MONTHLY').id, 'monthly');
  assert.equal(getPlan('bogus'), null);
  assert.equal(getPlan(undefined), null);
});

test('publicPlans exposes all three plans with prices', () => {
  const plans = publicPlans();
  assert.equal(plans.length, 3);
  assert.ok(plans.every((p) => p.price > 0));
  assert.equal(plans.find((p) => p.id === 'lifetime').days, null);
});

test('normalizeEmail lowercases and validates', () => {
  assert.equal(normalizeEmail('  User@Gmail.com '), 'user@gmail.com');
  assert.equal(normalizeEmail('not-an-email'), null);
  assert.equal(normalizeEmail(''), null);
  assert.equal(normalizeEmail(123), null);
});

test('addDays/toDateString/parseDateString round-trip', () => {
  const base = new Date('2026-01-01T00:00:00Z');
  const d = addDays(30, base);
  assert.equal(toDateString(d), '2026-01-31');
  assert.ok(parseDateString('2026-01-31'));
  assert.equal(parseDateString('not-a-date'), null);
});

test('randomId produces unique-ish prefixed ids', () => {
  const a = randomId('VUP');
  const b = randomId('VUP');
  assert.ok(a.startsWith('VUP'));
  assert.notEqual(a, b);
});

test('jazzcash secureHash is deterministic and order-independent on input key order', () => {
  const salt = 'test-salt';
  const fields = { pp_Amount: '100000', pp_MerchantID: 'MC1', pp_TxnRefNo: 'ORDER1' };
  const shuffled = { pp_TxnRefNo: 'ORDER1', pp_Amount: '100000', pp_MerchantID: 'MC1' };
  assert.equal(secureHash(fields, salt), secureHash(shuffled, salt));
  assert.equal(secureHash(fields, salt).length, 64);
});

console.log(`\n${passed} tests passed`);
