// app/api/stalker/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getStalkerPriceId } from '@/lib/stalker-prices';
import type { StalkerFrequency } from '@prisma/client';

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

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: customerId } });
  }

  let priceId: string;
  try {
    priceId = getStalkerPriceId(frequency as StalkerFrequency);
  } catch {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?stalker=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: {
      userId: session.user.id,
      trackedAccountId,
      frequency,
      type: 'STALKER',
    },
    subscription_data: {
      metadata: { userId: session.user.id, trackedAccountId, frequency, type: 'STALKER' },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
