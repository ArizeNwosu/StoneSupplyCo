import OpenAI from "openai";
import { Tone, CallScript, Persona, CallPerspective } from "../types";

declare const __OPENAI_API_KEY__: string;

const openai = new OpenAI({
  apiKey: __OPENAI_API_KEY__ || "",
  dangerouslyAllowBrowser: true
});

const SCRIPT_SYSTEM_PROMPT = `You are an expert communication coach specializing in helping people with phone call anxiety. You write scripts that sound like a real, relatable human being — not a robot or a formal business letter. Your scripts are assertive but use natural, everyday language and contractions.

Always respond with valid JSON matching exactly this structure:
{
  "opening": "string",
  "mainAsk": "string",
  "branchX": { "condition": "string", "response": "string" },
  "branchY": { "condition": "string", "response": "string" },
  "close": "string"
}`;

function parseJsonObject(content: string | null | undefined) {
  if (!content) return {};
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Model returned invalid JSON.');
  }
}

export async function generateCallScript(
  description: string,
  tone: Tone,
  perspective: CallPerspective,
  persona?: Persona,
  userProfile?: {
    name?: string;
    gender?: string;
    ageRange?: string;
    anxietySeverity?: string;
    anxietyTriggers?: string[];
    lifeImpact?: string[];
  }
): Promise<CallScript> {
  if (!__OPENAI_API_KEY__) {
    throw new Error('OpenAI API key is missing.');
  }

  const personaContext = persona ? `\nPersona Context: "${persona.context}" (The person you are calling is ${persona.name})` : "";
  const profileContext = userProfile?.name
    ? `\nCaller Profile: The caller's name is "${userProfile.name}"${userProfile.gender ? `, gender: ${userProfile.gender}` : ''}${userProfile.ageRange ? `, age range: ${userProfile.ageRange}` : ''}. Use "${userProfile.name}" naturally in the script (e.g. "Hi, my name is ${userProfile.name}") instead of any generic placeholder like [Your Name].`
    : "";

  const severityInstructions: Record<string, string> = {
    mild: 'The user has MILD phone anxiety. Write a natural, confident script with normal sentence length.',
    moderate: 'The user has MODERATE phone anxiety. Use shorter sentences. Add a "(pause)" note at 1-2 natural transition points to let them breathe.',
    severe: 'The user has SEVERE phone anxiety. Keep EVERY line very short (max 8 words). Add explicit "(breathe)" cues before key moments. branchY must be a graceful exit: something they can say if they freeze or need to end the call.',
    debilitating: 'The user has DEBILITATING phone anxiety. Lines must be 5 words or fewer — no exceptions. Start the opening with a grounding note in parentheses (e.g. "(feet on floor, breathe out)"). branchX and branchY must both be safety exits the user can use to end the call without embarrassment.',
  };

  let anxietyContext = '';
  if (userProfile?.anxietySeverity && severityInstructions[userProfile.anxietySeverity]) {
    anxietyContext += `\nAnxiety Context: ${severityInstructions[userProfile.anxietySeverity]}`;
  }
  if (userProfile?.anxietyTriggers?.length) {
    anxietyContext += `\nUser's specific fears: ${userProfile.anxietyTriggers.join('; ')}. Where possible, write branches that directly address these scenarios and include calming, reassuring language around them.`;
  }
  if (userProfile?.lifeImpact?.length) {
    anxietyContext += `\nThis call matters most for: ${userProfile.lifeImpact.join(', ')}. Keep that stakes context in mind when writing the main ask.`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SCRIPT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Generate a 5-section branching phone call script for the following situation:
Situation: "${description}"
Tone: "${tone}"
Perspective: "${perspective === 'outgoing' ? 'The user is INITIATING the call.' : 'The user is RECEIVING the call.'}"${personaContext}${profileContext}${anxietyContext}

CRITICAL:
1. Incorporate specific details from the description (names, durations, specific asks).
2. The script must be structured for a live call — short, scannable lines.
3. "branchX" and "branchY" should cover the most likely pushbacks or follow-up questions (shaped by the user's specific fears if provided).
4. Keep it concise, conversational, and human. No corporate language.
5. Use contractions (I'm, don't, won't) to sound like a real person.
6. If Perspective is 'incoming', the opening should be a natural way to answer and acknowledge the caller.
7. If a caller name is provided in the profile, use it naturally in the opening line.
8. If anxiety context is provided, it OVERRIDES default script length and structure — follow it strictly.`
      }
    ]
  });

  const data = parseJsonObject(response.choices[0].message.content);

  const opening = typeof data.opening === 'string' ? data.opening.trim() : '';
  const mainAsk = typeof data.mainAsk === 'string' ? data.mainAsk.trim() : '';
  const close = typeof data.close === 'string' ? data.close.trim() : '';
  const branchX = data.branchX && typeof data.branchX === 'object' ? data.branchX : {};
  const branchY = data.branchY && typeof data.branchY === 'object' ? data.branchY : {};

  if (!opening || !mainAsk || !close) {
    throw new Error('Generated script was incomplete.');
  }

  return {
    id: crypto.randomUUID(),
    description,
    tone,
    opening,
    mainAsk,
    close,
    branchX: {
      condition: typeof branchX.condition === 'string' && branchX.condition.trim() ? branchX.condition.trim() : 'If they push back',
      response: typeof branchX.response === 'string' && branchX.response.trim() ? branchX.response.trim() : 'I understand. Let me explain what I need.'
    },
    branchY: {
      condition: typeof branchY.condition === 'string' && branchY.condition.trim() ? branchY.condition.trim() : 'If you need to pause',
      response: typeof branchY.response === 'string' && branchY.response.trim() ? branchY.response.trim() : 'Let me take a moment and come back to that.'
    },
    timestamp: Date.now()
  };
}

export async function generatePanicResponse(originalScript: CallScript, situation: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a real-time call coach writing words for the USER to speak out loud. You are NOT writing what the other person says — you are writing the USER'S reply in the first person (e.g. 'I understand...', 'That's fair, but...', 'Actually, what I need is...'). One to three short sentences max. Natural, calm, conversational. Return only the spoken line — no quotes, no labels, no explanation."
      },
      {
        role: "user",
        content: `The user is on a phone call. Here is their script context:
Opening: ${originalScript.opening}
Main Ask: ${originalScript.mainAsk}

Situation they need to handle: "${situation}"

Write the exact words the USER should say out loud right now — in the first person, as if you are giving them their next line to speak. Do NOT write what the other person would say.`
      }
    ]
  });

  return (response.choices[0].message.content || "").trim();
}

export async function generateVoicemailScript(originalScript: CallScript): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert communication coach. Write a natural, human-sounding voicemail script that avoids corporate jargon. Return only the voicemail text — no labels, no explanation."
      },
      {
        role: "user",
        content: `Based on this call script:
Opening: ${originalScript.opening}
Main Ask: ${originalScript.mainAsk}

Generate a concise, warm voicemail script in case the person doesn't answer. Sound like a real person leaving a message.`
      }
    ]
  });

  return (response.choices[0].message.content || "").trim();
}

