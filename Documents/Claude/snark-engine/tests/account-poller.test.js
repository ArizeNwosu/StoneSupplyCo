require('dotenv').config({ path: '.env.test' });
jest.mock('../services/intent-classifier');
jest.mock('../services/account-reply-generator');

const { classifyIntent } = require('../services/intent-classifier');
const { generateAccountReply } = require('../services/account-reply-generator');
const { setupTestDb, teardownTestDb } = require('./helpers/db');
const { query } = require('../db/pg');
const { encrypt } = require('../lib/crypto');
const { pollAccount, shouldAutoPost } = require('../services/account-poller');

// ── shouldAutoPost unit tests ─────────────────────────────────────────────

describe('shouldAutoPost', () => {
  test('true when auto_post_enabled, high_intent, confidence >= 0.75', () => {
    expect(shouldAutoPost('balanced', true, 'high_intent', 0.75)).toBe(true);
  });
  test('true when engagement and confidence >= 0.75', () => {
    expect(shouldAutoPost('balanced', true, 'engagement', 0.80)).toBe(true);
  });
  test('false when auto_post_enabled = false', () => {
    expect(shouldAutoPost('balanced', false, 'high_intent', 0.90)).toBe(false);
  });
  test('false when skepticism (even with high confidence)', () => {
    expect(shouldAutoPost('balanced', true, 'skepticism', 0.95)).toBe(false);
  });
  test('false when spam', () => {
    expect(shouldAutoPost('balanced', true, 'spam', 0.95)).toBe(false);
  });
  test('false when balanced + high_intent + confidence 0.74', () => {
    expect(shouldAutoPost('balanced', true, 'high_intent', 0.74)).toBe(false);
  });
  test('false when spicy + high_intent + confidence 0.89', () => {
    expect(shouldAutoPost('spicy', true, 'high_intent', 0.89)).toBe(false);
  });
  test('true when spicy + high_intent + confidence 0.90', () => {
    expect(shouldAutoPost('spicy', true, 'high_intent', 0.90)).toBe(true);
  });
});

// ── Integration tests ─────────────────────────────────────────────────────

let accountId;

const FRESH_COMMENT = {
  id: 'ig_comment_1',
  text: 'How much does this cost?',
  username: 'fan1',
  timestamp: new Date().toISOString(),
  permalink: null,
  replies: { data: [] },
};

function makeMockIg(comments = [FRESH_COMMENT]) {
  return {
    getRecentMedia: jest.fn().mockResolvedValue([
      { id: 'post1', timestamp: new Date().toISOString(), comments_count: 1, permalink: null },
    ]),
    getCommentsForMedia: jest.fn().mockResolvedValue(comments),
    replyToComment: jest.fn().mockResolvedValue({ id: 'posted_reply_1' }),
  };
}

beforeAll(async () => {
  await setupTestDb();
  const acct = await query(
    `INSERT INTO accounts (email, password_hash, auto_post_enabled, voice_intensity, replies_limit)
     VALUES ('poller@test.com', 'hash', false, 'balanced', 100)
     RETURNING id`
  );
  accountId = acct.rows[0].id;
  await query(
    `INSERT INTO account_credentials (account_id, platform, access_token, platform_account_id, username)
     VALUES ($1, 'instagram', $2, 'ig_biz_123', 'testcreator')`,
    [accountId, encrypt('REAL_TOKEN')]
  );
});

afterAll(teardownTestDb);

beforeEach(() => jest.clearAllMocks());

test('inserts comment with intent into Postgres', async () => {
  classifyIntent.mockResolvedValue({ intent: 'high_intent', confidence: 0.90 });
  generateAccountReply.mockResolvedValue({ reply_text: '@fan1 DM us!', confidence_score: 0.88 });

  await pollAccount(accountId, makeMockIg());

  const row = await query('SELECT * FROM comments WHERE id = $1', ['ig_comment_1']);
  expect(row.rows).toHaveLength(1);
  expect(row.rows[0].intent).toBe('high_intent');
  expect(row.rows[0].intent_confidence).toBeCloseTo(0.90);
  expect(row.rows[0].account_id).toBe(accountId);
});

test('inserts reply into Postgres', async () => {
  classifyIntent.mockResolvedValue({ intent: 'engagement', confidence: 0.85 });
  generateAccountReply.mockResolvedValue({ reply_text: '@fan1 Thanks!', confidence_score: 0.82 });

  await pollAccount(accountId, makeMockIg([{
    ...FRESH_COMMENT,
    id: 'ig_comment_2',
    username: 'fan2',
  }]));

  const row = await query('SELECT * FROM replies WHERE comment_id = $1', ['ig_comment_2']);
  expect(row.rows).toHaveLength(1);
  expect(row.rows[0].reply_text).toBe('@fan1 Thanks!');
  expect(row.rows[0].status).toBe('pending');
  expect(row.rows[0].account_id).toBe(accountId);
});

