import { prisma } from '@/lib/prisma';
import { fetchInstagramProfile, fetchInstagramProfilesBatch } from '@/lib/scraper';
import { sendMilestoneEmail } from '@/lib/email';
import { ensureSeoPublicAccounts, savePublicSnapshotForHandle } from '@/lib/seo-public-accounts';

export type SnapshotScope = 'all' | 'tracked' | 'public';

export interface SnapshotRunOptions {
  scope?: SnapshotScope;
  trackedLimit?: number;
  publicLimit?: number;
  maxRuntimeMs?: number;
  force?: boolean;
  now?: Date;
}

export interface SnapshotRunStats {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  noData: number;
  failed: number;
  remainingDue: number;
}

export interface SnapshotRunResult {
  startedAt: string;
  finishedAt: string;
  day: string;
  scope: SnapshotScope;
  tracked: SnapshotRunStats;
  public: SnapshotRunStats;
}

const DEFAULT_TRACKED_LIMIT = 25;
const DEFAULT_PUBLIC_LIMIT = 10;
const DEFAULT_MAX_RUNTIME_MS = 240_000;

export async function runDailySnapshot(
  options: SnapshotRunOptions = {}
): Promise<SnapshotRunResult> {
  const startedAt = new Date();
  const now = options.now ?? startedAt;
  const dayStart = startOfUtcDay(now);
  const dayEnd = addDays(dayStart, 1);
  const scope = options.scope ?? 'all';
  const deadline = Date.now() + (options.maxRuntimeMs ?? DEFAULT_MAX_RUNTIME_MS);

  console.log(`[snapshot] Starting ${scope} run at ${startedAt.toISOString()}`);

  const tracked = createStats();
  const publicStats = createStats();

  if (scope === 'all' || scope === 'tracked') {
    await snapshotTrackedAccounts({
      stats: tracked,
      dayStart,
      dayEnd,
      limit: options.trackedLimit ?? DEFAULT_TRACKED_LIMIT,
      deadline,
      force: options.force ?? false,
    });
  }

  if ((scope === 'all' || scope === 'public') && Date.now() < deadline) {
    await ensureSeoPublicAccounts();
    await snapshotPublicAccounts({
      stats: publicStats,
      dayStart,
      dayEnd,
      limit: options.publicLimit ?? DEFAULT_PUBLIC_LIMIT,
      deadline,
      force: options.force ?? false,
    });
  }

  tracked.remainingDue =
    scope === 'all' || scope === 'tracked'
      ? await countDueTrackedAccounts(dayStart, options.force ?? false)
      : 0;
  publicStats.remainingDue =
    scope === 'all' || scope === 'public'
      ? await countDuePublicAccounts(dayStart, options.force ?? false)
      : 0;

  const finishedAt = new Date();
  console.log(`[snapshot] Run complete at ${finishedAt.toISOString()}`);

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    day: dayStart.toISOString().slice(0, 10),
    scope,
    tracked,
    public: publicStats,
  };
}

async function snapshotTrackedAccounts({
  stats,
  dayStart,
  dayEnd,
  limit,
  deadline,
  force,
}: {
  stats: SnapshotRunStats;
  dayStart: Date;
  dayEnd: Date;
  limit: number;
  deadline: number;
  force: boolean;
}) {
  const accounts = await prisma.trackedAccount.findMany({
    where: dueWhere(dayStart, force),
    include: { user: { select: { email: true } } },
    orderBy: [{ lastChecked: 'asc' }, { createdAt: 'asc' }],
    take: limit,
  });

  if (accounts.length === 0) return;

  // Skip accounts that already have a snapshot today (unless force)
  const due: typeof accounts = [];
  for (const account of accounts) {
    if (!force) {
      const existing = await prisma.snapshot.findFirst({
        where: { trackedAccountId: account.id, takenAt: { gte: dayStart, lt: dayEnd } },
        select: { id: true },
      });
      if (existing) { stats.skipped++; continue; }
    }
    due.push(account);
  }

  if (due.length === 0) return;
  stats.processed += due.length;

  // Fetch all handles in a single Apify batch call — avoids 30-60s × N timeout
  const handles = due.map((a) => a.handle);
  const profiles = await fetchInstagramProfilesBatch(handles);

  for (const account of due) {
    if (Date.now() >= deadline) break;

    const profile = profiles.get(account.handle.toLowerCase());
    if (!profile || profile.followerCount === null) {
      // Fall back to single fetch if batch missed this account
      try {
        const single = await fetchInstagramProfile(account.handle);
        if (single.followerCount === null) { stats.noData++; continue; }
        profiles.set(account.handle.toLowerCase(), single);
      } catch {
        stats.noData++;
        continue;
      }
    }

    const resolved = profiles.get(account.handle.toLowerCase())!;
    if (resolved.followerCount === null) { stats.noData++; continue; }

    try {
      const existing = await prisma.snapshot.findFirst({
        where: { trackedAccountId: account.id, takenAt: { gte: dayStart, lt: dayEnd } },
        select: { id: true },
      });

      await prisma.snapshot.upsert({
        where: { trackedAccountId_takenAt: { trackedAccountId: account.id, takenAt: dayStart } },
        create: {
          trackedAccountId: account.id,
          followerCount: resolved.followerCount,
          followingCount: resolved.followingCount ?? undefined,
          postCount: resolved.postCount ?? undefined,
          takenAt: dayStart,
        },
        update: {
          followerCount: resolved.followerCount,
          followingCount: resolved.followingCount ?? undefined,
          postCount: resolved.postCount ?? undefined,
        },
      });

      if (!resolved.isPrivate) {
        await savePublicSnapshotForHandle({
          handle: account.handle,
          followerCount: resolved.followerCount,
          followingCount: resolved.followingCount,
          postCount: resolved.postCount,
          displayName: resolved.displayName,
          avatarUrl: resolved.avatarUrl,
          bio: resolved.bio,
          takenAt: dayStart,
        });
      }

      const snapshotCount = await prisma.snapshot.count({ where: { trackedAccountId: account.id } });

      const updated = await prisma.trackedAccount.update({
        where: { id: account.id },
        data: {
          lastChecked: new Date(),
          displayName: resolved.displayName ?? undefined,
          avatarUrl: resolved.avatarUrl ?? undefined,
          isPublic: !resolved.isPrivate,
          snapshotCount,
        },
        include: { user: { select: { email: true } } },
      });

      if (existing) { stats.updated++; } else { stats.created++; }

      await sendMilestoneIfNeeded({ account: updated, followerCount: resolved.followerCount });
    } catch (err) {
      stats.failed++;
      console.error(`[snapshot] DB write failed for @${account.handle}:`, err);
    }
  }
}

