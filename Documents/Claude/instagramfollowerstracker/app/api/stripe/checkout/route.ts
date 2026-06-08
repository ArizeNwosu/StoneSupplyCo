import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getStripePriceId } from '@/lib/stripe-prices';

export const runtime = 'nodejs';

const CheckoutSchema = z.object({
  plan: z.enum(['PRO', 'AGENCY']),
  interval: z.enum(['monthly', 'annual']),
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

  const { plan, interval } = parsed.data;

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

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  }

  // Get or create Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  let priceId: string;
  try {
    priceId = getStripePriceId(plan, interval);
  } catch (err) {
    console.error('[checkout] Missing Stripe price id:', err);
    return NextResponse.json({ error: 'Stripe price is not configured' }, { status: 500 });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing`,
    allow_promotion_codes: true,
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
    metadata: { userId: user.id, plan, interval },
    subscription_data: {
      metadata: { userId: user.id, plan, interval },
    },
  });

  if (!checkoutSession.url) {
    console.error('[checkout] Stripe returned null URL for session', checkoutSession.id);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
