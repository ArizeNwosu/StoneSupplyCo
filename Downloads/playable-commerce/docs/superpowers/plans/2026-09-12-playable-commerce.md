# Playable Commerce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full Playable Commerce SaaS — AI brand analysis, mechanic+skin game engine, live editor, Splitflask and CyberBackpack demos

**Architecture:** React Context for global state, Gemini AI for brand analysis + concept generation + GameSpec building, primitive+skin game engine where 7 interaction primitives are independently skinnable per brand

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, @google/genai v2.4.0, motion, react-router-dom v7

---

### Task 1: Types + Vite env config

**Files:**
- Modify: `src/types.ts`
- Modify: `vite.config.ts`

- [ ] **Step 1: Replace src/types.ts**

```typescript
// src/types.ts

export type MechanicPrimitive =
  | 'precision_stop'
  | 'multi_dial'
  | 'pick_one'
  | 'hold_release'
  | 'reaction'
  | 'drag_target'
  | 'fill_meter';

export interface SkinConfig {
  // precision_stop skins
  targetValue?: number;
  maxValue?: number;
  speed?: 'slow' | 'medium' | 'fast';
  unit?: string;
  vessel_shape?: string;
  // multi_dial skins
  digits?: number;
  solution?: number[];
  // pick_one skins
  count?: number;
  box_labels?: string[];
  colors?: string[];
  // hold_release / fill_meter skins
  peak_zone_min?: number;
  peak_zone_max?: number;
  target_min?: number;
  target_max?: number;
  label?: string;
  // reaction skins
  flash_color?: string;
  window_ms?: number;
  object_label?: string;
  fall_speed?: 'slow' | 'medium' | 'fast';
  // drag_target skins
  item_labels?: string[];
  container_label?: string;
  items?: string[];
  bins?: string[];
  // misc
  orientation?: 'horizontal' | 'vertical';
  [key: string]: unknown;
}

export interface GameSpec {
  experience: {
    name: string;
    goal: 'lead_capture' | 'conversion' | 'aov' | 'brand_awareness';
    surface: 'popup' | 'embedded' | 'exit_intent' | 'cart';
  };
  branding: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontStyle: 'sans' | 'serif' | 'mono' | 'display';
    tone: string;
  };
  intro: {
    headline: string;
    body: string;
    cta: string;
  };
  mechanic: {
    primitive: MechanicPrimitive;
    skin: string;
    config: SkinConfig;
  };
  result: {
    headline: string;
    body: string;
    delayMs: number;
    type: 'deny' | 'reveal' | 'near_miss' | 'success';
  };
  reward: {
    type: 'free_shipping' | 'percentage_off' | 'fixed_off' | 'free_product' | 'mystery';
    value?: string;
    message: string;
  };
  conversion: {
    provider: 'klaviyo' | 'none';
    winnerFormId?: string;
    standardFormId?: string;
  };
}

export interface BrandProfile {
  brandName: string;
  productName: string;
  category: string;
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
  tone: string;
  usp: string;
  targetCustomer: string;
  playableAttributes: { label: string; reason: string }[];
  interactionMetaphors: string[];
}

export interface ConceptScores {
  brandSpecificity: number;
  productDemonstration: number;
  simplicity: number;
  suspense: number;
  rewardFit: number;
  mobileUsability: number;
  conversionPotential: number;
}

export interface Concept {
  id: string;
  name: string;
  premise: string;
  whyItFits: string;
  primitive: MechanicPrimitive;
  skin: string;
  skinDescription: string;
  headline: string;
  ctaText: string;
  resultHeadline: string;
  rewardMessage: string;
  scores: ConceptScores;
}

export interface StoreConfig {
  storeName: string;
  url: string;
}

export interface AppState {
  store: StoreConfig | null;
  brandProfile: BrandProfile | null;
  concepts: Concept[];
  selectedConcept: Concept | null;
  gameSpec: GameSpec | null;
  experience: { id: string; name: string; status: 'draft' | 'active' | 'paused' } | null;
  analyzing: boolean;
  generatingConcepts: boolean;
  buildingSpec: boolean;
  error: string | null;
}

// Legacy — keep for Dashboard compatibility
export interface Experience {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'paused';
  placement: string;
  impressions: number;
  plays: number;
  revenue: number;
  leadRate: number;
  createdAt: string;
  thumbnail: string;
}

export interface PlayableConfig {
  mechanic: string;
  duration: number;
  headline: string;
  reward: { type: string; value?: string };
  result: { type: string };
  targeting: { delay: number; newVisitors: boolean };
}
```

- [ ] **Step 2: Add GEMINI_API_KEY to vite.config.ts**

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(
        process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY ?? ''
      ),
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run lint`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/types.ts vite.config.ts
git commit -m "feat: extend types for GameSpec, BrandProfile, Concept; wire GEMINI_API_KEY"
```

---

### Task 2: AppContext

**Files:**
- Create: `src/context/AppContext.tsx`

- [ ] **Step 1: Create src/context/AppContext.tsx**

```typescript
// src/context/AppContext.tsx
import React, { createContext, useContext, useReducer } from 'react';
import type { AppState, BrandProfile, Concept, GameSpec, StoreConfig } from '../types';

type Action =
  | { type: 'SET_STORE'; payload: StoreConfig }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_BRAND_PROFILE'; payload: BrandProfile }
  | { type: 'SET_GENERATING_CONCEPTS'; payload: boolean }
  | { type: 'SET_CONCEPTS'; payload: Concept[] }
  | { type: 'SELECT_CONCEPT'; payload: Concept }
  | { type: 'SET_BUILDING_SPEC'; payload: boolean }
  | { type: 'SET_GAME_SPEC'; payload: GameSpec }
  | { type: 'UPDATE_GAME_SPEC'; payload: Partial<GameSpec> }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_FLOW' };

const initialState: AppState = {
  store: null,
  brandProfile: null,
  concepts: [],
  selectedConcept: null,
  gameSpec: null,
  experience: null,
  analyzing: false,
  generatingConcepts: false,
  buildingSpec: false,
  error: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STORE':
      return { ...state, store: action.payload };
    case 'SET_ANALYZING':
      return { ...state, analyzing: action.payload, error: null };
    case 'SET_BRAND_PROFILE':
      return { ...state, brandProfile: action.payload, analyzing: false };
    case 'SET_GENERATING_CONCEPTS':
      return { ...state, generatingConcepts: action.payload };
    case 'SET_CONCEPTS':
      return { ...state, concepts: action.payload, generatingConcepts: false };
    case 'SELECT_CONCEPT':
      return { ...state, selectedConcept: action.payload };
    case 'SET_BUILDING_SPEC':
      return { ...state, buildingSpec: action.payload };
    case 'SET_GAME_SPEC':
      return { ...state, gameSpec: action.payload, buildingSpec: false };
    case 'UPDATE_GAME_SPEC':
      if (!state.gameSpec) return state;
      return {
        ...state,
        gameSpec: {
          ...state.gameSpec,
          ...action.payload,
          branding: action.payload.branding
            ? { ...state.gameSpec.branding, ...action.payload.branding }
            : state.gameSpec.branding,
          intro: action.payload.intro
            ? { ...state.gameSpec.intro, ...action.payload.intro }
            : state.gameSpec.intro,
          reward: action.payload.reward
            ? { ...state.gameSpec.reward, ...action.payload.reward }
            : state.gameSpec.reward,
          result: action.payload.result
            ? { ...state.gameSpec.result, ...action.payload.result }
            : state.gameSpec.result,
        },
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, analyzing: false, generatingConcepts: false, buildingSpec: false };
    case 'RESET_FLOW':
      return { ...initialState, store: state.store };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/context/AppContext.tsx
git commit -m "feat: add AppContext with useReducer for global brand/game flow state"
```

---

### Task 3: Gemini Service

**Files:**
- Create: `src/services/geminiService.ts`

- [ ] **Step 1: Create src/services/geminiService.ts**

```typescript
// src/services/geminiService.ts
import { GoogleGenAI } from '@google/genai';
import type { BrandProfile, Concept, GameSpec } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const MODEL = 'gemini-2.5-flash';

export async function analyzeBrand(url: string): Promise<BrandProfile> {
  const prompt = `You are a creative director and game designer analyzing an ecommerce product URL to find what is inherently playable about it.

Analyze this URL: ${url}

