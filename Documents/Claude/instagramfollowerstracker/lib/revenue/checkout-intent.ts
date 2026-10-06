import { isCheckoutSource, type BillingInterval, type CheckoutSource } from './types';

const KEY = 'pending_checkout_v1';
const MAX_AGE_MS = 30 * 60 * 1000;

export interface CheckoutIntent {
  version: 1;
  plan: 'PRO' | 'AGENCY';
  interval: BillingInterval;
  source: CheckoutSource;
  createdAt: number;
  campaignId?: string;
  outreachMessageId?: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function parseCheckoutIntent(raw: string | null, now = Date.now()): CheckoutIntent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (value.version !== 1 || (value.plan !== 'PRO' && value.plan !== 'AGENCY')) return null;
    if (value.interval !== 'monthly' && value.interval !== 'annual') return null;
    if (!isCheckoutSource(value.source)) return null;
    if (typeof value.createdAt !== 'number' || now - value.createdAt > MAX_AGE_MS || value.createdAt > now + 60_000) return null;
    return value as unknown as CheckoutIntent;
  } catch {
    return null;
  }
}

export function saveCheckoutIntent(
  intent: Omit<CheckoutIntent, 'version' | 'createdAt'>,
  storage: StorageLike = window.sessionStorage
) {
  storage.setItem(KEY, JSON.stringify({ version: 1, createdAt: Date.now(), ...intent }));
}

export function readCheckoutIntent(storage: StorageLike = window.sessionStorage) {
  return parseCheckoutIntent(storage.getItem(KEY));
}

export function clearCheckoutIntent(storage: StorageLike = window.sessionStorage) {
  storage.removeItem(KEY);
}

export function safeReturnTo(value: string | null | undefined) {
  if (!value) return '/dashboard';
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { return '/dashboard'; }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')) return '/dashboard';
  return decoded;
}

