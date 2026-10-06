export type RevenuePrompt = 'account_limit' | 'seven_day_summary' | 'unfollowers' | 'export';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const shownKey = (key: RevenuePrompt) => `revenue_prompt_shown:${key}`;
const dismissedKey = (key: RevenuePrompt) => `revenue_prompt_dismissed:${key}`;

export function canShowPrompt(key: RevenuePrompt, options: {
  local?: StorageLike;
  session?: StorageLike;
  now?: number;
} = {}) {
  try {
    const local = options.local ?? window.localStorage;
    const session = options.session ?? window.sessionStorage;
    if (session.getItem(shownKey(key))) return false;
    const dismissedAt = Number(local.getItem(dismissedKey(key)) ?? 0);
    return !dismissedAt || (options.now ?? Date.now()) - dismissedAt >= WEEK_MS;
  } catch {
    return true;
  }
}

export function markPromptShown(key: RevenuePrompt, options: { session?: StorageLike } = {}) {
  try { (options.session ?? window.sessionStorage).setItem(shownKey(key), '1'); } catch { /* storage is optional */ }
}

export function dismissPrompt(key: RevenuePrompt, options: { local?: StorageLike; now?: number } = {}) {
  try { (options.local ?? window.localStorage).setItem(dismissedKey(key), String(options.now ?? Date.now())); } catch { /* storage is optional */ }
}
