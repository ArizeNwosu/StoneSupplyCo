import type { Tone, CallScript, Persona, CallPerspective } from '../types';
import { apiJson, getApiBaseUrl } from './api';
import { API_ENDPOINTS } from '../constants/api';

type UserProfileContext = {
  name?: string;
  gender?: string;
  ageRange?: string;
  anxietySeverity?: string;
  anxietyTriggers?: string[];
  lifeImpact?: string[];
};

type GeneratedScriptPayload = Omit<CallScript, 'id' | 'timestamp'> & {
  id?: string;
  timestamp?: number;
};

function resolveUserName(name?: string | null) {
  const candidate = name?.trim() || localStorage.getItem('callmate_user_name')?.trim() || '';
  return candidate || null;
}

const DESCRIPTION_MAX_LENGTH = 500;

export async function generateCallScript(
  description: string,
  tone: Tone,
  perspective: CallPerspective,
  persona?: Persona,
  userProfile?: UserProfileContext,
): Promise<CallScript> {
  const sanitized = description.trim().slice(0, DESCRIPTION_MAX_LENGTH);
  if (!sanitized) throw new Error('Please describe your call before generating a script.');

  const payload = await apiJson<GeneratedScriptPayload>(API_ENDPOINTS.script, {
    method: 'POST',
    body: JSON.stringify({
      description: sanitized,
      tone,
      perspective,
      persona: persona || null,
      userProfile: {
        ...userProfile,
        name: resolveUserName(userProfile?.name) || undefined,
      },
    }),
  });

  return {
    ...payload,
    id: payload.id || crypto.randomUUID(),
    timestamp: payload.timestamp || Date.now(),
  };
}

export async function generatePanicResponse(originalScript: CallScript, situation: string): Promise<string> {
  const payload = await apiJson<{ text: string }>(API_ENDPOINTS.panic, {
    method: 'POST',
    body: JSON.stringify({ originalScript, situation }),
  });

  return payload.text;
}

export async function generateVoicemailScript(originalScript: CallScript): Promise<string> {
  const payload = await apiJson<{ text: string }>(API_ENDPOINTS.voicemail, {
    method: 'POST',
    body: JSON.stringify({ originalScript }),
  });

  return payload.text;
}

export async function generateEmailFallback(originalScript: CallScript): Promise<string> {
  const payload = await apiJson<{ text: string }>(API_ENDPOINTS.emailFallback, {
    method: 'POST',
    body: JSON.stringify({ originalScript }),
  });

  return payload.text;
}

export async function generateBranch(
  description: string,
  scenario: string,
  tone: Tone,
): Promise<{ condition: string; response: string }> {
  return apiJson<{ condition: string; response: string }>(API_ENDPOINTS.branch, {
    method: 'POST',
    body: JSON.stringify({
      description,
      scenario,
      tone,
    }),
  });
}

export async function generateTTS(
  text: string,
  options?: { voice?: string; instructions?: string },
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(getApiBaseUrl(API_ENDPOINTS.tts), {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: options?.voice || 'nova',
        instructions: options?.instructions || 'Speak naturally, like a calm and professional phone call.',
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `TTS request failed with status ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('TTS request timed out.');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
