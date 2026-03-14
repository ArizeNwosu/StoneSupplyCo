import { Tone, CallScript, Persona, CallPerspective } from "../types";

type UserProfileContext = {
  name?: string;
  gender?: string;
  ageRange?: string;
  anxietySeverity?: string;
  anxietyTriggers?: string[];
  lifeImpact?: string[];
};

function resolveUserName(name?: string | null) {
  const candidate = name?.trim() || localStorage.getItem('callmate_user_name')?.trim() || '';
  return candidate || null;
}

function buildPersonaPrefix(persona?: Persona) {
  return persona ? ` speaking as ${persona.name}` : '';
}

function buildPerspectiveLine(perspective: CallPerspective, name?: string) {
  return perspective === 'incoming'
    ? 'Thanks for calling. Give me a second to get oriented.'
    : `Hi, this is ${resolveUserName(name) || 'there'}. Do you have a minute?`;
}

function buildToneLine(tone: Tone) {
  switch (tone) {
    case 'Assertive':
      return 'I wanted to call directly so I could be clear about what I need.';
    case 'Friendly':
      return 'I wanted to reach out and talk this through with you.';
    case 'Firm':
      return 'I’m calling because I need to resolve this today.';
    default:
      return 'I’m calling to handle this clearly and directly.';
  }
}

export async function generateCallScript(
  description: string,
  tone: Tone,
  perspective: CallPerspective,
  persona?: Persona,
  userProfile?: UserProfileContext
): Promise<CallScript> {
  const resolvedName = resolveUserName(userProfile?.name) || undefined;
  const opening = `${buildPerspectiveLine(perspective, resolvedName)}${buildPersonaPrefix(persona)}`;
  const mainAsk = `${buildToneLine(tone)} ${description.trim()}`.trim();

  return {
    id: crypto.randomUUID(),
    description,
    tone,
    name: resolvedName,
    opening,
    mainAsk,
    branchX: {
      condition: 'If they push back',
      response: 'I understand. Let me explain what I’m asking for and why it matters.',
    },
    branchY: {
      condition: 'If I need a moment',
      response: 'Give me one second to gather my thoughts, then I can answer that clearly.',
    },
    close: 'Thanks for talking this through with me. I appreciate your help.',
    timestamp: Date.now(),
  };
}

export async function generatePanicResponse(_originalScript: CallScript, situation: string): Promise<string> {
  return `I hear that. Let me slow down for a second and respond clearly to ${situation}.`;
}

export async function generateVoicemailScript(originalScript: CallScript): Promise<string> {
  return `${originalScript.opening} I'm calling about ${originalScript.description}. Please call me back when you have a moment. Thank you.`;
}

export async function generateEmailFallback(originalScript: CallScript): Promise<string> {
  return `Hi,\n\nI’m following up about ${originalScript.description}.\n\n${originalScript.mainAsk}\n\nThank you,\n${resolveUserName(originalScript.name) || 'Callmate User'}`;
}

export async function generateBranch(
  description: string,
  scenario: string,
  _tone: Tone
): Promise<{ condition: string; response: string }> {
  return {
    condition: scenario,
    response: `I understand. I’m calling about ${description}, and I’d like to keep moving this forward.`,
  };
}

export async function generateTTS(_text: string): Promise<string> {
  throw new Error('Text-to-speech is unavailable in this build state.');
}
