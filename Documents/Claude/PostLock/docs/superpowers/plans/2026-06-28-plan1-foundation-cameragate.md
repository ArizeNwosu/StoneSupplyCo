# Post Lock Plan 1: Foundation + CameraGate + Edge Functions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working Expo app where the camera gate records, runs real AI validation server-side, shows a coaching note on pass, and saves the recording to Supabase. Everything the product IS is in this plan.

**Architecture:** React Native + Expo (TypeScript) with Expo Router. All AI calls (Claude + Whisper) go through Supabase Edge Functions — never directly from the client. Detection pipeline (face, speech, motion, liveness) runs on-device during recording. Gate state machine drives the UI.

**Tech Stack:** Expo SDK 51, expo-camera, expo-face-detector, expo-av, expo-sensors, @supabase/supabase-js v2, Supabase Edge Functions (Deno runtime), Claude claude-sonnet-4-6, OpenAI Whisper.

**Supabase project ref:** `ohrclkyftqamtxgztxzu`
**Supabase URL:** `https://ohrclkyftqamtxgztxzu.supabase.co`

---

## File Map

```
postlock/
├── .env.local                              # env vars (never committed)
├── app.json                                # Expo config with bundle ID + permissions
├── app/
│   ├── _layout.tsx                         # Root layout, auth guard
│   ├── index.tsx                           # Auth redirect entry point
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── sign-in.tsx                     # Email sign-in screen
│   └── gate/
│       └── record.tsx                      # Gate screen (uses CameraGate)
├── components/gate/
│   ├── CameraGate.tsx                      # Core gate — the entire product
│   ├── DetectionStatus.tsx                 # Real-time face/speech/orientation icons
│   ├── PromptCard.tsx                      # Prompt overlay at top of camera
│   └── ValidationLoader.tsx               # "Atlas is reviewing" animation
├── lib/
│   ├── supabase/client.ts                  # Supabase client singleton
│   ├── ai/router.ts                        # All AI calls go through here
│   ├── detection/
│   │   ├── faceDetector.ts
│   │   ├── speechDetector.ts
│   │   ├── motionDetector.ts
│   │   └── livenessDetector.ts
├── hooks/
│   ├── useDetection.ts                     # Aggregates all 4 detectors
│   └── useRecording.ts                     # Recording session state
├── types/index.ts                          # All shared TypeScript types
└── supabase/
    ├── migrations/001_initial_schema.sql
    └── functions/
        ├── validate-recording/index.ts     # Whisper + Claude validation
        └── generate-prompts/index.ts       # Claude prompt generation
```

---

## Task 1: Expo scaffold + install dependencies

**Files:**
- Create: `postlock/` (Expo project root)
- Modify: `app.json`
- Create: `.env.local`
- Create: `.gitignore`

- [ ] **Step 1: Install Supabase CLI if not present**

```bash
brew install supabase/tap/supabase
supabase --version
```
Expected: prints version like `1.x.x`

- [ ] **Step 2: Scaffold Expo project**

```bash
cd /Users/riz/Documents/Claude/PostLock
npx create-expo-app postlock --template expo-template-blank-typescript
cd postlock
```

- [ ] **Step 3: Install all dependencies**

```bash
npx expo install expo-router expo-camera expo-face-detector expo-av expo-sensors expo-file-system
npm install @supabase/supabase-js
npx expo install @react-native-async-storage/async-storage
```

- [ ] **Step 4: Update app.json**

Replace contents of `app.json` with:

```json
{
  "expo": {
    "name": "Post Lock",
    "slug": "postlock",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "postlock",
    "userInterfaceStyle": "dark",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.postlock.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Post Lock needs your camera to record your content before unlocking social apps.",
        "NSMicrophoneUsageDescription": "Post Lock needs your microphone to detect speech in your recording."
      }
    },
    "plugins": [
      "expo-router",
      "expo-camera",
      [
        "expo-face-detector",
        {}
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 5: Create .env.local**

```bash
cat > .env.local << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://ohrclkyftqamtxgztxzu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mJsosFK2_sXx0cFd_c-6zw_t7YYR1-F
EOF
```

- [ ] **Step 6: Add .env.local to .gitignore**

Append to `.gitignore`:
```
.env.local
.env*.local
```

- [ ] **Step 7: Commit**

```bash
git add app.json package.json .gitignore
git commit -m "feat: expo scaffold with dependencies"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Create types/index.ts**

```typescript
// types/index.ts

export type GateState =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'pass'
  | 'fail'
  | 'retry_wait'

export interface DetectionState {
  faceDetected: boolean
  speechDetected: boolean
  orientationOk: boolean
  livenessConfidence: number // 0-1
  elapsedSeconds: number
  speechDurationSeconds: number
}

export interface UserProfile {
  id: string
  contentAngle: string
  targetAudience: string
  creatorSummary: string
  gateMode1: boolean
  gateMode2: boolean
  gateMode3: boolean
  dailyQuota: number
  launchCap: number
  sessionMinutes: number
  gatedApps: string[]
}

export interface ValidationResult {
  passed: boolean
  reason: string
  topicDetected: string
}

export interface Recording {
  id: string
  userId: string
  createdAt: string
  durationSeconds: number
  storagePath: string
  transcript?: string
  promptUsed?: string
  validationPassed: boolean
  validationReason?: string
  coachingNote?: string
  status: 'raw' | 'developed' | 'published'
  tags?: string[]
}

export interface DailyProgress {
  id: string
  userId: string
  date: string
  recordingsCompleted: number
  gateTriggeredCount: number
  quotaMet: boolean
}

export interface FaceDetectionResult {
  detected: boolean
  confidence: number
}

export interface SpeechDetectionResult {
  speechDetected: boolean
  confidence: number
  dbLevel: number
}

export interface MotionDetectionResult {
  orientationOk: boolean
  angle: number
  isStationary: boolean
}

export interface LivenessResult {
  isLive: boolean
  confidence: number
}

export interface FaceSample {
  timestamp: number
  bounds: { x: number; y: number; width: number; height: number }
}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: shared TypeScript types"
```

