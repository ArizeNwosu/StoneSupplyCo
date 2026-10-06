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

export async function evaluateCampaigns(now = new Date(), db: any = prisma) {
  const mode = getOutreachMode();
  const campaigns = await db.outreachCampaign.findMany({ where: { enabled: true } });
  let eligible = 0, queued = 0, previewed = 0;
  for (const campaign of campaigns) {
    const users = await db.user.findMany({ where: campaign.transactional ? {} : { plan: 'FREE' }, take: campaign.dailySendCap });
    for (const user of users) {
      if (isRevenueTestEmail(user.email)) continue;
      if (await db.outreachSuppression.findUnique({ where: { email: user.email.toLowerCase() } })) continue;
      eligible += 1;
      if (!mode.enabled && !mode.dryRun) continue;
      const occurrenceKey = `${campaign.key}:${user.id}:${now.toISOString().slice(0, 10)}`;
      await db.outreachMessage.upsert({
        where: { campaignId_occurrenceKey: { campaignId: campaign.id, occurrenceKey } },
        update: {},
        create: { userId: user.id, campaignId: campaign.id, occurrenceKey, replyToken: createReplyToken(), scheduledAt: now, dryRun: mode.dryRun, status: mode.dryRun ? 'CANCELED' : 'QUEUED' },
      });
      if (mode.dryRun) previewed += 1; else queued += 1;
    }
  }
  return { eligible, queued, previewed, mode };
}
