require('dotenv').config({ path: '.env.test' });
jest.mock('axios');

const axios = require('axios');
const { setupTestDb, teardownTestDb } = require('./helpers/db');
const { query } = require('../db/pg');
const { encrypt, decrypt } = require('../lib/crypto');
const { refreshExpiringTokens } = require('../jobs/token-refresh');

let accountId;

beforeAll(async () => {
  await setupTestDb();
  const res = await query(
    `INSERT INTO accounts (email, password_hash) VALUES ('refresh@test.com', 'hash') RETURNING id`
  );
  accountId = res.rows[0].id;
});

afterAll(teardownTestDb);
beforeEach(() => jest.clearAllMocks());

async function insertCred(platform, token, expiresAt) {
  const res = await query(
    `INSERT INTO account_credentials
       (account_id, platform, access_token, platform_account_id, username, expires_at)
     VALUES ($1, $2, $3, 'ig123', 'user', $4)
     RETURNING id`,
    [accountId, platform, encrypt(token), expiresAt]
  );
  return res.rows[0].id;
}

test('refreshes token expiring within 7 days', async () => {
  const soonExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
  const credId = await insertCred('instagram', 'OLD_TOKEN', soonExpiry);

  axios.get.mockResolvedValueOnce({
    data: { access_token: 'NEW_TOKEN', expires_in: 5184000 },
  });

  await refreshExpiringTokens();

  const row = await query('SELECT * FROM account_credentials WHERE id = $1', [credId]);
  expect(decrypt(row.rows[0].access_token)).toBe('NEW_TOKEN');
  expect(new Date(row.rows[0].expires_at).getTime()).toBeGreaterThan(soonExpiry.getTime());
});

test('does not refresh tokens with more than 7 days remaining', async () => {
  const farExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const credId = await insertCred('facebook', 'STABLE_TOKEN', farExpiry);

  await refreshExpiringTokens();

  expect(axios.get).not.toHaveBeenCalled();
  const row = await query('SELECT * FROM account_credentials WHERE id = $1', [credId]);
  expect(decrypt(row.rows[0].access_token)).toBe('STABLE_TOKEN');
});

test('continues refreshing remaining tokens when one fails', async () => {
  const soonA = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day (processed first)
  const soonB = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days (processed second)

  const res1 = await query(
    `INSERT INTO accounts (email, password_hash) VALUES ('refresh_a@test.com', 'hash') RETURNING id`
  );
  const acctAId = res1.rows[0].id;
  await query(
    `INSERT INTO account_credentials
       (account_id, platform, access_token, platform_account_id, username, expires_at)
     VALUES ($1, 'instagram', $2, 'igA', 'userA', $3)`,
    [acctAId, encrypt('TOKEN_A'), soonA]
  );

  const res2 = await query(
    `INSERT INTO accounts (email, password_hash) VALUES ('refresh_b@test.com', 'hash') RETURNING id`
  );
  const acctBId = res2.rows[0].id;
  const credBRes = await query(
    `INSERT INTO account_credentials
       (account_id, platform, access_token, platform_account_id, username, expires_at)
     VALUES ($1, 'instagram', $2, 'igB', 'userB', $3)
     RETURNING id`,
    [acctBId, encrypt('TOKEN_B'), soonB]
  );
  const credBId = credBRes.rows[0].id;

  axios.get
    .mockRejectedValueOnce(new Error('Meta API error'))
    .mockResolvedValueOnce({ data: { access_token: 'TOKEN_B_NEW', expires_in: 5184000 } });

  await refreshExpiringTokens();

  const rowB = await query('SELECT * FROM account_credentials WHERE id = $1', [credBId]);
  expect(decrypt(rowB.rows[0].access_token)).toBe('TOKEN_B_NEW');
});
