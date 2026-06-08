// Wayback Machine CDX API client — historical backfill for public and tracked accounts

import { prisma } from './prisma';
import { sleep } from './scraper';

export interface WaybackSnapshot {
  timestamp: Date;
  followerCount: number | null;
}

export async function getWaybackSnapshots(
  handle: string,
  limit = 120,
  to?: Date,        // optional upper bound — omit to get ALL available history
  deadlineMs?: number  // stop early and return partial results instead of timing out
): Promise<WaybackSnapshot[]> {
  const url = `https://instagram.com/${handle}/`;
  const toParam = to
    ? `&to=${to.toISOString().slice(0, 10).replace(/-/g, '')}`
    : '';
  // collapse=timestamp:6 collapses to one result per YYYYMM (monthly) — keeps result count
  // manageable (~120 for a full 10-year history) instead of hundreds of daily entries
  const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&fl=timestamp,statuscode&filter=statuscode:200&collapse=timestamp:6&limit=${limit}${toParam}`;

  let rows: string[][];
  try {
    const res = await fetch(cdxUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.warn(`[wayback] CDX API returned ${res.status} for @${handle}`);
      return [];
    }
    const body = (await res.json()) as unknown;
    if (!Array.isArray(body) || body.length === 0) return [];
    rows = body as string[][];
  } catch (err) {
    console.warn(`[wayback] CDX fetch failed for @${handle}:`, err);
    return [];
  }

  // First row is the header — skip it
  const snapshots: WaybackSnapshot[] = [];
  for (const [timestamp] of rows.slice(1)) {
    if (!timestamp) continue;
    if (deadlineMs && Date.now() >= deadlineMs) {
      console.warn(`[wayback] Deadline reached — returning ${snapshots.length} snapshots for @${handle}`);
      break;
    }
    const archivedUrl = `https://web.archive.org/web/${timestamp}if_/https://www.instagram.com/${handle}/`;
    const followerCount = await extractFollowerCountFromArchive(archivedUrl);
    if (followerCount !== null) {
      snapshots.push({
        timestamp: parseWaybackTimestamp(timestamp),
        followerCount,
      });
    }
    // Rate limit — don't hammer Wayback Machine
    await sleep(1500);
  }

  return snapshots;
}

async function extractFollowerCountFromArchive(
  url: string
): Promise<number | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const html = await res.text();

    const jsonMatch = html.match(/"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
    if (jsonMatch?.[1]) return parseInt(jsonMatch[1], 10);

    const jsonMatch2 = html.match(/"follower_count"\s*:\s*(\d+)/);
    if (jsonMatch2?.[1]) return parseInt(jsonMatch2[1], 10);

    return null;
  } catch {
    return null;
  }
}

function parseWaybackTimestamp(ts: string): Date {
  return new Date(
    `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T${ts.slice(8, 10)}:${ts.slice(10, 12)}:${ts.slice(12, 14)}Z`
  );
}

export interface BackfillTrackedResult {
  inserted: number;
  skipped: number;
}

/**
 * Backfill historical snapshots for a user-tracked account using the Wayback Machine.
 * Writes to the Snapshot model and updates snapshotCount on TrackedAccount.
 */
export async function backfillTrackedAccount(
  trackedAccountId: string,
  handle: string,
  maxSnapshots = 365,
  // Only fetch archives up to when we started tracking — cron handles everything after
  trackedSince?: Date
): Promise<BackfillTrackedResult> {
  const existing = await prisma.snapshot.findMany({
    where: { trackedAccountId },
    select: { takenAt: true },
  });
  const existingDates = new Set(
    existing.map((s) => s.takenAt.toISOString().slice(0, 10))
  );

  // Give ourselves 240s — leaves ~60s for DB writes within the 300s Vercel function limit
  const waybackSnaps = await getWaybackSnapshots(handle, maxSnapshots, trackedSince, Date.now() + 240_000);

  const newSnapshots: Array<{
    trackedAccountId: string;
    followerCount: number;
    takenAt: Date;
  }> = [];

  const sorted = waybackSnaps
    .filter((s) => s.followerCount !== null)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (const snap of sorted) {
    const dateKey = snap.timestamp.toISOString().slice(0, 10);
    if (existingDates.has(dateKey)) continue;
    newSnapshots.push({
      trackedAccountId,
      followerCount: snap.followerCount as number,
      takenAt: snap.timestamp,
    });
    existingDates.add(dateKey);
  }

  if (newSnapshots.length === 0) {
    return { inserted: 0, skipped: sorted.length };
  }

  await prisma.snapshot.createMany({ data: newSnapshots, skipDuplicates: true });

  // Update snapshotCount to reflect total (existing + new)
  const totalCount = await prisma.snapshot.count({ where: { trackedAccountId } });
  await prisma.trackedAccount.update({
    where: { id: trackedAccountId },
    data: {
      snapshotCount: totalCount,
      // Only update lastChecked if the most recent Wayback snap is newer
      ...(sorted.length > 0 && sorted[sorted.length - 1]
        ? { lastChecked: sorted[sorted.length - 1]!.timestamp }
        : {}),
    },
  });

  return { inserted: newSnapshots.length, skipped: sorted.length - newSnapshots.length };
}
