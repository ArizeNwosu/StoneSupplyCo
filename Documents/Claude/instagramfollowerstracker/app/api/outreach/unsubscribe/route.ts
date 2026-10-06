import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOutreachToken } from '@/lib/outreach/tokens';
import { recordRevenueEvent } from '@/lib/revenue/events';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { token?: string };
  const value = body.token ? verifyOutreachToken(body.token) : null;
  if (!value) return NextResponse.json({ error: 'Invalid or expired unsubscribe link' }, { status: 400 });
  await prisma.outreachSuppression.upsert({ where: { email: value.email }, update: { reason: 'UNSUBSCRIBED' }, create: { email: value.email, reason: 'UNSUBSCRIBED' } });
  await prisma.outreachMessage.updateMany({ where: { userId: value.userId, status: { in: ['QUEUED', 'SENDING'] } }, data: { status: 'SUPPRESSED', lockedAt: null } });
  await recordRevenueEvent({ userId: value.userId, type: 'OUTREACH_UNSUBSCRIBED', campaignId: value.campaignId, idempotencyKey: `unsubscribe:${value.userId}` });
  return NextResponse.json({ ok: true });
}
