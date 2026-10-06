import test from 'node:test';
import assert from 'node:assert/strict';
import { createAttributedCheckout } from '@/lib/revenue/checkout';
import { mapStripeStatusToAccess, processStripeEvent } from '@/lib/revenue/subscriptions';

test('Stripe invalid price never creates a customer', async () => {
  let customerCreates = 0;
  const stripe = {
    prices: { retrieve: async () => { throw new Error('missing price'); } },
    customers: { create: async () => { customerCreates += 1; return { id: 'cus_1' }; } },
    checkout: { sessions: { create: async () => ({ id: 'cs_1', url: 'https://checkout.stripe.com/1' }) } },
  };
  const store = {
    createAttempt: async () => ({ id: 'attempt_1' }),
    saveCustomer: async () => undefined,
    markCreated: async () => undefined,
    markFailed: async () => undefined,
  };

  await assert.rejects(() => createAttributedCheckout({
    stripe,
    store,
    priceId: 'missing',
    user: { id: 'user_1', email: 'u@example.com', stripeCustomerId: null },
    plan: 'PRO',
    interval: 'monthly',
    source: 'pricing',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  }), /missing price/);
  assert.equal(customerCreates, 0);
});

test('Stripe access mapping preserves recovery window and revokes terminal states', () => {
  assert.deepEqual(mapStripeStatusToAccess('active'), { hasAccess: true, billingWarning: false });
  assert.deepEqual(mapStripeStatusToAccess('trialing'), { hasAccess: true, billingWarning: false });
  assert.deepEqual(mapStripeStatusToAccess('past_due'), { hasAccess: true, billingWarning: true });
  for (const status of ['unpaid', 'canceled', 'incomplete_expired'] as const) {
    assert.deepEqual(mapStripeStatusToAccess(status), { hasAccess: false, billingWarning: false });
  }
});

test('Stripe event processing is idempotent on replay', async () => {
  const claimed = new Set<string>();
  let handled = 0;
  const store = {
    claim: async (id: string) => {
      if (claimed.has(id)) return false;
      claimed.add(id);
      return true;
    },
    release: async (id: string) => { claimed.delete(id); },
  };
  const event = { id: 'evt_1', type: 'checkout.session.completed' };
  await processStripeEvent(event, store, async () => { handled += 1; });
  const replay = await processStripeEvent(event, store, async () => { handled += 1; });
  assert.equal(handled, 1);
  assert.deepEqual(replay, { duplicate: true });
});
