const Anthropic = require('@anthropic-ai/sdk');

const VALID_INTENTS = ['high_intent', 'engagement', 'skepticism', 'spam'];

async function classifyIntent(commentText, username, _clientOverride = null) {
  if (!commentText || typeof commentText !== 'string') throw new Error('commentText must be a non-empty string');
  if (!username || typeof username !== 'string') throw new Error('username must be a non-empty string');

  const client = _clientOverride || new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 64,
    messages: [{
      role: 'user',
      content: `Classify this Instagram comment into exactly one intent.

Intents:
- high_intent: buying signals, questions about price/availability/product/where to buy
- engagement: genuine reactions, compliments, jokes, relatable responses, conversation starters
- skepticism: doubts, complaints, mild negativity, "prove it" energy, disappointment
- spam: promotional content, bot-like, hashtag dumps, irrelevant self-promotion

Comment from @${username}: "${commentText}"

Respond with JSON only: {"intent": "high_intent", "confidence": 0.92}`,
    }],
  });

  if (!response.content?.length) throw new Error('Empty response from Claude');

  const raw = response.content[0].text.trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error(`No JSON in response: ${raw.substring(0, 100)}`);
    parsed = JSON.parse(jsonMatch[0]);
  }

  if (!VALID_INTENTS.includes(parsed.intent)) {
    throw new Error(`Invalid intent: ${parsed.intent}`);
  }

  const confidence = Math.min(1, Math.max(0, parseFloat(parsed.confidence)));
  if (isNaN(confidence)) throw new Error(`Invalid confidence value: ${parsed.confidence}`);

  return {
    intent: parsed.intent,
    confidence,
  };
}

module.exports = { classifyIntent };
