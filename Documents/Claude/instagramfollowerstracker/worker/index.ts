import { runDailySnapshot } from './snapshot';

runDailySnapshot()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('[worker] Fatal error:', err);
    process.exit(1);
  });
