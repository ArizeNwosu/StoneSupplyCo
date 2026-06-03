import { runDailySnapshot } from './snapshot';

runDailySnapshot()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[worker] Fatal error:', err);
    process.exit(1);
  });
