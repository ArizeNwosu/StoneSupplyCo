/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { getOutreachMode, isRevenueTestEmail } from '@/lib/revenue/config';
import { createReplyToken } from './tokens';

export const CAMPAIGN_DEFINITIONS = [
  ['welcome_activation_help', 'Welcome activation help', 'SIGNED_UP_NO_ACTIVATION', 1440, false],
  ['activated_free_value', 'Activated free value', 'ACTIVATED_FREE', 2880, false],
  ['unfollower_result_upgrade', 'Unfollower result upgrade', 'EXPORT_RESULT', 60, false],
  ['abandoned_core_checkout', 'Abandoned core checkout', 'CORE_CHECKOUT_EXPIRED', 60, false],
  ['abandoned_stalker_checkout', 'Abandoned Stalker checkout', 'STALKER_CHECKOUT_EXPIRED', 60, false],
  ['founding_user_offer', 'Founding user offer', 'ACTIVE_FREE_USER', 10080, false],
  ['subscription_onboarding', 'Subscription onboarding', 'SUBSCRIPTION_ACTIVATED', 0, true],
  ['cancellation_feedback', 'Cancellation feedback', 'SUBSCRIPTION_CANCELED', 60, true],
] as const;

function campaignOccurrence(campaignKey: string, user: any) {
  const events = user.revenueEvents ?? [];
  const attempts = user.checkoutAttempts ?? [];
  const latest = (values: any[]) => values.sort((a, b) => new Date(b.occurredAt ?? b.createdAt).getTime() - new Date(a.occurredAt ?? a.createdAt).getTime())[0];
  switch (campaignKey) {
    case 'welcome_activation_help': return events.some((e: any) => e.type === 'ACTIVATION_COMPLETED') ? null : `user:${user.id}`;
    case 'activated_free_value': return latest(events.filter((e: any) => e.type === 'ACTIVATION_COMPLETED'))?.id ?? null;
    case 'unfollower_result_upgrade': return user.dataExports?.[0]?.id ?? null;
    case 'abandoned_core_checkout': return latest(attempts.filter((a: any) => a.status === 'EXPIRED' && a.plan !== 'STALKER'))?.id ?? null;
    case 'abandoned_stalker_checkout': return latest(attempts.filter((a: any) => a.status === 'EXPIRED' && a.plan === 'STALKER'))?.id ?? null;
    case 'founding_user_offer': return user.trackedAccounts?.some((account: any) => account.snapshotCount >= 2) ? `founder:${user.id}` : null;
    case 'subscription_onboarding': return latest(events.filter((e: any) => e.type === 'SUBSCRIPTION_ACTIVATED'))?.id ?? null;
    case 'cancellation_feedback': return latest(events.filter((e: any) => e.type === 'SUBSCRIPTION_CANCELED'))?.id ?? null;
    default: return null;
  }
}

export async function evaluateCampaigns(now = new Date(), db: any = prisma) {
  const mode = getOutreachMode();
  const campaigns = await db.outreachCampaign.findMany({ where: { enabled: true } });
  let eligible = 0, queued = 0, previewed = 0;
  for (const campaign of campaigns) {
    const cutoff = new Date(now.getTime() - campaign.delayMinutes * 60_000);
    const users = await db.user.findMany({
      where: campaign.transactional ? {} : { plan: 'FREE' },
      include: {
        revenueEvents: { where: { occurredAt: { lte: cutoff } }, select: { id: true, type: true, occurredAt: true } },
        checkoutAttempts: { where: { createdAt: { lte: cutoff } }, select: { id: true, plan: true, status: true, createdAt: true } },
        dataExports: { where: { uploadedAt: { lte: cutoff } }, select: { id: true }, orderBy: { uploadedAt: 'desc' }, take: 1 },
        trackedAccounts: { select: { snapshotCount: true } },
      },
    });
    let campaignCount = 0;
    for (const user of users) {
      if (campaignCount >= campaign.dailySendCap) break;
      if (campaign.key === 'welcome_activation_help' && user.createdAt > cutoff) continue;
      if (isRevenueTestEmail(user.email)) continue;
      if (await db.outreachSuppression.findUnique({ where: { email: user.email.toLowerCase() } })) continue;
      const occurrence = campaignOccurrence(campaign.key, user);
      if (!occurrence) continue;
      if (!campaign.transactional) {
        const recentCount = await db.outreachMessage.count({ where: { userId: user.id, sentAt: { gte: new Date(now.getTime() - 7 * 86_400_000) }, campaign: { transactional: false } } });
        if (recentCount >= 2) continue;
      }
      eligible += 1;
      if (!mode.enabled && !mode.dryRun) continue;
      const occurrenceKey = `${mode.dryRun ? 'preview:' : ''}${campaign.key}:${occurrence}`;
      await db.outreachMessage.upsert({
        where: { campaignId_occurrenceKey: { campaignId: campaign.id, occurrenceKey } },
        update: {},
        create: { userId: user.id, campaignId: campaign.id, occurrenceKey, replyToken: createReplyToken(), scheduledAt: now, dryRun: mode.dryRun, status: mode.dryRun ? 'CANCELED' : 'QUEUED' },
      });
      campaignCount += 1;
      if (mode.dryRun) previewed += 1; else queued += 1;
    }
  }
  return { eligible, queued, previewed, mode };
}
