import { prisma } from '@/lib/prisma';

export type PublicHistorySnapshot = {
  takenAt: Date;
  followerCount: number;
  followingCount?: number | null;
  postCount?: number | null;
};

const MAX_HISTORY_POINTS = 90;
const MAX_TRACKED_FALLBACK_POINTS = 300;

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function latestSnapshotPerDay(
  snapshots: PublicHistorySnapshot[],
  limit = MAX_HISTORY_POINTS
): PublicHistorySnapshot[] {
  const byDay = new Map<string, PublicHistorySnapshot>();
  const newestFirst = [...snapshots].sort(
    (a, b) => b.takenAt.getTime() - a.takenAt.getTime()
  );

  for (const snapshot of newestFirst) {
    const key = dayKey(snapshot.takenAt);
    if (!byDay.has(key)) {
      byDay.set(key, snapshot);
    }
  }

  return [...byDay.values()]
    .sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime())
    .slice(-limit);
}

export async function getPublicHistorySnapshots({
  handle,
  publicSnapshots,
  fallbackSnapshot,
}: {
  handle: string;
  publicSnapshots: PublicHistorySnapshot[];
  fallbackSnapshot?: PublicHistorySnapshot | null;
}): Promise<PublicHistorySnapshot[]> {
  const publicHistory = latestSnapshotPerDay(publicSnapshots);
  if (publicHistory.length > 0) {
    return publicHistory;
  }

  const trackedSnapshots = await prisma.snapshot.findMany({
    where: {
      trackedAccount: {
        handle,
        isPublic: true,
      },
    },
    orderBy: { takenAt: 'desc' },
    take: MAX_TRACKED_FALLBACK_POINTS,
    select: {
      takenAt: true,
      followerCount: true,
      followingCount: true,
      postCount: true,
    },
  });

  const trackedHistory = latestSnapshotPerDay(trackedSnapshots);
  if (trackedHistory.length > 0) {
    return trackedHistory;
  }

  return fallbackSnapshot ? [fallbackSnapshot] : [];
}
