// worker/stalker.ts
// SERVER-SIDE ONLY. Never import in client components.

import { prisma } from '@/lib/prisma';
import { fetchInstagramProfile, fetchFollowingList, sleep } from '@/lib/scraper';
import { diffStalkerProfiles, type StalkerProfileState } from '@/lib/stalker-diff';
import { sendStalkerAlertEmail } from '@/lib/stalker-email';
import type { StalkerFrequency } from '@prisma/client';

// How many minutes must pass before re-scraping for each frequency tier.
const FREQUENCY_INTERVAL_MINUTES: Record<StalkerFrequency, number> = {
  DAILY:    23 * 60,
  SIX_HOUR: 5 * 60 + 30,
  HOURLY:   50,
};

export interface StalkerRunOptions {
  maxAccounts?: number;
  maxRuntimeMs?: number;
}

export interface StalkerRunStats {
  checked: number;
  changed: number;
  eventsCreated: number;
  emailsSent: number;
  failed: number;
}

export async function runStalkerScrape(options: StalkerRunOptions = {}): Promise<StalkerRunStats> {
  const stats: StalkerRunStats = { checked: 0, changed: 0, eventsCreated: 0, emailsSent: 0, failed: 0 };
  const deadline = Date.now() + (options.maxRuntimeMs ?? 270_000);
  const maxAccounts = options.maxAccounts ?? 50;

  // Find TrackedAccounts that have at least one active stalker subscription.
  // Pick the highest-frequency (shortest interval) subscription per account.
  const dueAccounts = await prisma.$queryRaw<Array<{
    trackedAccountId: string;
    handle: string;
    minFrequency: StalkerFrequency;
    lastScrapedAt: Date | null;
  }>>`
    SELECT
      ta.id AS "trackedAccountId",
      ta.handle,
      (CASE
        WHEN bool_or(ss.frequency = 'HOURLY')   THEN 'HOURLY'
        WHEN bool_or(ss.frequency = 'SIX_HOUR') THEN 'SIX_HOUR'
        ELSE 'DAILY'
      END)::"StalkerFrequency" AS "minFrequency",
      sp."scrapedAt" AS "lastScrapedAt"
    FROM "StalkerSubscription" ss
    JOIN "TrackedAccount" ta ON ta.id = ss."trackedAccountId"
    LEFT JOIN "StalkerProfile" sp ON sp."trackedAccountId" = ta.id
    WHERE ss.active = true
    GROUP BY ta.id, ta.handle, sp."scrapedAt"
    LIMIT ${maxAccounts}
  `;

  for (const row of dueAccounts) {
    if (Date.now() > deadline) break;

    const intervalMinutes = FREQUENCY_INTERVAL_MINUTES[row.minFrequency];
    const minutesSinceLastScrape = row.lastScrapedAt
      ? (Date.now() - row.lastScrapedAt.getTime()) / 60_000
      : Infinity;

    if (minutesSinceLastScrape < intervalMinutes) continue;

    try {
      stats.checked++;

      const profile = await fetchInstagramProfile(row.handle);
      const following = await fetchFollowingList(row.handle);

      const nextState: StalkerProfileState = {
        username: profile.handle,
        displayName: profile.displayName,
        bio: profile.bio,
        externalUrl: profile.externalUrl,
        avatarUrl: profile.avatarUrl,
        postCount: profile.postCount,
        highlightCount: profile.highlightCount,
        isVerified: profile.isVerified,
        category: profile.category,
        pronouns: profile.pronouns,
        recentFollowing: following,
        isPrivate: profile.isPrivate,
      };

      const existing = await prisma.stalkerProfile.findUnique({
        where: { trackedAccountId: row.trackedAccountId },
      });

      if (!existing) {
        await prisma.stalkerProfile.create({
          data: {
            trackedAccountId: row.trackedAccountId,
            instagramUserId: profile.instagramUserId,
            username: nextState.username,
            displayName: nextState.displayName,
            bio: nextState.bio,
            externalUrl: nextState.externalUrl,
            avatarUrl: nextState.avatarUrl,
            postCount: nextState.postCount,
            highlightCount: nextState.highlightCount,
            isVerified: nextState.isVerified,
            category: nextState.category,
            pronouns: nextState.pronouns,
            recentFollowing: nextState.recentFollowing,
            isPrivate: nextState.isPrivate,
          },
        });
        continue;
      }

      const prevState: StalkerProfileState = {
        username: existing.username ?? row.handle,
        displayName: existing.displayName,
        bio: existing.bio,
        externalUrl: existing.externalUrl,
        avatarUrl: existing.avatarUrl,
        postCount: existing.postCount,
        highlightCount: existing.highlightCount,
        isVerified: existing.isVerified,
        category: existing.category,
        pronouns: existing.pronouns,
        recentFollowing: existing.recentFollowing,
        isPrivate: existing.isPrivate,
      };

      const changes = diffStalkerProfiles(prevState, nextState);

      await prisma.stalkerProfile.update({
        where: { trackedAccountId: row.trackedAccountId },
        data: {
          ...(profile.instagramUserId && !existing.instagramUserId
            ? { instagramUserId: profile.instagramUserId }
            : {}),
          username: nextState.username,
          displayName: nextState.displayName,
          bio: nextState.bio,
          externalUrl: nextState.externalUrl,
          avatarUrl: nextState.avatarUrl,
          postCount: nextState.postCount,
          highlightCount: nextState.highlightCount,
          isVerified: nextState.isVerified,
          category: nextState.category,
          pronouns: nextState.pronouns,
          recentFollowing: nextState.recentFollowing,
          isPrivate: nextState.isPrivate,
          scrapedAt: new Date(),
        },
      });

      if (changes.length === 0) continue;

      stats.changed++;

      const subs = await prisma.stalkerSubscription.findMany({
        where: { trackedAccountId: row.trackedAccountId, active: true },
        include: { user: { select: { id: true, email: true } } },
      });

      const eventRows = subs.flatMap((sub) =>
        changes.map((change) => ({
          stalkerSubId: sub.id,
          userId: sub.userId,
          signal: change.signal,
          oldValue: change.oldValue,
          newValue: change.newValue,
        }))
      );

      await prisma.stalkerEvent.createMany({ data: eventRows });
      stats.eventsCreated += eventRows.length;

      for (const sub of subs) {
        if (!sub.user.email) continue;
        try {
          await sendStalkerAlertEmail({
            to: sub.user.email,
            handle: row.handle,
            changes,
          });
          stats.emailsSent++;
        } catch (err) {
          console.error(`[stalker] email failed for ${sub.user.email}:`, err);
        }
      }
    } catch (err) {
      console.error(`[stalker] scrape failed for ${row.handle}:`, err);
      stats.failed++;
    }

    await sleep(2000 + Math.random() * 3000);
  }

  return stats;
}