---

## Task 3: Supabase client + schema migration

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Initialize Supabase CLI and link project**

```bash
supabase init
supabase link --project-ref ohrclkyftqamtxgztxzu
```

When prompted for password, enter your Supabase database password from the dashboard.

- [ ] **Step 2: Create migration file**

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users primary key,
  created_at timestamptz default now(),
  track text check (track in ('A', 'B')),
  creator_summary text,
  content_angle text,
  target_audience text,
  face_enrollment_hash text,
  gate_mode_1 boolean default true,
  gate_mode_2 boolean default false,
  gate_mode_3 boolean default false,
  daily_quota int default 1,
  launch_cap int default 3,
  session_minutes int default 25,
  gated_apps jsonb default '[]',
  atlas_connected boolean default false,
  atlas_user_id text
);

-- Recordings
create table if not exists recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  duration_seconds int not null,
  storage_path text not null,
  transcript text,
  prompt_used text,
  validation_passed boolean,
  validation_reason text,
  coaching_note text,
  status text default 'raw' check (status in ('raw', 'developed', 'published')),
  tags text[]
);

-- Prompts library
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  prompt_text text not null,
  content_pillar text,
  used_count int default 0,
  last_used_at timestamptz,
  source text check (source in ('onboarding', 'ai_generated', 'atlas'))
);

-- Gate sessions (analytics)
create table if not exists gate_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  app_attempted text,
  gate_mode text,
  recording_id uuid references recordings(id),
  outcome text check (outcome in ('completed', 'ignored', 'failed_validation', 'abandoned')),
  attempts int default 1
);

-- Daily progress
create table if not exists daily_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  recordings_completed int default 0,
  gate_triggered_count int default 0,
  quota_met boolean default false,
  unique(user_id, date)
);

-- RLS
alter table profiles enable row level security;
alter table recordings enable row level security;
alter table prompts enable row level security;
alter table gate_sessions enable row level security;
alter table daily_progress enable row level security;

create policy "users manage own profile"
  on profiles for all using (auth.uid() = id);

create policy "users manage own recordings"
  on recordings for all using (auth.uid() = user_id);

create policy "users manage own prompts"
  on prompts for all using (auth.uid() = user_id);

create policy "users manage own gate sessions"
  on gate_sessions for all using (auth.uid() = user_id);

create policy "users manage own daily progress"
  on daily_progress for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 3: Push migration to Supabase**

```bash
supabase db push
```

Expected: `Applying migration 001_initial_schema.sql... done`

- [ ] **Step 4: Create Supabase storage bucket for recordings**

In Supabase dashboard → Storage → New bucket:
- Name: `recordings`
- Public: NO (private)

- [ ] **Step 5: Create lib/supabase/client.ts**

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

- [ ] **Step 6: Commit**

```bash
git add supabase/ lib/supabase/ 
git commit -m "feat: supabase client + schema migration"
```

---

## Task 4: Edge Function — validate-recording

This is the server-side AI validation. API keys live here. Never in client code.

**Files:**
- Create: `supabase/functions/validate-recording/index.ts`

- [ ] **Step 1: Set Edge Function secrets in Supabase dashboard**

Go to Supabase dashboard → Settings → Edge Functions → Add secret:
- `ANTHROPIC_API_KEY` = your Anthropic API key
- `OPENAI_API_KEY` = your OpenAI API key

- [ ] **Step 2: Create the Edge Function**

```bash
mkdir -p supabase/functions/validate-recording
```

