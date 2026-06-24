import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://instagramfollowerstracker.com';

  let portalSession: Awaited<ReturnType<typeof stripe.billingPortal.sessions.create>>;
  try {
    portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings`,
    });
  } catch (err) {
    console.error('[portal] Stripe error:', err);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }

  if (!portalSession.url) {
    return NextResponse.json({ error: 'No portal URL returned' }, { status: 500 });
  }

  return NextResponse.json({ url: portalSession.url });
}
