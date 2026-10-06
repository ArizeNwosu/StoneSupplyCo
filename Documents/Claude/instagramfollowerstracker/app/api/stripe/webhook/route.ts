import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import type Stripe from 'stripe';
import { planFromStripePriceId, type StripeBillingPlan } from '@/lib/stripe-prices';
import type { StalkerFrequency } from '@prisma/client';
import { recordRevenueEvent } from '@/lib/revenue/events';

export const runtime = 'nodejs';

async function setPlan({
  userId,
  customerId,
  plan,
  subId,
}: {
  userId: string;
  customerId?: string | null;
  plan: StripeBillingPlan;
  subId: string;
}) {
  const result = await prisma.user.updateMany({
    where: { id: userId },
    data: {
      plan,
      stripeSubId: subId,
      ...(customerId ? { stripeCustomerId: customerId } : {}),
    },
  });
  if (result.count === 0) {
    console.warn('[webhook] setPlan: no user found for userId', userId);
  }
}

async function clearPlan({
  customerId,
  subId,
}: {
  customerId?: string | null;
  subId?: string | null;
}) {
  if (!customerId && !subId) {
    console.warn('[webhook] clearPlan called without customerId or subId');
    return;
  }

  const result = await prisma.user.updateMany({
    where: customerId ? { stripeCustomerId: customerId } : { stripeSubId: subId! },
    data: { plan: 'FREE', stripeSubId: null },
  });
  if (result.count === 0) {
    console.warn('[webhook] clearPlan: no user found', { customerId, subId });
  }
}

async function findUserIdForSubscription(sub: Stripe.Subscription) {
  const metadataUserId = sub.metadata?.userId;
  if (metadataUserId) return metadataUserId;

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { stripeSubId: sub.id },
        { stripeCustomerId: customerId },
      ],
    },
    select: { id: true },
  });

  return user?.id ?? null;
}

function planFromSubscription(sub: Stripe.Subscription) {
  const metadataPlan = sub.metadata?.plan as StripeBillingPlan | undefined;
  if (metadataPlan === 'PRO' || metadataPlan === 'AGENCY') return metadataPlan;

  const firstPrice = sub.items.data[0]?.price.id;
  return planFromStripePriceId(firstPrice);
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
    await prisma.processedStripeEvent.create({
      data: { stripeEventId: event.id, eventType: event.type },
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const type = session.metadata?.type;
        const subId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id;

        if (!userId || !subId) {
          console.error('[webhook] checkout.session.completed missing metadata', { sessionId: session.id });
          break;
        }

        const attemptId = session.metadata?.attemptId;
        if (attemptId) {
          await prisma.checkoutAttempt.updateMany({
            where: { id: attemptId },
            data: {
              status: 'COMPLETED',
              stripeSubscriptionId: subId,
              completedAt: new Date(),
            },
          });
        }
        await recordRevenueEvent({
          type: 'CHECKOUT_COMPLETED',
          userId,
          source: session.metadata?.source as never,
          plan: session.metadata?.plan as never,
          interval: session.metadata?.interval as never,
          campaignId: session.metadata?.campaignId || null,
          outreachMessageId: session.metadata?.outreachMessageId || null,
          stripeCheckoutSessionId: session.id,
          stripeSubscriptionId: subId,
          idempotencyKey: `stripe:${event.id}:checkout-completed`,
        });

        if (type === 'STALKER') {
          const trackedAccountId = session.metadata?.trackedAccountId;
          const frequency = session.metadata?.frequency as StalkerFrequency | undefined;
          if (!trackedAccountId || !frequency) {
            console.error('[webhook] stalker checkout missing trackedAccountId or frequency');
            break;
          }

          let stripePriceId: string | null = null;
          try {
            const stripeSub = await stripe.subscriptions.retrieve(subId);
            stripePriceId = stripeSub.items.data[0]?.price.id ?? null;
          } catch { /* ignore */ }

          await prisma.stalkerSubscription.upsert({
            where: { userId_trackedAccountId: { userId, trackedAccountId } },
            create: {
              userId,
              trackedAccountId,
              frequency,
              source: 'STRIPE',
              stripeSubId: subId,
              stripePriceId,
              active: true,
            },
            update: {
              frequency,
              stripeSubId: subId,
              stripePriceId,
              active: true,
            },
          });
          if (customerId) {
            await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
          }
        } else {
          const plan = session.metadata?.plan as StripeBillingPlan | undefined;
          if (!plan) {
            console.error('[webhook] checkout.session.completed missing plan for non-stalker', { sessionId: session.id });
            break;
          }
          await setPlan({ userId, customerId, plan, subId });
        }
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await prisma.checkoutAttempt.updateMany({
          where: { stripeCheckoutSessionId: session.id },
          data: { status: 'EXPIRED', expiredAt: new Date() },
        });
        await recordRevenueEvent({
          type: 'CHECKOUT_EXPIRED',
          userId: session.metadata?.userId || null,
          source: session.metadata?.source as never,
          plan: session.metadata?.plan as never,
          interval: session.metadata?.interval as never,
          stripeCheckoutSessionId: session.id,
          idempotencyKey: `stripe:${event.id}:checkout-expired`,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        const stalkerSub = await prisma.stalkerSubscription.findFirst({
          where: { stripeSubId: sub.id },
        });
        if (stalkerSub) {
          await prisma.stalkerSubscription.update({
            where: { id: stalkerSub.id },
            data: { active: false },
          });
          break;
        }

        await clearPlan({ customerId, subId: sub.id });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        const stalkerSubForUpdate = await prisma.stalkerSubscription.findFirst({
          where: { stripeSubId: sub.id },
        });
        if (stalkerSubForUpdate) {
          if (
            sub.status === 'canceled' ||
            sub.status === 'unpaid' ||
            sub.status === 'incomplete_expired'
          ) {
            await prisma.stalkerSubscription.update({
              where: { id: stalkerSubForUpdate.id },
              data: { active: false },
            });
          }
          break;
        }

        if (sub.status === 'active' || sub.status === 'trialing') {
          const userId = await findUserIdForSubscription(sub);
          const plan = planFromSubscription(sub);
          if (userId && plan) {
            await setPlan({ userId, customerId, plan, subId: sub.id });
          } else {
            console.warn('[webhook] subscription.updated active but missing metadata', {
              subId: sub.id,
            });
          }
        } else if (
          sub.status === 'canceled' ||
          sub.status === 'unpaid' ||
          sub.status === 'incomplete_expired'
        ) {
          await clearPlan({ customerId, subId: sub.id });
        } else {
          console.warn('[webhook] subscription.updated unhandled status', {
            status: sub.status,
            subId: sub.id,
          });
        }
        break;
      }
    }
  } catch (err) {
    await prisma.processedStripeEvent.delete({ where: { stripeEventId: event.id } }).catch(() => undefined);
    console.error('[webhook] Handler error:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