Extract the following and return ONLY valid JSON matching this exact schema:
{
  "brandName": "string — the brand name",
  "productName": "string — the hero product name",
  "category": "string — product category (e.g. bags, beverages, footwear)",
  "primaryColor": "string — hex color code representing the brand's primary color",
  "backgroundColor": "string — hex color code for a suitable game background",
  "accentColor": "string — hex color code for accent/highlight",
  "tone": "string — brand personality in one word (e.g. cybersecurity, playful, premium, athletic)",
  "usp": "string — the single most compelling unique selling point",
  "targetCustomer": "string — who buys this product",
  "playableAttributes": [
    { "label": "string — attribute name", "reason": "string — why this is gameable" }
  ],
  "interactionMetaphors": ["string — action metaphor e.g. 'crack the lock', 'stop the pour'"]
}

Rules:
- playableAttributes: list 3-5 concrete physical or conceptual features that could become game mechanics
- interactionMetaphors: list 4-6 brand-specific action phrases — NOT generic (no 'spin the wheel', no 'scratch card')
- If the URL is unreachable, infer from the domain name and any path segments
- primaryColor, backgroundColor, accentColor must be valid hex codes`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text ?? '';
  return JSON.parse(text) as BrandProfile;
}

export async function generateConcepts(brandProfile: BrandProfile): Promise<Concept[]> {
  const primitiveDocs = `
Available primitives and skins:
- precision_stop: stop a moving value at a target. Skins: stopwatch, ruler, fuel_gauge, pour_drink, countdown_bar
- multi_dial: set N dials/wheels to unlock. Skins: combination_lock, slot_reels, safe_dial
- pick_one: choose one from N mystery options. Skins: mystery_box, card_flip, capsule_machine
- hold_release: hold to charge, release at peak. Skins: strength_meter, tension_bow
- reaction: tap when visual signal fires. Skins: flash_tap, catch_object
- drag_target: drag items to destinations. Skins: pack_bag, sort_items
- fill_meter: fill to exact target level. Skins: charge_bar, stack_coins
`;

  const prompt = `You are a creative director and game designer generating brand-specific gamified conversion experiences.

Brand profile:
${JSON.stringify(brandProfile, null, 2)}

${primitiveDocs}

Generate exactly 3 game concepts. Each must be deeply tied to this specific product — NOT generic.
The test: "If the brand logo disappeared, could someone guess the brand from the game alone?" Answer must be YES.

Return ONLY valid JSON: an array of 3 concept objects matching this exact schema:
[
  {
    "id": "string — snake_case unique id",
    "name": "string — game name (2-4 words, dramatic)",
    "premise": "string — one sentence describing the game",
    "whyItFits": "string — why this mechanic represents the product specifically",
    "primitive": "string — one of: precision_stop, multi_dial, pick_one, hold_release, reaction, drag_target, fill_meter",
    "skin": "string — skin name from the available list above",
    "skinDescription": "string — how the skin should look using this brand's aesthetic",
    "headline": "string — the in-game headline shown to the visitor (max 5 words, ALL CAPS)",
    "ctaText": "string — start button text (2-3 words, ALL CAPS)",
    "resultHeadline": "string — the result moment headline (max 3 words, dramatic)",
    "rewardMessage": "string — the reward reveal copy (full sentence)",
    "scores": {
      "brandSpecificity": number 1-10,
      "productDemonstration": number 1-10,
      "simplicity": number 1-10,
      "suspense": number 1-10,
      "rewardFit": number 1-10,
      "mobileUsability": number 1-10,
      "conversionPotential": number 1-10
    }
  }
]

Rules:
- Each concept must use a DIFFERENT primitive
- No concept may score below 6 on brandSpecificity
- No concept may score below 5 on mobileUsability
- Concepts must vary in tone (e.g. one intense, one playful, one elegant)`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text ?? '';
  return JSON.parse(text) as Concept[];
}

export async function buildGameSpec(concept: Concept, brandProfile: BrandProfile): Promise<GameSpec> {
  const prompt = `You are building a structured GameSpec JSON for a gamified ecommerce conversion experience.

Brand profile:
${JSON.stringify(brandProfile, null, 2)}

Selected concept:
${JSON.stringify(concept, null, 2)}

Return ONLY valid JSON matching this exact schema:
{
  "experience": {
    "name": "string — experience name",
    "goal": "lead_capture",
    "surface": "popup"
  },
  "branding": {
    "primaryColor": "string — hex from brand",
    "backgroundColor": "string — hex, dark works best",
    "textColor": "string — hex, high contrast against backgroundColor",
    "accentColor": "string — hex for highlights",
    "fontStyle": "string — one of: sans, serif, mono, display",
    "tone": "string — e.g. cybersecurity, playful, premium"
  },
  "intro": {
    "headline": "string — 3-5 words ALL CAPS",
    "body": "string — 1-2 sentences enticing play",
    "cta": "string — 2-3 words ALL CAPS"
  },
  "mechanic": {
    "primitive": "${concept.primitive}",
    "skin": "${concept.skin}",
    "config": {
      // For precision_stop/pour_drink: targetValue (0-100), maxValue (100), speed ("medium"), unit ("%"), vessel_shape ("flask")
      // For multi_dial/combination_lock: digits (3), solution ([random 3 digits])
      // For pick_one/mystery_box: count (3), box_labels (["Box A","Box B","Box C"])
      // For hold_release/strength_meter: peak_zone_min (60), peak_zone_max (80), label ("POWER")
      // For reaction/flash_tap: flash_color (hex), window_ms (800)
      // For fill_meter/charge_bar: target_min (55), target_max (75), label ("CHARGE")
    }
  },
  "result": {
    "headline": "string — 2-3 words, dramatic ALL CAPS",
    "body": "string — acknowledge attempt, then reveal reward",
    "delayMs": 1200,
    "type": "deny"
  },
  "reward": {
    "type": "free_shipping",
    "value": "string or omit",
    "message": "string — the full reward reveal sentence"
  },
  "conversion": {
    "provider": "klaviyo",
    "winnerFormId": "",
    "standardFormId": ""
  }
}

Important: fill config with actual values appropriate to the skin. Do not leave placeholder comments.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text ?? '';
  return JSON.parse(text) as GameSpec;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/services/geminiService.ts
git commit -m "feat: add Gemini service — analyzeBrand, generateConcepts, buildGameSpec"
```

---

### Task 4: Demo data + skin registry

**Files:**
- Create: `src/data/demos.ts`
- Create: `src/data/skins.ts`

- [ ] **Step 1: Create src/data/demos.ts**

```typescript
// src/data/demos.ts
import type { GameSpec } from '../types';

export const splitflaskSpec: GameSpec = {
  experience: {
    name: 'Stop the Pour',
    goal: 'lead_capture',
    surface: 'popup',
  },
  branding: {
    primaryColor: '#FF6B35',
    backgroundColor: '#1A1A2E',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    fontStyle: 'display',
    tone: 'playful',
  },
  intro: {
    headline: 'TRY YOUR LUCK',
    body: 'Stop the pour at exactly 50% to win a free Splitflask.',
    cta: 'START POURING',
  },
  mechanic: {
    primitive: 'precision_stop',
    skin: 'pour_drink',
    config: {
      vessel_shape: 'flask',
      targetValue: 50,
      unit: '%',
      maxValue: 100,
      speed: 'medium',
    },
  },
  result: {
    headline: 'SO CLOSE.',
    body: "You didn't nail it. But you still get 15% off your order.",
    delayMs: 1000,
    type: 'near_miss',
  },
  reward: {
    type: 'percentage_off',
    value: '15',
    message: '15% off your order — use code SPLITLUCK at checkout.',
  },
  conversion: {
    provider: 'klaviyo',
    winnerFormId: '',
    standardFormId: '',
  },
};

