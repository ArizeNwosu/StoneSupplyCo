/* eslint-disable @typescript-eslint/no-explicit-any */
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { planFromStripePriceId } from '@/lib/stripe-prices';
import { mapStripeStatusToAccess } from './subscriptions';
import { recordRevenueEvent } from './events';

export async function attributeOutreachConversion(input: { db?: any; userId: string; subscriptionId: string; outreachMessageId?: string | null; campaignId?: string | null; completedAt?: Date }) {
  const db = input.db ?? prisma;
  const completedAt = input.completedAt ?? new Date();
  let message = input.outreachMessageId ? await db.outreachMessage.findUnique({ where: { id: input.outreachMessageId } }) : null;
  if (!message) {
    message = await db.outreachMessage.findFirst({ where: { userId: input.userId, sentAt: { gte: new Date(completedAt.getTime() - 30 * 86_400_000), lte: completedAt } }, orderBy: { sentAt: 'desc' } });
  }
  if (!message) return null;
  await db.outreachMessage.update({ where: { id: message.id }, data: { convertedAt: completedAt, attributedSubscriptionId: input.subscriptionId } });
  return message.id;
}

export async function reconcileStripeSubscriptions(options: { stripeClient?: Pick<Stripe, 'subscriptions'>; db?: any; now?: Date } = {}) {
  const stripeClient = options.stripeClient ?? stripe;
  const db = options.db ?? prisma;
  let startingAfter: string | undefined;
  let scanned = 0, repaired = 0, unknown = 0;
  do {
    const page = await stripeClient.subscriptions.list({ status: 'all', limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) });
    for (const sub of page.data) {
      scanned += 1;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const user = sub.metadata?.userId
        ? await db.user.findUnique({ where: { id: sub.metadata.userId } })
        : await db.user.findFirst({ where: { OR: [{ stripeSubId: sub.id }, { stripeCustomerId: customerId }] } });
      if (!user) { unknown += 1; continue; }
      if (sub.metadata?.type === 'STALKER') {
        const active = mapStripeStatusToAccess(sub.status).hasAccess;
        const result = await db.stalkerSubscription.updateMany({ where: { stripeSubId: sub.id, active: { not: active } }, data: { active } });
        repaired += result.count;
        continue;
      }
      const active = mapStripeStatusToAccess(sub.status).hasAccess;
      const metadataPlan = sub.metadata?.plan;
      const plan = active && (metadataPlan === 'PRO' || metadataPlan === 'AGENCY' ? metadataPlan : planFromStripePriceId(sub.items.data[0]?.price.id)) || 'FREE';
      if (user.plan !== plan || (active && user.stripeSubId !== sub.id)) {
        await db.user.update({ where: { id: user.id }, data: { plan, stripeSubId: active ? sub.id : null, stripeCustomerId: customerId } });
        await recordRevenueEvent({ userId: user.id, type: active ? 'SUBSCRIPTION_ACTIVATED' : 'SUBSCRIPTION_CANCELED', plan: plan === 'FREE' ? null : plan, stripeSubscriptionId: sub.id, idempotencyKey: `reconcile:${sub.id}:${sub.status}` }, db.revenueEvent);
        repaired += 1;
      }
    }
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);
  return { scanned, repaired, unknown };
}