test('auto-skips spam comments with confidence > 0.85', async () => {
  classifyIntent.mockResolvedValue({ intent: 'spam', confidence: 0.92 });

  await pollAccount(accountId, makeMockIg([{
    ...FRESH_COMMENT,
    id: 'ig_comment_spam',
    text: 'Follow me!!!',
    username: 'spammer',
  }]));

  const comment = await query('SELECT status FROM comments WHERE id = $1', ['ig_comment_spam']);
  expect(comment.rows[0].status).toBe('skipped');
  expect(generateAccountReply).not.toHaveBeenCalled();
});

test('auto-posts when conditions met', async () => {
  // Update account to enable auto-post
  await query('UPDATE accounts SET auto_post_enabled = true WHERE id = $1', [accountId]);

  const mockIg = makeMockIg([{
    ...FRESH_COMMENT,
    id: 'ig_comment_autopost',
    username: 'buyer',
  }]);
  classifyIntent.mockResolvedValue({ intent: 'high_intent', confidence: 0.90 });
  generateAccountReply.mockResolvedValue({ reply_text: '@buyer Link in bio!', confidence_score: 0.88 });

  await pollAccount(accountId, mockIg);

  expect(mockIg.replyToComment).toHaveBeenCalledWith('ig_comment_autopost', '@buyer Link in bio!');
  const reply = await query('SELECT status FROM replies WHERE comment_id = $1', ['ig_comment_autopost']);
  expect(reply.rows[0].status).toBe('posted');
  const comment = await query('SELECT status FROM comments WHERE id = $1', ['ig_comment_autopost']);
  expect(comment.rows[0].status).toBe('replied');

  // Reset
  await query('UPDATE accounts SET auto_post_enabled = false WHERE id = $1', [accountId]);
});

test('increments replies_used after each draft', async () => {
  const before = await query('SELECT replies_used FROM accounts WHERE id = $1', [accountId]);
  const countBefore = before.rows[0].replies_used;

  classifyIntent.mockResolvedValue({ intent: 'engagement', confidence: 0.80 });
  generateAccountReply.mockResolvedValue({ reply_text: '@fan cool!', confidence_score: 0.78 });

  await pollAccount(accountId, makeMockIg([{
    ...FRESH_COMMENT,
    id: 'ig_comment_count',
    username: 'counter_fan',
  }]));

  const after = await query('SELECT replies_used FROM accounts WHERE id = $1', [accountId]);
  expect(after.rows[0].replies_used).toBe(countBefore + 1);
});

test('skips processing when at replies_limit', async () => {
  await query('UPDATE accounts SET replies_used = 100, replies_limit = 100 WHERE id = $1', [accountId]);

  const mockIg = makeMockIg();
  await pollAccount(accountId, mockIg);

  expect(mockIg.getRecentMedia).not.toHaveBeenCalled();
  expect(classifyIntent).not.toHaveBeenCalled();

  // Reset
  await query('UPDATE accounts SET replies_used = 0 WHERE id = $1', [accountId]);
});

test('updates last_poll_timestamp in settings', async () => {
  classifyIntent.mockResolvedValue({ intent: 'engagement', confidence: 0.70 });
  generateAccountReply.mockResolvedValue({ reply_text: '@fan hi', confidence_score: 0.70 });

  await pollAccount(accountId, makeMockIg([{
    ...FRESH_COMMENT,
    id: 'ig_comment_ts',
    username: 'ts_fan',
  }]));

  const row = await query(
    'SELECT value FROM settings WHERE account_id = $1 AND key = $2',
    [accountId, 'last_poll_timestamp']
  );
  expect(row.rows).toHaveLength(1);
  const ts = new Date(row.rows[0].value);
  expect(ts.getTime()).toBeGreaterThan(Date.now() - 5000); // within last 5 seconds
});

test('skips creator own comments (username === own_username)', async () => {
  // Creator's own comment (username = 'testcreator' matches credentials.username)
  await pollAccount(accountId, makeMockIg([{
    ...FRESH_COMMENT,
    id: 'ig_comment_own',
    username: 'testcreator',
  }]));

  expect(classifyIntent).not.toHaveBeenCalled();
  const row = await query('SELECT * FROM comments WHERE id = $1', ['ig_comment_own']);
  expect(row.rows).toHaveLength(0);
});
