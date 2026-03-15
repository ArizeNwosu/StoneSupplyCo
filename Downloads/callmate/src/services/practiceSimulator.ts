import type { CallPerspective, CallScript, PracticeFeedback, PracticeScenario, PracticeScenarioStep, PracticeTurn } from '../types';

type ScenarioKind =
  | 'medical'
  | 'restaurant'
  | 'store_hours'
  | 'customer_support'
  | 'job_followup'
  | 'housing'
  | 'generic';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'about', 'be', 'for', 'from', 'have', 'how', 'i',
  'im', "i'm", 'if', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'please',
  'so', 'that', 'the', 'their', 'them', 'this', 'to', 'we', 'with', 'you', 'your'
]);

function compact(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function toSentence(text: string) {
  const cleaned = compact(text).replace(/[.?!]+$/, '');
  return cleaned ? `${cleaned}.` : '';
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'practice_call';
}

function extractKeywords(...parts: string[]) {
  return Array.from(new Set(
    parts
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word))
  ));
}

function inferScenarioKind(description: string): ScenarioKind {
  const text = description.toLowerCase();
  if (/(doctor|dentist|clinic|hospital|medical|pharmacy|appointment|cleaning)/.test(text)) return 'medical';
  if (/(restaurant|reservation|table|dinner|host)/.test(text)) return 'restaurant';
  if (/(store hours|hours|open|closing|close time)/.test(text)) return 'store_hours';
  if (/(customer service|refund|billing|charge|support|bank|utility|insurance|complaint)/.test(text)) return 'customer_support';
  if (/(recruiter|interview|job|hiring|follow[- ]?up)/.test(text)) return 'job_followup';
  if (/(landlord|apartment|lease|property|rent|maintenance)/.test(text)) return 'housing';
  return 'generic';
}

function inferInformalCall(description: string) {
  return /(friend|mom|mother|dad|father|sister|brother|partner|boyfriend|girlfriend|roommate|neighbor|landlord direct|family|someone i know|my friend)/i.test(description);
}

function scenarioCopy(kind: ScenarioKind) {
  switch (kind) {
    case 'medical':
      return {
        title: 'Schedule a Medical Appointment',
        contactName: 'Green Valley Clinic',
        category: 'appointments',
        introLine: 'Hello, thanks for calling Green Valley Clinic. How can I help you today?',
        questions: ['Are you a new patient?', 'What day works best for you?'],
        detailReply: 'Of course. Are you a new patient with us?',
        resolveReply: 'What day or time usually works best for you?',
        finalReply: 'Perfect. I have what I need for now. Thanks for calling.',
      };
    case 'restaurant':
      return {
        title: 'Restaurant Reservation',
        contactName: 'Juniper Table',
        category: 'reservations',
        introLine: 'Thanks for calling Juniper Table. How can I help you?',
        questions: ['What day are you looking for?', 'How many people will be in your party?'],
        detailReply: 'Absolutely. What day are you hoping to come in?',
        resolveReply: 'Got it. About how many people should I plan for?',
        finalReply: 'Sounds good. We are all set on this end. Thanks for calling.',
      };
    case 'store_hours':
      return {
        title: 'Ask Store Hours',
        contactName: 'Main Street Market',
        category: 'everyday',
        introLine: 'Main Street Market, this is the front desk. How can I help?',
        questions: ['What day are you asking about?', 'Is there anything specific you need before you come in?'],
        detailReply: 'Sure. What day are you planning to stop by?',
        resolveReply: 'Thanks. Is there anything specific you need to confirm before you come in?',
        finalReply: 'Happy to help. See you soon, and thanks for calling.',
      };
    case 'customer_support':
      return {
        title: 'Customer Support Call',
        contactName: 'Customer Support',
        category: 'support',
        introLine: 'Thank you for calling customer support. What can I help you with today?',
        questions: ['Can you tell me what happened?', 'What outcome are you hoping for today?'],
        detailReply: 'I can help with that. Can you tell me what happened?',
        resolveReply: 'Understood. What would feel like a good resolution for you today?',
        finalReply: 'Thanks for explaining that clearly. We can take it from here.',
      };
    case 'job_followup':
      return {
        title: 'Recruiter Follow-up',
        contactName: 'Hiring Team',
        category: 'career',
        introLine: 'Hello, this is the hiring team. How can I help you today?',
        questions: ['Which role are you calling about?', 'What would you like to confirm or follow up on?'],
        detailReply: 'Thanks for following up. Which role are you calling about?',
        resolveReply: 'That helps. What are you hoping to confirm today?',
        finalReply: 'Appreciate the follow-up. We will make note of that. Thanks for calling.',
      };
    case 'housing':
      return {
        title: 'Landlord or Property Call',
        contactName: 'Property Management',
        category: 'housing',
        introLine: 'Property management, this is the office. How can I help?',
        questions: ['Can you tell me what is going on?', 'What do you need from us today?'],
        detailReply: 'Okay, can you tell me what is going on?',
        resolveReply: 'Thanks for explaining that. What do you need from us today?',
        finalReply: 'Understood. We have the details we need for now. Thanks for calling.',
      };
    default:
      return {
        title: 'Practice This Call',
        contactName: 'Call Office',
        category: 'general',
        introLine: 'Hello, thanks for calling. What can I help you with today?',
        questions: ['Can you tell me a little more?', 'What are you hoping to get done on this call?'],
        detailReply: 'Sure, can you tell me a little more?',
        resolveReply: 'That makes sense. What are you hoping to get done on this call?',
        finalReply: 'Thanks. That gives us a good next step. I appreciate the call.',
      };
  }
}

