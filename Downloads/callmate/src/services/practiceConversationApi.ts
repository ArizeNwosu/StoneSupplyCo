import { apiJson } from './api';
import type { PracticeFeedback, PracticeScenario, PracticeTurn } from '../types';
import { buildPracticeFeedback } from './practiceSimulator';

type TurnRequest = {
  scenario: PracticeScenario;
  currentStepIndex: number;
  attemptCount: number;
  userTranscript: string;
  conversationHistory: PracticeTurn[];
};

type TurnResponse = {
  aiText: string;
  nextStepIndex: number;
  suggestions: string[];
  callComplete: boolean;
  progressed: boolean;
  responseDelayMs: number;
};

type EndSessionRequest = {
  turns: PracticeTurn[];
  completed: boolean;
};

const PRACTICE_API_URL = import.meta.env.VITE_PRACTICE_API_URL?.trim() || import.meta.env.VITE_API_URL?.trim();

async function endSessionLocally(request: EndSessionRequest): Promise<PracticeFeedback> {
  return buildPracticeFeedback(request.turns, request.completed);
}

async function postToPracticeApi<T>(path: string, body: unknown): Promise<T> {
  if (!PRACTICE_API_URL) {
    return apiJson<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  const response = await fetch(`${PRACTICE_API_URL.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Practice API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function processPracticeResponse(request: TurnRequest): Promise<TurnResponse> {
  return postToPracticeApi<TurnResponse>('/api/practice-call/next-turn', {
      scenarioId: request.scenario.scenarioId,
      currentStep: request.scenario.steps[request.currentStepIndex]?.id ?? null,
      currentStepIndex: request.currentStepIndex,
      attemptCount: request.attemptCount,
      userTranscript: request.userTranscript,
      conversationHistory: request.conversationHistory,
      scenario: request.scenario,
  });
}

export async function endPracticeSession(request: EndSessionRequest): Promise<PracticeFeedback> {
  if (!PRACTICE_API_URL) {
    return endSessionLocally(request);
  }

  return postToPracticeApi<PracticeFeedback>('/api/practice-call/end', request);
}
