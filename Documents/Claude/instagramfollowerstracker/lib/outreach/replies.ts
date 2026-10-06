import { prisma } from '@/lib/prisma';
import { recordRevenueEvent } from '@/lib/revenue/events';
import type { parseReply } from './reply-parser';

type ParsedReply = Awaited<ReturnType<typeof parseReply>>;

export async function matchReplyToMessage(db: any, reply: ParsedReply) {
  if (reply.replyToken) {
    const byToken = await db.outreachMessage.findUnique({ where: { replyToken: reply.replyToken } });
    if (byToken) return byToken;
  }
  const ids = [reply.inReplyTo, ...reply.references].filter(Boolean);
  for (const rfcMessageId of ids) {
    const byHeader = await db.outreachMessage.findUnique({ where: { rfcMessageId } });
    if (byHeader) return byHeader;
  }
  return null;
}

export async function storeReply(input: { db?: any; mailbox: string; uidValidity: string; uid: number; reply: ParsedReply }) {
  const db = input.db ?? prisma;
  if (!input.reply.senderEmail || !input.reply.bodyText) return { matched: false, stored: false };
  const message = await matchReplyToMessage(db, input.reply);
  if (!message) return { matched: false, stored: false };
  try {
    await db.outreachReply.create({ data: { outreachMessageId: message.id, mailbox: input.mailbox, uidValidity: input.uidValidity, uid: input.uid, senderEmail: input.reply.senderEmail, receivedAt: input.reply.receivedAt, bodyText: input.reply.bodyText, subject: input.reply.subject, inReplyTo: input.reply.inReplyTo, references: input.reply.references } });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') return { matched: true, stored: false };
    throw error;
  }
  await db.outreachMessage.update({ where: { id: message.id }, data: { status: 'REPLIED', repliedAt: input.reply.receivedAt, adminStatus: 'NEEDS_RESPONSE' } });
  await recordRevenueEvent({ userId: message.userId, type: 'OUTREACH_REPLIED', campaignId: message.campaignId, outreachMessageId: message.id, idempotencyKey: `outreach-reply:${input.mailbox}:${input.uidValidity}:${input.uid}` }, db.revenueEvent);
  return { matched: true, stored: true };
}
