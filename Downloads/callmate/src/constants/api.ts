/**
 * Centralized API endpoint paths.
 * Import from here instead of hardcoding strings across service files.
 */
export const API_ENDPOINTS = {
  script: '/api/ai/script',
  panic: '/api/ai/panic',
  voicemail: '/api/ai/voicemail',
  emailFallback: '/api/ai/email-fallback',
  branch: '/api/ai/branch',
  tts: '/api/ai/tts',
  practiceNextTurn: '/api/practice-call/next-turn',
  practiceEnd: '/api/practice-call/end',
  liveAssistSession: '/api/live-assist/session',
  liveAssistRespond: '/api/live-assist/respond',
  liveAssistAction: '/api/live-assist/action',
  liveAssistEnd: '/api/live-assist/end',
} as const;
