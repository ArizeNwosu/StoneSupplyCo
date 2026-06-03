// Wayback Machine CDX API client — used for historical backfill of public accounts
// Only called from worker/backfill.ts, never from API routes

import { sleep } from './scraper';

export interface WaybackSnapshot {
  timestamp: Date;
  followerCount: number | null;
}

export async function getWaybackSnapshots(
  handle: string,
  limit = 50
): Promise<WaybackSnapshot[]> {
  const url = `https://instagram.com/${handle}/`;
  const cdxUrl = `http://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&fl=timestamp,statuscode&filter=statuscode:200&limit=${limit}&from=20200101`;

  const res = await fetch(cdxUrl, { next: { revalidate: 86400 } });
  const rows: string[][] = (await res.json()) as string[][];

  // First row is header
  const snapshots: WaybackSnapshot[] = [];
  for (const [timestamp] of rows.slice(1)) {
    if (!timestamp) continue;
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
