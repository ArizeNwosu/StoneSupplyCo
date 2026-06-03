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
      // Load existing snapshot dates to avoid duplicates within this run
      const existing = await prisma.publicSnapshot.findMany({
        where: { publicAccountId: account.id },
        select: { takenAt: true },
      });
      const existingDates = new Set(
        existing.map((s) => s.takenAt.toISOString().slice(0, 10))
      );

      const waybackSnaps = await getWaybackSnapshots(account.handle, maxSnapshotsPerAccount);

      // Filter nulls, deduplicate by calendar day (keep first per day), sort ascending
      const newSnapshots: Array<{ publicAccountId: string; followerCount: number; takenAt: Date }> = [];
      const sorted = waybackSnaps
        .filter((s) => s.followerCount !== null)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      for (const snap of sorted) {
        const dateKey = snap.timestamp.toISOString().slice(0, 10);
        if (existingDates.has(dateKey)) continue;
        newSnapshots.push({
          publicAccountId: account.id,
          followerCount: snap.followerCount as number,
          takenAt: snap.timestamp,
        });
        // Mark date as seen so same-day later entries in this batch are skipped
        existingDates.add(dateKey);
      }

      // skipDuplicates handles concurrent runs that race on the unique(publicAccountId, takenAt) constraint
      const result = await prisma.publicSnapshot.createMany({
        data: newSnapshots,
        skipDuplicates: true,
      });

      // Update account's current follower count — only if Wayback data is newer than what we have
      if (sorted.length > 0) {
        const latest = sorted[sorted.length - 1];
        const shouldUpdate =
          account.lastChecked === null ||
          latest.timestamp > account.lastChecked;
        if (shouldUpdate) {
          await prisma.publicAccount.update({
            where: { id: account.id },
            data: {
              followerCount: latest.followerCount as number,
              lastChecked: latest.timestamp,
            },
          });
        }
      }

      console.log(`[backfill] @${account.handle} — inserted ${result.count} new snapshots`);
    } catch (err) {
      console.error(`[backfill] @${account.handle} failed:`, err);
    }

    // Rate limit: be polite to the Wayback Machine
    await sleep(3000);
  }

  console.log('[backfill] Done');
}
