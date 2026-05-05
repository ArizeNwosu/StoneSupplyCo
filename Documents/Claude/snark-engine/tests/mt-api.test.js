require('dotenv').config({ path: '.env.test' });
jest.mock('../instagram-api');

const request = require('supertest');
const app = require('../server');
const InstagramAPI = require('../instagram-api');
const { setupTestDb, teardownTestDb } = require('./helpers/db');
const { query } = require('../db/pg');
const { encrypt } = require('../lib/crypto');

let token, accountId;

beforeAll(async () => {
  await setupTestDb();
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'mtapi@test.com', password: 'password123' });
  token = res.body.token;
  accountId = res.body.account.id;
  await query(
    `INSERT INTO account_credentials
       (account_id, platform, access_token, platform_account_id, username, expires_at)
     VALUES ($1, 'instagram', $2, 'ig_biz_999', 'testcreator',
             now() + interval '60 days')`,
    [accountId, encrypt('FAKE_TOKEN')]
  );
});

afterAll(teardownTestDb);
beforeEach(() => jest.clearAllMocks());

// ── Status ────────────────────────────────────────────────────────────────

test('GET /api/mt/status returns account and credential', async () => {
  const res = await request(app)
    .get('/api/mt/status')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body.account.email).toBe('mtapi@test.com');
  expect(res.body.account.voice_intensity).toBe('balanced');
  expect(res.body.credential.username).toBe('testcreator');
});

test('GET /api/mt/status returns null credential when none connected', async () => {
  const res2 = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'nocred@test.com', password: 'password123' });
  const t2 = res2.body.token;

  const res = await request(app)
    .get('/api/mt/status')
    .set('Authorization', `Bearer ${t2}`);
  expect(res.status).toBe(200);
  expect(res.body.credential).toBeNull();
});

// ── Settings ──────────────────────────────────────────────────────────────

test('PATCH /api/mt/settings updates voice_intensity', async () => {
  const res = await request(app)
    .patch('/api/mt/settings')
    .set('Authorization', `Bearer ${token}`)
    .send({ voice_intensity: 'spicy' });
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);

  const row = await query('SELECT voice_intensity FROM accounts WHERE id = $1', [accountId]);
  expect(row.rows[0].voice_intensity).toBe('spicy');

  // Reset
  await query("UPDATE accounts SET voice_intensity = 'balanced' WHERE id = $1", [accountId]);
});

test('PATCH /api/mt/settings rejects invalid voice_intensity', async () => {
  const res = await request(app)
    .patch('/api/mt/settings')
    .set('Authorization', `Bearer ${token}`)
    .send({ voice_intensity: 'aggressive' });
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/voice_intensity/);
});

test('PATCH /api/mt/settings with empty body returns 400', async () => {
  const res = await request(app)
    .patch('/api/mt/settings')
    .set('Authorization', `Bearer ${token}`)
    .send({});
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/No fields/);
});

test('PATCH /api/mt/settings updates both fields at once', async () => {
  const res = await request(app)
    .patch('/api/mt/settings')
    .set('Authorization', `Bearer ${token}`)
    .send({ voice_intensity: 'safe', auto_post_enabled: true });
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);

  const row = await query('SELECT voice_intensity, auto_post_enabled FROM accounts WHERE id = $1', [accountId]);
  expect(row.rows[0].voice_intensity).toBe('safe');
  expect(row.rows[0].auto_post_enabled).toBe(true);

  // Reset
  await query("UPDATE accounts SET voice_intensity = 'balanced', auto_post_enabled = false WHERE id = $1", [accountId]);
});

test('GET /api/mt/status without token returns 401', async () => {
  const res = await request(app).get('/api/mt/status');
  expect(res.status).toBe(401);
});
