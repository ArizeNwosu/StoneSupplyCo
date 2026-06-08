import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export interface FollowerHistoryPoint {
  date: string; // ISO date string
  cumulative: number;
}

export interface UploadSnapshot {
  date: string;
  followerCount: number | null;
}

export interface FollowerHistoryResponse {
  uploadSnapshots: UploadSnapshot[];
  joinTrend: FollowerHistoryPoint[]; // cumulative from followedAt dates
  hasJoinData: boolean;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const handle = new URL(req.url).searchParams.get('handle') ?? null;
  const where = handle
    ? { userId: session.user.id, handle }
    : { userId: session.user.id };

  // All uploads oldest → newest for the trend line
  const exports = await prisma.dataExport.findMany({
    where,
    orderBy: { uploadedAt: 'asc' },
    select: {
      id: true,
      uploadedAt: true,
      followerCount: true,
    },
  });

  const uploadSnapshots: UploadSnapshot[] = exports.map((e) => ({
    date: e.uploadedAt.toISOString(),
    followerCount: e.followerCount,
  }));

  // Use followers from the most recent upload that has followedAt data
  // (later uploads are more complete — more followers have dated join times)
  const latestWithDates = await prisma.dataExport.findFirst({
    where: { ...where, followers: { some: { followedAt: { not: null } } } },
    orderBy: { uploadedAt: 'desc' },
    select: {
      followers: {
        where: { followedAt: { not: null } },
        select: { followedAt: true },
      },
    },
  });

  let joinTrend: FollowerHistoryPoint[] = [];

  if (latestWithDates && latestWithDates.followers.length > 0) {
    // Bucket by month (YYYY-MM)
    const buckets = new Map<string, number>();
    for (const { followedAt } of latestWithDates.followers) {
      if (!followedAt) continue;
      const key = `${followedAt.getUTCFullYear()}-${String(followedAt.getUTCMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    // Sort months and compute cumulative
    let cumulative = 0;
    joinTrend = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => {
        cumulative += count;
        return { date: `${month}-01`, cumulative };
      });
  }

  return NextResponse.json({
    uploadSnapshots,
    joinTrend,
    hasJoinData: joinTrend.length > 0,
  } satisfies FollowerHistoryResponse);
}
