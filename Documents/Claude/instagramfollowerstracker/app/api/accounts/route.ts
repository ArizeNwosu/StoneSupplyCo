import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PLAN_LIMITS, CHART_UNLOCK_THRESHOLD } from '@/lib/limits';
import { parseHandle, isValidHandle } from '@/lib/handles';
import { sendMilestoneEmail } from '@/lib/email';
import { parseFollowerCount } from '@/lib/counts';

export const runtime = 'nodejs';
export const maxDuration = 60;

const AddAccountSchema = z.object({
  handle: z.string().min(1).max(60),
  followerCount: z.string().max(30).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await prisma.trackedAccount.findMany({
    where: { userId: session.user.id },
    include: {
      snapshots: {
        orderBy: { takenAt: 'desc' },
        take: 2,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const result = accounts.map((account) => {
    const [latest, previous] = account.snapshots;
    const latestCount = latest?.followerCount ?? null;
    const change24h =
      latest && previous
        ? latest.followerCount - previous.followerCount
        : null;
    const chartReady = account.snapshotCount >= CHART_UNLOCK_THRESHOLD;
    return {
      id: account.id,
      handle: account.handle,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      latestCount,
      change24h,
      lastChecked: account.lastChecked,
      snapshotCount: account.snapshotCount,
      chartReady,
      authenticityScore: account.authenticityScore,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as unknown;
  const parsed = AddAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid handle' }, { status: 400 });
  }

  const handle = parseHandle(parsed.data.handle);
  if (!isValidHandle(handle)) {
    return NextResponse.json(
      { error: 'Invalid Instagram handle' },
      { status: 400 }
    );
  }
  const manualFollowerCount = parsed.data.followerCount
    ? parseFollowerCount(parsed.data.followerCount)
    : null;

  if (parsed.data.followerCount && manualFollowerCount === null) {
    return NextResponse.json(
      { error: 'Invalid follower count' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      plan: true,
      _count: { select: { trackedAccounts: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const limit = PLAN_LIMITS[user.plan].maxAccounts;
  if (limit !== null && user._count.trackedAccounts >= limit) {
    return NextResponse.json(
      { error: 'Plan limit reached', limit, upgrade: '/pricing' },
      { status: 402 }
    );
  }

  const existing = await prisma.trackedAccount.findUnique({
    where: { userId_handle: { userId: user.id, handle } },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Already tracking this account' },
      { status: 400 }
    );
  }

  const account = await prisma.trackedAccount.create({
    data: { userId: user.id, handle },
  });

  let snapshotCount = 0;
  let firstFollowerCount: number | null = null;

  // Take first snapshot immediately. Import dynamically to keep scraper server-only.
  try {
    const { fetchInstagramProfile } = await import('@/lib/scraper');
    const profile = await fetchInstagramProfile(handle);
    const followerCount = profile.followerCount ?? manualFollowerCount;

    if (followerCount !== null) {
      await prisma.snapshot.create({
        data: {
          trackedAccountId: account.id,
          followerCount,
          followingCount: profile.followingCount ?? undefined,
          postCount: profile.postCount ?? undefined,
        },
      });
      snapshotCount = 1;
      firstFollowerCount = followerCount;
    }

    const updatedAccount = await prisma.trackedAccount.update({
      where: { id: account.id },
      data: {
        snapshotCount,
        // Only mark as checked when we actually stored a snapshot.
        // Leaving lastChecked null lets the cron pick it up the next day.
        ...(snapshotCount > 0 ? { lastChecked: new Date() } : {}),
        displayName: profile.displayName ?? undefined,
        avatarUrl: profile.avatarUrl ?? undefined,
        isPublic: !profile.isPrivate,
        milestone1Sent: snapshotCount === 1,
      },
      include: { user: { select: { email: true } } },
    });

    // Milestone 1 email: worker checks count===1 never fires because
    // snapshotCount is already 1 by the time cron runs, so send it here.
    if (firstFollowerCount !== null && updatedAccount.user.email) {
      await sendMilestoneEmail({
        to: updatedAccount.user.email,
        handle,
        snapshotCount: 1,
        followerCount: firstFollowerCount,
      });
    }
  } catch (err) {
    console.error(`[accounts] First snapshot failed for @${handle}:`, err);
  }

  return NextResponse.json(
    {
      id: account.id,
      handle: account.handle,
      snapshotCount,
      chartReady: snapshotCount >= CHART_UNLOCK_THRESHOLD,
    },
    { status: 200 }
  );
}
