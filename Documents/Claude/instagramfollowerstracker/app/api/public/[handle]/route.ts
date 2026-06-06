import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseHandle, isValidHandle } from '@/lib/handles';
import { getPublicHistorySnapshots } from '@/lib/public-history';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const normalizedHandle = parseHandle(handle);

  if (!isValidHandle(normalizedHandle)) {
    return NextResponse.json({ error: 'Invalid handle' }, { status: 400 });
  }

  const account = await prisma.publicAccount.findUnique({
    where: { handle: normalizedHandle },
    include: {
      snapshots: {
        orderBy: { takenAt: 'desc' },
        take: 90,
        select: {
          takenAt: true,
          followerCount: true,
          followingCount: true,
          postCount: true,
        },
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const snapshots = await getPublicHistorySnapshots({
    handle: normalizedHandle,
    publicSnapshots: account.snapshots,
    fallbackSnapshot:
      account.followerCount !== null
        ? {
            takenAt: account.lastChecked ?? account.createdAt,
            followerCount: account.followerCount,
            followingCount: account.followingCount,
            postCount: account.postCount,
          }
        : null,
  });
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
