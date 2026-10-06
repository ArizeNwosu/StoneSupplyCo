import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCheckoutIntent, safeReturnTo } from '@/lib/revenue/checkout-intent';

test('checkout intent accepts a current valid value', () => {
  const now = Date.now();
  assert.deepEqual(parseCheckoutIntent(JSON.stringify({
    version: 1, plan: 'PRO', interval: 'monthly', source: 'pricing', createdAt: now,
  }), now), { version: 1, plan: 'PRO', interval: 'monthly', source: 'pricing', createdAt: now });
});

test('checkout intent rejects expired, corrupt, and invalid values', () => {
  const now = Date.now();
  assert.equal(parseCheckoutIntent('{', now), null);
  assert.equal(parseCheckoutIntent(JSON.stringify({ version: 1, plan: 'FREE', interval: 'monthly', source: 'pricing', createdAt: now }), now), null);
  assert.equal(parseCheckoutIntent(JSON.stringify({ version: 1, plan: 'PRO', interval: 'weekly', source: 'pricing', createdAt: now }), now), null);
  assert.equal(parseCheckoutIntent(JSON.stringify({ version: 1, plan: 'PRO', interval: 'monthly', source: 'other', createdAt: now }), now), null);
  assert.equal(parseCheckoutIntent(JSON.stringify({ version: 1, plan: 'PRO', interval: 'monthly', source: 'pricing', createdAt: now - 1_800_001 }), now), null);
});

test('checkout intent return path rejects external and protocol-relative URLs', () => {
  assert.equal(safeReturnTo('/pricing?resumeCheckout=1'), '/pricing?resumeCheckout=1');
  for (const value of ['https://evil.example', '//evil.example', '%2F%2Fevil.example', '/\\evil.example']) {
    assert.equal(safeReturnTo(value), '/dashboard');
  }
});
