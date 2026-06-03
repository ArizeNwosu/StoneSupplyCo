import { prisma } from '@/lib/prisma';
import { getWaybackSnapshots } from '@/lib/wayback';
import { sleep } from '@/lib/scraper';

export interface BackfillOptions {
  maxSnapshotsPerAccount?: number;  // how many Wayback snapshots to request (default 100)
  skipIfSnapshotsAbove?: number;    // skip account if it already has >= this many snapshots (default 10)
  handleFilter?: string;            // optional: only backfill one specific account
}

export async function runBackfill(options: BackfillOptions = {}): Promise<void> {
  const {
    maxSnapshotsPerAccount = 100,
    skipIfSnapshotsAbove = 10,
    handleFilter,
  } = options;

  const accounts = await prisma.publicAccount.findMany({
    where: handleFilter ? { handle: handleFilter } : undefined,
    include: { _count: { select: { snapshots: true } } },
    orderBy: { followerCount: 'desc' },
  });

  console.log(`[backfill] ${accounts.length} accounts to process`);

  for (const account of accounts) {
    const existingCount = account._count.snapshots;

    if (existingCount >= skipIfSnapshotsAbove) {
      console.log(`[backfill] Skipping @${account.handle} (${existingCount} snapshots already)`);
      continue;
    }

    console.log(`[backfill] @${account.handle} — fetching Wayback snapshots (existing: ${existingCount})`);

    try {
      // Load existing snapshot dates to avoid duplicates
      const existing = await prisma.publicSnapshot.findMany({
        where: { publicAccountId: account.id },
        select: { takenAt: true },
      });
      const existingDates = new Set(
        existing.map((s) => s.takenAt.toISOString().slice(0, 10))
      );

      const waybackSnaps = await getWaybackSnapshots(account.handle, maxSnapshotsPerAccount);

      let inserted = 0;
      // Sort ascending so we insert in chronological order
      const sorted = waybackSnaps
        .filter((s) => s.followerCount !== null)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      for (const snap of sorted) {
        const dateKey = snap.timestamp.toISOString().slice(0, 10);
        if (existingDates.has(dateKey)) continue;

        await prisma.publicSnapshot.create({
          data: {
            publicAccountId: account.id,
            followerCount: snap.followerCount as number,
            takenAt: snap.timestamp,
          },
        });

        existingDates.add(dateKey);
        inserted++;
      }

      // Update account's current follower count to the most recent Wayback value
      if (sorted.length > 0) {
        const latest = sorted[sorted.length - 1];
        await prisma.publicAccount.update({
          where: { id: account.id },
          data: {
            followerCount: latest.followerCount as number,
            lastChecked: latest.timestamp,
          },
        });
      }

      console.log(`[backfill] @${account.handle} — inserted ${inserted} new snapshots`);
    } catch (err) {
      console.error(`[backfill] @${account.handle} failed:`, err);
    }

    // Rate limit: be polite to the Wayback Machine
    await sleep(3000);
  }

  console.log('[backfill] Done');
}
