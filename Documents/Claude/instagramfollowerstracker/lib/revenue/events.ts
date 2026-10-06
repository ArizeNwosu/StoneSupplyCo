import { prisma } from '@/lib/prisma';
import {
  CHECKOUT_SOURCES,
  type CheckoutSource,
  type RevenueEventType,
  type RevenuePlan,
  type BillingInterval,
  isCheckoutSource,
} from './types';

const BROWSER_EVENT_TYPES = [
  'PAYWALL_VIEWED',
  'PRICING_VIEWED',
  'CHECKOUT_CLICKED',
] as const satisfies readonly RevenueEventType[];

export interface RevenueEventInput {
  type: RevenueEventType;
  userId?: string | null;
  source?: CheckoutSource | null;
  plan?: RevenuePlan | null;
  interval?: BillingInterval | null;
  campaignId?: string | null;
  outreachMessageId?: string | null;
  stripeCustomerId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeSubscriptionId?: string | null;
  properties?: Record<string, unknown> | null;
  idempotencyKey?: string | null;
  occurredAt?: Date;
}

export interface RevenueEventStore {
  create(args: { data: RevenueEventInput }): Promise<unknown>;
  findUnique(args: { where: { idempotencyKey: string } }): Promise<unknown>;
}

export function parseBrowserRevenueEvent(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Invalid revenue event');
  const input = value as Record<string, unknown>;
  if (!(BROWSER_EVENT_TYPES as readonly unknown[]).includes(input.type)) {
    throw new Error('Invalid browser event type');
  }
  if (!isCheckoutSource(input.source)) throw new Error('Invalid checkout source');
  if (input.properties !== undefined) {
    const size = Buffer.byteLength(JSON.stringify(input.properties));
    if (size > 4096) throw new Error('Event properties exceed 4 KB');
  }
  if (input.idempotencyKey !== undefined &&
      (typeof input.idempotencyKey !== 'string' || input.idempotencyKey.length > 200)) {
    throw new Error('Invalid idempotency key');
  }
  const plan: RevenuePlan | undefined =
    input.plan === 'PRO' || input.plan === 'AGENCY' || input.plan === 'STALKER'
      ? input.plan
      : undefined;
  const interval: BillingInterval | undefined =
    input.interval === 'monthly' || input.interval === 'annual'
      ? input.interval
      : undefined;
  return {
    type: input.type as (typeof BROWSER_EVENT_TYPES)[number],
    source: input.source,
    plan,
    interval,
    properties: input.properties as Record<string, unknown> | undefined,
    idempotencyKey: input.idempotencyKey as string | undefined,
  };
}

export async function recordRevenueEvent(
  input: RevenueEventInput,
  store: RevenueEventStore = prisma.revenueEvent
) {
  try {
    return await store.create({ data: input });
  } catch (error) {
    if ((error as { code?: string }).code !== 'P2002' || !input.idempotencyKey) throw error;
    const existing = await store.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (!existing) throw error;
    return existing;
  }
}

export { CHECKOUT_SOURCES };
