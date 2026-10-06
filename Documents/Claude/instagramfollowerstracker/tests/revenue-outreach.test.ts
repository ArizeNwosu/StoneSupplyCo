import test from 'node:test';
import assert from 'node:assert/strict';
import { isOutreachEligible } from '@/lib/outreach/eligibility';
import { CAMPAIGN_DEFINITIONS } from '@/lib/outreach/campaigns';
import { renderOutreachTemplate } from '@/lib/outreach/templates';
import { signOutreachToken, verifyOutreachToken } from '@/lib/outreach/tokens';

test('outreach defines all eight lifecycle campaigns', () => assert.deepEqual(CAMPAIGN_DEFINITIONS.map((item) => item[0]), ['welcome_activation_help','activated_free_value','unfollower_result_upgrade','abandoned_core_checkout','abandoned_stalker_checkout','founding_user_offer','subscription_onboarding','cancellation_feedback']));

test('outreach eligibility excludes tests, paid users, suppressions, and caps promotions', () => {
  process.env.REVENUE_TEST_EMAILS = 'test@example.com';
  const now = new Date('2026-10-06T00:00:00Z');
  const base = { email: 'real@example.com', plan: 'FREE', suppressed: false, transactional: false, promotionalSentAt: [] as Date[], now };
  assert.equal(isOutreachEligible(base), true);
  assert.equal(isOutreachEligible({ ...base, email: 'test@example.com' }), false);
  assert.equal(isOutreachEligible({ ...base, plan: 'PRO' }), false);
  assert.equal(isOutreachEligible({ ...base, suppressed: true }), false);
  assert.equal(isOutreachEligible({ ...base, promotionalSentAt: [now, now] }), false);
  assert.equal(isOutreachEligible({ ...base, plan: 'PRO', transactional: true }), true);
});

test('outreach tokens are signed, normalized, and expire', () => {
  process.env.OUTREACH_TOKEN_SECRET = 'test-secret-long-enough';
  const token = signOutreachToken({ userId: 'u1', campaignId: 'c1', email: ' A@Example.com ', exp: 100 });
  assert.equal(verifyOutreachToken(token, 99)?.email, 'a@example.com');
  assert.equal(verifyOutreachToken(token, 101), null);
  assert.equal(verifyOutreachToken(`${token}x`, 99), null);
});

test('outreach templates escape user content and include one CTA and unsubscribe', () => {
  process.env.OUTREACH_TOKEN_SECRET = 'test-secret-long-enough';
  process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  process.env.OUTREACH_COMPANY_ADDRESS = '123 Main St';
  const value = renderOutreachTemplate({ campaignKey: 'abandoned_core_checkout', userId: 'u', campaignId: 'c', email: 'a@example.com', name: '<script>alert(1)</script>', replyToken: 'reply1' });
  assert.doesNotMatch(value.html, /<script>/);
  assert.match(value.html, /&lt;script&gt;/);
  assert.match(value.text, /123 Main St/);
  assert.match(value.text, /Unsubscribe: https:\/\/example.com\/unsubscribe/);
  assert.equal((value.html.match(/<a /g) ?? []).length, 2);
});
