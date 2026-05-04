require('dotenv').config({ path: '.env.test' });
const { setupTestDb, teardownTestDb } = require('./helpers/db');
const { query } = require('../db/pg');
const { extractVoice } = require('../jobs/voice-extraction');

const MEDIA = [
  { id: 'post1', timestamp: new Date().toISOString() },
  { id: 'post2', timestamp: new Date().toISOString() },
];

const COMMENTS_POST1 = [
  {
    id: 'c1',
    text: 'Where can I buy this?',
    username: 'fan1',
    replies: {
      data: [
        { id: 'r1', text: 'Link in bio! 🔥', username: 'testcreator' },
        { id: 'r2', text: 'Me too!', username: 'fan2' },
      ],
    },
  },
  {
    id: 'c2',
    text: 'This is amazing',
    username: 'fan3',
    replies: {
      data: [
        { id: 'r3', text: 'Thanks so much 🙏', username: 'testcreator' },
      ],
    },
  },
];

const COMMENTS_POST2 = [
  {
    id: 'c3',
    text: 'Is this available in red?',
    username: 'fan4',
    replies: { data: [] },
  },
];

function makeMockIg(ownUsername) {
  return {
    getRecentMedia: jest.fn().mockResolvedValue(MEDIA),
    getCommentsForMedia: jest.fn()
      .mockResolvedValueOnce(COMMENTS_POST1)
      .mockResolvedValueOnce(COMMENTS_POST2),
  };
}

let accountId;

beforeAll(async () => {
  await setupTestDb();
  const res = await query(
    `INSERT INTO accounts (email, password_hash) VALUES ('voice@test.com', 'hash') RETURNING id`
  );
  accountId = res.rows[0].id;
});

afterAll(teardownTestDb);

test('inserts creator reply pairs as voice_examples', async () => {
  const mockIg = makeMockIg('testcreator');
  await extractVoice(accountId, 'TOKEN', 'IG_ACCT_ID', 'testcreator', mockIg);

  const rows = await query(
    'SELECT * FROM voice_examples WHERE account_id = $1 ORDER BY id',
    [accountId]
  );
  expect(rows.rows).toHaveLength(2);
  expect(rows.rows[0].comment).toBe('Where can I buy this?');
  expect(rows.rows[0].reply).toBe('Link in bio! 🔥');
  expect(rows.rows[1].comment).toBe('This is amazing');
  expect(rows.rows[1].reply).toBe('Thanks so much 🙏');
});

test('sets voice_extracted = true on account', async () => {
  const mockIg = makeMockIg('testcreator');
  const res = await query(
    `INSERT INTO accounts (email, password_hash) VALUES ('voice2@test.com', 'hash') RETURNING id`
  );
  const acctId = res.rows[0].id;

  await extractVoice(acctId, 'TOKEN', 'IG_ACCT_ID', 'testcreator', mockIg);

  const row = await query('SELECT voice_extracted FROM accounts WHERE id = $1', [acctId]);
  expect(row.rows[0].voice_extracted).toBe(true);
});

test('skips creator top-level comments (only collects replies to others)', async () => {
  const commentsWithOwnPost = [
    {
      id: 'c10',
      text: 'Check this out',
      username: 'testcreator',
      replies: {
        data: [{ id: 'r10', text: 'Great!', username: 'fan1' }],
      },
    },
    {
      id: 'c11',
      text: 'What is this?',
      username: 'fan5',
      replies: {
        data: [{ id: 'r11', text: 'My product!', username: 'testcreator' }],
      },
    },
  ];
  const mockIg = {
    getRecentMedia: jest.fn().mockResolvedValue([{ id: 'post3', timestamp: new Date().toISOString() }]),
    getCommentsForMedia: jest.fn().mockResolvedValue(commentsWithOwnPost),
  };
  const res = await query(
    `INSERT INTO accounts (email, password_hash) VALUES ('voice3@test.com', 'hash') RETURNING id`
  );
  const acctId = res.rows[0].id;
  await extractVoice(acctId, 'TOKEN', 'IG_ACCT_ID', 'testcreator', mockIg);

  const rows = await query(
    'SELECT * FROM voice_examples WHERE account_id = $1',
    [acctId]
  );
  expect(rows.rows).toHaveLength(1);
  expect(rows.rows[0].comment).toBe('What is this?');
  expect(rows.rows[0].reply).toBe('My product!');
});

test('does not throw when no pairs found', async () => {
  const mockIg = {
    getRecentMedia: jest.fn().mockResolvedValue([]),
    getCommentsForMedia: jest.fn().mockResolvedValue([]),
  };
  const res = await query(
    `INSERT INTO accounts (email, password_hash) VALUES ('voice4@test.com', 'hash') RETURNING id`
  );
  await expect(extractVoice(res.rows[0].id, 'TOKEN', 'IG', 'creator', mockIg)).resolves.toBeUndefined();
});

test('caps voice examples at MAX_PAIRS (12)', async () => {
  // 15 comments, each with a creator reply — should only insert 12
  const manyComments = Array.from({ length: 15 }, (_, i) => ({
    id: `cap_c${i}`,
    text: `Fan comment ${i}`,
    username: `fan${i}`,
    replies: {
      data: [{ id: `cap_r${i}`, text: `Creator reply ${i}`, username: 'testcreator' }],
    },
  }));

  const mockIg = {
    getRecentMedia: jest.fn().mockResolvedValue([{ id: 'cappost', timestamp: new Date().toISOString() }]),
    getCommentsForMedia: jest.fn().mockResolvedValue(manyComments),
  };

  const res = await query(
    `INSERT INTO accounts (email, password_hash) VALUES ('voice_cap@test.com', 'hash') RETURNING id`
  );
  const acctId = res.rows[0].id;
  await extractVoice(acctId, 'TOKEN', 'IG', 'testcreator', mockIg);

  const rows = await query(
    'SELECT * FROM voice_examples WHERE account_id = $1',
    [acctId]
  );
  expect(rows.rows).toHaveLength(12);
});
