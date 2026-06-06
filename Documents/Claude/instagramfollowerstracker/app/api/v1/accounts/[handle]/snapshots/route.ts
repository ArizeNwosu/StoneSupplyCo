import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const apiUser = await validateApiKey(req.headers.get('authorization'));
  if (!apiUser) {
    return NextResponse.json(
      { error: 'Invalid or missing API key. Use Authorization: Bearer <key>' },
      { status: 401 }
    );
  }

  const { handle } = await params;

  const account = await prisma.trackedAccount.findUnique({
    where: { userId_handle: { userId: apiUser.id, handle } },
    include: {
      snapshots: {
        orderBy: { takenAt: 'asc' },
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
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const snapshots = account.snapshots;
  const current = snapshots.at(-1)?.followerCount ?? null;
  const oldest = snapshots[0]?.followerCount ?? null;
  const change = current !== null && oldest !== null ? current - oldest : null;

  return NextResponse.json({
    handle: account.handle,
    displayName: account.displayName,
    snapshotCount: account.snapshotCount,
    authenticityScore: account.authenticityScore,
    snapshots,
    stats:
      account.snapshotCount >= 7 && current !== null
        ? {
            current,
            change,
            changePct:
              change !== null && oldest
                ? Math.round((change / oldest) * 100)
                : null,
            avgDailyGain:
              change !== null && snapshots.length > 1
                ? Math.round(change / (snapshots.length - 1))
                : null,
          }
        : null,
  });
}
