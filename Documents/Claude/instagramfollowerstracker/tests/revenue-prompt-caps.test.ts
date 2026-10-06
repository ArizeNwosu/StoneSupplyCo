import test from 'node:test';
import assert from 'node:assert/strict';
import { canShowPrompt, dismissPrompt, markPromptShown } from '@/lib/revenue/prompt-caps';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test('prompt caps allow one modal per session and seven-day dismissal', () => {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const now = Date.UTC(2026, 9, 6);
  assert.equal(canShowPrompt('account_limit', { local, session, now }), true);
  markPromptShown('account_limit', { session });
  assert.equal(canShowPrompt('account_limit', { local, session, now }), false);
  const freshSession = new MemoryStorage();
  dismissPrompt('account_limit', { local, now });
  assert.equal(canShowPrompt('account_limit', { local, session: freshSession, now: now + 6 * 86_400_000 }), false);
  assert.equal(canShowPrompt('account_limit', { local, session: freshSession, now: now + 8 * 86_400_000 }), true);
  assert.equal(canShowPrompt('seven_day_summary', { local, session: freshSession, now }), true);
});

test('prompt caps fail open when storage is unavailable', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(canShowPrompt('account_limit', { local: broken, session: broken }), true);
});
