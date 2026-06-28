# Post Lock V1 — Design Spec

**Date:** 2026-06-28  
**Status:** Approved for implementation

---

## What We're Building

Post Lock is an iOS app (React Native + Expo) that gates social media consumption behind content creation. Before any gated app opens, the user must record a short video that passes multi-layer AI validation. The core mechanic: you don't get to scroll until you record.

---

## Critical Constraints (Non-Negotiable)

1. **CameraGate.tsx is built first.** It is the entire product. Everything else is scaffolding around it.

2. **Screen Time API works WITH Apple, not against it.** Apple forces an "Ignore Limit" button — this cannot be removed and Post Lock does not try to remove it. The flow is: user tries to open Instagram → Apple shows the standard Time Limit screen → user taps "Open App Anyway" → iOS redirects to Post Lock → user records → Instagram opens. Post Lock is the redirect target, not a hard blocker. The quality of the prompt shown at the gate is what keeps users from tapping ignore — that IS the product.

3. **All AI calls are server-side only.** Claude API and Whisper API keys live exclusively in Supabase Edge Functions. No API keys in client code. No exceptions.

4. **Face biometric data stays on-device.** Only a hash is stored server-side. No biometric data transmitted.

---

## Environment

| Variable | Value |
|---|---|
| Project root | `/Users/riz/Documents/Claude/PostLock/postlock/` |
| Supabase URL | `https://ohrclkyftqamtxgztxzu.supabase.co` |
| Supabase anon key | `sb_publishable_mJsosFK2_sXx0cFd_c-6zw_t7YYR1-F` |
| Supabase CLI | Not confirmed installed — plan includes setup |
| ANTHROPIC_API_KEY | Server-side only (Edge Function env var) |
| OPENAI_API_KEY | Server-side only (Edge Function env var, Whisper) |

---

## Tech Stack

- **Frontend:** React Native + Expo (TypeScript), Expo Router for navigation
- **Camera/Detection:** expo-camera, expo-face-detector, expo-av (audio metering), expo-sensors (gyroscope/accelerometer)
- **Backend:** Supabase (auth, Postgres, storage, edge functions)
- **AI:** Claude API claude-sonnet-4-6 (validation, coaching, prompts, interview) via Edge Functions
- **Transcription:** OpenAI Whisper API via Edge Functions
- **Screen Time:** expo-screen-time or react-native-screen-time (FamilyControls API wrapper)

---

## Architecture

### The Gate Flow (most important)
```
User opens Instagram
  → Apple Screen Time intercept: "Time Limit Reached" + "Open App Anyway" button
  → User taps "Open App Anyway"  
  → iOS deep links to Post Lock (Post Lock is registered as the redirect target)
  → CameraGate.tsx renders full-screen
  → Detection pipeline runs during recording (face, speech, orientation, liveness)
  → Recording stops (min 15s, must pass all detectors)
  → Audio uploaded to Edge Function → Whisper transcription → Claude validation
  → Pass: coaching note shown → Instagram opens
  → Fail: reason shown → retry (second fail = 10 min cooldown)
  → Recording saved to library regardless of validation result
```

### AI Router Pattern
All AI calls go through `lib/ai/router.ts` → Supabase Edge Functions → Claude/Whisper. Components never call Claude or Whisper directly.

```
Component → AIRouter (client) → Edge Function (server) → Claude/Whisper API
```

Three Edge Functions:
- `validate-recording` — Whisper transcription + Claude content validation + coaching note
- `generate-prompts` — Claude prompt generation from user profile
- `run-interview` — Claude adaptive discovery interview (Track A)

### Detection Pipeline
Five independent detector modules, all running concurrently during recording:
1. **FaceDetector** — expo-face-detector, continuous check every 500ms, pause+warn if face absent >3s
2. **SpeechDetector** — expo-av audio metering + frequency analysis, requires ≥10s detected speech in 15s floor
3. **MotionDetector** — expo-sensors gyroscope + accelerometer, flags if phone not roughly vertical
4. **LivenessDetector** — V1: face landmark movement variance as proxy for liveness (full SDK in V1.1)
5. **AI Validator** — post-recording, server-side: Whisper transcript → Claude pass/fail

