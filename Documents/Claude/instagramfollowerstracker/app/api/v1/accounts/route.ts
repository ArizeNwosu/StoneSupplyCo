import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';
import { CHART_UNLOCK_THRESHOLD } from '@/lib/limits';

export async function GET(req: NextRequest) {
  const apiUser = await validateApiKey(req.headers.get('authorization'));
  if (!apiUser) {
    return NextResponse.json(
      { error: 'Invalid or missing API key. Use Authorization: Bearer <key>' },
      { status: 401 }
    );
  }

  const accounts = await prisma.trackedAccount.findMany({
    where: { userId: apiUser.id },
    include: {
      snapshots: {
        orderBy: { takenAt: 'desc' },
        take: 2,
        select: { followerCount: true, takenAt: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const result = accounts.map((account) => {
    const [latest, previous] = account.snapshots;
    return {
      handle: account.handle,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      followerCount: latest?.followerCount ?? null,
      change24h:
        latest && previous
          ? latest.followerCount - previous.followerCount
          : null,
      lastChecked: account.lastChecked,
      snapshotCount: account.snapshotCount,
      chartReady: account.snapshotCount >= CHART_UNLOCK_THRESHOLD,
      authenticityScore: account.authenticityScore,
    };
  });

  return NextResponse.json(result);
}