export const cyberbackpackSpec: GameSpec = {
  experience: {
    name: 'Crack the Lock',
    goal: 'lead_capture',
    surface: 'popup',
  },
  branding: {
    primaryColor: '#E51B23',
    backgroundColor: '#080808',
    textColor: '#00FF41',
    accentColor: '#E51B23',
    fontStyle: 'mono',
    tone: 'cybersecurity',
  },
  intro: {
    headline: 'BREAK INTO THE BACKPACK',
    body: 'Think you can crack our TSA combination lock?',
    cta: 'START MISSION',
  },
  mechanic: {
    primitive: 'multi_dial',
    skin: 'combination_lock',
    config: {
      digits: 3,
      solution: [3, 7, 1],
    },
  },
  result: {
    headline: 'ACCESS DENIED',
    body: "You didn't crack the lock. But you did unlock FREE SHIPPING.",
    delayMs: 1200,
    type: 'deny',
  },
  reward: {
    type: 'free_shipping',
    message: 'Free shipping on your order — no code needed.',
  },
  conversion: {
    provider: 'klaviyo',
    winnerFormId: '',
    standardFormId: '',
  },
};
```

- [ ] **Step 2: Create src/data/skins.ts**

```typescript
// src/data/skins.ts
import type { MechanicPrimitive } from '../types';

export interface SkinMeta {
  id: string;
  label: string;
  description: string;
}

export const SKIN_REGISTRY: Record<MechanicPrimitive, SkinMeta[]> = {
  precision_stop: [
    { id: 'pour_drink', label: 'Pour Drink', description: 'Liquid auto-pours, tap to stop at target line' },
    { id: 'stopwatch', label: 'Stopwatch', description: 'Classic circular timer face' },
    { id: 'ruler', label: 'Ruler', description: 'Tape extends, stop at measurement mark' },
    { id: 'fuel_gauge', label: 'Fuel Gauge', description: 'Needle sweeps, stop in target zone' },
    { id: 'countdown_bar', label: 'Countdown Bar', description: 'Horizontal bar depletes' },
  ],
  multi_dial: [
    { id: 'combination_lock', label: 'Combination Lock', description: '3 vertical number wheels, drag up/down' },
    { id: 'slot_reels', label: 'Slot Reels', description: 'Spinning reels with custom symbols' },
    { id: 'safe_dial', label: 'Safe Dial', description: 'Single circular dial with sequence' },
  ],
  pick_one: [
    { id: 'mystery_box', label: 'Mystery Box', description: 'N boxes, tap to reveal' },
    { id: 'card_flip', label: 'Card Flip', description: 'Playing cards face-down, flip to reveal' },
    { id: 'capsule_machine', label: 'Capsule Machine', description: 'Gumball-style capsule drop' },
  ],
  hold_release: [
    { id: 'strength_meter', label: 'Strength Meter', description: 'Charge bar fills while held, release at peak zone' },
    { id: 'tension_bow', label: 'Tension Bow', description: 'Pull back to optimal tension' },
  ],
  reaction: [
    { id: 'flash_tap', label: 'Flash Tap', description: 'Screen flashes, tap immediately' },
    { id: 'catch_object', label: 'Catch Object', description: 'Branded object falls, tap to catch' },
  ],
  drag_target: [
    { id: 'pack_bag', label: 'Pack the Bag', description: 'Drag product items into a bag/container' },
    { id: 'sort_items', label: 'Sort Items', description: 'Drag items to correct labeled bins' },
  ],
  fill_meter: [
    { id: 'charge_bar', label: 'Charge Bar', description: 'Tap/hold to fill to the target zone' },
    { id: 'stack_coins', label: 'Stack Coins', description: 'Stack coins to reach prize tier' },
  ],
};
```

- [ ] **Step 3: Commit**

```bash
git add src/data/demos.ts src/data/skins.ts
git commit -m "feat: add Splitflask + CyberBackpack demo GameSpecs and skin registry"
```

---

### Task 5: GameRenderer phase machine

**Files:**
- Create: `src/components/games/GameRenderer.tsx`

- [ ] **Step 1: Create src/components/games/GameRenderer.tsx**

```typescript
// src/components/games/GameRenderer.tsx
import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GameSpec } from '../../types';
import { PrecisionStop } from './primitives/PrecisionStop';
import { MultiDial } from './primitives/MultiDial';
import { PickOne } from './primitives/PickOne';

type Phase = 'intro' | 'playing' | 'result' | 'reward';

interface GameRendererProps {
  spec: GameSpec;
  onComplete?: () => void;
}

