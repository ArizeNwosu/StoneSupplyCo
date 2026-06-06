export const PLAN_LIMITS = {
  FREE: {
    maxAccounts: 1,
    historyDays: null,        // null = no limit, full history always
    unfollowDetection: false,
    alerts: false,
    apiAccess: false,
  },
  PRO: {
    maxAccounts: 10,
    historyDays: null,
    unfollowDetection: true,  // via Instagram data export upload
    alerts: true,
    apiAccess: false,
  },
  AGENCY: {
    maxAccounts: null, // unlimited
    historyDays: null,
    unfollowDetection: true,
    alerts: true,
    apiAccess: true,
  },
} as const;

export const CHART_UNLOCK_THRESHOLD = 1;

// Display prices only — safe to import in client components.
// Stripe price IDs are server-side only: see lib/stripe-prices.ts
export const PLAN_PRICES = {
  PRO: {
    monthly: 19,
    annual: 15,
  },
  AGENCY: {
    monthly: 149,
    annual: 119,
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
