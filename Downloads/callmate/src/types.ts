export type Tone = 'Professional' | 'Assertive' | 'Friendly' | 'Firm';

export type Tier = 'free' | 'trial' | 'monthly' | 'annual';

export type CallPerspective = 'outgoing' | 'incoming';

export interface ScriptSection {
  title: string;
  content: string;
  isBranch?: boolean;
}

export interface CallScript {
  id: string;
  description: string;
  tone: Tone;
  opening: string;
  mainAsk: string;
  branchX: { condition: string; response: string };
  branchY: { condition: string; response: string };
  extraBranches?: Array<{ condition: string; response: string }>;
  close: string;
  timestamp: number;
}

export interface Persona {
  id: string;
  name: string;
  context: string;
}

export interface Reflection {
  id: string;
  scriptId: string;
  feedback: string;
  timestamp: number;
}

export interface SafeLine {
  situation: string;
  line: string;
}

export const SAFE_LINES: SafeLine[] = [
  {
    situation: "I need a moment to collect myself",
    line: "Hi! Thanks for calling. Give me just one second to pull something up."
  },
  {
    situation: "I'm not ready and need to reschedule",
    line: "Hi, I'm actually in the middle of something — can I call you back in about 10 minutes? I want to give you my full attention."
  },
  {
    situation: "I don't recognize the number / need context",
    line: "Hi, thanks for calling. Can I ask who I'm speaking with and what this is regarding?"
  },
  {
    situation: "The call is going badly and I need to exit",
    line: "I want to make sure I handle this properly — let me pull up the relevant information and call you right back within the hour."
  }
];

export interface PanicOption {
  category: 'Pushback' | 'Transfer' | 'Question' | 'Exit';
  label: string;
  description: string;
}

export const COMMON_CALL_TYPES = [
  "Doctor / Medical Office",
  "Landlord / Property Management",
  "Customer Service / Complaints",
  "Calling a business to ask a question",
  "Insurance Company",
  "Making a reservation",
  "Calling in sick to work",
  "Calling back a missed number",
  "Breaking up or confrontation",
  "Calling a contractor",
  "Job Interview Follow-up",
  "Bank / Financial Issue",
  "Utility Company",
  "Tech Support",
  "RSVP for an event"
];

export const PANIC_OPTIONS: PanicOption[] = [
  { category: 'Pushback', label: 'They said no / pushed back', description: 'Calm, firm response that doesn\'t concede but doesn\'t escalate.' },
  { category: 'Pushback', label: 'They got defensive or upset', description: 'De-escalating language that acknowledges their reaction without backing down.' },
  { category: 'Pushback', label: 'They said "that\'s not my problem"', description: 'Redirects responsibility clearly and professionally.' },
  { category: 'Transfer', label: 'They\'re transferring me', description: 'Re-opening line for the new person to re-establish context.' },
  { category: 'Transfer', label: 'They put me on hold', description: 'Short script for when they come back to recap the situation.' },
  { category: 'Question', label: 'They asked something I can\'t answer', description: 'Graceful "I\'ll find out and get back to you" that sets expectations.' },
  { category: 'Question', label: 'They asked for info I don\'t have', description: 'Buys time professionally — "Let me pull that up".' },
  { category: 'Question', label: 'They asked why it took so long', description: 'Non-defensive, natural explanation without over-apologizing.' },
  { category: 'Exit', label: 'I want to end the call — it went well', description: 'Warm, clear close that confirms next steps.' },
  { category: 'Exit', label: 'I want to end the call — it\'s unresolved', description: 'Professional close that leaves the situation open.' },
  { category: 'Exit', label: 'I want to end the call — it went badly', description: 'Neutral, controlled exit that doesn\'t burn the relationship.' },
  { category: 'Exit', label: 'They won\'t stop talking', description: 'Polite but firm interruption script to close the call.' },
];
