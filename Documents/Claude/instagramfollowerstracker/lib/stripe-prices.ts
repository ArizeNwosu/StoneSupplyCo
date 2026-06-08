// Server-side only — never import this file from client components.
// Price IDs are Stripe-internal identifiers, not payment secrets,
// but there is no reason to include them in the client bundle.

export const STRIPE_PRICE_IDS = {
  PRO: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? 'price_pro_monthly',
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? 'price_pro_annual',
  },
  AGENCY: {
    monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY ?? 'price_agency_monthly',
    annual: process.env.STRIPE_PRICE_AGENCY_ANNUAL ?? 'price_agency_annual',
  },
} as const;

export type StripeBillingPlan = keyof typeof STRIPE_PRICE_IDS;
export type StripeBillingInterval = keyof typeof STRIPE_PRICE_IDS[StripeBillingPlan];

export function getStripePriceId(
  plan: StripeBillingPlan,
  interval: StripeBillingInterval
) {
  const priceId = STRIPE_PRICE_IDS[plan][interval];
  if (!priceId || priceId.startsWith('price_pro_') || priceId.startsWith('price_agency_')) {
    throw new Error(`Missing Stripe price id for ${plan} ${interval}`);
  }
  return priceId;
}

export function planFromStripePriceId(priceId: string | null | undefined) {
  if (!priceId) return null;

  for (const [plan, intervals] of Object.entries(STRIPE_PRICE_IDS)) {
    for (const configuredPriceId of Object.values(intervals)) {
      if (configuredPriceId === priceId) {
        return plan as StripeBillingPlan;
      }
    }
  }

  return null;
}
