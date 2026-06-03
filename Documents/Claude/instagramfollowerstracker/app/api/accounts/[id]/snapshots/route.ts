import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PLAN_LIMITS } from '@/lib/limits';

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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const historyDays = PLAN_LIMITS[user.plan].historyDays;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - historyDays);

  const snapshots = await prisma.snapshot.findMany({
    where: { trackedAccountId: id, takenAt: { gte: cutoff } },
    orderBy: { takenAt: 'asc' },
    select: { takenAt: true, followerCount: true },
  });

  const current = snapshots.at(-1)?.followerCount ?? null;
  const oldest = snapshots[0]?.followerCount ?? null;
  const change =
    current !== null && oldest !== null ? current - oldest : null;
  const changePct =
    change !== null && oldest
      ? Math.round((change / oldest) * 100)
      : null;
  const peak = snapshots.reduce<
    { takenAt: Date; followerCount: number } | undefined
  >(
    (max, s) =>
      !max || s.followerCount > max.followerCount ? s : max,
    undefined
  );

  return NextResponse.json({
    handle: account.handle,
    snapshots,
    stats: {
      current,
      change,
      changePct,
      avgDailyGain:
        change !== null && snapshots.length > 1
          ? Math.round(change / (snapshots.length - 1))
          : null,
      peakCount: peak?.followerCount ?? null,
      peakDate: peak?.takenAt ?? null,
    },
  });
}