### Gate Modes
- **Mode 1 (Daily Quota):** X recordings/day unlocks all gated apps for 24h. Default: 1/day.
- **Mode 2 (Per Launch):** Every launch requires a recording. Daily cap N before gate resets. Default: 3.
- **Mode 3 (Session Timer):** Add-on to Mode 1 or 2. After unlock, user gets X minutes before gate closes again. Default: 25 min.

---

## Database Schema (Supabase Postgres)

```sql
profiles         -- extends auth.users, stores gate config + creator profile
recordings       -- every passed recording, with transcript + coaching note
prompts          -- user's personalized prompt library
gate_sessions    -- analytics: gate triggered, outcome (completed/ignored/failed/abandoned)
daily_progress   -- recordings_completed, quota_met per user per date
```

Full schema defined in `postlock-claude-code-prompt.md`.

---

## Onboarding Tracks

**Track B (Directed Creator):** Knows their niche → 3 questions → Claude generates 10 prompts → gate setup.  
**Track A (Discovery Creator):** Doesn't know niche → adaptive Atlas interview → mini creator blueprint + 10 prompts → gate setup.

If Atlas account exists: skip interview, pull existing Creator Blueprint.

---

## Build Order (Phase-Gated)

### Phase 1 — Foundation
1. Expo project scaffold with TypeScript
2. Supabase CLI setup + schema migration
3. Auth (email + Apple Sign In)
4. Expo Router navigation structure

### Phase 2 — Onboarding
5. Welcome screen
6. Track selector (YES/NO fork)
7. Track B: 3-question flow + Claude prompt generation (via Edge Function)
8. Track A: adaptive interview with Claude (via Edge Function)
9. App selection screen
10. Mode selection screen
11. Face enrollment screen (on-device only)

### Phase 3 — The Gate (Core Product)
12. **CameraGate.tsx — basic camera + record button** ← start here
13. Face detection integration
14. Speech detection integration
15. Motion/orientation detection
16. Liveness detection (simplified V1)
17. Post-recording Whisper transcription (via Edge Function)
18. Claude content validation (via Edge Function)
19. Pass/fail UI + coaching note display
20. Gate controller (Mode 1 first)
21. Mode 2 + Mode 3 logic
22. Screen Time API integration (FamilyControls entitlement required)

### Phase 4 — Library + Progress
23. Recording library screen
24. Transcript view
25. Progress / streak screen
26. Settings screen

### Phase 5 — Polish
27. Onboarding animations
28. Gate pass unlock animation
29. Push notifications (daily reminder if quota not met)
30. App Store submission prep

---

## Key Component Interfaces

### CameraGate.tsx
```typescript
interface CameraGateProps {
  prompt: string;
  onValidationPass: (recordingId: string) => void;
  onIgnore: () => void; // User tapped Apple's "Ignore Limit" — track this
}

type GateState = 'idle' | 'recording' | 'processing' | 'pass' | 'fail' | 'retry_wait'

interface DetectionState {
  faceDetected: boolean;
  speechDetected: boolean;
  orientationOk: boolean;
  livenessConfidence: number; // 0-1
  elapsedSeconds: number;
}
```

UI: full screen camera, prompt overlay at top, detection indicators at bottom, large record button center-bottom, timer only appears after recording starts.

---

## Definition of Done — V1

- [ ] Onboarding complete via Track A or Track B
- [ ] App selection + gate mode configuration
- [ ] Gate triggers when Post Lock opens as Screen Time redirect target
- [ ] Recording requires minimum 15s with face + speech detected
- [ ] AI validation (server-side) passes/fails correctly
- [ ] Coaching note shown after each recording
- [ ] Gated app accessible after pass
- [ ] Recordings saved with transcripts in library
- [ ] Streaks and daily progress tracked
- [ ] Mode 1, 2, and 3 working correctly
- [ ] All API keys server-side only
- [ ] Face enrollment on-device only
- [ ] TestFlight build submitted
