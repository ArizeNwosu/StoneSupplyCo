import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  const account = await prisma.publicAccount.findUnique({
    where: { handle: handle.toLowerCase() },
    include: {
      snapshots: {
        orderBy: { takenAt: 'asc' },
        take: 90,
        select: { takenAt: true, followerCount: true },
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const snapshots = account.snapshots;
  const current = snapshots.at(-1)?.followerCount ?? account.followerCount;
  const oldest = snapshots[0]?.followerCount ?? null;
  const change =
    current !== null && oldest !== null ? current - oldest : null;
  const changePct =
    change !== null && oldest
      ? Math.round((change / oldest) * 100)
      : null;

  return NextResponse.json({
    handle: account.handle,
    displayName: account.displayName,
    bio: account.bio,
    avatarUrl: account.avatarUrl,
    currentCount: current,
    snapshots,
    stats: {
      current,
      change,
      changePct,
      avgDailyGain:
        change !== null && snapshots.length > 1
          ? Math.round(change / (snapshots.length - 1))
          : null,
    },
    lastChecked: account.lastChecked,
  });
}
