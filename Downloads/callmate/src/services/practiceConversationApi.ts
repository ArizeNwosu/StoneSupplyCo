import { apiJson } from './api';
import type { PracticeFeedback, PracticeScenario, PracticeTurn } from '../types';
import { buildPracticeFeedback } from './practiceSimulator';
import { API_ENDPOINTS } from '../constants/api';

type TurnRequest = {
  scenario: PracticeScenario;
  currentStepIndex: number;
  attemptCount: number;
  userTranscript?: string;
  conversationHistory: PracticeTurn[];
  autoContinue?: boolean;
};

type TurnResponse = {
  aiText: string;
  nextStepIndex: number;
  suggestions: string[];
  callComplete: boolean;
  progressed: boolean;
  responseDelayMs: number;
  autoContinueAfterMs?: number;
};

type EndSessionRequest = {
  turns: PracticeTurn[];
  completed: boolean;
};

const PRACTICE_API_URL = import.meta.env.VITE_PRACTICE_API_URL?.trim() || import.meta.env.VITE_API_URL?.trim();

async function endSessionLocally(request: EndSessionRequest): Promise<PracticeFeedback> {
  return buildPracticeFeedback(request.turns, request.completed);
}

async function postToPracticeApi<T>(path: string, body: unknown, timeoutMs = 30_000): Promise<T> {
  if (!PRACTICE_API_URL) {
    return apiJson<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }, timeoutMs);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${PRACTICE_API_URL.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Practice API request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function processPracticeResponse(request: TurnRequest): Promise<TurnResponse> {
  return postToPracticeApi<TurnResponse>(API_ENDPOINTS.practiceNextTurn, {
      scenarioId: request.scenario.scenarioId,
      currentStep: request.scenario.steps[request.currentStepIndex]?.id ?? null,
      currentStepIndex: request.currentStepIndex,
      attemptCount: request.attemptCount,
      userTranscript: request.userTranscript,
      conversationHistory: request.conversationHistory,
      scenario: request.scenario,
      autoContinue: request.autoContinue ?? false,
  });
}

export async function endPracticeSession(request: EndSessionRequest): Promise<PracticeFeedback> {
  if (!PRACTICE_API_URL) {
    return endSessionLocally(request);
  }

  return postToPracticeApi<PracticeFeedback>(API_ENDPOINTS.practiceEnd, request);
}
