import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { CHART_UNLOCK_THRESHOLD } from '@/lib/limits';
import { calculateAuthenticityScore } from '@/lib/fake-follower-score';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const account = await prisma.trackedAccount.findUnique({ where: { id } });

  if (!account) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (account.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Full history — no date cutoff on any tier
  const snapshots = await prisma.snapshot.findMany({
    where: { trackedAccountId: id },
    orderBy: { takenAt: 'asc' },
    select: { takenAt: true, followerCount: true },
  });

  const snapshotCount = account.snapshotCount;
  const chartReady = snapshotCount >= CHART_UNLOCK_THRESHOLD;

  const current = snapshots.at(-1)?.followerCount ?? null;
  const oldest = snapshots[0]?.followerCount ?? null;
  const change =
    current !== null && oldest !== null && snapshots.length > 1
      ? current - oldest
      : null;
  const changePct =
    change !== null && oldest ? Math.round((change / oldest) * 100) : null;
  const peak = snapshots.reduce<
    { takenAt: Date; followerCount: number } | undefined
  >(
    (max, s) => (!max || s.followerCount > max.followerCount ? s : max),
    undefined
  );

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Find the most recent snapshot taken at or before 7/30 days ago
  const snap7d = [...snapshots]
    .filter((s) => new Date(s.takenAt).getTime() <= sevenDaysAgo)
    .at(-1);
  const snap30d = [...snapshots]
    .filter((s) => new Date(s.takenAt).getTime() <= thirtyDaysAgo)
    .at(-1);

  const change7d =
    current !== null && snap7d ? current - snap7d.followerCount : null;
  const change30d =
    current !== null && snap30d ? current - snap30d.followerCount : null;

  // Compute authenticity score if we have enough data and it hasn't been cached yet
  let authenticityScore: ReturnType<typeof calculateAuthenticityScore> | null = null;
  if (snapshots.length >= 5) {
    if (account.authenticityScore === null) {
      authenticityScore = calculateAuthenticityScore(snapshots);
      // Cache score fire-and-forget — don't block the response
      prisma.trackedAccount
        .update({
          where: { id },
          data: { authenticityScore: authenticityScore.score },
        })
        .catch(() => {});
    } else {
      // Re-compute from snapshots so we always return the full result (score + label + signals)
      authenticityScore = calculateAuthenticityScore(snapshots);
    }
  }

  return NextResponse.json({
    handle: account.handle,
    snapshotCount,
    chartReady,
    snapshots,
    authenticityScore,
    // stats is null when chart isn't ready yet
    stats: chartReady
      ? {
          current,
          change,
          changePct,
          change7d,
          change30d,
          avgDailyGain:
            change !== null && snapshots.length > 1
              ? Math.round(change / (snapshots.length - 1))
              : null,
          peakCount: peak?.followerCount ?? null,
          peakDate: peak?.takenAt ?? null,
        }
      : null,
  });
}