export async function generateEmailFallback(originalScript: CallScript): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert communication coach. Write a natural, clear follow-up email that sounds like it was written by a person, not a template. Return only the email text — no labels, no explanation."
      },
      {
        role: "user",
        content: `Based on this call script:
Opening: ${originalScript.opening}
Main Ask: ${originalScript.mainAsk}

Generate a natural follow-up email in case the call fails or is unresolved. Professional but conversational.`
      }
    ]
  });

  return (response.choices[0].message.content || "").trim();
}

export async function generateBranch(description: string, scenario: string, tone: Tone): Promise<{ condition: string; response: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert communication coach writing a phone call script for the USER to speak. Generate a natural, concise IF/THEN branch. CRITICAL: "condition" is a short summary of what the OTHER PERSON says. "response" is the exact words the USER speaks in reply — written in the first person (e.g. "I understand...", "That's fair, but...", "What I need is..."). The response must sound like a real human talking out loud. Return JSON: { "condition": "short version of what the other person says (10 words max)", "response": "what the USER says out loud in reply (1-3 sentences, first person)" }`
      },
      {
        role: "user",
        content: `Call context: "${description}" (Tone: ${tone})
Scenario to handle: "${scenario}"
Generate one IF/THEN branch where the response is what the USER says out loud.`
      }
    ]
  });

  const data = parseJsonObject(response.choices[0].message.content);
  return {
    condition: typeof data.condition === 'string' && data.condition.trim() ? data.condition.trim() : 'If they ask a follow-up',
    response: typeof data.response === 'string' && data.response.trim() ? data.response.trim() : 'That makes sense. Here is what I need.'
  };
}

export async function generateTTS(text: string): Promise<string> {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: text
  });

  const arrayBuffer = await mp3.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
  return URL.createObjectURL(blob);
}
