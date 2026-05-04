const Anthropic = require('@anthropic-ai/sdk');

const VOICE_DESCRIPTIONS = {
  safe: 'Measured and on-brand. Warm, friendly, no sharp edges. Suitable for all audiences.',
  balanced: 'Punchy and self-aware. Playful humor that lands without offending. The sweet spot.',
  spicy: 'Bold, absurdist, chaos energy. Provocative but never mean. Full character.',
};

function buildPrompt({ account, commenterUsername, commentText, intent, voiceExamples }) {
  const intentFirst = voiceExamples.filter(e => e.intent === intent);
  const others = voiceExamples.filter(e => e.intent !== intent);
  const examples = [...intentFirst, ...others].slice(0, 8);

  const voiceSection = examples.length > 0
    ? `Voice examples from @${account.username}:\n${examples.map(e =>
        `Comment: "${e.comment}"\nReply: "${e.reply}"`
      ).join('\n\n')}`
    : `No voice examples yet — reply naturally at the selected voice intensity.`;

  const system = `You are the Instagram comment-reply manager for @${account.username}.
Voice intensity: ${account.voice_intensity} — ${VOICE_DESCRIPTIONS[account.voice_intensity] || VOICE_DESCRIPTIONS.balanced}

Rules:
- Address the commenter by @${commenterUsername} at the start
- Maximum 1-2 sentences
- Never be defensive or use corporate filler phrases
- Match the creator's voice exactly as shown in the examples

${voiceSection}

This comment intent: ${intent}

Confidence score guide — how well the reply matches this creator's voice:
- 0.90–1.00: Perfect match, auto-postable
- 0.75–0.89: Good, review optional
- 0.50–0.74: Slightly off, review recommended
- Below 0.50: Doesn't match, needs human

Output JSON only: {"reply_text": "...", "confidence_score": 0.87}`;

  const user = `Reply to this ${intent} comment from @${commenterUsername}: "${commentText}"`;
  return { system, user };
}

async function generateAccountReply(params, _clientOverride = null) {
  if (!params.commenterUsername || typeof params.commenterUsername !== 'string') {
    throw new Error('commenterUsername must be a non-empty string');
  }
  if (!params.commentText || typeof params.commentText !== 'string') {
    throw new Error('commentText must be a non-empty string');
  }
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(params.commenterUsername)) {
    throw new Error(`Invalid commenterUsername: ${params.commenterUsername}`);
  }

  const client = _clientOverride || new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  const { system, user } = buildPrompt(params);

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 256,
    system,
    messages: [{ role: 'user', content: user }],
  });

  if (!response.content?.length) throw new Error('Empty response from Claude');

  const raw = response.content[0].text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON in response: ${raw.substring(0, 100)}`);

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.reply_text || typeof parsed.reply_text !== 'string' || !parsed.reply_text.trim()) {
    throw new Error('Claude returned an empty or missing reply_text');
  }

  const score = parseFloat(parsed.confidence_score);
  if (isNaN(score)) throw new Error(`Invalid confidence_score value: ${parsed.confidence_score}`);
  return {
    reply_text: parsed.reply_text,
    confidence_score: Math.min(1, Math.max(0, score)),
  };
}

module.exports = { generateAccountReply, buildPrompt };
