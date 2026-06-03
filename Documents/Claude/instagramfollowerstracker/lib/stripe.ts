import Stripe from 'stripe';

// Lazily initialised so Next.js can build without STRIPE_SECRET_KEY set.
// At runtime, any route that calls stripe.* will throw if the env var is missing.
let _stripe: Stripe | null = null;

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
      _stripe = new Stripe(key, { apiVersion: '2026-05-27.dahlia' });
    }
    const value = (_stripe as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(_stripe) : value;
  },
});
