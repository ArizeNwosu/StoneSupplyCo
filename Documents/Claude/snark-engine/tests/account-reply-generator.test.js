require('dotenv').config({ path: '.env.test' });
const { generateAccountReply, buildPrompt } = require('../services/account-reply-generator');

const ACCOUNT = { username: 'testcreator', voice_intensity: 'balanced' };

const VOICE_EXAMPLES = [
  { comment: 'Where can I buy?', reply: 'Link in bio! 🔥', intent: 'high_intent' },
  { comment: 'This is amazing', reply: 'Thank you so much 🙏', intent: 'engagement' },
  { comment: 'Does this really work?', reply: 'Try it and see 😏', intent: 'skepticism' },
];

function makeClient(responseText) {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({ content: [{ text: responseText }] }),
    },
  };
}

test('returns reply_text and confidence_score', async () => {
  const client = makeClient('{"reply_text": "@fan1 Link in bio! 🔥", "confidence_score": 0.88}');
  const result = await generateAccountReply({
    account: ACCOUNT,
    commenterUsername: 'fan1',
    commentText: 'Where can I buy this?',
    intent: 'high_intent',
    voiceExamples: VOICE_EXAMPLES,
  }, client);
  expect(result.reply_text).toBe('@fan1 Link in bio! 🔥');
  expect(result.confidence_score).toBe(0.88);
});

test('clamps confidence_score above 1 to exactly 1', async () => {
  const client = makeClient('{"reply_text": "hi", "confidence_score": 1.5}');
  const result = await generateAccountReply({
    account: ACCOUNT,
    commenterUsername: 'fan',
    commentText: 'test',
    intent: 'engagement',
    voiceExamples: [],
  }, client);
  expect(result.confidence_score).toBe(1);
});

test('clamps confidence_score below 0 to exactly 0', async () => {
  const client = makeClient('{"reply_text": "hi", "confidence_score": -0.5}');
  const result = await generateAccountReply({
    account: ACCOUNT,
    commenterUsername: 'fan',
    commentText: 'test',
    intent: 'engagement',
    voiceExamples: [],
  }, client);
  expect(result.confidence_score).toBe(0);
});

test('buildPrompt places intent-matching examples before others', () => {
  const { system } = buildPrompt({
    account: ACCOUNT,
    commenterUsername: 'fan1',
    commentText: 'How much?',
    intent: 'high_intent',
    voiceExamples: VOICE_EXAMPLES,
  });
  const highIntentPos = system.indexOf('Link in bio!');
  const engagementPos = system.indexOf('Thank you so much');
  expect(highIntentPos).toBeGreaterThan(-1);
  expect(engagementPos).toBeGreaterThan(-1);
  expect(highIntentPos).toBeLessThan(engagementPos);
});

test('buildPrompt includes voice_intensity description', () => {
  const { system } = buildPrompt({
    account: { username: 'creator', voice_intensity: 'spicy' },
    commenterUsername: 'fan',
    commentText: 'test',
    intent: 'engagement',
    voiceExamples: [],
  });
  expect(system).toMatch(/spicy/i);
  expect(system).toMatch(/bold|absurdist|chaos/i);
});

test('buildPrompt caps examples at 8 even if more provided', () => {
  const manyExamples = Array.from({ length: 15 }, (_, i) => ({
    comment: `Comment ${i}`,
    reply: `Reply ${i}`,
    intent: 'engagement',
  }));
  const { system } = buildPrompt({
    account: ACCOUNT,
    commenterUsername: 'fan',
    commentText: 'test',
    intent: 'engagement',
    voiceExamples: manyExamples,
  });
  const occurrences = (system.match(/Reply \d+/g) || []).length;
  expect(occurrences).toBeLessThanOrEqual(8);
});

test('buildPrompt handles empty voice examples gracefully', () => {
  const { system } = buildPrompt({
    account: ACCOUNT,
    commenterUsername: 'fan',
    commentText: 'test',
    intent: 'engagement',
    voiceExamples: [],
  });
  expect(system).toBeTruthy();
  expect(system.length).toBeGreaterThan(50);
});

test('throws on malformed JSON from Claude', async () => {
  const client = makeClient('not json');
  await expect(generateAccountReply({
    account: ACCOUNT,
    commenterUsername: 'fan',
    commentText: 'test',
    intent: 'engagement',
    voiceExamples: [],
  }, client)).rejects.toThrow();
});

test('throws when reply_text is missing from Claude response', async () => {
  const client = makeClient('{"confidence_score": 0.9}');
  await expect(generateAccountReply({
    account: ACCOUNT,
    commenterUsername: 'fan',
    commentText: 'test',
    intent: 'engagement',
    voiceExamples: [],
  }, client)).rejects.toThrow('Claude returned an empty or missing reply_text');
});

test('throws when confidence_score is missing from Claude response', async () => {
  const client = makeClient('{"reply_text": "@fan hi"}');
  await expect(generateAccountReply({
    account: ACCOUNT,
    commenterUsername: 'fan',
    commentText: 'test',
    intent: 'engagement',
    voiceExamples: [],
  }, client)).rejects.toThrow('Invalid confidence_score value');
});

test('throws on invalid commenterUsername', async () => {
  const client = makeClient('{"reply_text": "@fan hi", "confidence_score": 0.9}');
  await expect(generateAccountReply({
    account: ACCOUNT,
    commenterUsername: 'fan with spaces!',
    commentText: 'test',
    intent: 'engagement',
    voiceExamples: [],
  }, client)).rejects.toThrow('Invalid commenterUsername');
});
