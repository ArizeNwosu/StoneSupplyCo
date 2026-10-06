export const REVENUE_EVENT_TYPES = [
  'SIGNUP_COMPLETED',
  'ACTIVATION_COMPLETED',
  'PAYWALL_VIEWED',
  'PRICING_VIEWED',
  'CHECKOUT_CLICKED',
  'CHECKOUT_CREATED',
  'CHECKOUT_COMPLETED',
  'CHECKOUT_EXPIRED',
  'SUBSCRIPTION_ACTIVATED',
  'SUBSCRIPTION_CANCELED',
  'OUTREACH_QUEUED',
  'OUTREACH_SENT',
  'OUTREACH_FAILED',
  'OUTREACH_REPLIED',
  'OUTREACH_UNSUBSCRIBED',
] as const;

export type RevenueEventType = (typeof REVENUE_EVENT_TYPES)[number];

export const CHECKOUT_SOURCES = [
  'pricing',
  'settings',
  'account_limit',
  'unfollowers',
  'export',
  'seven_day_summary',
  'stalker',
  'email',
] as const;

export type CheckoutSource = (typeof CHECKOUT_SOURCES)[number];
export type RevenuePlan = 'PRO' | 'AGENCY' | 'STALKER';
export type BillingInterval = 'monthly' | 'annual';

export function isCheckoutSource(value: unknown): value is CheckoutSource {
  return typeof value === 'string' && (CHECKOUT_SOURCES as readonly string[]).includes(value);
}

