import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');

test('revenue and outreach schema has durable idempotency constraints', () => {
  for (const model of [
    'RevenueEvent',
    'CheckoutAttempt',
    'ProcessedStripeEvent',
    'OutreachCampaign',
    'OutreachMessage',
    'OutreachReply',
    'OutreachSuppression',
    'OutreachMailboxCursor',
  ]) {
    assert.match(schema, new RegExp(`model ${model} \\{`), `missing ${model}`);
  }
  assert.match(schema, /idempotencyKey\s+String\?\s+@unique/);
  assert.match(schema, /stripeEventId\s+String\s+@id/);
  assert.match(schema, /@@unique\(\[campaignId, occurrenceKey\]\)/);
  assert.match(schema, /@@unique\(\[mailbox, uidValidity, uid\]\)/);
});

test('revenue and outreach schema indexes reporting and worker queries', () => {
  for (const index of [
    '@@index([userId, occurredAt])',
    '@@index([type, occurredAt])',
    '@@index([status, createdAt])',
    '@@index([status, scheduledAt])',
    '@@index([adminStatus, repliedAt])',
  ]) {
    assert.ok(schema.includes(index), `missing ${index}`);
  }
});