Create `supabase/functions/validate-recording/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioBase64, userProfile } = await req.json()

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!openaiKey || !anthropicKey) {
      throw new Error('Missing API keys in Edge Function environment')
    }

    // Step 1: Transcribe with Whisper
    const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
    const audioBlob = new Blob([audioBytes], { type: 'audio/m4a' })
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.m4a')
    formData.append('model', 'whisper-1')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}` },
      body: formData,
    })

    if (!whisperRes.ok) {
      throw new Error(`Whisper error: ${await whisperRes.text()}`)
    }

    const { text: transcript } = await whisperRes.json()

    // Step 2: Validate with Claude
    const validationPrompt = `You are validating whether a short video recording contains genuine content.

Creator profile:
- Content angle: ${userProfile?.contentAngle || 'general'}
- Target audience: ${userProfile?.targetAudience || 'general audience'}

Recording transcript:
"${transcript}"

Validate against these criteria:
1. Duration proxy — transcript must contain at least 30 words (indicates ~15 seconds of real speech)
2. Coherence — must contain at least one complete thought or statement
3. Not gaming — not counting, repeating words, gibberish, or filler designed to satisfy a timer
4. Human speech — sounds like a real person talking, not reading random words

Respond in JSON only, no markdown:
{
  "passed": true or false,
  "reason": "one sentence plain English explanation",
  "topic_detected": "brief description of what they talked about"
}`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        messages: [{ role: 'user', content: validationPrompt }],
      }),
    })

    if (!claudeRes.ok) {
      throw new Error(`Claude error: ${await claudeRes.text()}`)
    }

    const claudeData = await claudeRes.json()
    const validationText = claudeData.content[0].text
    const validation = JSON.parse(validationText)

    // Step 3: Coaching note if passed
    let coachingNote: string | null = null
    if (validation.passed) {
      const coachingPrompt = `You are a supportive content coach giving brief feedback after a 15-60 second recording.

Creator's content angle: ${userProfile?.contentAngle || 'general'}

Their recording transcript:
"${transcript}"

Give ONE specific observation. Forward looking. Never shame. Focus on what they did well OR one specific improvement for next time. Maximum 2 sentences.

Respond with just the coaching note text. No preamble.`

      const coachingRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 128,
          messages: [{ role: 'user', content: coachingPrompt }],
        }),
      })

      if (coachingRes.ok) {
        const coachingData = await coachingRes.json()
        coachingNote = coachingData.content[0].text
      }
    }

    return new Response(
      JSON.stringify({ transcript, validation, coachingNote }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('validate-recording error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 3: Deploy the Edge Function**

```bash
supabase functions deploy validate-recording
```

Expected: `Deployed Function validate-recording`

- [ ] **Step 4: Smoke test the Edge Function**

```bash
curl -X POST \
  'https://ohrclkyftqamtxgztxzu.supabase.co/functions/v1/validate-recording' \
  -H 'Authorization: Bearer sb_publishable_mJsosFK2_sXx0cFd_c-6zw_t7YYR1-F' \
  -H 'Content-Type: application/json' \
  -d '{"audioBase64": "AAAA", "userProfile": {"contentAngle": "AI tools"}}'
```

Expected: JSON response (may fail validation with a whisper error on fake audio — that's fine, confirms the function runs).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/
git commit -m "feat: validate-recording edge function (Whisper + Claude)"
```

---

## Task 5: Edge Function — generate-prompts

**Files:**
- Create: `supabase/functions/generate-prompts/index.ts`

- [ ] **Step 1: Create the function**

```bash
mkdir -p supabase/functions/generate-prompts
```

Create `supabase/functions/generate-prompts/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userProfile, count = 10 } = await req.json()
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) throw new Error('Missing ANTHROPIC_API_KEY')

    const prompt = `Generate ${count} specific content prompts for this creator.

Profile:
- Content angle: ${userProfile.contentAngle}
- Target audience: ${userProfile.targetAudience}
- Creator summary: ${userProfile.creatorSummary || ''}

Requirements for each prompt:
- Specific enough that they know exactly what to say
- Designed for a 15-60 second video
- Opens with an implied hook
- References their actual life/work where possible

Return a JSON array of strings only. No numbering, no explanation, no markdown.

Example good prompt: "Tell the story of the last time you did something yourself that would have cost a professional thousands of dollars."
Example bad prompt: "Share your thoughts on entrepreneurship."`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) throw new Error(`Claude error: ${await res.text()}`)

    const data = await res.json()
    const prompts = JSON.parse(data.content[0].text)

    return new Response(
      JSON.stringify({ prompts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2: Deploy**

```bash
supabase functions deploy generate-prompts
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/generate-prompts/
git commit -m "feat: generate-prompts edge function"
```

---

## Task 6: AI Router (client-side)

All AI calls from the app flow through this. Nothing in components calls Claude or Whisper directly.

**Files:**
- Create: `lib/ai/router.ts`

- [ ] **Step 1: Create lib/ai/router.ts**

```typescript
// lib/ai/router.ts
import { supabase } from '../supabase/client'
import type { UserProfile, ValidationResult } from '../../types'

export const AIRouter = {
  async validateRecording(
    audioBase64: string,
    userProfile: Pick<UserProfile, 'contentAngle' | 'targetAudience'>
  ): Promise<{
    transcript: string
    validation: ValidationResult
    coachingNote: string | null
  }> {
    const { data, error } = await supabase.functions.invoke('validate-recording', {
      body: { audioBase64, userProfile },
    })
    if (error) throw new Error(`Validation failed: ${error.message}`)
    if (data.error) throw new Error(`Validation error: ${data.error}`)
    return data
  },

  async generatePrompts(
    userProfile: Pick<UserProfile, 'contentAngle' | 'targetAudience' | 'creatorSummary'>,
    count: number
  ): Promise<string[]> {
    const { data, error } = await supabase.functions.invoke('generate-prompts', {
      body: { userProfile, count },
    })
    if (error) throw new Error(`Prompt generation failed: ${error.message}`)
    if (data.error) throw new Error(`Prompt error: ${data.error}`)
    return data.prompts
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/router.ts
git commit -m "feat: AI router (client → edge functions)"
```

---

## Task 7: Detection modules

**Files:**
- Create: `lib/detection/faceDetector.ts`
- Create: `lib/detection/speechDetector.ts`
- Create: `lib/detection/motionDetector.ts`
- Create: `lib/detection/livenessDetector.ts`

- [ ] **Step 1: Create faceDetector.ts**

```typescript
// lib/detection/faceDetector.ts
import {
  FaceDetectorMode,
  FaceDetectorLandmarks,
  FaceDetectorClassifications,
} from 'expo-face-detector'
import type { FaceDetectionResult, FaceSample } from '../../types'

export class FaceDetector {
  getDetectorConfig() {
    return {
      mode: FaceDetectorMode.fast,
      detectLandmarks: FaceDetectorLandmarks.none,
      runClassifications: FaceDetectorClassifications.none,
      minDetectionInterval: 500,
      tracking: true,
    }
  }

  processResult(faces: any[]): FaceDetectionResult {
    return {
      detected: faces.length > 0,
      confidence: faces.length > 0 ? 1.0 : 0,
    }
  }

  toSample(faces: any[]): FaceSample | null {
    if (faces.length === 0) return null
    return {
      timestamp: Date.now(),
      bounds: faces[0].bounds,
    }
  }
}

export const faceDetector = new FaceDetector()
```

- [ ] **Step 2: Create speechDetector.ts**

```typescript
// lib/detection/speechDetector.ts
import { Audio } from 'expo-av'
import type { SpeechDetectionResult } from '../../types'

// dB threshold above which we consider audio to be speech
const SPEECH_THRESHOLD_DB = -30
const NOISE_FLOOR_DB = -60
const POLL_INTERVAL_MS = 500

export class SpeechDetector {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private recording: Audio.Recording | null = null
  private speechSeconds = 0
  private lastCheckAt = 0

  async startDetection(
    recording: Audio.Recording,
    callback: (result: SpeechDetectionResult) => void
  ): Promise<void> {
    this.recording = recording
    this.speechSeconds = 0
    this.lastCheckAt = Date.now()

    this.intervalId = setInterval(async () => {
      if (!this.recording) return
      try {
        const status = await this.recording.getStatusAsync()
        if (!status.isRecording) return

        const db = (status as any).metering ?? NOISE_FLOOR_DB
        const speechDetected = db > SPEECH_THRESHOLD_DB
        const now = Date.now()
        const deltaSec = (now - this.lastCheckAt) / 1000
        this.lastCheckAt = now

        if (speechDetected) this.speechSeconds += deltaSec

        callback({
          speechDetected,
          confidence: speechDetected
            ? Math.min(1, (db - NOISE_FLOOR_DB) / Math.abs(NOISE_FLOOR_DB))
            : 0,
          dbLevel: db,
        })
      } catch {
        // recording may have stopped
      }
    }, POLL_INTERVAL_MS)
  }

  stopDetection(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.recording = null
  }

  getSpeechDuration(): number {
    return this.speechSeconds
  }

  reset(): void {
    this.speechSeconds = 0
    this.lastCheckAt = Date.now()
  }
}

export const speechDetector = new SpeechDetector()
```

- [ ] **Step 3: Create motionDetector.ts**

```typescript
// lib/detection/motionDetector.ts
import { Accelerometer } from 'expo-sensors'
import type { MotionDetectionResult } from '../../types'

// Phone is "upright" when y-axis magnitude > threshold (held vertically)
// Face-down: z > 0.7, Face-up: z < -0.7
const UPRIGHT_Y_THRESHOLD = 0.5
const FLAT_Z_THRESHOLD = 0.7

export class MotionDetector {
  private subscription: { remove: () => void } | null = null

  startDetection(callback: (result: MotionDetectionResult) => void): void {
    Accelerometer.setUpdateInterval(500)
    this.subscription = Accelerometer.addListener(({ x, y, z }) => {
      const isUpright = Math.abs(y) > UPRIGHT_Y_THRESHOLD
      const isFaceDown = z > FLAT_Z_THRESHOLD
      const isCeilingFacing = z < -FLAT_Z_THRESHOLD

      callback({
        orientationOk: isUpright && !isFaceDown && !isCeilingFacing,
        angle: Math.atan2(y, z) * (180 / Math.PI),
        isStationary: false,
      })
    })
  }

  stopDetection(): void {
    this.subscription?.remove()
    this.subscription = null
  }
}

export const motionDetector = new MotionDetector()
```

- [ ] **Step 4: Create livenessDetector.ts**

```typescript
// lib/detection/livenessDetector.ts
// V1: face bounds variance as liveness proxy. Full SDK (FaceTec) deferred to V1.1.
import type { LivenessResult, FaceSample } from '../../types'

const MAX_SAMPLES = 20 // ~10 seconds at 500ms intervals
const MIN_SAMPLES_FOR_ANALYSIS = 4
const LIVENESS_VARIANCE_THRESHOLD = 0.5
const MAX_VARIANCE_FOR_FULL_CONFIDENCE = 5

export class LivenessDetector {
  private samples: FaceSample[] = []

  addSample(sample: FaceSample): void {
    this.samples.push(sample)
    if (this.samples.length > MAX_SAMPLES) this.samples.shift()
  }

  analyze(): LivenessResult {
    if (this.samples.length < MIN_SAMPLES_FOR_ANALYSIS) {
      return { isLive: false, confidence: 0 }
    }

    const xValues = this.samples.map(s => s.bounds.x)
    const yValues = this.samples.map(s => s.bounds.y)
    const xVar = this.variance(xValues)
    const yVar = this.variance(yValues)
    const totalVariance = xVar + yVar

    return {
      isLive: totalVariance > LIVENESS_VARIANCE_THRESHOLD,
      confidence: Math.min(1, totalVariance / MAX_VARIANCE_FOR_FULL_CONFIDENCE),
    }
  }

  reset(): void {
    this.samples = []
  }

  private variance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  }
}

export const livenessDetector = new LivenessDetector()
```

- [ ] **Step 5: Commit**

```bash
git add lib/detection/
git commit -m "feat: detection modules (face, speech, motion, liveness)"
```

---

## Task 8: useDetection hook

**Files:**
- Create: `hooks/useDetection.ts`

- [ ] **Step 1: Create hooks/useDetection.ts**

```typescript
// hooks/useDetection.ts
import { useState, useCallback, useRef } from 'react'
import { Audio } from 'expo-av'
import { faceDetector } from '../lib/detection/faceDetector'
import { speechDetector } from '../lib/detection/speechDetector'
import { motionDetector } from '../lib/detection/motionDetector'
import { livenessDetector } from '../lib/detection/livenessDetector'
import type { DetectionState } from '../types'

const FACE_ABSENT_WARN_MS = 3000

const initialState: DetectionState = {
  faceDetected: false,
  speechDetected: false,
  orientationOk: true,
  livenessConfidence: 0,
  elapsedSeconds: 0,
  speechDurationSeconds: 0,
}

export function useDetection() {
  const [state, setState] = useState<DetectionState>(initialState)
  const faceAbsentTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Called by Camera's onFacesDetected prop
  const handleFacesDetected = useCallback(({ faces }: { faces: any[] }) => {
    const result = faceDetector.processResult(faces)
    const sample = faceDetector.toSample(faces)
    if (sample) livenessDetector.addSample(sample)
    const liveness = livenessDetector.analyze()

    if (!result.detected) {
      if (!faceAbsentTimer.current) {
        faceAbsentTimer.current = setTimeout(() => {
          setState(prev => ({ ...prev, faceDetected: false }))
        }, FACE_ABSENT_WARN_MS)
      }
    } else {
      if (faceAbsentTimer.current) {
        clearTimeout(faceAbsentTimer.current)
        faceAbsentTimer.current = null
      }
      setState(prev => ({
        ...prev,
        faceDetected: true,
        livenessConfidence: liveness.confidence,
      }))
    }
  }, [])

  const startDetection = useCallback(async (recording: Audio.Recording) => {
    livenessDetector.reset()
    speechDetector.reset()

    await speechDetector.startDetection(recording, (speechResult) => {
      setState(prev => ({
        ...prev,
        speechDetected: speechResult.speechDetected,
        speechDurationSeconds: speechDetector.getSpeechDuration(),
      }))
    })

    motionDetector.startDetection((motionResult) => {
      setState(prev => ({ ...prev, orientationOk: motionResult.orientationOk }))
    })
  }, [])

  const stopDetection = useCallback(() => {
    speechDetector.stopDetection()
    motionDetector.stopDetection()
    if (faceAbsentTimer.current) {
      clearTimeout(faceAbsentTimer.current)
      faceAbsentTimer.current = null
    }
  }, [])

  const updateElapsed = useCallback((seconds: number) => {
    setState(prev => ({ ...prev, elapsedSeconds: seconds }))
  }, [])

  const resetDetection = useCallback(() => {
    setState(initialState)
    livenessDetector.reset()
    speechDetector.reset()
  }, [])

  return {
    detectionState: state,
    handleFacesDetected,
    startDetection,
    stopDetection,
    updateElapsed,
    resetDetection,
    faceDetectorConfig: faceDetector.getDetectorConfig(),
    getSpeechDuration: () => speechDetector.getSpeechDuration(),
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useDetection.ts
git commit -m "feat: useDetection hook (aggregates all detectors)"
```

---

## Task 9: useRecording hook

**Files:**
- Create: `hooks/useRecording.ts`

- [ ] **Step 1: Create hooks/useRecording.ts**

```typescript
// hooks/useRecording.ts
import { useState, useRef, useCallback } from 'react'
import { Audio } from 'expo-av'
import type { CameraRef } from 'expo-camera'

export const MIN_DURATION_SECONDS = 15
export const MIN_SPEECH_SECONDS = 10

export function useRecording(cameraRef: React.RefObject<any>) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRecordingRef = useRef<Audio.Recording | null>(null)
  const videoUriRef = useRef<string | null>(null)

  const startRecording = useCallback(async (): Promise<Audio.Recording> => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    })

    const { recording } = await Audio.Recording.createAsync(
      {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true, // required for speech detection
      }
    )
    audioRecordingRef.current = recording

    // Start video recording (non-blocking — result comes later)
    if (cameraRef.current) {
      cameraRef.current.recordAsync({ maxDuration: 300 }).then((video: { uri: string } | undefined) => {
        videoUriRef.current = video?.uri ?? null
      })
    }

    setDuration(0)
    setIsRecording(true)
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)

    return recording
  }, [cameraRef])

  const stopRecording = useCallback(async (): Promise<{
    audioUri: string
    videoUri: string | null
    durationSeconds: number
  }> => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    cameraRef.current?.stopRecording()

    let audioUri = ''
    if (audioRecordingRef.current) {
      await audioRecordingRef.current.stopAndUnloadAsync()
      audioUri = audioRecordingRef.current.getURI() ?? ''
      audioRecordingRef.current = null
    }

    const finalDuration = duration
    setIsRecording(false)

    return {
      audioUri,
      videoUri: videoUriRef.current,
      durationSeconds: finalDuration,
    }
  }, [cameraRef, duration])

  return {
    isRecording,
    duration,
    canStop: duration >= MIN_DURATION_SECONDS,
    startRecording,
    stopRecording,
    getActiveRecording: () => audioRecordingRef.current,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useRecording.ts
git commit -m "feat: useRecording hook"
```

---

## Task 10: Gate UI sub-components

**Files:**
- Create: `components/gate/PromptCard.tsx`
- Create: `components/gate/DetectionStatus.tsx`
- Create: `components/gate/ValidationLoader.tsx`

- [ ] **Step 1: Create PromptCard.tsx**

```typescript
// components/gate/PromptCard.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface PromptCardProps {
  prompt: string
  visible: boolean
}

export default function PromptCard({ prompt, visible }: PromptCardProps) {
  if (!visible) return null
  return (
    <View style={styles.container}>
      <Text style={styles.label}>YOUR PROMPT</Text>
      <Text style={styles.prompt}>{prompt}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  prompt: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 28,
  },
})
```

- [ ] **Step 2: Create DetectionStatus.tsx**

```typescript
// components/gate/DetectionStatus.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { DetectionState } from '../../types'

interface Props {
  detection: DetectionState
  isRecording: boolean
}

interface IndicatorProps {
  label: string
  active: boolean
}

function Indicator({ label, active }: IndicatorProps) {
  return (
    <View style={styles.indicator}>
      <View style={[styles.dot, active ? styles.dotActive : styles.dotInactive]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

export default function DetectionStatus({ detection, isRecording }: Props) {
  if (!isRecording) return null
  return (
    <View style={styles.container}>
      <Indicator label="Face" active={detection.faceDetected} />
      <Indicator label="Voice" active={detection.speechDetected} />
      <Indicator label="Hold" active={detection.orientationOk} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  indicator: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: { backgroundColor: '#00e676' },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
})
```

- [ ] **Step 3: Create ValidationLoader.tsx**

```typescript
// components/gate/ValidationLoader.tsx
import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'

export default function ValidationLoader() {
  const pulse = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, [pulse])

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.orb, { opacity: pulse }]} />
      <Text style={styles.title}>Atlas is reviewing</Text>
      <Text style={styles.subtitle}>Checking your content...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  orb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7c3aed',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
})
```

- [ ] **Step 4: Commit**

```bash
git add components/gate/
git commit -m "feat: gate UI sub-components (PromptCard, DetectionStatus, ValidationLoader)"
```

---

## Task 11: CameraGate.tsx

This is the product. Full screen camera, detection pipeline, recording, server-side validation, coaching note.

**Files:**
- Create: `components/gate/CameraGate.tsx`

- [ ] **Step 1: Create components/gate/CameraGate.tsx**

```typescript
// components/gate/CameraGate.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { Camera, CameraType } from 'expo-camera'
import * as FileSystem from 'expo-file-system'
import { useDetection } from '../../hooks/useDetection'
import { useRecording, MIN_SPEECH_SECONDS, MIN_DURATION_SECONDS } from '../../hooks/useRecording'
import { AIRouter } from '../../lib/ai/router'
import { supabase } from '../../lib/supabase/client'
import PromptCard from './PromptCard'
import DetectionStatus from './DetectionStatus'
import ValidationLoader from './ValidationLoader'
import type { GateState, UserProfile } from '../../types'

interface CameraGateProps {
  prompt: string
  userId: string
  userProfile: Pick<UserProfile, 'contentAngle' | 'targetAudience'>
  onValidationPass: (recordingId: string) => void
  onIgnore: () => void
}

const COOLDOWN_SECONDS = 600 // 10 minutes

export default function CameraGate({
  prompt,
  userId,
  userProfile,
  onValidationPass,
  onIgnore,
}: CameraGateProps) {
  const [gateState, setGateState] = useState<GateState>('idle')
  const [permission, requestPermission] = Camera.useCameraPermissions()
  const [audioPermission, requestAudioPermission] = Camera.useMicrophonePermissions()
  const [failReason, setFailReason] = useState('')
  const [coachingNote, setCoachingNote] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const cameraRef = useRef<any>(null)

  const {
    detectionState,
    handleFacesDetected,
    startDetection,
    stopDetection,
    updateElapsed,
    resetDetection,
    faceDetectorConfig,
    getSpeechDuration,
  } = useDetection()

  const {
    isRecording,
    duration,
    canStop,
    startRecording,
    stopRecording,
  } = useRecording(cameraRef)

  // Keep elapsed seconds in sync with detection state
  useEffect(() => {
    updateElapsed(duration)
  }, [duration, updateElapsed])

  // Cooldown countdown
  useEffect(() => {
    if (gateState !== 'retry_wait') return
    setCooldown(COOLDOWN_SECONDS)
    const interval = setInterval(() => {
      setCooldown(s => {
        if (s <= 1) {
          clearInterval(interval)
          setGateState('idle')
          setRetryCount(0)
          resetDetection()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [gateState, resetDetection])

  const handleRecord = useCallback(async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission()
      if (!granted) {
        Alert.alert('Camera Required', 'Post Lock needs camera access to verify your recording.')
        return
      }
    }
    if (!audioPermission?.granted) {
      const { granted } = await requestAudioPermission()
      if (!granted) {
        Alert.alert('Microphone Required', 'Post Lock needs microphone access to detect speech.')
        return
      }
    }

    setGateState('recording')
    const recording = await startRecording()
    await startDetection(recording)
  }, [
    permission,
    audioPermission,
    requestPermission,
    requestAudioPermission,
    startRecording,
    startDetection,
  ])

  const handleStop = useCallback(async () => {
    if (!canStop) return

    const speechDuration = getSpeechDuration()
    if (speechDuration < MIN_SPEECH_SECONDS) {
      Alert.alert(
        'Keep talking',
        `Post Lock needs at least ${MIN_SPEECH_SECONDS}s of speech. You have ${Math.floor(speechDuration)}s so far. Keep going.`
      )
      return
    }

    stopDetection()
    setGateState('processing')

    try {
      const { audioUri, durationSeconds } = await stopRecording()

      // Convert audio to base64 for Edge Function
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Server-side validation (never on client)
      const result = await AIRouter.validateRecording(audioBase64, userProfile)

      // Save recording to Supabase
      const { data: savedRecording, error: saveError } = await supabase
        .from('recordings')
        .insert({
          user_id: userId,
          duration_seconds: durationSeconds,
          storage_path: audioUri,
          transcript: result.transcript,
          prompt_used: prompt,
          validation_passed: result.validation.passed,
          validation_reason: result.validation.reason,
          coaching_note: result.coachingNote,
          status: 'raw',
        })
        .select('id')
        .single()

      if (saveError) throw saveError

      if (result.validation.passed) {
        setCoachingNote(result.coachingNote ?? '')
        setGateState('pass')
        // Show coaching note for 3 seconds then unlock
        setTimeout(() => onValidationPass(savedRecording.id), 3000)
      } else {
        setFailReason(result.validation.reason)
        const newRetryCount = retryCount + 1
        setRetryCount(newRetryCount)
        setGateState(newRetryCount >= 2 ? 'retry_wait' : 'fail')
      }
    } catch (err) {
      console.error('Gate error:', err)
      Alert.alert('Something went wrong', 'Please try again.')
      setGateState('idle')
    }
  }, [
    canStop,
    getSpeechDuration,
    stopDetection,
    stopRecording,
    userProfile,
    userId,
    prompt,
    retryCount,
    onValidationPass,
  ])

  // Cooldown screen
  if (gateState === 'retry_wait') {
    const mins = Math.floor(cooldown / 60)
    const secs = cooldown % 60
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.cooldownTitle}>Take a breath.</Text>
        <Text style={styles.cooldownBody}>
          Come back in {mins}:{secs.toString().padStart(2, '0')} and try again.
        </Text>
        <TouchableOpacity style={styles.ignoreButton} onPress={onIgnore}>
          <Text style={styles.ignoreButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!permission) return <View style={styles.container} />

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={CameraType.front}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={faceDetectorConfig}
      >
        <PromptCard
          prompt={prompt}
          visible={gateState === 'idle' || gateState === 'recording'}
        />

        {gateState === 'processing' && <ValidationLoader />}

        {gateState === 'pass' && (
          <View style={[styles.overlay, styles.passOverlay]}>
            <Text style={styles.passTitle}>Nice work.</Text>
            {coachingNote ? (
              <Text style={styles.coachingNote}>{coachingNote}</Text>
            ) : null}
            <Text style={styles.unlocking}>Unlocking...</Text>
          </View>
        )}

        {gateState === 'fail' && (
          <View style={[styles.overlay, styles.failOverlay]}>
            <Text style={styles.failTitle}>Not quite.</Text>
            <Text style={styles.failReason}>{failReason}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setGateState('idle')
                resetDetection()
              }}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {(gateState === 'idle' || gateState === 'recording') && (
          <View style={styles.bottomControls}>
            <DetectionStatus detection={detectionState} isRecording={isRecording} />

            {isRecording && (
              <Text style={styles.timer}>{duration}s</Text>
            )}

            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
                isRecording && !canStop && styles.recordButtonDisabled,
              ]}
              onPress={isRecording ? handleStop : handleRecord}
              disabled={isRecording && !canStop}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.recordButtonInner,
                  isRecording && styles.recordButtonInnerStop,
                ]}
              />
            </TouchableOpacity>

            {!isRecording && (
              <TouchableOpacity style={styles.ignoreLink} onPress={onIgnore}>
                <Text style={styles.ignoreLinkText}>Skip for now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Camera>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  passOverlay: {
    backgroundColor: 'rgba(0, 180, 90, 0.88)',
  },
  failOverlay: {
    backgroundColor: 'rgba(180, 40, 40, 0.88)',
  },
  passTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
  },
  coachingNote: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
  },
  unlocking: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  failTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
  },
  failReason: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#b42828',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 52,
    paddingHorizontal: 24,
    gap: 12,
  },
  timer: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  recordButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    borderColor: '#ff4d4d',
  },
  recordButtonDisabled: {
    opacity: 0.45,
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff4d4d',
  },
  recordButtonInnerStop: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#ff4d4d',
  },
  ignoreLink: {
    marginTop: 4,
  },
  ignoreLinkText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  ignoreButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ignoreButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  cooldownTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  cooldownBody: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add components/gate/CameraGate.tsx
git commit -m "feat: CameraGate — full detection + recording + server-side validation"
```

---

## Task 12: Navigation skeleton + auth + gate screen

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/sign-in.tsx`
- Create: `app/gate/record.tsx`

- [ ] **Step 1: Create app/_layout.tsx**

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in')
    } else if (session && inAuthGroup) {
      router.replace('/gate/record')
    }
  }, [session, loading, segments, router])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="gate" />
    </Stack>
  )
}
```

- [ ] **Step 2: Create app/index.tsx**

```typescript
// app/index.tsx
import { Redirect } from 'expo-router'

export default function Index() {
  return <Redirect href="/gate/record" />
}
```

- [ ] **Step 3: Create app/(auth)/_layout.tsx**

```typescript
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Step 4: Create app/(auth)/sign-in.tsx**

```typescript
// app/(auth)/sign-in.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { supabase } from '../../lib/supabase/client'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert('Sign in failed', error.message)
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) Alert.alert('Sign up failed', error.message)
    else Alert.alert('Check your email', 'Confirm your account then sign in.')
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Post Lock</Text>
      <Text style={styles.subtitle}>You don't get to scroll until you record.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Sign In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSignUp} disabled={loading}>
        <Text style={styles.linkText}>No account? Sign up</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 24,
    lineHeight: 22,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  linkText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 8,
  },
})
```

- [ ] **Step 5: Create app/gate/record.tsx**

```typescript
// app/gate/record.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase/client'
import { AIRouter } from '../../lib/ai/router'
import CameraGate from '../../components/gate/CameraGate'
import type { UserProfile } from '../../types'

