import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PLAN_LIMITS, CHART_UNLOCK_THRESHOLD } from '@/lib/limits';
import { parseHandle, isValidHandle } from '@/lib/handles';
import { sendMilestoneEmail } from '@/lib/email';
import { parseFollowerCount } from '@/lib/counts';
import { ensureSeoPublicAccountByHandle } from '@/lib/seo-public-accounts';

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

  await ensureSeoPublicAccountByHandle(handle).catch((err) => {
    console.warn(`[accounts] Could not ensure SEO public account for @${handle}:`, err);
  });

  const seeded = await seedTrackedAccountFromPublicHistory(account.id, handle).catch((err) => {
    console.warn(`[accounts] Could not seed @${handle} from public history:`, err);
    return null;
  });

  if (seeded) {
    snapshotCount = seeded.snapshotCount;
    firstFollowerCount = seeded.latestFollowerCount;
    await prisma.trackedAccount.update({
      where: { id: account.id },
      data: {
        snapshotCount,
        ...(seeded.lastChecked ? { lastChecked: seeded.lastChecked } : {}),
        displayName: seeded.displayName ?? undefined,
        avatarUrl: seeded.avatarUrl ?? undefined,
      },
    });
  }

  // Take first snapshot immediately. Import dynamically to keep scraper server-only.
  try {
    const { fetchInstagramProfile } = await import('@/lib/scraper');
    const profile = await fetchInstagramProfile(handle);
    const followerCount = profile.followerCount ?? manualFollowerCount;

    if (followerCount !== null) {
      const now = new Date();
      const dayStart = startOfUtcDay(now);
      const dayEnd = addDays(dayStart, 1);
      const existingToday = await prisma.snapshot.findFirst({
        where: {
          trackedAccountId: account.id,
          takenAt: { gte: dayStart, lt: dayEnd },
        },
        select: { id: true },
      });

      if (existingToday) {
        await prisma.snapshot.update({
          where: { id: existingToday.id },
          data: {
            followerCount,
            followingCount: profile.followingCount ?? undefined,
            postCount: profile.postCount ?? undefined,
          },
        });
      } else {
        await prisma.snapshot.create({
          data: {
            trackedAccountId: account.id,
            followerCount,
            followingCount: profile.followingCount ?? undefined,
            postCount: profile.postCount ?? undefined,
            takenAt: dayStart,
          },
        });
      }

      snapshotCount = await prisma.snapshot.count({
        where: { trackedAccountId: account.id },
      });
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

async function seedTrackedAccountFromPublicHistory(
  trackedAccountId: string,
  handle: string
) {
  const publicAccount = await prisma.publicAccount.findUnique({
    where: { handle },
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

  if (!publicAccount) return null;

  const snapshots =
    publicAccount.snapshots.length > 0
      ? publicAccount.snapshots
      : publicAccount.followerCount !== null
        ? [
            {
              takenAt: publicAccount.lastChecked ?? publicAccount.createdAt,
              followerCount: publicAccount.followerCount,
              followingCount: publicAccount.followingCount,
              postCount: publicAccount.postCount,
            },
          ]
        : [];

  if (snapshots.length > 0) {
    await prisma.snapshot.createMany({
      data: snapshots.map((snapshot) => ({
        trackedAccountId,
        takenAt: snapshot.takenAt,
        followerCount: snapshot.followerCount,
        followingCount: snapshot.followingCount ?? undefined,
        postCount: snapshot.postCount ?? undefined,
      })),
      skipDuplicates: true,
    });
  }

  const snapshotCount = await prisma.snapshot.count({
    where: { trackedAccountId },
  });
  const latest = snapshots.at(-1);

  return {
    snapshotCount,
    latestFollowerCount: latest?.followerCount ?? null,
    lastChecked: publicAccount.lastChecked,
    displayName: publicAccount.displayName,
    avatarUrl: publicAccount.avatarUrl,
  };
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
