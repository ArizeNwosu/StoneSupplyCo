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
