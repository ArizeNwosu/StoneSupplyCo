// app/api/stalker/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sub = await prisma.stalkerSubscription.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (sub.source === 'PRO_INCLUDED') {
    return NextResponse.json({ error: 'Cannot cancel a plan-included subscription' }, { status: 403 });
  }

  if (sub.stripeSubId) {
    try {
      await stripe.subscriptions.cancel(sub.stripeSubId);
    } catch (err) {
      console.error('[stalker] cancel stripe sub failed:', err);
    }
  }

  await prisma.stalkerSubscription.update({
    where: { id: sub.id },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
