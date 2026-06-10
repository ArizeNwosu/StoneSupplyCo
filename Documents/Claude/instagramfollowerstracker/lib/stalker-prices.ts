// lib/stalker-prices.ts
// SERVER-SIDE ONLY.

import type { StalkerFrequency } from '@prisma/client';

export const STALKER_PRICE_IDS: Record<StalkerFrequency, string> = {
  DAILY:    process.env.STRIPE_PRICE_STALKER_DAILY    ?? 'price_stalker_daily',
  SIX_HOUR: process.env.STRIPE_PRICE_STALKER_SIX_HOUR ?? 'price_stalker_six_hour',
  HOURLY:   process.env.STRIPE_PRICE_STALKER_HOURLY   ?? 'price_stalker_hourly',
};

export const STALKER_PRICES_USD: Record<StalkerFrequency, number> = {
  DAILY:    499,  // cents
  SIX_HOUR: 699,
  HOURLY:   999,
};

export const STALKER_FREQUENCY_LABEL: Record<StalkerFrequency, string> = {
  DAILY:    'Daily (every 24h)',
  SIX_HOUR: 'Every 6 hours',
  HOURLY:   'Every hour',
};

export function getStalkerPriceId(frequency: StalkerFrequency): string {
  const id = STALKER_PRICE_IDS[frequency];
  if (id.startsWith('price_stalker_')) {
    throw new Error(`Missing Stripe price ID for stalker frequency ${frequency}. Set STRIPE_PRICE_STALKER_${frequency} in env.`);
  }
  return id;
}

export function stalkerFrequencyFromPriceId(priceId: string | null | undefined): StalkerFrequency | null {
  if (!priceId) return null;
  for (const [freq, id] of Object.entries(STALKER_PRICE_IDS) as [StalkerFrequency, string][]) {
    if (id === priceId) return freq;
  }
  return null;
}
