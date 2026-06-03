import { runBackfill } from './backfill';

// Optional: pass --handle=cristiano to test a single account
const handleArg = process.argv.find((a) => a.startsWith('--handle='))?.split('=')[1];

const maxPerAccount = parseInt(process.env.MAX_SNAPSHOTS_PER_ACCOUNT ?? '100', 10);
const skipAbove = parseInt(process.env.SKIP_IF_SNAPSHOTS_ABOVE ?? '10', 10);

runBackfill({
  maxSnapshotsPerAccount: maxPerAccount,
  skipIfSnapshotsAbove: skipAbove,
  handleFilter: handleArg,
})
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[backfill] Fatal error:', err);
    process.exit(1);
  });