// Fallback prompt for users with no prompt library yet
const DEFAULT_PROMPT =
  'Tell me about the most useful thing you learned this week and why it matters to you.'

export default function GateScreen() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<Pick<UserProfile, 'contentAngle' | 'targetAudience'>>({
    contentAngle: '',
    targetAudience: '',
  })
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/(auth)/sign-in')
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('content_angle, target_audience')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile({
          contentAngle: profile.content_angle ?? '',
          targetAudience: profile.target_audience ?? '',
        })
      }

      // Pull next unused prompt from library
      const { data: nextPrompt } = await supabase
        .from('prompts')
        .select('id, prompt_text')
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: true, nullsFirst: true })
        .limit(1)
        .single()

      if (nextPrompt) {
        setPrompt(nextPrompt.prompt_text)
        // Mark as used
        await supabase
          .from('prompts')
          .update({ used_count: 1, last_used_at: new Date().toISOString() })
          .eq('id', nextPrompt.id)
      }

      setLoading(false)
    }

    init()
  }, [router])

  const handlePass = async (recordingId: string) => {
    // Update daily progress
    if (userId) {
      const today = new Date().toISOString().split('T')[0]
      await supabase.rpc('increment_daily_progress', {
        p_user_id: userId,
        p_date: today,
      }).catch(() => {
        // RPC may not exist yet — create daily_progress row manually
        supabase.from('daily_progress').upsert({
          user_id: userId,
          date: today,
          recordings_completed: 1,
          quota_met: true,
        }, { onConflict: 'user_id,date' })
      })
    }

    // Route to gated app (in production: deep link to Instagram)
    // For now: navigate to a placeholder "you're in" screen
    router.replace('/gate/unlocked')
  }

  const handleIgnore = () => {
    // Track the ignore event
    if (userId) {
      supabase.from('gate_sessions').insert({
        user_id: userId,
        outcome: 'ignored',
        gate_mode: 'mode_1',
      })
    }
    // In production: open gated app anyway (via deep link or Screen Time delegate)
    router.back()
  }

  if (loading || !userId) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#7c3aed" size="large" />
      </View>
    )
  }

  return (
    <CameraGate
      prompt={prompt}
      userId={userId}
      userProfile={userProfile}
      onValidationPass={handlePass}
      onIgnore={handleIgnore}
    />
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
```

- [ ] **Step 6: Commit**

```bash
git add app/
git commit -m "feat: navigation skeleton, auth screen, gate screen"
```

---

## Task 13: First run + smoke test on device

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/riz/Documents/Claude/PostLock/postlock
npx expo start --tunnel
```

- [ ] **Step 2: Open on iOS device via Expo Go**

Scan the QR code with your iPhone camera. The app requires a real device for camera + face detection — simulator will not work.

- [ ] **Step 3: Verify sign-in flow**

1. App opens → redirected to sign-in
2. Sign up with a test email
3. Confirm email (check inbox)
4. Sign in → redirected to gate screen

Expected: Camera opens full screen with the default prompt visible.

- [ ] **Step 4: Verify detection indicators appear when recording**

1. Tap record button
2. Detection indicators appear at bottom (Face / Voice / Hold)
3. Smile at camera → Face indicator turns green
4. Speak → Voice indicator turns green
5. Hold phone upright → Hold indicator stays green

- [ ] **Step 5: Verify 15-second minimum enforcement**

1. Tap record, immediately try to tap stop
2. Stop button should be disabled / do nothing for first 15 seconds
3. After 15 seconds: stop button activates

- [ ] **Step 6: Verify AI validation flow**

1. Record 20+ seconds of real speech
2. Tap stop → "Atlas is reviewing" screen appears
3. After ~5 seconds → pass (green) or fail (red) overlay
4. On pass: coaching note shown, then "Unlocking..."

- [ ] **Step 7: Verify fail flow**

1. Record 15 seconds of gibberish / silence
2. Tap stop → validation fails
3. Fail reason shown, retry button visible
4. Retry once → fail again → cooldown screen with countdown

- [ ] **Step 8: Check Supabase recordings table**

In Supabase dashboard → Table Editor → recordings:
- Row should appear with transcript, coaching_note, validation_passed

---

## Task 14: Final commit + tag

- [ ] **Step 1: Final cleanup commit**

```bash
cd /Users/riz/Documents/Claude/PostLock/postlock
git add -A
git commit -m "feat: Plan 1 complete — foundation + CameraGate + edge functions"
```

- [ ] **Step 2: Tag Plan 1 complete**

```bash
git tag plan1-complete
```

---

## What's Next

**Plan 2 — Onboarding** (Track A + B discovery interview, face enrollment, app selection, mode selection)

**Plan 3 — Gate Controller + Modes** (Mode 1/2/3 logic, daily quota tracking, session timer, gate_sessions analytics)

**Plan 4 — Library + Progress + Screen Time** (recording library, transcripts, streaks, FamilyControls integration)