export function GameRenderer({ spec, onComplete }: GameRendererProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [isSuccess, setIsSuccess] = useState(false);

  const { branding, intro, result, reward, conversion, mechanic } = spec;

  const bg = branding.backgroundColor;
  const text = branding.textColor;
  const primary = branding.primaryColor;
  const accent = branding.accentColor;
  const fontClass = branding.fontStyle === 'mono' ? 'font-mono' : branding.fontStyle === 'serif' ? 'font-serif' : 'font-sans';

  const handleGameResult = useCallback((success: boolean) => {
    setIsSuccess(success);
    setPhase('result');
    setTimeout(() => setPhase('reward'), result.delayMs + 1500);
  }, [result.delayMs]);

  const handleKlaviyo = useCallback(() => {
    const formId = isSuccess ? conversion.winnerFormId : conversion.standardFormId;
    if (formId && conversion.provider === 'klaviyo') {
      // @ts-ignore
      window._klOnsite = window._klOnsite || [];
      // @ts-ignore
      window._klOnsite.push(['openForm', formId]);
    }
    onComplete?.();
  }, [isSuccess, conversion, onComplete]);

  const renderPrimitive = () => {
    switch (mechanic.primitive) {
      case 'precision_stop':
        return <PrecisionStop config={mechanic.config} skin={mechanic.skin} branding={branding} onResult={handleGameResult} />;
      case 'multi_dial':
        return <MultiDial config={mechanic.config} skin={mechanic.skin} branding={branding} onResult={handleGameResult} />;
      case 'pick_one':
        return <PickOne config={mechanic.config} skin={mechanic.skin} branding={branding} onResult={handleGameResult} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-48">
            <p style={{ color: text }} className="opacity-50 text-sm">
              {mechanic.primitive} / {mechanic.skin}
            </p>
            <button
              onClick={() => handleGameResult(false)}
              className="mt-4 px-6 py-3 rounded-lg font-bold text-sm"
              style={{ background: primary, color: bg }}
            >
              PLAY (DEMO)
            </button>
          </div>
        );
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-between ${fontClass} overflow-hidden relative`}
      style={{ background: bg, color: text }}
    >
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
          >
            <h1
              className="text-3xl font-black tracking-tight mb-3 leading-tight"
              style={{ color: accent }}
            >
              {intro.headline}
            </h1>
            <p className="text-sm opacity-70 max-w-xs leading-relaxed mb-10">{intro.body}</p>
            <button
              onClick={() => setPhase('playing')}
              className="px-8 py-4 rounded-lg font-bold tracking-widest text-sm transition-all active:scale-95"
              style={{ background: primary, color: bg }}
            >
              {intro.cta}
            </button>
          </motion.div>
        )}

        {phase === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col"
          >
            {renderPrimitive()}
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.h1
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              className="text-4xl font-black tracking-widest mb-4"
              style={{ color: result.type === 'deny' ? '#EF4444' : accent }}
            >
              {result.headline}
            </motion.h1>
            <p className="text-sm opacity-70 max-w-xs leading-relaxed">{result.body}</p>
          </motion.div>
        )}

        {phase === 'reward' && (
          <motion.div
            key="reward"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-2xl"
              style={{ background: primary + '22', color: primary }}
            >
              🎁
            </div>
            <h2 className="text-2xl font-black mb-3" style={{ color: accent }}>
              YOU UNLOCKED IT
            </h2>
            <p className="text-base opacity-90 max-w-xs leading-relaxed mb-8">{reward.message}</p>
            <button
              onClick={handleKlaviyo}
              className="px-8 py-4 rounded-lg font-bold tracking-widest text-sm transition-all active:scale-95"
              style={{ background: primary, color: bg }}
            >
              CLAIM MY REWARD
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/games/GameRenderer.tsx
git commit -m "feat: add GameRenderer phase machine (intro→playing→result→reward)"
```

---

### Task 6: PrecisionStop primitive + PourDrink skin

**Files:**
- Create: `src/components/games/primitives/PrecisionStop.tsx`
- Create: `src/components/games/skins/precision_stop/PourDrink.tsx`

- [ ] **Step 1: Create PrecisionStop.tsx**

```typescript
// src/components/games/primitives/PrecisionStop.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import type { SkinConfig } from '../../../types';
import { PourDrink } from '../skins/precision_stop/PourDrink';

interface BrandingColors {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  tone: string;
}

interface Props {
  config: SkinConfig;
  skin: string;
  branding: BrandingColors;
  onResult: (success: boolean, value?: number) => void;
}

const SPEEDS = { slow: 12000, medium: 7000, fast: 3500 };
const DEFAULT_TOLERANCE = 8; // ± percent of maxValue

export function PrecisionStop({ config, skin, branding, onResult }: Props) {
  const maxValue = config.maxValue ?? 100;
  const targetValue = config.targetValue ?? 50;
  const speed = config.speed ?? 'medium';
  const duration = SPEEDS[speed];
  const tolerance = DEFAULT_TOLERANCE;

  const [currentValue, setCurrentValue] = useState(0);
  const [stopped, setStopped] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const directionRef = useRef(1);

  const tick = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;
    // oscillate back and forth
    const fullCycle = duration * 2;
    const pos = elapsed % fullCycle;
    let value: number;
    if (pos < duration) {
      value = (pos / duration) * maxValue;
    } else {
      value = maxValue - ((pos - duration) / duration) * maxValue;
    }
    setCurrentValue(Math.round(value));
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, maxValue]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  const handleStop = useCallback(() => {
    if (stopped) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setStopped(true);
    const success = Math.abs(currentValue - targetValue) <= tolerance;
    setTimeout(() => onResult(success, currentValue), 400);
  }, [stopped, currentValue, targetValue, tolerance, onResult]);

  const skinProps = { currentValue, maxValue, targetValue, stopped, onStop: handleStop, config, branding };

  if (skin === 'pour_drink') return <PourDrink {...skinProps} />;

  // Generic fallback for other precision_stop skins
  const pct = (currentValue / maxValue) * 100;
  const targetPct = (targetValue / maxValue) * 100;
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
      <div className="text-4xl font-black" style={{ color: branding.accentColor }}>
        {currentValue}{config.unit ?? ''}
      </div>
      <div className="w-full h-6 rounded-full bg-white/10 relative">
        <div
          className="h-full rounded-full transition-none"
          style={{ width: `${pct}%`, background: branding.primaryColor }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/60"
          style={{ left: `${targetPct}%` }}
        />
      </div>
      <button
        onClick={handleStop}
        disabled={stopped}
        className="px-8 py-4 rounded-lg font-bold tracking-widest text-sm disabled:opacity-50"
        style={{ background: branding.primaryColor, color: branding.backgroundColor }}
      >
        STOP
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create PourDrink.tsx**

```typescript
// src/components/games/skins/precision_stop/PourDrink.tsx
import { motion } from 'motion/react';
import type { SkinConfig } from '../../../../types';

interface BrandingColors {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  tone: string;
}

interface Props {
  currentValue: number;
  maxValue: number;
  targetValue: number;
  stopped: boolean;
  onStop: () => void;
  config: SkinConfig;
  branding: BrandingColors;
}

export function PourDrink({ currentValue, maxValue, targetValue, stopped, onStop, config, branding }: Props) {
  const fillPct = (currentValue / maxValue) * 100;
  const targetPct = (targetValue / maxValue) * 100;
  const unit = config.unit ?? '%';

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
      {/* Flask */}
      <div className="relative w-32 h-56 flex flex-col justify-end">
        {/* Flask outline */}
        <div
          className="absolute inset-0 rounded-b-3xl rounded-t-lg border-2"
          style={{ borderColor: branding.primaryColor + '60' }}
        />
        {/* Target line */}
        <div
          className="absolute left-0 right-0 border-t-2 border-dashed z-10 flex items-center"
          style={{
            bottom: `${targetPct}%`,
            borderColor: branding.accentColor,
          }}
        >
          <span
            className="absolute -right-10 text-xs font-bold"
            style={{ color: branding.accentColor }}
          >
            {targetValue}{unit}
          </span>
        </div>
        {/* Liquid fill */}
        <motion.div
          className="rounded-b-3xl rounded-t-none absolute bottom-0 left-0 right-0"
          style={{ background: branding.primaryColor + 'CC' }}
          animate={{ height: `${fillPct}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
        {/* Current value overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center z-20 text-2xl font-black"
          style={{ color: branding.textColor }}
        >
          {currentValue}{unit}
        </div>
      </div>

      {/* Instruction */}
      <p className="text-sm opacity-60 text-center" style={{ color: branding.textColor }}>
        Stop the pour at {targetValue}{unit}
      </p>

      {/* Stop button */}
      <button
        onClick={onStop}
        disabled={stopped}
        className="w-48 py-4 rounded-xl font-black tracking-widest text-base transition-all active:scale-95 disabled:opacity-40"
        style={{ background: branding.primaryColor, color: branding.backgroundColor }}
      >
        {stopped ? 'STOPPED' : 'STOP'}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/games/primitives/PrecisionStop.tsx src/components/games/skins/precision_stop/PourDrink.tsx
git commit -m "feat: add PrecisionStop primitive + PourDrink skin (Splitflask)"
```

---

### Task 7: MultiDial primitive + CombinationLock skin

**Files:**
- Create: `src/components/games/primitives/MultiDial.tsx`
- Create: `src/components/games/skins/multi_dial/CombinationLock.tsx`

- [ ] **Step 1: Create MultiDial.tsx**

```typescript
// src/components/games/primitives/MultiDial.tsx
import { useState, useCallback } from 'react';
import type { SkinConfig } from '../../../types';
import { CombinationLock } from '../skins/multi_dial/CombinationLock';

interface BrandingColors {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  tone: string;
}

interface Props {
  config: SkinConfig;
  skin: string;
  branding: BrandingColors;
  onResult: (success: boolean) => void;
}

export type DialPhase = 'playing' | 'checking' | 'done';

export function MultiDial({ config, skin, branding, onResult }: Props) {
  const digits = config.digits ?? 3;
  const [values, setValues] = useState<number[]>(Array(digits).fill(0));
  const [phase, setPhase] = useState<DialPhase>('playing');

  const handleChange = useCallback((index: number, delta: number) => {
    if (phase !== 'playing') return;
    setValues(prev => {
      const next = [...prev];
      next[index] = ((next[index] + delta + 10) % 10);
      return next;
    });
  }, [phase]);

  const handleSubmit = useCallback(() => {
    if (phase !== 'playing') return;
    setPhase('checking');
    // Always fails — combination is secret, player never knows it
    setTimeout(() => {
      setPhase('done');
      onResult(false);
    }, 1800);
  }, [phase, onResult]);

  const skinProps = { values, phase, onDigitChange: handleChange, onSubmit: handleSubmit, config, branding };

  if (skin === 'combination_lock') return <CombinationLock {...skinProps} />;

  // Generic fallback
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="flex gap-4">
        {values.map((v, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <button onClick={() => handleChange(i, -1)} className="text-2xl" style={{ color: branding.textColor }}>▲</button>
            <span className="text-4xl font-black w-12 text-center" style={{ color: branding.accentColor }}>{v}</span>
            <button onClick={() => handleChange(i, 1)} className="text-2xl" style={{ color: branding.textColor }}>▼</button>
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={phase !== 'playing'}
        className="px-8 py-4 rounded-lg font-bold tracking-widest"
        style={{ background: branding.primaryColor, color: branding.backgroundColor }}
      >
        {phase === 'checking' ? 'CHECKING...' : 'UNLOCK'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create CombinationLock.tsx**

```typescript
// src/components/games/skins/multi_dial/CombinationLock.tsx
import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SkinConfig } from '../../../../types';
import type { DialPhase } from '../../primitives/MultiDial';

interface BrandingColors {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  tone: string;
}

interface Props {
  values: number[];
  phase: DialPhase;
  onDigitChange: (index: number, delta: number) => void;
  onSubmit: () => void;
  config: SkinConfig;
  branding: BrandingColors;
}

export function CombinationLock({ values, phase, onDigitChange, onSubmit, branding }: Props) {
  const dragStartY = useRef<Record<number, number>>({});

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    dragStartY.current[index] = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (index: number, e: React.PointerEvent) => {
    if (dragStartY.current[index] === undefined) return;
    const delta = e.clientY - dragStartY.current[index];
    if (Math.abs(delta) >= 40) {
      onDigitChange(index, delta > 0 ? 1 : -1);
      dragStartY.current[index] = e.clientY;
    }
  };

  const handlePointerUp = (index: number) => {
    delete dragStartY.current[index];
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs tracking-widest opacity-50 mb-1" style={{ color: branding.textColor }}>
          DRAG UP/DOWN TO CHANGE
        </p>
      </div>

      {/* Dials */}
      <div
        className="flex gap-3 p-4 rounded-2xl border"
        style={{ borderColor: branding.primaryColor + '40', background: branding.backgroundColor }}
      >
        {values.map((v, i) => (
          <div
            key={i}
            className="relative w-16 h-24 rounded-xl overflow-hidden flex items-center justify-center cursor-ns-resize select-none border"
            style={{
              borderColor: branding.primaryColor + '60',
              background: branding.textColor + '08',
            }}
            onPointerDown={(e) => handlePointerDown(i, e)}
            onPointerMove={(e) => handlePointerMove(i, e)}
            onPointerUp={() => handlePointerUp(i)}
          >
            {/* Prev */}
            <span
              className="absolute top-1 text-xl font-black opacity-20"
              style={{ color: branding.accentColor }}
            >
              {(v + 9) % 10}
            </span>
            {/* Current */}
            <AnimatePresence mode="popLayout">
              <motion.span
                key={v}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-4xl font-black z-10"
                style={{ color: branding.accentColor }}
              >
                {v}
              </motion.span>
            </AnimatePresence>
            {/* Next */}
            <span
              className="absolute bottom-1 text-xl font-black opacity-20"
              style={{ color: branding.accentColor }}
            >
              {(v + 1) % 10}
            </span>
            {/* Checking spin overlay */}
            {phase === 'checking' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-xl"
                style={{ background: branding.primaryColor + '20' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.4, repeat: Infinity }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Unlock button */}
      <button
        onClick={onSubmit}
        disabled={phase !== 'playing'}
        className="w-48 py-4 rounded-xl font-black tracking-widest text-base transition-all active:scale-95 disabled:opacity-50"
        style={{ background: branding.primaryColor, color: branding.backgroundColor }}
      >
        {phase === 'checking' ? 'CHECKING...' : 'UNLOCK'}
      </button>

      <p className="text-xs opacity-30 tracking-widest" style={{ color: branding.textColor }}>
        {values.join('-')}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/games/primitives/MultiDial.tsx src/components/games/skins/multi_dial/CombinationLock.tsx
git commit -m "feat: add MultiDial primitive + CombinationLock skin (CyberBackpack)"
```

---

### Task 8: PickOne primitive + MysteryBox skin

**Files:**
- Create: `src/components/games/primitives/PickOne.tsx`
- Create: `src/components/games/skins/pick_one/MysteryBox.tsx`

- [ ] **Step 1: Create PickOne.tsx**

```typescript
// src/components/games/primitives/PickOne.tsx
import { useState, useCallback } from 'react';
import type { SkinConfig } from '../../../types';
import { MysteryBox } from '../skins/pick_one/MysteryBox';

interface BrandingColors {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  tone: string;
}

interface Props {
  config: SkinConfig;
  skin: string;
  branding: BrandingColors;
  onResult: (success: boolean) => void;
}

export function PickOne({ config, skin, branding, onResult }: Props) {
  const count = config.count ?? 3;
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handlePick = useCallback((index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setTimeout(() => {
      setRevealed(true);
      setTimeout(() => onResult(false), 800);
    }, 600);
  }, [selected, onResult]);

  const skinProps = { count, selected, revealed, onPick: handlePick, config, branding };

  if (skin === 'mystery_box') return <MysteryBox {...skinProps} />;

  // Generic fallback
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <p className="text-sm opacity-60" style={{ color: branding.textColor }}>Choose one:</p>
      <div className="flex gap-4">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            onClick={() => handlePick(i)}
            className="w-20 h-20 rounded-xl font-bold text-lg border-2 transition-all"
            style={{
              borderColor: selected === i ? branding.primaryColor : branding.primaryColor + '40',
              background: selected === i ? branding.primaryColor + '20' : 'transparent',
              color: branding.textColor,
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create MysteryBox.tsx**

```typescript
// src/components/games/skins/pick_one/MysteryBox.tsx
import { motion } from 'motion/react';
import type { SkinConfig } from '../../../../types';

interface BrandingColors {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  tone: string;
}

interface Props {
  count: number;
  selected: number | null;
  revealed: boolean;
  onPick: (index: number) => void;
  config: SkinConfig;
  branding: BrandingColors;
}

const BOX_EMOJIS = ['📦', '🎁', '🎀'];

export function MysteryBox({ count, selected, revealed, onPick, config, branding }: Props) {
  const labels = config.box_labels ?? Array.from({ length: count }, (_, i) => `Box ${i + 1}`);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-8">
      <p className="text-sm opacity-60 tracking-widest" style={{ color: branding.textColor }}>
        PICK ONE
      </p>
      <div className="flex gap-4">
        {Array.from({ length: count }, (_, i) => (
          <motion.button
            key={i}
            onClick={() => onPick(i)}
            disabled={selected !== null}
            whileHover={{ y: selected === null ? -4 : 0 }}
            whileTap={{ scale: 0.95 }}
            animate={selected === i && revealed ? { rotateY: 180 } : {}}
            className="w-24 h-28 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-colors disabled:cursor-default"
            style={{
              borderColor: selected === i ? branding.primaryColor : branding.primaryColor + '30',
              background: selected === i ? branding.primaryColor + '15' : branding.textColor + '05',
            }}
          >
            <span className="text-3xl">{BOX_EMOJIS[i % BOX_EMOJIS.length]}</span>
            <span className="text-xs font-bold tracking-wide" style={{ color: branding.textColor }}>
              {labels[i]}
            </span>
            {selected === i && revealed && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xl"
              >
                🎉
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>
      {selected === null && (
        <p className="text-xs opacity-40" style={{ color: branding.textColor }}>
          One box holds your reward
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/games/primitives/PickOne.tsx src/components/games/skins/pick_one/MysteryBox.tsx
git commit -m "feat: add PickOne primitive + MysteryBox skin"
```

---

### Task 9: CreateExperience view

**Files:**
- Create: `src/views/CreateExperience.tsx`

- [ ] **Step 1: Create src/views/CreateExperience.tsx**

```typescript
// src/views/CreateExperience.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeBrand } from '../services/geminiService';

const GOAL_OPTIONS = [
  { value: 'lead_capture', label: 'Capture email / SMS' },
  { value: 'conversion', label: 'Increase conversion' },
  { value: 'aov', label: 'Increase AOV' },
  { value: 'brand_awareness', label: 'Brand experience / launch' },
];

const REWARD_OPTIONS = [
  { value: 'percentage_off', label: 'Percentage discount' },
  { value: 'free_shipping', label: 'Free shipping' },
  { value: 'free_product', label: 'Free product' },
  { value: 'mystery', label: 'Mystery reward' },
];

export default function CreateExperience() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [url, setUrl] = useState('');
  const [goal, setGoal] = useState('lead_capture');
  const [reward, setReward] = useState('free_shipping');
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { setError('Please enter a product or store URL'); return; }
    setError('');
    dispatch({ type: 'RESET_FLOW' });
    dispatch({ type: 'SET_ANALYZING', payload: true });
    navigate('/analyze', { state: { url: url.trim(), goal, reward } });
  };

  return (
    <div className="min-h-full flex flex-col justify-center items-center p-8 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-3">Create an Experience</h1>
        <p className="text-neutral-500 max-w-md mx-auto leading-relaxed">
          Paste your product URL. Our AI will analyze what's inherently playable about it and generate brand-specific game concepts.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="w-full space-y-5">
        {/* URL input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Product or store URL</label>
          <div className="relative flex items-center">
            <Link2 className="absolute left-4 w-4 h-4 text-neutral-400" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://cyberbackpack.com/products/cyberbackpack"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>

        {/* Goal selector */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Primary goal <span className="text-neutral-400 font-normal">(optional)</span></label>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGoal(opt.value)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors border ${
                  goal === opt.value
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reward selector */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Reward type <span className="text-neutral-400 font-normal">(optional)</span></label>
          <div className="grid grid-cols-2 gap-2">
            {REWARD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setReward(opt.value)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors border ${
                  reward === opt.value
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center px-6 py-4 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors text-sm tracking-wide"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Analyze Brand
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/CreateExperience.tsx
git commit -m "feat: add CreateExperience view with URL input, goal + reward selectors"
```

---

### Task 10: AnalyzeStore view (rewritten)

**Files:**
- Modify: `src/views/AnalyzeStore.tsx`

- [ ] **Step 1: Rewrite src/views/AnalyzeStore.tsx**

```typescript
// src/views/AnalyzeStore.tsx
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Wand2, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeBrand, generateConcepts } from '../services/geminiService';

export default function AnalyzeStore() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();
  const hasRun = useRef(false);

  const { url } = (location.state as { url?: string; goal?: string; reward?: string }) ?? {};

  useEffect(() => {
    if (hasRun.current) return;
    if (!url && !state.analyzing) {
      navigate('/create');
      return;
    }
    hasRun.current = true;

    const run = async () => {
      try {
        dispatch({ type: 'SET_ANALYZING', payload: true });
        const profile = await analyzeBrand(url ?? 'https://example.com');
        dispatch({ type: 'SET_BRAND_PROFILE', payload: profile });
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to analyze brand. Check your API key or try a different URL.' });
      }
    };
    run();
  }, []);

  const handleGenerateConcepts = async () => {
    if (!state.brandProfile) return;
    dispatch({ type: 'SET_GENERATING_CONCEPTS', payload: true });
    try {
      const concepts = await generateConcepts(state.brandProfile);
      dispatch({ type: 'SET_CONCEPTS', payload: concepts });
      navigate('/concepts');
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate concepts. Please try again.' });
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto h-full flex flex-col justify-center">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden p-8">
        <AnimatePresence mode="wait">
          {state.analyzing && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 flex flex-col items-center"
            >
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Analyzing Brand</h2>
              <p className="text-neutral-500 max-w-sm mx-auto">
                Scanning products, images, descriptions, and brand tone...
              </p>
              {url && (
                <p className="text-xs text-neutral-400 mt-4 font-mono">{url}</p>
              )}
            </motion.div>
          )}

          {state.error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 flex flex-col items-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Analysis Failed</h2>
              <p className="text-neutral-500 max-w-sm mx-auto mb-6">{state.error}</p>
              <button
                onClick={() => navigate('/create')}
                className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {state.brandProfile && !state.analyzing && !state.error && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: state.brandProfile.primaryColor + '20', color: state.brandProfile.primaryColor }}>
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Analysis Complete</h2>
                  <p className="text-neutral-500 text-sm">{state.brandProfile.brandName} — {state.brandProfile.category}</p>
                </div>
                {/* Color swatches */}
                <div className="ml-auto flex gap-2">
                  {[state.brandProfile.primaryColor, state.brandProfile.accentColor, state.brandProfile.backgroundColor].map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border border-neutral-200 shadow-sm" style={{ background: c }} title={c} />
                  ))}
                </div>
              </div>

              {/* USP */}
              <div className="bg-neutral-50 rounded-xl p-4">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Core USP</p>
                <p className="text-neutral-900 font-medium">{state.brandProfile.usp}</p>
              </div>

              {/* Playable attributes */}
              <div>
                <p className="text-sm font-semibold text-neutral-700 mb-3">Playable attributes</p>
                <div className="grid grid-cols-2 gap-3">
                  {state.brandProfile.playableAttributes.map((attr, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start p-3 rounded-xl border border-neutral-100 bg-neutral-50"
                    >
                      <div className="w-8 h-8 rounded-lg border border-neutral-200 bg-white flex items-center justify-center mr-3 shadow-sm flex-shrink-0 text-sm">
                        {['🔒', '🛡️', '⚡', '🎯', '✨'][i % 5]}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">{attr.label}</p>
                        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{attr.reason}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Interaction metaphors */}
              <div>
                <p className="text-sm font-semibold text-neutral-700 mb-3">Best interaction metaphors</p>
                <div className="flex flex-wrap gap-2">
                  {state.brandProfile.interactionMetaphors.map((m, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-2">
                <button
                  onClick={handleGenerateConcepts}
                  disabled={state.generatingConcepts}
                  className="inline-flex items-center justify-center px-8 py-4 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                >
                  {state.generatingConcepts ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" />Generate Experiences<ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/AnalyzeStore.tsx
git commit -m "feat: rewrite AnalyzeStore with real Gemini analyzeBrand call and progressive reveal"
```

---

### Task 11: SelectConcept view (rewritten)

**Files:**
- Modify: `src/views/SelectConcept.tsx`

- [ ] **Step 1: Rewrite src/views/SelectConcept.tsx**

```typescript
// src/views/SelectConcept.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, RefreshCw, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { buildGameSpec, generateConcepts } from '../services/geminiService';
import type { Concept } from '../types';

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-500 w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-neutral-700 w-4">{value}</span>
    </div>
  );
}

function ConceptCard({ concept, onSelect, loading }: { concept: Concept; onSelect: () => void; loading: boolean }) {
  const avgScore = Math.round(
    Object.values(concept.scores).reduce((a, b) => a + b, 0) / Object.keys(concept.scores).length
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-neutral-900">{concept.name}</h3>
          <div className="flex gap-2 mt-1.5">
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">{concept.primitive}</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{concept.skin}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-neutral-50 px-2.5 py-1.5 rounded-lg">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-sm font-bold text-neutral-700">{avgScore}/10</span>
        </div>
      </div>

      <p className="text-sm text-neutral-600 leading-relaxed mb-3">{concept.premise}</p>
      <p className="text-xs text-neutral-500 italic mb-5 leading-relaxed">{concept.whyItFits}</p>

      {/* Scores */}
      <div className="space-y-1.5 mb-6">
        <ScoreBar label="Brand specificity" value={concept.scores.brandSpecificity} />
        <ScoreBar label="Product demo" value={concept.scores.productDemonstration} />
        <ScoreBar label="Simplicity" value={concept.scores.simplicity} />
        <ScoreBar label="Suspense" value={concept.scores.suspense} />
        <ScoreBar label="Mobile usability" value={concept.scores.mobileUsability} />
        <ScoreBar label="Conversion" value={concept.scores.conversionPotential} />
      </div>

      {/* Headline preview */}
      <div className="bg-neutral-900 rounded-xl px-4 py-3 text-center mb-5">
        <p className="text-white font-black tracking-wider text-sm">{concept.headline}</p>
        <p className="text-neutral-400 text-xs mt-1">{concept.ctaText}</p>
      </div>

      <button
        onClick={onSelect}
        disabled={loading}
        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Build This Experience <ArrowRight className="w-4 h-4 ml-2" /></>}
      </button>
    </motion.div>
  );
}

export default function SelectConcept() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [regenNote, setRegenNote] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const handleSelect = async (concept: Concept) => {
    if (!state.brandProfile) return;
    setBuildingId(concept.id);
    dispatch({ type: 'SELECT_CONCEPT', payload: concept });
    dispatch({ type: 'SET_BUILDING_SPEC', payload: true });
    try {
      const spec = await buildGameSpec(concept, state.brandProfile);
      dispatch({ type: 'SET_GAME_SPEC', payload: spec });
      navigate('/editor');
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to build game spec. Please try again.' });
      setBuildingId(null);
    }
  };

  const handleRegenerate = async () => {
    if (!state.brandProfile) return;
    setRegenerating(true);
    try {
      // Append user note to brand profile USP for regeneration context
      const modifiedProfile = regenNote
        ? { ...state.brandProfile, usp: `${state.brandProfile.usp}. Additional direction: ${regenNote}` }
        : state.brandProfile;
      const concepts = await generateConcepts(modifiedProfile);
      dispatch({ type: 'SET_CONCEPTS', payload: concepts });
      setRegenNote('');
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to regenerate. Please try again.' });
    } finally {
      setRegenerating(false);
    }
  };

  if (!state.concepts.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-neutral-500">Generating concepts...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-neutral-900 mb-3">Choose an Experience</h2>
        <p className="text-neutral-500 text-lg">
          AI-generated concepts mapped to {state.brandProfile?.productName ?? 'your product'}'s playable attributes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {state.concepts.map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            onSelect={() => handleSelect(concept)}
            loading={buildingId === concept.id}
          />
        ))}
      </div>

      {/* Regenerate */}
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <input
          type="text"
          value={regenNote}
          onChange={(e) => setRegenNote(e.target.value)}
          placeholder="Make it funnier / More premium / Harder..."
          className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          {regenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Regenerate
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/SelectConcept.tsx
git commit -m "feat: rewrite SelectConcept with real AI concepts, quality scores, and regenerate"
```

---

### Task 12: Editor view (rewritten)

**Files:**
- Modify: `src/views/Editor.tsx`

- [ ] **Step 1: Rewrite src/views/Editor.tsx**

```typescript
// src/views/Editor.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Palette, Gift, Settings2, ArrowRight, Save, Smartphone, Monitor } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GameRenderer } from '../components/games/GameRenderer';
import { cyberbackpackSpec } from '../data/demos';

type Tab = 'content' | 'design' | 'rewards' | 'integration';
type Device = 'mobile' | 'desktop';

export default function Editor() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [device, setDevice] = useState<Device>('mobile');

  // Fall back to CyberBackpack demo if no spec in context (e.g. direct navigation)
  const spec = state.gameSpec ?? cyberbackpackSpec;

  const update = (patch: Parameters<typeof dispatch>[0]) => dispatch(patch as any);

  const tabs: { id: Tab; icon: typeof MessageSquare; label: string }[] = [
    { id: 'content', icon: MessageSquare, label: 'Content' },
    { id: 'design', icon: Palette, label: 'Design' },
    { id: 'rewards', icon: Gift, label: 'Rewards' },
    { id: 'integration', icon: Settings2, label: 'Integration' },
  ];

  return (
    <div className="flex h-full bg-neutral-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-neutral-200 flex flex-col h-full overflow-y-auto">
        <div className="p-5 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900">{spec.experience.name}</h2>
          <p className="text-xs text-neutral-500 mt-0.5 capitalize">{spec.mechanic.primitive.replace('_', ' ')} · {spec.mechanic.skin.replace('_', ' ')}</p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 border-b border-neutral-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="p-5 flex-1 space-y-5 overflow-y-auto">
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Headline</label>
                <input
                  type="text"
                  value={spec.intro.headline}
                  onChange={(e) => dispatch({ type: 'UPDATE_GAME_SPEC', payload: { intro: { headline: e.target.value, body: spec.intro.body, cta: spec.intro.cta } } })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Body copy</label>
                <textarea
                  rows={3}
                  value={spec.intro.body}
                  onChange={(e) => dispatch({ type: 'UPDATE_GAME_SPEC', payload: { intro: { headline: spec.intro.headline, body: e.target.value, cta: spec.intro.cta } } })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Button text</label>
                <input
                  type="text"
                  value={spec.intro.cta}
                  onChange={(e) => dispatch({ type: 'UPDATE_GAME_SPEC', payload: { intro: { headline: spec.intro.headline, body: spec.intro.body, cta: e.target.value } } })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="border-t border-neutral-100 pt-4">
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Result headline</label>
                <input
                  type="text"
                  value={spec.result.headline}
                  onChange={(e) => dispatch({ type: 'UPDATE_GAME_SPEC', payload: { result: { ...spec.result, headline: e.target.value } } })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-4">
              {([
                ['Background', 'backgroundColor'],
                ['Text color', 'textColor'],
                ['Primary color', 'primaryColor'],
                ['Accent color', 'accentColor'],
              ] as [string, keyof typeof spec.branding][]).map(([label, key]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-neutral-700">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={spec.branding[key] as string}
                      onChange={(e) => dispatch({ type: 'UPDATE_GAME_SPEC', payload: { branding: { ...spec.branding, [key]: e.target.value } } })}
                      className="w-8 h-8 rounded-md border border-neutral-200 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-neutral-500">{spec.branding[key] as string}</span>
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Font style</label>
                <select
                  value={spec.branding.fontStyle}
                  onChange={(e) => dispatch({ type: 'UPDATE_GAME_SPEC', payload: { branding: { ...spec.branding, fontStyle: e.target.value as any } } })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sans">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                  <option value="display">Display</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Reward type</label>
                <select
                  value={spec.reward.type}
                  onChange={(e) => dispatch({ type: 'UPDATE_GAME_SPEC', payload: { reward: { ...spec.reward, type: e.target.value as any } } })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free_shipping">Free shipping</option>
                  <option value="percentage_off">Percentage off</option>
                  <option value="fixed_off">Fixed amount off</option>
                  <option value="free_product">Free product</option>
                  <option value="mystery">Mystery reward</option>
                </select>
              </div>
              {(spec.reward.type === 'percentage_off' || spec.reward.type === 'fixed_off') && (
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Value</label>
                  <input
                    type="text"
                    value={spec.reward.value ?? ''}
                    onChange={(e) => dispatch({ type: 'UPDATE_GAME_SPEC', payload: { reward: { ...spec.reward, value: e.target.value } } })}
                    placeholder={spec.reward.type === 'percentage_off' ? '15' : '10'}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Reward message</label>
                <textarea
                  rows={3}
                  value={spec.reward.message}
                  onChange={(e) => dispatch({ type: 'UPDATE_GAME_SPEC', payload: { reward: { ...spec.reward, message: e.target.value } } })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'integration' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500">Klaviyo form IDs — visitors are sent to these forms after the game completes.</p>
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Standard form ID</label>
                <input
                  type="text"
                  value={spec.conversion.standardFormId ?? ''}
                  onChange={(e) => dispatch({ type: 'UPDATE_GAME_SPEC', payload: { conversion: { ...spec.conversion, standardFormId: e.target.value } } })}
                  placeholder="XXXXXX"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Winner form ID <span className="font-normal normal-case">(optional)</span></label>
                <input
                  type="text"
                  value={spec.conversion.winnerFormId ?? ''}
                  onChange={(e) => dispatch({ type: 'UPDATE_GAME_SPEC', payload: { conversion: { ...spec.conversion, winnerFormId: e.target.value } } })}
                  placeholder="XXXXXX"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-neutral-50 rounded-xl p-4 text-xs text-neutral-600 leading-relaxed">
                After the game, Playable Commerce calls:<br />
                <code className="font-mono bg-white px-1.5 py-0.5 rounded mt-1 block">
                  window._klOnsite.push(['openForm', formId])
                </code>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative bg-neutral-100">
        {/* Top bar */}
        <div className="absolute top-6 left-8 right-8 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setDevice('mobile')}
              className={`p-2 rounded-md transition-colors ${device === 'mobile' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('desktop')}
              className={`p-2 rounded-md transition-colors ${device === 'desktop' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm flex items-center">
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </button>
            <button
              onClick={() => navigate('/targeting')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center"
            >
              Continue to Targeting
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>

        {/* Phone mockup */}
        {device === 'mobile' && (
          <div className="relative w-[375px] h-[720px] bg-white rounded-[3rem] shadow-2xl border-[14px] border-neutral-900 overflow-hidden flex flex-col">
            <div className="absolute top-0 inset-x-0 h-6 bg-neutral-900 rounded-b-3xl mx-auto w-36 z-20" />
            <div className="flex-1 overflow-hidden mt-3">
              <GameRenderer spec={spec} />
            </div>
          </div>
        )}

        {/* Desktop mockup */}
        {device === 'desktop' && (
          <div className="relative w-[680px] h-[480px] bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden flex flex-col">
            <div className="h-8 bg-neutral-100 border-b border-neutral-200 flex items-center px-4 gap-2 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <GameRenderer spec={spec} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/Editor.tsx
git commit -m "feat: rewrite Editor with live GameRenderer, sidebar tabs, device switcher"
```

---

### Task 13: Dashboard update + Targeting

**Files:**
- Modify: `src/views/Dashboard.tsx`
- Modify: `src/views/Targeting.tsx`

- [ ] **Step 1: Update Dashboard.tsx — add demo rows with Edit buttons**

In `src/views/Dashboard.tsx`, replace the `activeExperiences` array and the "Create Experience" link:

```typescript
// Add at top with other imports:
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { splitflaskSpec, cyberbackpackSpec } from '../data/demos';
```

Replace the `<Link to="/analyze"` button with:
```typescript
<button
  onClick={() => navigate('/create')}
  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
>
  <Plus className="w-4 h-4 mr-2" />
  Create Experience
</button>
```

Replace `activeExperiences` array with:
```typescript
const demoExperiences = [
  {
    id: 'splitflask',
    name: 'Stop the Pour',
    brand: 'Splitflask',
    placement: 'Homepage popup',
    metrics: { leads: '27.1%', revenue: '$4,318' },
    status: 'active',
    spec: splitflaskSpec,
  },
  {
    id: 'cyberbackpack',
    name: 'Crack the Lock',
    brand: 'CyberBackpack',
    placement: 'Product page popup',
    metrics: { leads: '19.4%', revenue: '$3,241' },
    status: 'active',
    spec: cyberbackpackSpec,
  },
];
```

Update the `Edit` button in the table row to dispatch and navigate:
```typescript
<button
  onClick={() => {
    dispatch({ type: 'SET_GAME_SPEC', payload: exp.spec });
    navigate('/editor');
  }}
  className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
>
  Edit
</button>
```

Add `const navigate = useNavigate(); const { dispatch } = useApp();` inside `Dashboard` function.

- [ ] **Step 2: Rewrite Targeting.tsx**

```typescript
// src/views/Targeting.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

interface TargetingRules {
  triggerDelay: number;
  scrollDepth: number;
  visitorType: 'all' | 'new' | 'returning';
  device: 'all' | 'mobile' | 'desktop';
  placement: 'popup' | 'embedded' | 'exit_intent' | 'cart';
  frequencyCap: number;
}

export default function Targeting() {
  const navigate = useNavigate();
  const [rules, setRules] = useState<TargetingRules>({
    triggerDelay: 10,
    scrollDepth: 25,
    visitorType: 'new',
    device: 'all',
    placement: 'popup',
    frequencyCap: 30,
  });
  const [published, setPublished] = useState(false);

  const set = <K extends keyof TargetingRules>(key: K, value: TargetingRules[K]) =>
    setRules(prev => ({ ...prev, [key]: value }));

  const handlePublish = () => {
    setPublished(true);
    setTimeout(() => navigate('/'), 2000);
  };

  if (published) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">Experience Published</h2>
        <p className="text-neutral-500">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Targeting Rules</h1>
      <p className="text-neutral-500 mb-8">Configure when and to whom this experience shows.</p>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 space-y-7">
        {/* Trigger delay */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-neutral-700">Time on site before showing</label>
            <span className="text-sm font-bold text-neutral-900">{rules.triggerDelay}s</span>
          </div>
          <input type="range" min={0} max={60} step={5} value={rules.triggerDelay}
            onChange={(e) => set('triggerDelay', +e.target.value)} className="w-full" />
          <div className="flex justify-between text-xs text-neutral-400 mt-1"><span>0s (immediate)</span><span>60s</span></div>
        </div>

        {/* Scroll depth */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-neutral-700">Minimum scroll depth</label>
            <span className="text-sm font-bold text-neutral-900">{rules.scrollDepth}%</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={rules.scrollDepth}
            onChange={(e) => set('scrollDepth', +e.target.value)} className="w-full" />
        </div>

        {/* Visitor type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Visitor type</label>
          <div className="flex gap-2">
            {(['all', 'new', 'returning'] as const).map(v => (
              <button key={v} onClick={() => set('visitorType', v)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors border ${rules.visitorType === v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Device */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Device</label>
          <div className="flex gap-2">
            {(['all', 'mobile', 'desktop'] as const).map(v => (
              <button key={v} onClick={() => set('device', v)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors border ${rules.device === v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Placement */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Placement</label>
          <div className="grid grid-cols-2 gap-2">
            {(['popup', 'embedded', 'exit_intent', 'cart'] as const).map(v => (
              <button key={v} onClick={() => set('placement', v)}
                className={`py-2 rounded-lg text-sm font-medium capitalize transition-colors border ${rules.placement === v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}>
                {v.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency cap */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-neutral-700">Frequency cap (days between shows)</label>
            <span className="text-sm font-bold text-neutral-900">{rules.frequencyCap} days</span>
          </div>
          <input type="range" min={1} max={90} step={1} value={rules.frequencyCap}
            onChange={(e) => set('frequencyCap', +e.target.value)} className="w-full" />
        </div>

        {/* Summary */}
        <div className="bg-neutral-50 rounded-xl p-4 text-sm text-neutral-600 leading-relaxed">
          Show to <strong>{rules.visitorType}</strong> visitors on <strong>{rules.device}</strong> devices, after <strong>{rules.triggerDelay}s</strong> on site and <strong>{rules.scrollDepth}%</strong> scroll, as a <strong>{rules.placement.replace('_', ' ')}</strong>. Show once every <strong>{rules.frequencyCap} days</strong>.
        </div>

        <button
          onClick={handlePublish}
          className="w-full flex items-center justify-center px-6 py-4 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
        >
          Publish Experience
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/views/Dashboard.tsx src/views/Targeting.tsx
git commit -m "feat: update Dashboard with demo edit buttons; add functional Targeting view"
```

---

### Task 14: App.tsx + Layout wiring

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Wrap app in AppProvider in src/main.tsx**

```typescript
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AppProvider } from './context/AppContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);
```

- [ ] **Step 2: Add /create route to App.tsx**

```typescript
// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import ConnectStore from './views/ConnectStore';
import AnalyzeStore from './views/AnalyzeStore';
import SelectConcept from './views/SelectConcept';
import Editor from './views/Editor';
import Targeting from './views/Targeting';
import Pricing from './views/Pricing';
import CreateExperience from './views/CreateExperience';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateExperience />} />
          <Route path="/connect" element={<ConnectStore />} />
          <Route path="/analyze" element={<AnalyzeStore />} />
          <Route path="/concepts" element={<SelectConcept />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/targeting" element={<Targeting />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
```

- [ ] **Step 3: Update Layout nav to point to /create**

In `src/components/Layout.tsx`, change the "Create Experience" nav item path from `/analyze` to `/create`:

```typescript
{ icon: Wand2, label: 'Create Experience', path: '/create' },
```

- [ ] **Step 4: Final lint check**

Run: `npm run lint`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/main.tsx src/App.tsx src/components/Layout.tsx
git commit -m "feat: wire AppProvider, add /create route, update nav"
```

---

### Task 15: Manual smoke test

No code changes. Verify the full flow works end-to-end.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Open: `http://localhost:3000`

- [ ] **Step 2: Test Dashboard demo edit**

1. Click "Edit" on CyberBackpack row
2. Expected: Editor opens with CombinationLock game, dark cyberpunk theme
3. Drag the number dials up/down — digits should change
4. Click UNLOCK — checking animation plays, then result fires to GameRenderer

- [ ] **Step 3: Test Splitflask demo**

1. From Dashboard, click "Edit" on Splitflask row
2. Expected: Editor opens with PourDrink game
3. Click START POURING — flask fills
4. Click STOP — result fires

- [ ] **Step 4: Test full AI flow (requires GEMINI_API_KEY)**

```bash
GEMINI_API_KEY=your_key_here npm run dev
```

1. Click "Create Experience" in nav
2. Paste a product URL (e.g. `https://ridgewallet.com/products/wallet`)
3. Click "Analyze Brand"
4. Expected: AnalyzeStore shows loading then reveals brand attributes
5. Click "Generate Experiences"
6. Expected: 3 concept cards appear with quality score bars
7. Click "Build This Experience" on any concept
8. Expected: Editor opens with a live playable game

- [ ] **Step 5: Test sidebar editing**

In Editor, change the headline text — game preview updates live.
Change a color — game preview reflects the new color immediately.

- [ ] **Step 6: Test Targeting → publish flow**

Click "Continue to Targeting" → adjust sliders → click "Publish Experience" → success state → auto-redirect to Dashboard.

---

### Appendix: File map

All files created or modified by this plan:

**Created:**
- `src/context/AppContext.tsx`
- `src/services/geminiService.ts`
- `src/data/demos.ts`
- `src/data/skins.ts`
- `src/components/games/GameRenderer.tsx`
- `src/components/games/primitives/PrecisionStop.tsx`
- `src/components/games/primitives/MultiDial.tsx`
- `src/components/games/primitives/PickOne.tsx`
- `src/components/games/skins/precision_stop/PourDrink.tsx`
- `src/components/games/skins/multi_dial/CombinationLock.tsx`
- `src/components/games/skins/pick_one/MysteryBox.tsx`
- `src/views/CreateExperience.tsx`

**Modified:**
- `src/types.ts`
- `vite.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/views/AnalyzeStore.tsx`
- `src/views/SelectConcept.tsx`
- `src/views/Editor.tsx`
- `src/views/Dashboard.tsx`
- `src/views/Targeting.tsx`
