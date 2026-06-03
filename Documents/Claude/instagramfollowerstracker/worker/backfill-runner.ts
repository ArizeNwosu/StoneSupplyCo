import { runBackfill } from './backfill';
import { parseHandle } from '@/lib/handles';

// Optional: pass --handle=cristiano (or @cristiano, instagram.com/cristiano) to test one account
const rawHandle = process.argv.find((a) => a.startsWith('--handle='))?.split('=')[1];
const handleFilter = rawHandle ? parseHandle(rawHandle) : undefined;

const maxPerAccount = parseInt(process.env.MAX_SNAPSHOTS_PER_ACCOUNT ?? '100', 10);
if (isNaN(maxPerAccount) || maxPerAccount <= 0) {
  console.error('[backfill] MAX_SNAPSHOTS_PER_ACCOUNT must be a positive integer');
  process.exit(1);
}

const skipAbove = parseInt(process.env.SKIP_IF_SNAPSHOTS_ABOVE ?? '10', 10);
if (isNaN(skipAbove) || skipAbove < 0) {
  console.error('[backfill] SKIP_IF_SNAPSHOTS_ABOVE must be a non-negative integer');
  process.exit(1);
}

runBackfill({ maxSnapshotsPerAccount: maxPerAccount, skipIfSnapshotsAbove: skipAbove, handleFilter })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[backfill] Fatal error:', err);
    process.exit(1);
  });
