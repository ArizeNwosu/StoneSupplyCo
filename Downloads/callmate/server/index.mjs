import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';

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
  const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwardedFor || req.ip || req.socket.remoteAddress || 'unknown';
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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/ai/script', rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const { description, tone, perspective, persona, userProfile } = req.body || {};
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
    console.error('Failed to generate script', error);
    res.status(500).send(error?.message || 'Failed to generate script');
  }
});

app.post('/api/ai/panic', rateLimit({ windowMs: 60_000, max: 30 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const text = await createTextCompletion({
      system: 'You generate one short in-the-moment phone reply for an anxious caller. Make it sound grounded, useful, and specific.',
      user: JSON.stringify(req.body || {}),
      temperature: 0.9,
    });
    res.json({ text });
  } catch (error) {
    console.error('Failed to generate panic response', error);
    res.status(500).send(error?.message || 'Failed to generate panic response');
  }
});

app.post('/api/ai/voicemail', rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
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
    console.error('Failed to generate voicemail', error);
    res.status(500).send(error?.message || 'Failed to generate voicemail');
  }
});

app.post('/api/ai/email-fallback', rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
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
    console.error('Failed to generate email fallback', error);
    res.status(500).send(error?.message || 'Failed to generate email fallback');
  }
});

app.post('/api/ai/branch', rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const data = await createJsonCompletion({
      system: 'You write one realistic “if they say...” branch for a phone call script. Output JSON only.',
      user: JSON.stringify({
        requiredShape: { condition: 'string', response: 'string' },
        constraints: [
          'Condition must read like a realistic scenario label.',
          'Response must sound specific to the exact topic, not generic.',
          'Keep it short enough to speak aloud.',
        ],
        ...req.body,
      }),
      temperature: 1,
    });
    res.json({
      condition: compact(data.condition),
      response: compact(data.response),
    });
  } catch (error) {
    console.error('Failed to generate branch', error);
    res.status(500).send(error?.message || 'Failed to generate branch');
  }
});

app.post('/api/ai/tts', rateLimit({ windowMs: 60_000, max: 25 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const { text, voice = 'nova', instructions } = req.body || {};
    const speech = await client.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice,
      input: compact(text),
      instructions: compact(instructions || 'Speak naturally, like a real phone call.'),
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  } catch (error) {
    console.error('Failed to generate TTS', error);
    res.status(500).send(error?.message || 'Failed to generate TTS');
  }
});

app.post('/api/practice-call/next-turn', rateLimit({ windowMs: 60_000, max: 40 }), async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  try {
    const { scenario, currentStepIndex = 0, userTranscript, conversationHistory, autoContinue = false } = req.body || {};
    const transcript = compact(userTranscript);
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
    console.error('Failed to process practice turn', error);
    res.status(500).send(error?.message || 'Failed to process practice turn');
  }
});

app.post('/api/practice-call/end', rateLimit({ windowMs: 60_000, max: 60 }), async (req, res) => {
  try {
    const { turns = [], completed = false } = req.body || {};
    res.json(buildFeedback(turns, completed));
  } catch (error) {
    console.error('Failed to end practice session', error);
    res.status(500).send(error?.message || 'Failed to build feedback');
  }
});

app.listen(port, () => {
  console.log(`Callmate API listening on http://localhost:${port}`);
});