function uniqueSuggestions(...groups: string[][]) {
  return Array.from(new Set(groups.flat().map(compact).filter(Boolean))).slice(0, 3);
}

function normalizeConditionPrompt(condition: string, fallback: string) {
  const cleaned = compact(condition)
    .replace(/^if they (say|ask|mention|need)\s+/i, '')
    .replace(/^if\s+/i, '')
    .replace(/^they (say|ask|mention|need)\s+/i, '')
    .replace(/^about\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();

  if (!cleaned) return fallback;

  if (cleaned.endsWith('?')) return cleaned;

  if (/^(are|do|does|did|can|could|would|will|what|when|where|which|who|why|how)\b/i.test(cleaned)) {
    return `${cleaned.replace(/[.?!]+$/, '')}?`;
  }

  if (/^(whether|if)\b/i.test(cleaned)) {
    return `${cleaned.replace(/^(whether|if)\s+/i, '').replace(/[.?!]+$/, '')}?`;
  }

  return toSentence(cleaned);
}

function buildIntroLine(kind: ScenarioKind, description: string, contactName: string) {
  if (inferInformalCall(description)) {
    return 'Hello?';
  }

  const businessName = compact(contactName);
  if (businessName && !/^(call office|customer support|hiring team)$/i.test(businessName)) {
    return `Hello, thanks for calling ${businessName}. How can I help you today?`;
  }

  switch (kind) {
    case 'restaurant':
      return 'Thanks for calling. How can I help you today?';
    case 'store_hours':
      return 'Hello, thanks for calling the store. How can I help you today?';
    case 'customer_support':
      return 'Thank you for calling support. How can I help you today?';
    case 'job_followup':
      return 'Hello, this is the hiring team. How can I help you today?';
    case 'housing':
      return 'Property management office. How can I help you today?';
    default:
      return 'Hello, how can I help you today?';
  }
}

export function buildPracticeScenario(script: CallScript, perspective: CallPerspective = 'outgoing'): PracticeScenario {
  const kind = inferScenarioKind(script.description);
  const copy = scenarioCopy(kind);
  const scenarioId = slugify(script.description);
  const contactName = compact(script.name || copy.contactName);
  const reasonSummary = compact(script.description);
  const openingLine = perspective === 'incoming'
    ? 'Answer the phone naturally in your own words.'
    : `Open the call naturally about: ${reasonSummary}`;
  const possibleQuestions = perspective === 'incoming'
    ? ['The caller explains why they are calling.', 'You respond naturally and ask follow-up questions as needed.']
    : ['They may ask clarifying questions based on the reason for your call.', 'The conversation should evolve naturally from what you both say.'];
  const initialSuggestions = perspective === 'incoming'
    ? ['Hello?', 'Hi, this is me.', 'Hello, who is this?']
    : uniqueSuggestions(
        [`Hi, I'm calling about ${reasonSummary}.`],
        [`I'm calling because ${reasonSummary}.`],
        [`Hi, I had a question about ${reasonSummary}.`],
      );
  const steps: PracticeScenarioStep[] = [
    {
      id: 'live_call',
      label: 'Live call',
      prompt: 'Respond naturally to what the other person just said.',
      suggestions: initialSuggestions,
      expectedKeywords: extractKeywords(reasonSummary),
      successReply: '',
      retryReply: '',
    },
  ];

  return {
    scenarioId,
    title: copy.title,
    contactName,
    category: copy.category,
    difficulty: 'easy',
    perspective,
    estimatedDuration: '2 minutes',
    reasonSummary,
    openingLine,
    possibleQuestions,
    exitLine: compact(script.close),
    introLine: buildIntroLine(kind, script.description, contactName),
    steps,
  };
}

export function buildPracticeFeedback(turns: PracticeTurn[], completed: boolean): PracticeFeedback {
  const userTurns = turns.filter(turn => turn.role === 'user');
  const responseSamples = userTurns.map(turn => turn.responseMs).filter((value): value is number => typeof value === 'number');
  const averageResponseMs = responseSamples.length > 0
    ? Math.round(responseSamples.reduce((sum, value) => sum + value, 0) / responseSamples.length)
    : 0;
  const suggestionTurns = userTurns.filter(turn => turn.usedSuggestion).length;
  const ownWordsTurns = userTurns.length - suggestionTurns;

  let confidenceScore = 55;
  if (completed) confidenceScore += 18;
  if (averageResponseMs > 0) {
    confidenceScore += Math.max(0, 16 - Math.round(averageResponseMs / 900));
  }
  confidenceScore += Math.min(12, ownWordsTurns * 4);
  confidenceScore += Math.min(8, userTurns.length * 2);
  confidenceScore = Math.max(48, Math.min(96, confidenceScore));

  const strengths: string[] = [];
  const suggestions: string[] = [];

  if (completed) strengths.push('You finished the full simulated call.');
  if (averageResponseMs > 0 && averageResponseMs < 3500) strengths.push('Your responses stayed fairly steady.');
  if (ownWordsTurns > 0) strengths.push('You improvised instead of relying only on prompts.');
  if (strengths.length === 0) strengths.push('You showed up and practiced instead of avoiding the call.');

  if (!completed) suggestions.push('Stay with the call long enough to reach the closing next time.');
  if (averageResponseMs >= 4500) suggestions.push('Try answering a little faster after each question.');
  if (suggestionTurns === userTurns.length && userTurns.length > 1) suggestions.push('Use one prompt, then try the next answer in your own words.');
  if (suggestions.length === 0) suggestions.push('Ask one short follow-up question to sound even more natural.');

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
