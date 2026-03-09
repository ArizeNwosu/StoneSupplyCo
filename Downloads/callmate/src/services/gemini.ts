import OpenAI from "openai";
import { Tone, CallScript, Persona, CallPerspective } from "../types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
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

export async function generateCallScript(
  description: string,
  tone: Tone,
  perspective: CallPerspective,
  persona?: Persona,
  userProfile?: { name?: string; gender?: string; ageRange?: string }
): Promise<CallScript> {
  const personaContext = persona ? `\nPersona Context: "${persona.context}" (The person you are calling is ${persona.name})` : "";
  const profileContext = userProfile?.name
    ? `\nCaller Profile: The caller's name is "${userProfile.name}"${userProfile.gender ? `, gender: ${userProfile.gender}` : ''}${userProfile.ageRange ? `, age range: ${userProfile.ageRange}` : ''}. Use "${userProfile.name}" naturally in the script (e.g. "Hi, my name is ${userProfile.name}") instead of any generic placeholder like [Your Name].`
    : "";

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
Perspective: "${perspective === 'outgoing' ? 'The user is INITIATING the call.' : 'The user is RECEIVING the call.'}"${personaContext}${profileContext}

CRITICAL:
1. Incorporate specific details from the description (names, durations, specific asks).
2. The script must be structured for a live call — short, scannable lines.
3. "branchX" and "branchY" should cover the most likely pushbacks or follow-up questions.
4. Keep it concise, conversational, and human. No corporate language.
5. Use contractions (I'm, don't, won't) to sound like a real person.
6. If Perspective is 'incoming', the opening should be a natural way to answer and acknowledge the caller.
7. If a caller name is provided in the profile, use it naturally in the opening line.`
      }
    ]
  });

  const data = JSON.parse(response.choices[0].message.content || "{}");

  return {
    id: crypto.randomUUID(),
    description,
    tone,
    ...data,
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
        content: `You are an expert communication coach. Generate a natural, concise IF/THEN branch for a phone call script. The response must sound like a real person talking. Return JSON: { "condition": "short version of what they say (10 words max)", "response": "natural response to read aloud (1-3 sentences)" }`
      },
      {
        role: "user",
        content: `Call context: "${description}" (Tone: ${tone})
Scenario to handle: "${scenario}"
Generate one IF/THEN branch.`
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content || "{}");
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
