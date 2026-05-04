require('dotenv').config({ path: '.env.test' });
jest.mock('../services/account-poller');

const { pollAccount } = require('../services/account-poller');
const { setupTestDb, teardownTestDb } = require('./helpers/db');
const { query } = require('../db/pg');
const { encrypt } = require('../lib/crypto');
const { runScheduler } = require('../services/scheduler');

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(() => jest.clearAllMocks());
beforeEach(async () => {
  await query('DELETE FROM account_credentials WHERE TRUE');
  await query('DELETE FROM accounts WHERE TRUE');
});

async function createAccount(email, opts = {}) {
  const res = await query(
    `INSERT INTO accounts (email, password_hash, replies_used, replies_limit)
     VALUES ($1, 'hash', $2, $3)
     RETURNING id`,
    [email, opts.repliesUsed ?? 0, opts.repliesLimit ?? 100]
  );
  return res.rows[0].id;
}

async function addCredential(accountId, opts = {}) {
  const expiresAt = opts.expired
    ? new Date(Date.now() - 1000).toISOString()  // expired 1 second ago
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days out
  await query(
    `INSERT INTO account_credentials (account_id, platform, access_token, platform_account_id, username, expires_at)
     VALUES ($1, 'instagram', $2, 'ig123', 'user', $3)`,
    [accountId, encrypt('TOKEN'), expiresAt]
  );
}

test('calls pollAccount for each eligible account', async () => {
  pollAccount.mockResolvedValue(undefined);
  const id1 = await createAccount('sched1@test.com');
  const id2 = await createAccount('sched2@test.com');
  await addCredential(id1);
  await addCredential(id2);

  await runScheduler();

  const calledIds = pollAccount.mock.calls.map(call => call[0]);
  expect(calledIds).toContain(id1);
  expect(calledIds).toContain(id2);
});

test('skips accounts at replies_limit', async () => {
  pollAccount.mockResolvedValue(undefined);
  const id = await createAccount('sched_limit@test.com', { repliesUsed: 100, repliesLimit: 100 });
  await addCredential(id);

  await runScheduler();

  const calledIds = pollAccount.mock.calls.map(call => call[0]);
  expect(calledIds).not.toContain(id);
});

test('skips accounts with expired credentials', async () => {
  pollAccount.mockResolvedValue(undefined);
  const id = await createAccount('sched_expired@test.com');
  await addCredential(id, { expired: true });

  await runScheduler();

  const calledIds = pollAccount.mock.calls.map(call => call[0]);
  expect(calledIds).not.toContain(id);
});

test('skips accounts with no Instagram credentials', async () => {
  pollAccount.mockResolvedValue(undefined);
  const id = await createAccount('sched_nocreds@test.com');
  // No credentials added

  await runScheduler();

  const calledIds = pollAccount.mock.calls.map(call => call[0]);
  expect(calledIds).not.toContain(id);
});

test('continues running other accounts when one pollAccount throws', async () => {
  const id1 = await createAccount('sched_err1@test.com');
  const id2 = await createAccount('sched_err2@test.com');
  await addCredential(id1);
  await addCredential(id2);

  pollAccount
    .mockRejectedValueOnce(new Error('IG API down'))
    .mockResolvedValueOnce(undefined);

  await expect(runScheduler()).resolves.toBeUndefined();
  const calledIds = pollAccount.mock.calls.map(c => c[0]);
  expect(calledIds).toContain(id1);
  expect(calledIds).toContain(id2);
  expect(pollAccount).toHaveBeenCalledTimes(2);
});
