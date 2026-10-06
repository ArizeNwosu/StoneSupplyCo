import type { BillingInterval, CheckoutSource, RevenuePlan } from './types';

interface StripeLike {
  prices: { retrieve(id: string): Promise<unknown> };
  customers: { create(input: Record<string, unknown>): Promise<{ id: string }> };
  checkout: {
    sessions: {
      create(input: Record<string, unknown>): Promise<{ id: string; url: string | null }>;
    };
  };
}

export interface CheckoutStore {
  createAttempt(input: Record<string, unknown>): Promise<{ id: string }>;
  saveCustomer(userId: string, customerId: string): Promise<void>;
  markCreated(attemptId: string, input: { sessionId: string; customerId: string }): Promise<void>;
  markFailed(attemptId: string, input: { category: string; message: string }): Promise<void>;
}

interface CreateAttributedCheckoutInput {
  stripe: StripeLike;
  store: CheckoutStore;
  priceId: string;
  user: { id: string; email: string | null; stripeCustomerId: string | null };
  plan: RevenuePlan;
  interval: BillingInterval;
  source: CheckoutSource;
  successUrl: string;
  cancelUrl: string;
  campaignId?: string;
  outreachMessageId?: string;
  extraMetadata?: Record<string, string>;
}

export async function createAttributedCheckout(input: CreateAttributedCheckoutInput) {
  const attempt = await input.store.createAttempt({
    userId: input.user.id,
    plan: input.plan,
    interval: input.interval,
    source: input.source,
    campaignId: input.campaignId,
    outreachMessageId: input.outreachMessageId,
  });

  try {
    await input.stripe.prices.retrieve(input.priceId);
    let customerId = input.user.stripeCustomerId;
    if (!customerId) {
      const customer = await input.stripe.customers.create({
        email: input.user.email ?? undefined,
        metadata: { userId: input.user.id },
      });
      customerId = customer.id;
      await input.store.saveCustomer(input.user.id, customerId);
    }

    const metadata = {
      attemptId: attempt.id,
      userId: input.user.id,
      plan: input.plan,
      interval: input.interval,
      source: input.source,
      campaignId: input.campaignId ?? '',
      outreachMessageId: input.outreachMessageId ?? '',
      ...input.extraMetadata,
    };
    const session = await input.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      allow_promotion_codes: true,
      metadata,
      subscription_data: { metadata },
    });
    await input.store.markCreated(attempt.id, { sessionId: session.id, customerId });
    return { ...session, attemptId: attempt.id, customerId };
  } catch (error) {
    await input.store.markFailed(attempt.id, {
      category: (error as { code?: string }).code ?? 'stripe_error',
      message: error instanceof Error ? error.message.slice(0, 500) : 'Unknown Stripe error',
    });
    throw error;
  }
}