async function snapshotPublicAccounts({
  stats,
  dayStart,
  dayEnd,
  limit,
  deadline,
  force,
}: {
  stats: SnapshotRunStats;
  dayStart: Date;
  dayEnd: Date;
  limit: number;
  deadline: number;
  force: boolean;
}) {
  const accounts = await prisma.publicAccount.findMany({
    where: dueWhere(dayStart, force),
    orderBy: [{ lastChecked: 'asc' }, { followerCount: 'desc' }],
    take: limit,
  });

  if (accounts.length === 0) return;

  const due: typeof accounts = [];
  for (const account of accounts) {
    if (!force) {
      const existing = await prisma.publicSnapshot.findFirst({
        where: {
          publicAccountId: account.id,
          takenAt: { gte: dayStart, lt: dayEnd },
        },
        select: { id: true },
      });

      if (existing) {
        stats.skipped++;
        continue;
      }
    }

    due.push(account);
  }

  if (due.length === 0) return;
  stats.processed += due.length;

  const profiles = await fetchInstagramProfilesBatch(due.map((account) => account.handle));

  for (const account of due) {
    if (Date.now() >= deadline) break;

    try {
      let profile = profiles.get(account.handle.toLowerCase());
      if (!profile || profile.followerCount === null) {
        profile = await fetchInstagramProfile(account.handle);
      }

      if (profile.followerCount === null) {
        stats.noData++;
        continue;
      }

      const existing = await prisma.publicSnapshot.findFirst({
        where: {
          publicAccountId: account.id,
          takenAt: { gte: dayStart, lt: dayEnd },
        },
        select: { id: true },
      });

      await prisma.publicSnapshot.upsert({
        where: {
          publicAccountId_takenAt: {
            publicAccountId: account.id,
            takenAt: dayStart,
          },
        },
        create: {
          publicAccountId: account.id,
          followerCount: profile.followerCount,
          followingCount: profile.followingCount ?? undefined,
          postCount: profile.postCount ?? undefined,
          takenAt: dayStart,
        },
        update: {
          followerCount: profile.followerCount,
          followingCount: profile.followingCount ?? undefined,
          postCount: profile.postCount ?? undefined,
        },
      });

      await prisma.publicAccount.update({
        where: { id: account.id },
        data: {
          followerCount: profile.followerCount,
          followingCount: profile.followingCount ?? undefined,
          postCount: profile.postCount ?? undefined,
          displayName: profile.displayName ?? undefined,
          bio: profile.bio ?? undefined,
          avatarUrl: profile.avatarUrl ?? undefined,
          lastChecked: new Date(),
        },
      });

      if (existing) {
        stats.updated++;
      } else {
        stats.created++;
      }
    } catch (err) {
      stats.failed++;
      console.error(`[snapshot] Public @${account.handle} failed:`, err);
    }
  }
}

async function sendMilestoneIfNeeded({
  account,
  followerCount,
}: {
  account: {
    id: string;
    handle: string;
    snapshotCount: number;
    milestone1Sent: boolean;
    milestone3Sent: boolean;
    milestone7Sent: boolean;
    milestone30Sent: boolean;
    user: { email: string | null };
  };
  followerCount: number;
}) {
  const email = account.user.email;
  if (!email) return;

  const milestones = [
    { count: 1, field: 'milestone1Sent' },
    { count: 3, field: 'milestone3Sent' },
    { count: 7, field: 'milestone7Sent' },
    { count: 30, field: 'milestone30Sent' },
  ] as const;

  const milestone = milestones.find(
    (item) => account.snapshotCount === item.count && !account[item.field]
  );
  if (!milestone) return;

  await prisma.trackedAccount.update({
    where: { id: account.id },
    data: { [milestone.field]: true },
  });
  await sendMilestoneEmail({
    to: email,
    handle: account.handle,
    snapshotCount: milestone.count,
    followerCount,
  });
}

function dueWhere(dayStart: Date, force: boolean) {
  if (force) return {};
  return {
    OR: [{ lastChecked: null }, { lastChecked: { lt: dayStart } }],
  };
}

async function countDueTrackedAccounts(dayStart: Date, force: boolean) {
  return prisma.trackedAccount.count({ where: dueWhere(dayStart, force) });
}

async function countDuePublicAccounts(dayStart: Date, force: boolean) {
  return prisma.publicAccount.count({ where: dueWhere(dayStart, force) });
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function createStats(): SnapshotRunStats {
  return {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    noData: 0,
    failed: 0,
    remainingDue: 0,
  };
}
