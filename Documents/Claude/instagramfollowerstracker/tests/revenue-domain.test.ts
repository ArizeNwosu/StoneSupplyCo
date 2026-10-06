import test from 'node:test';
import assert from 'node:assert/strict';
import { getOutreachMode, isRevenueTestEmail } from '@/lib/revenue/config';

test('test-account matching is normalized', () => {
  process.env.REVENUE_TEST_EMAILS = 'Owner@Example.com, test@example.com ';
  assert.equal(isRevenueTestEmail('owner@example.com'), true);
  assert.equal(isRevenueTestEmail(' TEST@example.com '), true);
  assert.equal(isRevenueTestEmail('real@example.com'), false);
});

test('outreach defaults to disabled dry-run mode', () => {
  delete process.env.OUTREACH_ENABLED;
  delete process.env.OUTREACH_DRY_RUN;
  delete process.env.OUTREACH_ALLOWLIST;
  assert.deepEqual(getOutreachMode(), { enabled: false, dryRun: true, allowlist: [] });
});

test('outreach requires exact true and normalizes its allowlist', () => {
  process.env.OUTREACH_ENABLED = 'TRUE';
  process.env.OUTREACH_DRY_RUN = 'false';
  process.env.OUTREACH_ALLOWLIST = ' One@Example.com, two@example.com ';
  assert.deepEqual(getOutreachMode(), {
    enabled: false,
    dryRun: false,
    allowlist: ['one@example.com', 'two@example.com'],
  });
});
