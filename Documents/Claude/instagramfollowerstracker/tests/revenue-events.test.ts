import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseBrowserRevenueEvent,
  recordRevenueEvent,
  type RevenueEventStore,
} from '@/lib/revenue/events';

test('revenue event parser accepts allowlisted browser events', () => {
  const parsed = parseBrowserRevenueEvent({
    type: 'PAYWALL_VIEWED',
    source: 'unfollowers',
    idempotencyKey: 'browser:123',
    properties: { count: 4 },
  });
  assert.equal(parsed.type, 'PAYWALL_VIEWED');
  assert.equal(parsed.source, 'unfollowers');
});

test('revenue event parser rejects server-only event types and unknown sources', () => {
  assert.throws(
    () => parseBrowserRevenueEvent({ type: 'SUBSCRIPTION_ACTIVATED', source: 'pricing' }),
    /event type/i
  );
  assert.throws(
    () => parseBrowserRevenueEvent({ type: 'PAYWALL_VIEWED', source: 'sidebar' }),
    /source/i
  );
});

test('revenue event parser rejects properties larger than 4 KB', () => {
  assert.throws(
    () => parseBrowserRevenueEvent({
      type: 'PRICING_VIEWED',
      source: 'pricing',
      properties: { value: 'x'.repeat(4097) },
    }),
    /4 KB/i
  );
});

test('revenue event recorder returns the existing idempotent event', async () => {
  const existing = { id: 'evt_existing' };
  const store: RevenueEventStore = {
    async create() {
      throw Object.assign(new Error('unique'), { code: 'P2002' });
    },
    async findUnique() {
      return existing;
    },
  };

  const result = await recordRevenueEvent({
    type: 'SIGNUP_COMPLETED',
    userId: 'user_1',
    idempotencyKey: 'signup:user_1',
  }, store);

  assert.equal(result, existing);
});
