import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  // Try PublicAccount first (seeded accounts with full history)
  const publicAccount = await prisma.publicAccount.findUnique({
    where: { handle },
    include: {
      snapshots: {
        orderBy: { takenAt: 'desc' },
        take: 7,
        select: { followerCount: true, takenAt: true },
      },
    },
  });

  if (publicAccount?.followerCount) {
    const snaps = publicAccount.snapshots.reverse();
    const oldest = snaps[0]?.followerCount ?? null;
    const latest = snaps.at(-1)?.followerCount ?? null;
    return NextResponse.json(
      {
        handle,
        followerCount: publicAccount.followerCount,
        trend:
          latest !== null && oldest !== null && oldest !== latest
            ? latest - oldest
            : null,
        lastChecked: publicAccount.lastChecked,
      },
      { headers: CORS }
    );
  }

  // Fall back to most recent user-tracked snapshot
  const snap = await prisma.snapshot.findFirst({
    where: { trackedAccount: { handle } },
    orderBy: { takenAt: 'desc' },
    select: { followerCount: true, takenAt: true, trackedAccountId: true },
  });

  if (!snap) {
    return NextResponse.json(
      { error: 'No data for this handle' },
      { status: 404, headers: CORS }
    );
  }

  const oldest = await prisma.snapshot.findFirst({
    where: { trackedAccountId: snap.trackedAccountId },
    orderBy: { takenAt: 'asc' },
    select: { followerCount: true },
  });

  return NextResponse.json(
    {
      handle,
      followerCount: snap.followerCount,
      trend:
        oldest && oldest.followerCount !== snap.followerCount
          ? snap.followerCount - oldest.followerCount
          : null,
      lastChecked: snap.takenAt,
    },
    { headers: CORS }
  );
}
