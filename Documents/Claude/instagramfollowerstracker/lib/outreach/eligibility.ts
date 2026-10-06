/* eslint-disable @typescript-eslint/no-explicit-any */
import { isRevenueTestEmail } from '@/lib/revenue/config';

export function isOutreachEligible(input: { email: string; plan: string; suppressed: boolean; transactional: boolean; promotionalSentAt: Date[]; now: Date }) {
  if (isRevenueTestEmail(input.email) || input.suppressed) return false;
  if (input.transactional) return true;
  if (input.plan !== 'FREE') return false;
  const cutoff = input.now.getTime() - 7 * 86_400_000;
  return input.promotionalSentAt.filter((date) => date.getTime() >= cutoff).length < 2;
}

export async function guardMessageDelivery(db: any, messageId: string) {
  const message = await db.outreachMessage.findUnique({ where: { id: messageId }, include: { user: true } });
  if (!message?.user) return false;
  const suppression = await db.outreachSuppression.findUnique({ where: { email: message.user.email.toLowerCase() } });
  if (!suppression) return true;
  await db.outreachMessage.update({ where: { id: messageId }, data: { status: 'SUPPRESSED', lockedAt: null } });
  return false;
}
