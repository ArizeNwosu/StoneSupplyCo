// app/api/stalker/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getStalkerPriceId } from '@/lib/stalker-prices';
import type { StalkerFrequency } from '@prisma/client';
import { createAttributedCheckout } from '@/lib/revenue/checkout';

export const runtime = 'nodejs';

const SubscribeSchema = z.object({
  trackedAccountId: z.string().min(1),
  frequency: z.enum(['DAILY', 'SIX_HOUR', 'HOURLY']),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as unknown;
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { trackedAccountId, frequency } = parsed.data;

  const [account, existing] = await Promise.all([
    prisma.trackedAccount.findFirst({
      where: { id: trackedAccountId, userId: session.user.id },
      select: { id: true, handle: true },
    }),
    prisma.stalkerSubscription.findUnique({
      where: { userId_trackedAccountId: { userId: session.user.id, trackedAccountId } },
    }),
  ]);
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  if (existing?.active) {
    return NextResponse.json({ error: 'Stalker Mode already active for this account' }, { status: 409 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://instagramfollowerstracker.com';

  let priceId: string;
  try {
    priceId = getStalkerPriceId(frequency as StalkerFrequency);
  } catch {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 });
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
      user: { id: session.user.id, email: user.email, stripeCustomerId: user.stripeCustomerId },
      plan: 'STALKER',
      interval: 'monthly',
      source: 'stalker',
      successUrl: `${appUrl}/dashboard?stalker=1&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/dashboard`,
      extraMetadata: { trackedAccountId, frequency, type: 'STALKER' },
    });
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[stalker] Checkout creation failed:', error);
    return NextResponse.json({ error: 'Could not create Stalker Mode checkout' }, { status: 500 });
  }
}
