import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

async function setPlan(userId: string, plan: 'PRO' | 'AGENCY', subId: string) {
  const result = await prisma.user.updateMany({
    where: { id: userId },
    data: { plan, stripeSubId: subId },
  });
  if (result.count === 0) {
    console.warn('[webhook] setPlan: no user found for userId', userId);
  }
}

async function clearPlan(customerId: string) {
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { plan: 'FREE', stripeSubId: null },
  });
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  const rawBody = await req.text();

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as 'PRO' | 'AGENCY' | undefined;
        const subId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;
        if (!userId || !plan || !subId) {
          console.error('[webhook] checkout.session.completed missing metadata', {
            sessionId: session.id,
            userId,
            plan,
            subId,
          });
          break;
        }
        await setPlan(userId, plan, subId);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        await clearPlan(customerId);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        const plan = sub.metadata?.plan as 'PRO' | 'AGENCY' | undefined;
        if (userId && plan) {
          if (sub.status === 'active') {
            await setPlan(userId, plan, sub.id);
          } else {
            console.warn('[webhook] subscription.updated non-active status ignored', {
              userId,
              status: sub.status,
              subId: sub.id,
            });
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('[webhook] Handler error:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
