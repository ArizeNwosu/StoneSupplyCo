const { query } = require('../db/pg');
const { pollAccount } = require('./account-poller');

async function runScheduler() {
  let result;
  try {
    result = await query(
      `SELECT DISTINCT a.id
       FROM accounts a
       JOIN account_credentials c ON c.account_id = a.id AND c.platform = 'instagram'
       WHERE a.replies_used < a.replies_limit
         AND (c.expires_at IS NULL OR c.expires_at > now())
       ORDER BY a.id`
    );
  } catch (err) {
    console.error('[scheduler] Failed to fetch eligible accounts:', err.message);
    return;
  }

  const accountIds = result.rows.map(r => r.id);
  console.log(`[scheduler] Polling ${accountIds.length} account(s)`);

  for (const accountId of accountIds) {
    try {
      await pollAccount(accountId);
    } catch (err) {
      console.error(`[scheduler] Poll failed for account ${accountId}:`, err.message);
    }
  }
}

function startScheduler(intervalSecs = 60) {
  function schedule() {
    runScheduler().finally(() => setTimeout(schedule, intervalSecs * 1000));
  }
  schedule();
}

module.exports = { runScheduler, startScheduler };
