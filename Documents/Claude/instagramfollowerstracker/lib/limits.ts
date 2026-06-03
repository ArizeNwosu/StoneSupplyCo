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
    maxAccounts: 100,
    historyDays: null,
    unfollowDetection: true,
    alerts: true,
    apiAccess: true,
  },
} as const;

export const CHART_UNLOCK_THRESHOLD = 7; // snapshots needed before chart renders

export const PLAN_PRICES = {
  PRO: {
    monthly: 19,
    annual: 15,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? 'price_pro_monthly',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? 'price_pro_annual',
  },
  AGENCY: {
    monthly: 149,
    annual: 119,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY ?? 'price_agency_monthly',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_AGENCY_ANNUAL ?? 'price_agency_annual',
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
