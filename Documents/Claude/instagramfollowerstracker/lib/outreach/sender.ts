/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { getOutreachMode } from '@/lib/revenue/config';
import { recordRevenueEvent } from '@/lib/revenue/events';
import { guardMessageDelivery } from './eligibility';
import { renderOutreachTemplate } from './templates';
import { createSmtpTransport } from './smtp';

export async function claimOutreachBatch(db: any = prisma, now = new Date(), limit = 20) {
  const stale = new Date(now.getTime() - 15 * 60_000);
  await db.outreachMessage.updateMany({ where: { status: 'SENDING', lockedAt: { lt: stale } }, data: { status: 'QUEUED', lockedAt: null } });
  const candidates = await db.outreachMessage.findMany({ where: { status: 'QUEUED', dryRun: false, scheduledAt: { lte: now } }, orderBy: { scheduledAt: 'asc' }, take: limit * 2, select: { id: true } });
  const claimed: string[] = [];
  for (const candidate of candidates) {
    if (claimed.length >= limit) break;
    const result = await db.outreachMessage.updateMany({ where: { id: candidate.id, status: 'QUEUED', lockedAt: null }, data: { status: 'SENDING', lockedAt: now, attemptCount: { increment: 1 } } });
    if (result.count === 1) claimed.push(candidate.id);
  }
  return claimed;
}

function errorCategory(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (/AUTH|EAUTH|535/i.test(code)) return 'authentication';
  if (/POLICY|550|553/i.test(code)) return 'policy';
  return 'transient';
}

export async function sendOutreachBatch(options: { db?: any; now?: Date; limit?: number; transportFactory?: typeof createSmtpTransport } = {}) {
  const db = options.db ?? prisma;
  const mode = getOutreachMode();
  if (!mode.enabled || mode.dryRun) return { claimed: 0, sent: 0, failed: 0, suppressed: 0, skipped: true };
  const ids = await claimOutreachBatch(db, options.now, options.limit);
  if (!ids.length) return { claimed: 0, sent: 0, failed: 0, suppressed: 0, skipped: false };
  const transport = (options.transportFactory ?? createSmtpTransport)();
  let sent = 0, failed = 0, suppressed = 0;
  for (const id of ids) {
    if (!await guardMessageDelivery(db, id)) { suppressed += 1; continue; }
    const message = await db.outreachMessage.findUnique({ where: { id }, include: { user: true, campaign: true } });
    if (!message?.user) { await db.outreachMessage.update({ where: { id }, data: { status: 'FAILED', lockedAt: null, lastErrorCategory: 'missing_recipient' } }); failed += 1; continue; }
    if (mode.allowlist.length && !mode.allowlist.includes(message.user.email.toLowerCase())) { await db.outreachMessage.update({ where: { id }, data: { status: 'SUPPRESSED', lockedAt: null, lastErrorCategory: 'allowlist' } }); suppressed += 1; continue; }
    const rendered = renderOutreachTemplate({ campaignKey: message.campaign.key, userId: message.user.id, campaignId: message.campaignId, email: message.user.email, name: message.user.name, replyToken: message.replyToken });
    const rfcMessageId = `<outreach-${message.id}@${new URL(rendered.ctaUrl).hostname}>`;
    try {
      const result = await transport.sendMail({
        from: { name: process.env.OUTREACH_FROM_NAME ?? 'Instagram Followers Tracker', address: process.env.IONOS_EMAIL_USER! },
        to: message.user.email,
        replyTo: process.env.OUTREACH_REPLY_TO ?? process.env.IONOS_EMAIL_USER,
        subject: rendered.subject, text: rendered.text, html: rendered.html, messageId: rfcMessageId,
        headers: { 'X-Outreach-Token': message.replyToken, 'List-Unsubscribe': `<${rendered.unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      });
      await db.outreachMessage.update({ where: { id }, data: { status: 'SENT', lockedAt: null, sentAt: options.now ?? new Date(), providerMessageId: result.messageId, rfcMessageId } });
      await recordRevenueEvent({ userId: message.user.id, type: 'OUTREACH_SENT', campaignId: message.campaignId, outreachMessageId: id, idempotencyKey: `outreach-sent:${id}` }, db.revenueEvent);
      sent += 1;
    } catch (error) {
      const category = errorCategory(error);
      const retry = category === 'transient' && message.attemptCount < 4;
      const delayMinutes = 2 ** Math.max(message.attemptCount, 1) * 5;
      await db.outreachMessage.update({ where: { id }, data: { status: retry ? 'QUEUED' : 'FAILED', lockedAt: null, scheduledAt: retry ? new Date((options.now ?? new Date()).getTime() + delayMinutes * 60_000) : message.scheduledAt, lastErrorCategory: category } });
      failed += 1;
    }
  }
  return { claimed: ids.length, sent, failed, suppressed, skipped: false };
}
