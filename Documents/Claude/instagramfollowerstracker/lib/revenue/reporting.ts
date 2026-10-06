/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { getOutreachMode, isRevenueTestEmail } from './config';
import { PLAN_PRICES } from '@/lib/limits';

export type ReportRange = '7d' | '30d' | 'all';
export const safeRate = (numerator: number, denominator: number) => denominator ? numerator / denominator : 0;
function since(range: ReportRange, now = new Date()) { return range === 'all' ? undefined : new Date(now.getTime() - (range === '7d' ? 7 : 30) * 86_400_000); }
function rangeValue(value: string | null): ReportRange { return value === '7d' || value === 'all' ? value : '30d'; }
export { rangeValue };

export async function getRevenueReport(range: ReportRange, db: any = prisma) {
  const start = since(range);
  const users = await db.user.findMany({ select: { id: true, email: true, plan: true, createdAt: true, stripeSubId: true } });
  const real = users.filter((user: any) => !isRevenueTestEmail(user.email));
  const realIds = new Set(real.map((user: any) => user.id));
  const events = await db.revenueEvent.findMany({ where: { ...(start ? { occurredAt: { gte: start } } : {}) }, orderBy: { occurredAt: 'asc' } });
  const attempts = await db.checkoutAttempt.findMany({ where: { ...(start ? { createdAt: { gte: start } } : {}) } });
  const filteredEvents = events.filter((event: any) => !event.userId || realIds.has(event.userId));
  const filteredAttempts = attempts.filter((attempt: any) => !attempt.userId || realIds.has(attempt.userId));
  const count = (type: string) => filteredEvents.filter((event: any) => event.type === type).length;
  const active = real.filter((user: any) => user.plan !== 'FREE' && user.stripeSubId);
  const mrr = active.reduce((sum: number, user: any) => sum + (user.plan === 'AGENCY' ? PLAN_PRICES.AGENCY.monthly : PLAN_PRICES.PRO.monthly), 0);
  const signups = count('SIGNUP_COMPLETED'); const activations = count('ACTIVATION_COMPLETED'); const checkoutClicks = count('CHECKOUT_CLICKED'); const completions = count('CHECKOUT_COMPLETED');
  const funnel = [
    { label: 'Activation', numerator: activations, denominator: signups, rate: safeRate(activations, signups) },
    { label: 'Checkout started', numerator: filteredAttempts.length || checkoutClicks, denominator: activations, rate: safeRate(filteredAttempts.length || checkoutClicks, activations) },
    { label: 'Checkout completed', numerator: completions, denominator: filteredAttempts.length, rate: safeRate(completions, filteredAttempts.length) },
  ];
  const stalker = filteredAttempts.filter((attempt: any) => attempt.plan === 'STALKER');
  return { range, summary: { totalUsers: real.length, activeSubscribers: active.length, mrr, newSubscriptions: count('SUBSCRIPTION_ACTIVATED'), cancellations: count('SUBSCRIPTION_CANCELED'), expiredCheckouts: filteredAttempts.filter((attempt: any) => attempt.status === 'EXPIRED').length }, funnel, stalker: { attempts: stalker.length, completed: stalker.filter((attempt: any) => attempt.status === 'COMPLETED').length }, generatedAt: new Date().toISOString() };
}

export async function getCampaignReport(range: ReportRange, db: any = prisma) {
  const start = since(range);
  const campaigns = await db.outreachCampaign.findMany({ include: { messages: { where: start ? { createdAt: { gte: start } } : {}, include: { user: { select: { email: true } } } } }, orderBy: { name: 'asc' } });
  return { range, mode: getOutreachMode(), campaigns: campaigns.map((campaign: any) => { const messages = campaign.messages.filter((message: any) => !isRevenueTestEmail(message.user?.email)); const sent = messages.filter((m: any) => ['SENT','REPLIED'].includes(m.status)).length; const replied = messages.filter((m: any) => m.repliedAt).length; const converted = messages.filter((m: any) => m.convertedAt).length; return { id: campaign.id, key: campaign.key, name: campaign.name, enabled: campaign.enabled, triggerType: campaign.triggerType, delayMinutes: campaign.delayMinutes, dailySendCap: campaign.dailySendCap, queued: messages.filter((m: any) => m.status === 'QUEUED').length, sent, failed: messages.filter((m: any) => m.status === 'FAILED').length, replied, converted, replyRate: safeRate(replied, sent), conversionRate: safeRate(converted, sent) }; }) };
}

export async function getReplyInbox(input: { status?: string | null; campaignId?: string | null; page?: number; pageSize?: number }, db: any = prisma) {
  const page = Math.max(1, input.page ?? 1), pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25));
  const where = { repliedAt: { not: null }, ...(input.status ? { adminStatus: input.status } : {}), ...(input.campaignId ? { campaignId: input.campaignId } : {}) };
  const [total, rows] = await Promise.all([db.outreachMessage.count({ where }), db.outreachMessage.findMany({ where, include: { user: { select: { email: true } }, campaign: { select: { name: true } }, replies: { orderBy: { receivedAt: 'desc' }, take: 1 } }, orderBy: { repliedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize })]);
  return { page, pageSize, total, replies: rows.map((row: any) => ({ id: row.id, senderEmail: row.replies[0]?.senderEmail ?? row.user?.email ?? '', campaign: row.campaign.name, receivedAt: row.replies[0]?.receivedAt?.toISOString() ?? row.repliedAt?.toISOString(), subject: row.replies[0]?.subject ?? '', bodyText: row.replies[0]?.bodyText ?? '', classification: row.classification, adminStatus: row.adminStatus })) };
}
