// app/api/stalker/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { STALKER_FREQUENCY_LABEL, STALKER_PRICES_USD } from '@/lib/stalker-prices';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subs = await prisma.stalkerSubscription.findMany({
    where: { userId: session.user.id, active: true },
    include: { trackedAccount: { select: { id: true, handle: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    subs.map((s) => ({
      id: s.id,
      trackedAccountId: s.trackedAccountId,
      handle: s.trackedAccount.handle,
      avatarUrl: s.trackedAccount.avatarUrl,
      frequency: s.frequency,
      frequencyLabel: STALKER_FREQUENCY_LABEL[s.frequency],
      priceUsd: STALKER_PRICES_USD[s.frequency],
      source: s.source,
      createdAt: s.createdAt,
    }))
  );
}
