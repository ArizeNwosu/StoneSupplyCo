import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getStripePriceId } from '@/lib/stripe-prices';
import { createAttributedCheckout } from '@/lib/revenue/checkout';
import { isCheckoutSource } from '@/lib/revenue/types';

export const runtime = 'nodejs';

const CheckoutSchema = z.object({
  plan: z.enum(['PRO', 'AGENCY']),
  interval: z.enum(['monthly', 'annual']),
  source: z.string().optional(),
  campaignId: z.string().optional(),
  outreachMessageId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as unknown;
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { plan, interval, campaignId, outreachMessageId } = parsed.data;
  const source = isCheckoutSource(parsed.data.source) ? parsed.data.source : 'pricing';

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true, plan: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://instagramfollowerstracker.com';

  if (user.plan !== 'FREE') {
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Billing customer missing. Contact support to adjust this subscription.' },
        { status: 409 }
      );
    }

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${appUrl}/dashboard/settings`,
      });

      return NextResponse.json({ url: portalSession.url });
    } catch (err) {
      console.error('[checkout] Failed to create portal session:', formatStripeError(err));
      return NextResponse.json(
        { error: 'Could not open billing portal. Check Stripe customer configuration.' },
        { status: 500 }
      );
    }
  }

  let priceId: string;
  try {
    priceId = getStripePriceId(plan, interval);
  } catch (err) {
    console.error('[checkout] Missing Stripe price id:', err);
    return NextResponse.json({ error: 'Stripe price is not configured' }, { status: 500 });
  }

  try {
    const checkoutSession = await createAttributedCheckout({
      stripe,
      store: {
        createAttempt: (data) => prisma.checkoutAttempt.create({ data: data as never }),
        saveCustomer: async (userId, customerId) => {
          await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
        },
        markCreated: async (attemptId, data) => {
          await prisma.checkoutAttempt.update({
            where: { id: attemptId },
            data: { status: 'CREATED', stripeCheckoutSessionId: data.sessionId, stripeCustomerId: data.customerId },
          });
        },
        markFailed: async (attemptId, data) => {
          await prisma.checkoutAttempt.update({
            where: { id: attemptId },
            data: { status: 'FAILED', failureCategory: data.category, failureMessage: data.message },
          });
        },
      },
      priceId,
      user,
      plan,
      interval,
      source,
      successUrl: `${appUrl}/dashboard?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/pricing`,
      campaignId,
      outreachMessageId,
    });
    if (!checkoutSession.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const stripeError = formatStripeError(err);
    console.error('[checkout] Failed to create checkout session:', {
      ...stripeError,
      plan,
      interval,
      priceId,
    });

    const message =
      stripeError.code === 'resource_missing'
        ? `Stripe price not found for ${plan} ${interval}. Check that the Vercel price ID exists in the same Stripe mode as STRIPE_SECRET_KEY.`
        : 'Could not create Stripe checkout session.';

    return NextResponse.json(
      { error: message },
      { status: stripeError.code === 'resource_missing' ? 400 : stripeError.statusCode ?? 500 }
    );
  }

}

function formatStripeError(err: unknown) {
  const maybeStripeError = err as {
    type?: string;
    code?: string;
    message?: string;
    statusCode?: number;
    requestId?: string;
  };

  return {
    type: maybeStripeError.type,
    code: maybeStripeError.code,
    message: maybeStripeError.message ?? (err instanceof Error ? err.message : 'Unknown Stripe error'),
    statusCode: maybeStripeError.statusCode,
    requestId: maybeStripeError.requestId,
  };
}
