require('dotenv').config({ path: '.env.test' });
jest.mock('axios');
jest.mock('../jobs/voice-extraction', () => ({
  extractVoice: jest.fn().mockResolvedValue(undefined),
}));

const axios = require('axios');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { setupTestDb, teardownTestDb } = require('./helpers/db');
const { query } = require('../db/pg');
const { decrypt } = require('../lib/crypto');
const { extractVoice } = require('../jobs/voice-extraction');

let testAccountId;
let authToken;

beforeAll(async () => {
  await setupTestDb();
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'oauth@test.com', password: 'password123' });
  authToken = res.body.token;
  testAccountId = res.body.account.id;
});

afterAll(teardownTestDb);

beforeEach(() => jest.clearAllMocks());

describe('GET /api/auth/meta/connect/instagram', () => {
  test('returns a Meta OAuth URL with state JWT', async () => {
    const res = await request(app)
      .get('/api/auth/meta/connect/instagram')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/facebook\.com.*dialog\/oauth/);
    const url = new URL(res.body.url);
    const state = url.searchParams.get('state');
    const payload = jwt.verify(state, process.env.JWT_SECRET);
    expect(payload.account_id).toBe(testAccountId);
    expect(payload.platform).toBe('instagram');
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/auth/meta/connect/instagram');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/meta/callback/instagram', () => {
  test('exchanges code, stores encrypted credential, fires voice extraction', async () => {
    const state = jwt.sign(
      { account_id: testAccountId, platform: 'instagram' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    axios.get
      .mockResolvedValueOnce({ data: { access_token: 'SHORT_TOKEN' } })
      .mockResolvedValueOnce({ data: { access_token: 'LONG_TOKEN', expires_in: 5184000 } })
      .mockResolvedValueOnce({
        data: {
          data: [{
            id: 'page123',
            name: 'Test Page',
            instagram_business_account: { id: 'ig456', username: 'testcreator' },
          }],
        },
      });

    const res = await request(app)
      .get(`/api/auth/meta/callback/instagram?code=AUTH_CODE&state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');

    const row = await query(
      'SELECT * FROM account_credentials WHERE account_id = $1 AND platform = $2',
      [testAccountId, 'instagram']
    );
    expect(row.rows).toHaveLength(1);
    expect(decrypt(row.rows[0].access_token)).toBe('LONG_TOKEN');
    expect(row.rows[0].platform_account_id).toBe('ig456');
    expect(row.rows[0].username).toBe('testcreator');
    expect(extractVoice).toHaveBeenCalledWith(testAccountId, 'LONG_TOKEN', 'ig456', 'testcreator');
  });

  test('redirects to /?error=... on bad state JWT', async () => {
    const res = await request(app)
      .get('/api/auth/meta/callback/instagram?code=CODE&state=bad-state');
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/error=/);
  });

  test('redirects to /?error=... when Meta returns error param', async () => {
    const res = await request(app)
      .get('/api/auth/meta/callback/instagram?error=access_denied');
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/error=/);
  });

  test('upserts credential on reconnect (same account, same platform)', async () => {
    const state = jwt.sign(
      { account_id: testAccountId, platform: 'instagram' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    axios.get
      .mockResolvedValueOnce({ data: { access_token: 'SHORT2' } })
      .mockResolvedValueOnce({ data: { access_token: 'LONG_TOKEN_V2', expires_in: 5184000 } })
      .mockResolvedValueOnce({
        data: {
          data: [{
            id: 'page123',
            instagram_business_account: { id: 'ig456', username: 'testcreator' },
          }],
        },
      });

    await request(app)
      .get(`/api/auth/meta/callback/instagram?code=CODE2&state=${state}`);

    const row = await query(
      'SELECT * FROM account_credentials WHERE account_id = $1 AND platform = $2',
      [testAccountId, 'instagram']
    );
    expect(row.rows).toHaveLength(1);
    expect(decrypt(row.rows[0].access_token)).toBe('LONG_TOKEN_V2');
  });
});

describe('GET /api/auth/meta/status', () => {
  test('returns connected platforms for account', async () => {
    const res = await request(app)
      .get('/api/auth/meta/status')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.credentials).toHaveLength(1);
    expect(res.body.credentials[0].platform).toBe('instagram');
    expect(res.body.credentials[0].username).toBe('testcreator');
  });
});

describe('DELETE /api/auth/meta/:platform', () => {
  test('removes credential and returns ok', async () => {
    const res = await request(app)
      .delete('/api/auth/meta/instagram')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const row = await query(
      'SELECT * FROM account_credentials WHERE account_id = $1',
      [testAccountId]
    );
    expect(row.rows).toHaveLength(0);
  });
});
