require('dotenv').config({ path: '.env.test' });
const { classifyIntent } = require('../services/intent-classifier');

function makeClient(responseText) {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({ content: [{ text: responseText }] }),
    },
  };
}

test('classifies high_intent comment', async () => {
  const client = makeClient('{"intent": "high_intent", "confidence": 0.92}');
  const result = await classifyIntent('How much does this cost?', 'fan1', client);
  expect(result).toEqual({ intent: 'high_intent', confidence: 0.92 });
});

test('classifies spam comment', async () => {
  const client = makeClient('{"intent": "spam", "confidence": 0.95}');
  const result = await classifyIntent('Follow me for free stuff!!!', 'spammer', client);
  expect(result).toEqual({ intent: 'spam', confidence: 0.95 });
});

test('clamps confidence above 1 to exactly 1', async () => {
  const client = makeClient('{"intent": "engagement", "confidence": 1.5}');
  const result = await classifyIntent('Love this!', 'fan', client);
  expect(result.confidence).toBe(1);
});

test('clamps confidence below 0 to exactly 0', async () => {
  const client = makeClient('{"intent": "skepticism", "confidence": -0.1}');
  const result = await classifyIntent('Meh', 'fan', client);
  expect(result.confidence).toBe(0);
});

test('throws on invalid intent value', async () => {
  const client = makeClient('{"intent": "unknown_bucket", "confidence": 0.8}');
  await expect(classifyIntent('test', 'user', client)).rejects.toThrow('Invalid intent');
});

test('throws on malformed JSON from Claude', async () => {
  const client = makeClient('not valid json at all');
  await expect(classifyIntent('test', 'user', client)).rejects.toThrow('No JSON in response');
});

test('extracts JSON from response with surrounding text', async () => {
  const client = makeClient('Sure! {"intent": "engagement", "confidence": 0.85} Hope that helps.');
  const result = await classifyIntent('Cool!', 'fan', client);
  expect(result.intent).toBe('engagement');
});

test('throws when confidence field is missing', async () => {
  const client = makeClient('{"intent": "engagement"}');
  await expect(classifyIntent('test', 'user', client)).rejects.toThrow('Invalid confidence value');
});

test('throws on null commentText', async () => {
  const client = makeClient('{"intent": "engagement", "confidence": 0.9}');
  await expect(classifyIntent(null, 'user', client)).rejects.toThrow('commentText must be a non-empty string');
});
