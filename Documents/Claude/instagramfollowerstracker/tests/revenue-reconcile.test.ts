import test from 'node:test';
import assert from 'node:assert/strict';
import { attributeOutreachConversion } from '@/lib/revenue/reconcile';

test('reconcile attribution prefers explicit outreach message', async () => {
  const updates: unknown[] = [];
  const db = { outreachMessage: { findUnique: async () => ({ id: 'explicit' }), findFirst: async () => ({ id: 'recent' }), update: async (value: unknown) => { updates.push(value); } } };
  const id = await attributeOutreachConversion({ db, userId: 'u', subscriptionId: 'sub', outreachMessageId: 'explicit' });
  assert.equal(id, 'explicit'); assert.deepEqual((updates[0] as any).where, { id: 'explicit' });
});

test('reconcile attribution falls back to most recent sent message within 30 days', async () => {
  let query: any;
  const db = { outreachMessage: { findUnique: async () => null, findFirst: async (value: unknown) => { query = value; return { id: 'recent' }; }, update: async () => undefined } };
  const completedAt = new Date('2026-10-06T00:00:00Z');
  assert.equal(await attributeOutreachConversion({ db, userId: 'u', subscriptionId: 'sub', completedAt }), 'recent');
  assert.equal(query.orderBy.sentAt, 'desc'); assert.equal(query.where.sentAt.gte.toISOString(), '2026-09-06T00:00:00.000Z');
});
