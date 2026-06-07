import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS } from '@/lib/limits';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, plan: true },
  });
  if (!user) return NextResponse.json(null);

  const isPro = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS].unfollowDetection;

  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle') ?? null;

  const whereClause = handle
    ? { userId: user.id, handle }
    : { userId: user.id };

  // Fetch the two most recent exports with follower AND following lists
  const exports = await prisma.dataExport.findMany({
    where: whereClause,
    orderBy: { uploadedAt: 'desc' },
    take: 2,
    include: {
      followers: { select: { handle: true, displayName: true } },
      following: { select: { handle: true, displayName: true } },
    },
  });

  if (exports.length === 0) return NextResponse.json(null);

  const latest = exports[0]!;
  const previous = exports[1] ?? null;

  let diff: {
    newFollowers: { handle: string; displayName?: string }[];
    lostFollowers: { handle: string; displayName?: string }[];
    newCount: number;
    lostCount: number;
  } | null = null;

  // Accounts in previous following but not current following = you unfollowed them
  let youUnfollowed: { handle: string; displayName?: string }[] = [];

  if (previous) {
    const prevHandles = new Set(previous.followers.map((f) => f.handle));
    const currHandles = new Set(latest.followers.map((f) => f.handle));

    const lostFollowers = previous.followers.filter((f) => !currHandles.has(f.handle));
    const newFollowers = latest.followers.filter((f) => !prevHandles.has(f.handle));

    diff = {
      lostCount: lostFollowers.length,
      newCount: newFollowers.length,
      lostFollowers: isPro
        ? lostFollowers.map((f) => ({ handle: f.handle, displayName: f.displayName ?? undefined }))
        : [],
      newFollowers: isPro
        ? newFollowers.map((f) => ({ handle: f.handle, displayName: f.displayName ?? undefined }))
        : [],
    };

    // Compute who you unfollowed from stored following lists
    if (previous.following.length > 0 || latest.following.length > 0) {
      const currFollowingHandles = new Set(latest.following.map((f) => f.handle));
      youUnfollowed = previous.following
        .filter((f) => !currFollowingHandles.has(f.handle))
        .map((f) => ({ handle: f.handle, displayName: f.displayName ?? undefined }));
    }
  }

  // Ghost following: accounts you follow that don't follow you back
  const latestFollowerHandles = new Set(latest.followers.map((f) => f.handle));
  const ghostFollowing = latest.following.filter((f) => !latestFollowerHandles.has(f.handle));

  return NextResponse.json({
    uploadId: latest.id,
    followerCount: latest.followerCount,
    followingCount: latest.followingCount,
    uploadedAt: latest.uploadedAt.toISOString(),
    diff,
    recentlyUnfollowed: isPro ? youUnfollowed : [],
    recentlyUnfollowedCount: youUnfollowed.length,
    ghostFollowing: isPro
      ? ghostFollowing.map((f) => ({ handle: f.handle, displayName: f.displayName ?? undefined }))
      : [],
    ghostFollowingCount: ghostFollowing.length,
  });
}
