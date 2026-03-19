import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import { createHmac, timingSafeEqual } from 'crypto';

const app = express();
const port = Number(process.env.PORT || 3001);
app.set('trust proxy', 1);

const defaultAllowedOrigins = [
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://app.trycallmate.app',
];
const allowedOrigins = new Set(
  String(process.env.ALLOWED_ORIGINS || defaultAllowedOrigins.join(','))
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);
const rateLimitStore = new Map();

app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowOrigin = !origin || allowedOrigins.size === 0 || allowedOrigins.has(origin);

  if (origin && !allowOrigin) {
    res.status(403).send('Origin not allowed.');
    return;
  }

  if (origin && allowOrigin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('Referrer-Policy', 'no-referrer');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function requireOpenAI(res) {
  if (openai) return openai;
  res.status(500).send('OPENAI_API_KEY is missing on the API server.');
  return null;
}

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getClientKey(req) {
  // req.ip is populated correctly by Express when trust proxy is set,
  // so we use it directly rather than reading x-forwarded-for manually
  // (which would allow header spoofing to bypass per-IP rate limits).
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.path}:${getClientKey(req)}`;
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt <= now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      res.status(429).send('Too many requests. Please slow down and try again shortly.');
      return;
    }

    entry.count += 1;
    next();
  };
}

function verifySupabaseJwt(token) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return { ok: true, payload: null }; // auth disabled — dev mode

  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false };

  const [headerB64, payloadB64, sigB64] = parts;
  const sigInput = `${headerB64}.${payloadB64}`;

  let expectedSig;
  try {
    expectedSig = createHmac('sha256', secret).update(sigInput).digest('base64url');
  } catch {
    return { ok: false };
  }

  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  const actualBuf = Buffer.from(sigB64, 'utf8');
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return { ok: false };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false };
    }
    return { ok: true, payload };
  } catch {
    return { ok: false };
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    // If JWT secret is not configured, allow through (dev mode)
    if (!process.env.SUPABASE_JWT_SECRET) { next(); return; }
    res.status(401).send('Authorization required.');
    return;
  }
  const token = authHeader.slice(7);
  const result = verifySupabaseJwt(token);
  if (!result.ok) {
    res.status(401).send('Invalid or expired token.');
    return;
  }
  req.user = result.payload;
  next();
}

const INPUT_LIMITS = {
  description: 600,
  tone: 30,
  perspective: 20,
  text: 1200,
  voice: 20,
  instructions: 250,
  userTranscript: 600,
  situation: 500,
  scenario: 500,
};

const ALLOWED_VOICES = new Set(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'coral', 'sage', 'ash']);

function validateString(value, max) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  return value.slice(0, max);
}

function safeTrim(obj, limits) {
  const out = {};
  for (const [key, max] of Object.entries(limits)) {
    if (obj[key] !== undefined) out[key] = validateString(obj[key], max);
  }
  return out;
}

function serverError(res, label, error) {
  // Log full error server-side; send only a generic message to the client
  // to avoid leaking internal details (stack traces, API key hints, etc.)
  console.error(label, error);
  if (!res.headersSent) {
    res.status(500).send(`${label}. Please try again.`);
  }
}

function parseJson(content) {
  const raw = String(content || '').trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  return JSON.parse(candidate);
}

function sanitizeScript(description, tone, payload) {
  return {
    id: payload.id || crypto.randomUUID(),
    description,
    tone,
    name: payload.name || undefined,
    opening: compact(payload.opening),
    mainAsk: compact(payload.mainAsk),
    branchX: {
      condition: compact(payload.branchX?.condition),
      response: compact(payload.branchX?.response),
    },
    branchY: {
      condition: compact(payload.branchY?.condition),
      response: compact(payload.branchY?.response),
    },
    extraBranches: Array.isArray(payload.extraBranches)
      ? payload.extraBranches
          .map((branch) => ({
            condition: compact(branch.condition),
            response: compact(branch.response),
          }))
          .filter((branch) => branch.condition && branch.response)
      : [],
    close: compact(payload.close),
    timestamp: Date.now(),
  };
}

async function createJsonCompletion({ system, user, temperature = 1 }) {
  const client = openai;
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  return parseJson(response.choices[0]?.message?.content || '{}');
}

async function createTextCompletion({ system, user, temperature = 0.9 }) {
  const client = openai;
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  return compact(response.choices[0]?.message?.content || '');
}

async function repairPracticeLine({ scenario, userTranscript, conversationHistory, candidate }) {
  const repaired = await createTextCompletion({
    system: [
      'You are repairing a phone-call line so it sounds like the callee, not the caller.',
      'Keep it under 18 words.',
      'Do not narrate. Do not speak as the caller.',
      'Reply as the person on the other end of the phone.',
    ].join(' '),
    user: JSON.stringify({
      contactName: scenario?.contactName,
      perspective: scenario?.perspective,
      reasonSummary: scenario?.reasonSummary,
      userTranscript,
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory.slice(-10) : [],
      candidate,
    }),
    temperature: 0.5,
  });

  return compact(repaired);
}

async function generatePracticeTurn({ scenario, userTranscript, conversationHistory, attempt = 0 }) {
  const recentConversation = Array.isArray(conversationHistory) ? conversationHistory.slice(-12) : [];
  const retryNote = attempt > 0
    ? `Previous attempt was unusable because it was ${attempt === 1 ? 'empty or too vague' : 'still speaking like the caller or not answering the latest user input'}. Generate a direct callee reply now.`
    : undefined;

  const modelResult = await createJsonCompletion({
    system: [
      'You are the person the caller reached on the phone, such as the receptionist, host, office staff member, recruiter, support agent, or friend on the other end.',
      'Respond only after the user has spoken.',
      'Use the actual conversation so far, especially the user\'s latest words, to decide what to say next.',
      'Speak only from the callee perspective.',
      'Do not use canned fallback lines, placeholder responses, or scripted branches.',
      'Do not repeat a generic opener once the conversation has already started.',
      'Keep replies short, natural, and phone-like.',
      'You may ask one focused follow-up question, provide an answer, confirm a detail, or close the call if the issue feels resolved.',
      'If the issue sounds resolved, you may end the call politely and set callComplete to true.',
      'Never speak as the caller. Never say lines that sound like you are the user placing the call.',
      'Always generate up to 3 suggested caller replies that fit your exact line.',
      'Output JSON only.',
      'Bad examples: "I am calling to schedule", "Next Tuesday works for me", "Yes, I am a new patient.", "Could you tell me more?" when the user already explained themselves.',
      'Good examples: "Sure, what day works best for you?", "We can do Tuesday at 3pm.", "Yes, we accept that insurance."',
    ].join(' '),
    user: JSON.stringify({
      requiredShape: {
        aiText: 'string',
        suggestions: ['string'],
        callComplete: 'boolean',
      },
      perspective: scenario?.perspective,
      contactName: scenario?.contactName,
      scenarioTitle: scenario?.title,
      reasonSummary: scenario?.reasonSummary,
      openingLine: scenario?.openingLine,
      userTranscript,
      conversationHistory: recentConversation,
      instruction: scenario?.perspective === 'incoming'
        ? 'If this is the first AI turn after the user answered hello, explain why you are calling. Otherwise continue naturally from the thread.'
        : 'Continue the call naturally from the thread. Do not restart the call.',
      retryNote,
    }),
    temperature: 0.95,
  });

  const aiText = compact(modelResult?.aiText);
  const suggestions = Array.isArray(modelResult?.suggestions)
    ? modelResult.suggestions.map((item) => compact(item)).filter(Boolean).slice(0, 3)
    : [];
  const callComplete = Boolean(modelResult?.callComplete);

  return {
    aiText,
    suggestions,
    callComplete,
  };
}

function shouldAutoContinueHold(aiText) {
  const normalized = compact(aiText).toLowerCase();
  if (!normalized) return false;

  return [
    'please hold',
    'hold on',
    'one moment',
    'just a moment',
    'give me a moment',
    'let me check',
    'let me see',
    'bear with me',
  ].some((phrase) => normalized.includes(phrase));
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'about', 'be', 'for', 'from', 'have', 'how', 'i',
  'im', "i'm", 'if', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'please',
  'so', 'that', 'the', 'their', 'them', 'this', 'to', 'we', 'with', 'you', 'your',
]);

function extractKeywords(...parts) {
  return Array.from(new Set(
    parts
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  ));
}

function matchesExpectedIntent(userTranscript, expectedKeywords) {
  const words = extractKeywords(userTranscript);
  if (words.length === 0) return false;
  if (!expectedKeywords?.length) return true;
  return words.some((word) => expectedKeywords.includes(word));
}

function processPracticeTurn({ scenario, currentStepIndex, attemptCount, userTranscript }) {
  const currentStep = scenario?.steps?.[currentStepIndex];
  if (!currentStep) {
    return {
      aiText: scenario?.exitLine || 'Thanks for the call.',
      nextStepIndex: currentStepIndex,
      suggestions: [],
      callComplete: true,
      progressed: true,
    };
  }

  const matched = currentStep.id === 'opening'
    ? compact(userTranscript).length > 6
    : matchesExpectedIntent(userTranscript, currentStep.expectedKeywords || []);
  const shouldRetry = !matched && attemptCount === 0;

  if (shouldRetry) {
    return {
      aiText: currentStep.retryReply,
      nextStepIndex: currentStepIndex,
      suggestions: currentStep.suggestions || [],
      callComplete: false,
      progressed: false,
    };
  }

  return {
    aiText: currentStep.successReply,
    nextStepIndex: currentStepIndex + 1,
    suggestions: scenario?.steps?.[currentStepIndex + 1]?.suggestions || [],
    callComplete: !!currentStep.isFinal,
    progressed: true,
  };
}

function looksLikeCallerLine(text) {
  const normalized = compact(text).toLowerCase();
  if (!normalized) return true;

  if (
    /^(hi|hello)[,! ]/.test(normalized) ||
    /^(i|i'm|im|i am|my)\b/.test(normalized) ||
    /\b(i'm calling|im calling|i am calling|i'd like|i would like|i want to|i need to)\b/.test(normalized) ||
    /\bworks for me\b/.test(normalized) ||
    /\bnew patient\b/.test(normalized) ||
    /\bmy appointment\b/.test(normalized)
  ) {
    return true;
  }

  return false;
}

function buildFeedback(turns, completed) {
  const userTurns = turns.filter((turn) => turn.role === 'user');
  const responseSamples = userTurns.map((turn) => turn.responseMs).filter((value) => typeof value === 'number');
  const averageResponseMs = responseSamples.length
    ? Math.round(responseSamples.reduce((sum, value) => sum + value, 0) / responseSamples.length)
    : 0;
  const suggestionTurns = userTurns.filter((turn) => turn.usedSuggestion).length;
  const ownWordsTurns = userTurns.length - suggestionTurns;

  let confidenceScore = 55;
  if (completed) confidenceScore += 18;
  if (averageResponseMs > 0) confidenceScore += Math.max(0, 16 - Math.round(averageResponseMs / 900));
  confidenceScore += Math.min(12, ownWordsTurns * 4);
  confidenceScore += Math.min(8, userTurns.length * 2);
  confidenceScore = Math.max(48, Math.min(96, confidenceScore));

  const strengths = [];
  const suggestions = [];

  if (completed) strengths.push('You finished the full simulated call.');
  if (averageResponseMs > 0 && averageResponseMs < 3500) strengths.push('Your responses stayed fairly steady.');
  if (ownWordsTurns > 0) strengths.push('You improvised instead of relying only on prompts.');
  if (!strengths.length) strengths.push('You practiced instead of avoiding the call.');

  if (!completed) suggestions.push('Stay with the call long enough to reach the closing next time.');
  if (averageResponseMs >= 4500) suggestions.push('Try answering a little faster after each question.');
  if (suggestionTurns === userTurns.length && userTurns.length > 1) suggestions.push('Use one prompt, then try the next answer in your own words.');
  if (!suggestions.length) suggestions.push('Ask one short follow-up question to sound even more natural.');

  return {
    confidenceScore,
    strengths: strengths.slice(0, 2),
    suggestions: suggestions.slice(0, 2),
    averageResponseMs,
    completed,
    ownWordsTurns,
    suggestionTurns,
  };
}

const LIVE_ASSIST_INTENTS = new Set([
  'neutral',
  'question',
  'pushback',
  'delay',
  'pricing',
  'clarification',
  'transfer',
  'close',
]);

function normalizeLiveAssistIntent(value) {
  const normalized = compact(value).toLowerCase().replace(/\s+/g, '_');
  return LIVE_ASSIST_INTENTS.has(normalized) ? normalized : 'neutral';
}

function buildLiveAssistFallbacks(tone = 'Professional') {
  const professional = tone === 'Professional' || tone === 'Firm';
  return {
    clarify: professional ? 'Can you walk me through that one more time?' : 'Can you say that one more time?',
    pushback: professional ? 'I understand. What can be done from here?' : 'Okay, what are my options from here?',
    freeze: professional ? 'I just want to understand my options.' : 'Let me rephrase that for a second.',
  };
}

function inferLiveAssistIntent(text, override) {
  const forced = normalizeLiveAssistIntent(override);
  if (forced !== 'neutral') return forced;

  const normalized = compact(text).toLowerCase();
  if (!normalized) return 'neutral';
  if (/\b(next week|later|not until|fully booked|backed up|we can probably|another time)\b/.test(normalized)) return 'delay';
  if (/\b(price|cost|fee|charge|payment|how much|quote)\b/.test(normalized)) return 'pricing';
  if (/\b(what do you mean|can you explain|not sure i understand|clarify|walk me through)\b/.test(normalized)) return 'clarification';
  if (/\b(hold|one moment|just a moment|transfer|let me check|bear with me)\b/.test(normalized)) return 'transfer';
  if (/\b(no|can’t|cannot|won’t|policy|not able|unable)\b/.test(normalized)) return 'pushback';
  if (/\?$/.test(normalized) || /\b(what|when|which|who|how)\b/.test(normalized)) return 'question';
  if (/\b(thanks|thank you|all set|sounds good|take care|goodbye|bye)\b/.test(normalized)) return 'close';
  return 'neutral';
}

function buildLiveAssistSummary(events, transcriptOptIn) {
  const otherTurns = events.filter((event) => event?.speaker === 'other').map((event) => compact(event.text)).filter(Boolean);
  const userTurns = events.filter((event) => event?.speaker === 'user').map((event) => compact(event.text)).filter(Boolean);
  const objections = Array.from(new Set(otherTurns.map((text) => inferLiveAssistIntent(text)).filter((intent) => intent !== 'neutral' && intent !== 'close')));

  return {
    summary: userTurns.length
      ? 'You stayed engaged and kept the call moving with direct responses.'
      : 'You completed the session and stayed with the call.',
    objections,
    improvements: [
      userTurns.length > 1
        ? 'Ask one direct follow-up as soon as you hear a delay or policy objection.'
        : 'Use the first suggestion quickly so the call keeps moving.',
    ],
    helpfulnessPrompt: transcriptOptIn
      ? 'Did saving this call review make the feature more useful?'
      : 'Did this help you continue the call?',
  };
}

async function buildLiveAssistBrief({
  scenarioType,
  contactName,
  goal,
  worries,
  tone,
}) {
  if (!openai) {
    return {
      openingLine: `Hi, I’m calling about ${goal.toLowerCase()}.`,
      goalReminder: compact(goal),
      likelyObjections: ['They may delay you.', 'They may ask you to clarify the issue.'],
      freezeLine: buildLiveAssistFallbacks(tone).freeze,
    };
  }

  const data = await createJsonCompletion({
    temperature: 0.8,
    system: [
      'You generate a short pre-call brief for a real-time phone call assist feature.',
      'Keep everything concise, spoken, and realistic.',
      'Output JSON only.',
    ].join(' '),
    user: JSON.stringify({
      requiredShape: {
        openingLine: 'string',
        goalReminder: 'string',
        likelyObjections: ['string'],
        freezeLine: 'string',
      },
      constraints: [
        'openingLine must sound like something the caller can actually say aloud.',
        'goalReminder must be one short sentence fragment.',
        'likelyObjections should contain 2 short realistic objections.',
        'freezeLine should be a stabilizing line the caller can say if they freeze.',
      ],
      scenarioType,
      contactName,
      goal,
      worries,
      tone,
    }),
  });

  return {
    openingLine: compact(data.openingLine) || `Hi, I’m calling about ${goal.toLowerCase()}.`,
    goalReminder: compact(data.goalReminder) || compact(goal),
    likelyObjections: Array.isArray(data.likelyObjections)
      ? data.likelyObjections.map((item) => compact(item)).filter(Boolean).slice(0, 3)
      : ['They may delay you.', 'They may ask for more detail.'],
    freezeLine: compact(data.freezeLine) || buildLiveAssistFallbacks(tone).freeze,
  };
}

async function buildLiveAssistSuggestion({
  scenarioType,
  contactName,
  goal,
  worries,
  tone,
  latestTranscript,
  recentHistory,
  state,
}) {
  const fallbackLines = buildLiveAssistFallbacks(tone);
  const intent = inferLiveAssistIntent(latestTranscript, state?.intentOverride);

  if (state?.freezeMode) {
    return {
      primary: fallbackLines.freeze,
      alternate: 'Can you walk me through the next step?',
      intent,
      confidence: 0.94,
      freezeRecommended: false,
    };
  }

  if (!openai) {
    const fallbackByIntent = {
      delay: 'Can you tell me the earliest day this can happen?',
      pricing: 'Can you tell me the exact cost from here?',
      pushback: fallbackLines.pushback,
      clarification: fallbackLines.clarify,
      question: 'Can you tell me what that means for me right now?',
      transfer: 'Okay, can you stay with me while that happens?',
      close: 'Great, thanks for clarifying that for me.',
      neutral: 'Can you walk me through the next step?',
    };
    const primary = fallbackByIntent[intent] || fallbackByIntent.neutral;
    return {
      primary: state?.shorterRequested ? primary.split(' ').slice(0, 8).join(' ') : primary,
      alternate: 'What are my options from here?',
      intent,
      confidence: 0.72,
      freezeRecommended: false,
    };
  }

  const result = await createJsonCompletion({
    temperature: 0.7,
    system: [
      'You are a live phone-call response assistant.',
      'Generate exactly one short sentence the caller can say next.',
      'Return spoken language only.',
      'Keep it under 16 words whenever possible.',
      'Never return paragraphs, labels, bullets, or explanations.',
      'Do not roleplay both sides.',
      'If transcription is unclear, return a safe clarifying response.',
      'If shorterRequested is true, make it even shorter.',
      'If alternateRequested is true, provide a different but still natural alternate.',
      'Output JSON only.',
    ].join(' '),
    user: JSON.stringify({
      requiredShape: {
        primary: 'string',
        alternate: 'string',
        intent: 'string',
        confidence: 'number',
        freezeRecommended: 'boolean',
      },
      scenarioType,
      contactName,
      goal,
      worries,
      tone,
      latestTranscript,
      recentHistory: Array.isArray(recentHistory) ? recentHistory.slice(-6) : [],
      state,
      fallbackLines,
    }),
  });

  const primary = compact(result.primary) || fallbackLines.clarify;
  const alternate = compact(result.alternate);
  const confidence = Number.isFinite(Number(result.confidence)) ? Math.max(0, Math.min(1, Number(result.confidence))) : 0.72;

  return {
    primary: state?.shorterRequested ? primary.split(' ').slice(0, 8).join(' ') : primary,
    alternate: alternate || 'What are my options from here?',
    intent: inferLiveAssistIntent(latestTranscript, result.intent || intent),
    confidence,
    freezeRecommended: Boolean(result.freezeRecommended),
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/ai/script', requireAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const raw = req.body || {};
    const description = validateString(raw.description, INPUT_LIMITS.description);
    const tone = validateString(raw.tone, INPUT_LIMITS.tone);
    const perspective = validateString(raw.perspective, INPUT_LIMITS.perspective);
    const persona = raw.persona && typeof raw.persona === 'object' ? raw.persona : undefined;
    const userProfile = raw.userProfile && typeof raw.userProfile === 'object' ? raw.userProfile : undefined;
    if (!description?.trim()) { res.status(400).send('Call description is required.'); return; }
    const data = await createJsonCompletion({
      temperature: 1.1,
      system: [
        'You write bespoke phone-call scripts for anxious users.',
        'Do not use canned templates or repeated stock phrasing.',
        'Every section must sound specific to the exact call topic and the caller profile.',
        'Use the user profile to shape pace, wording, assertiveness, and emotional support without sounding clinical.',
        'Write natural spoken language, not corporate writing.',
        'Output JSON only.',
      ].join(' '),
      user: JSON.stringify({
        task: 'Generate a personalized phone call script.',
        requiredShape: {
          opening: 'string',
          mainAsk: 'string',
          branchX: { condition: 'string', response: 'string' },
          branchY: { condition: 'string', response: 'string' },
          extraBranches: [{ condition: 'string', response: 'string' }],
          close: 'string',
          name: 'optional string',
        },
        constraints: [
          'Opening must directly fit the topic. Do not start every call with “Hi, this is…” unless the topic naturally calls for it.',
          'Main ask must be specific, topic-aware, and sound like something a real person would actually say.',
          'branchX and branchY must be scenario-specific “if they say...” responses, not generic pushback lines.',
          'extraBranches should be 1 or 2 additional realistic conversation branches when helpful.',
          'Close must match the likely outcome of this specific call.',
          'Keep each line concise enough to speak aloud.',
          'Never mention AI or templates.',
        ],
        callDescription: description,
        tone,
        perspective,
        persona,
        userProfile,
      }),
    });

    res.json(sanitizeScript(description, tone, data));
  } catch (error) {
    serverError(res, 'Failed to generate script', error);
  }
});

app.post('/api/ai/panic', requireAuth, rateLimit({ windowMs: 60_000, max: 30 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const raw = req.body || {};
    const situation = validateString(raw.situation, INPUT_LIMITS.situation);
    const panicPayload = { ...safeTrim(raw, { situation: INPUT_LIMITS.situation }), situation };
    const text = await createTextCompletion({
      system: 'You generate one short in-the-moment phone reply for an anxious caller. Make it sound grounded, useful, and specific.',
      user: JSON.stringify(panicPayload),
      temperature: 0.9,
    });
    res.json({ text });
  } catch (error) {
    serverError(res, 'Failed to generate panic response', error);
  }
});

app.post('/api/ai/voicemail', requireAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const text = await createTextCompletion({
      system: 'You convert a call script into a concise voicemail script. Keep it natural, warm, and under 70 words.',
      user: JSON.stringify(req.body || {}),
      temperature: 0.8,
    });
    res.json({ text });
  } catch (error) {
    serverError(res, 'Failed to generate voicemail', error);
  }
});

app.post('/api/ai/email-fallback', requireAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const text = await createTextCompletion({
      system: 'You turn a phone call script into a short fallback email. Keep it clear, polite, and realistic.',
      user: JSON.stringify(req.body || {}),
      temperature: 0.8,
    });
    res.json({ text });
  } catch (error) {
    serverError(res, 'Failed to generate email fallback', error);
  }
});

app.post('/api/ai/branch', requireAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const raw = req.body || {};
    const description = validateString(raw.description, INPUT_LIMITS.description);
    const scenario = validateString(raw.scenario, INPUT_LIMITS.scenario);
    const tone = validateString(raw.tone, INPUT_LIMITS.tone);
    const data = await createJsonCompletion({
      system: 'You write one realistic “if they say...” branch for a phone call script. Output JSON only.',
      user: JSON.stringify({
        requiredShape: { condition: 'string', response: 'string' },
        constraints: [
          'Condition must read like a realistic scenario label.',
          'Response must sound specific to the exact topic, not generic.',
          'Keep it short enough to speak aloud.',
        ],
        description,
        scenario,
        tone,
      }),
      temperature: 1,
    });
    res.json({
      condition: compact(data.condition),
      response: compact(data.response),
    });
  } catch (error) {
    serverError(res, 'Failed to generate branch', error);
  }
});

app.post('/api/ai/tts', requireAuth, rateLimit({ windowMs: 60_000, max: 25 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const raw = req.body || {};
    const ttsText = validateString(raw.text, INPUT_LIMITS.text);
    const rawVoice = validateString(raw.voice, INPUT_LIMITS.voice) || 'nova';
    const voice = ALLOWED_VOICES.has(rawVoice) ? rawVoice : 'nova';
    const instructions = validateString(raw.instructions, INPUT_LIMITS.instructions);
    if (!ttsText?.trim()) { res.status(400).send('Text is required for TTS.'); return; }
    const speech = await client.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice,
      input: compact(ttsText),
      instructions: compact(instructions || 'Speak naturally, like a real phone call.'),
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  } catch (error) {
    serverError(res, 'Failed to generate TTS', error);
  }
});

app.post('/api/practice-call/next-turn', requireAuth, rateLimit({ windowMs: 60_000, max: 40 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const raw = req.body || {};
    const scenario = raw.scenario && typeof raw.scenario === 'object' ? raw.scenario : undefined;
    const currentStepIndex = typeof raw.currentStepIndex === 'number' ? raw.currentStepIndex : 0;
    const autoContinue = Boolean(raw.autoContinue);
    const conversationHistory = Array.isArray(raw.conversationHistory)
      ? raw.conversationHistory.slice(-20) // cap history to prevent token bloat
      : [];
    const transcript = compact(validateString(raw.userTranscript, INPUT_LIMITS.userTranscript));
    if (!transcript && !autoContinue) {
      res.status(400).send('A user transcript is required before generating an AI response.');
      return;
    }
    const effectiveTranscript = autoContinue
      ? '[SYSTEM] Continue the call after the brief hold and update the caller.'
      : transcript;

    let generated = await generatePracticeTurn({
      scenario,
      userTranscript: effectiveTranscript,
      conversationHistory,
      attempt: 0,
    });

    let finalAiText = generated.aiText;
    if (!finalAiText || looksLikeCallerLine(finalAiText)) {
      finalAiText = await repairPracticeLine({
        scenario,
        userTranscript: effectiveTranscript,
        conversationHistory,
        candidate: finalAiText || generated,
      });
    }

    if (!finalAiText || looksLikeCallerLine(finalAiText)) {
      generated = await generatePracticeTurn({
        scenario,
        userTranscript: effectiveTranscript,
        conversationHistory,
        attempt: 1,
      });
      finalAiText = generated.aiText;
    }

    if (!finalAiText || looksLikeCallerLine(finalAiText)) {
      finalAiText = await repairPracticeLine({
        scenario,
        userTranscript: effectiveTranscript,
        conversationHistory,
        candidate: finalAiText || generated,
      });
    }

    if (!finalAiText || looksLikeCallerLine(finalAiText)) {
      generated = await generatePracticeTurn({
        scenario,
        userTranscript: effectiveTranscript,
        conversationHistory,
        attempt: 2,
      });
      finalAiText = generated.aiText;
    }

    const cleanAiText = compact(finalAiText);
    if (!cleanAiText || looksLikeCallerLine(cleanAiText)) {
      res.status(502).send('Failed to generate a valid callee response.');
      return;
    }
    const autoContinueAfterMs = shouldAutoContinueHold(cleanAiText) ? 5500 : undefined;

    res.json({
      aiText: cleanAiText,
      nextStepIndex: currentStepIndex,
      suggestions: generated.suggestions,
      callComplete: Boolean(generated.callComplete) || (Array.isArray(conversationHistory) && conversationHistory.length >= 15),
      progressed: true,
      responseDelayMs: generated.callComplete ? 40 : 0,
      autoContinueAfterMs,
    });
  } catch (error) {
    serverError(res, 'Failed to process practice turn', error);
  }
});

app.post('/api/practice-call/end', requireAuth, rateLimit({ windowMs: 60_000, max: 60 }), async (req, res) => {
  try {
    const { turns = [], completed = false } = req.body || {};
    res.json(buildFeedback(turns, completed));
  } catch (error) {
    serverError(res, 'Failed to end practice session', error);
  }
});

app.post('/api/live-assist/session', requireAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  try {
    const raw = req.body || {};
    const scenarioType = compact(raw.scenarioType) || 'general_business';
    const contactName = validateString(raw.contactName, 120);
    const goal = validateString(raw.goal, 240);
    const tone = validateString(raw.tone, INPUT_LIMITS.tone) || 'Professional';
    const worries = Array.isArray(raw.worries)
      ? raw.worries.map((item) => validateString(item, 180)).filter(Boolean).slice(0, 5)
      : [];
    const transcriptOptIn = Boolean(raw.transcriptOptIn);

    if (!goal?.trim()) {
      res.status(400).send('Goal is required.');
      return;
    }

    const brief = await buildLiveAssistBrief({
      scenarioType,
      contactName: compact(contactName),
      goal,
      worries,
      tone,
    });

    res.json({
      sessionId: crypto.randomUUID(),
      brief,
      fallbacks: buildLiveAssistFallbacks(tone),
      transcriptOptIn,
    });
  } catch (error) {
    serverError(res, 'Failed to create live assist session', error);
  }
});

app.post('/api/live-assist/respond', requireAuth, rateLimit({ windowMs: 60_000, max: 60 }), async (req, res) => {
  try {
    const raw = req.body || {};
    const sessionId = validateString(raw.sessionId, 120);
    const latestTranscript = validateString(raw.latestTranscript, INPUT_LIMITS.text);
    const state = raw.state && typeof raw.state === 'object' ? raw.state : {};
    const recentHistory = Array.isArray(raw.recentHistory)
      ? raw.recentHistory
          .map((turn) => ({
            speaker: turn?.speaker === 'user' ? 'user' : 'other',
            text: validateString(turn?.text, INPUT_LIMITS.text) || '',
          }))
          .filter((turn) => turn.text)
          .slice(-10)
      : [];

    if (!sessionId?.trim()) {
      res.status(400).send('sessionId is required.');
      return;
    }

    if (!latestTranscript?.trim()) {
      res.status(400).send('latestTranscript is required.');
      return;
    }

    const suggestion = await buildLiveAssistSuggestion({
      scenarioType: compact(raw.scenarioType) || 'general_business',
      contactName: compact(raw.contactName),
      goal: compact(raw.goal),
      worries: Array.isArray(raw.worries) ? raw.worries.map((item) => compact(item)).filter(Boolean).slice(0, 5) : [],
      tone: validateString(raw.tone, INPUT_LIMITS.tone) || 'Professional',
      latestTranscript,
      recentHistory,
      state: {
        intentOverride: normalizeLiveAssistIntent(state.intentOverride),
        freezeMode: Boolean(state.freezeMode),
        shorterRequested: Boolean(state.shorterRequested),
        alternateRequested: Boolean(state.alternateRequested),
        lastSuggestion: compact(state.lastSuggestion),
      },
    });

    res.json(suggestion);
  } catch (error) {
    serverError(res, 'Failed to generate live assist response', error);
  }
});

app.post('/api/live-assist/action', requireAuth, rateLimit({ windowMs: 60_000, max: 120 }), async (req, res) => {
  try {
    const raw = req.body || {};
    const sessionId = validateString(raw.sessionId, 120);
    const action = compact(raw.action);
    const timestamp = Number(raw.timestamp);

    if (!sessionId?.trim() || !action) {
      res.status(400).send('sessionId and action are required.');
      return;
    }

    res.json({
      ok: true,
      sessionId,
      action,
      timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    });
  } catch (error) {
    serverError(res, 'Failed to log live assist action', error);
  }
});

app.post('/api/live-assist/end', requireAuth, rateLimit({ windowMs: 60_000, max: 40 }), async (req, res) => {
  try {
    const raw = req.body || {};
    const sessionId = validateString(raw.sessionId, 120);
    const transcriptOptIn = Boolean(raw.transcriptOptIn);
    const events = Array.isArray(raw.events)
      ? raw.events
          .map((event) => ({
            speaker: event?.speaker === 'user' ? 'user' : 'other',
            text: validateString(event?.text, INPUT_LIMITS.text) || '',
          }))
          .filter((event) => event.text)
      : [];

    if (!sessionId?.trim()) {
      res.status(400).send('sessionId is required.');
      return;
    }

    res.json(buildLiveAssistSummary(events, transcriptOptIn));
  } catch (error) {
    serverError(res, 'Failed to end live assist session', error);
  }
});

app.listen(port, () => {
  console.log(`Callmate API listening on http://localhost:${port}`);
});
