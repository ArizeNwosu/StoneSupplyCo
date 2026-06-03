export const PLAN_LIMITS = {
  FREE: {
    maxAccounts: 3,
    historyDays: 30,
    updateFrequency: 'daily' as const,
    alerts: false,
    apiAccess: false,
    publicPages: true,
  },
  PRO: {
    maxAccounts: 25,
    historyDays: 365,
    updateFrequency: 'daily' as const,
    alerts: true,
    apiAccess: false,
    publicPages: true,
  },
  AGENCY: {
    maxAccounts: 200,
    historyDays: 9999,
    updateFrequency: 'daily' as const,
    alerts: true,
    apiAccess: true,
    publicPages: true,
  },
} as const;

export const PLAN_PRICES = {
  PRO: {
    monthly: 9,
    annual: 7,
    stripePriceIdMonthly: 'price_pro_monthly',
    stripePriceIdAnnual: 'price_pro_annual',
  },
  AGENCY: {
    monthly: 49,
    annual: 39,
    stripePriceIdMonthly: 'price_agency_monthly',
    stripePriceIdAnnual: 'price_agency_annual',
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
