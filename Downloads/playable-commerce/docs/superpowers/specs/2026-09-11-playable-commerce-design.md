# Playable Commerce — Full Product Design Spec
**Date:** 2026-09-11  
**Status:** Approved  
**Scope:** Full end-to-end build — AI brand analysis, mechanic+skin game engine, live editor, demo brands

---

## 1. Product Overview

Playable Commerce is a SaaS dashboard that turns a merchant's product URL into a branded, interactive conversion experience. The merchant pastes a URL, AI analyzes what is inherently playable about the product, generates 3–5 game concepts, the merchant selects one, edits it live in a preview, and publishes it to their storefront via Shopify App Embed or universal script.

**Core magic moment:** Paste a product URL → wait ~10s → play a game built around that specific product's defining feature.

---

## 2. Architecture

### Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **AI:** `@google/genai` client-side, key from `VITE_GEMINI_API_KEY`
- **State:** React Context (`AppContext`) — single source of truth for brand profile, concepts, selected concept, game spec, and experience
- **Animation:** `motion` (Framer Motion)
- **Routing:** `react-router-dom` v7

### State Shape
```typescript
interface AppState {
  store: StoreConfig | null;           // connected store info
  brandProfile: BrandProfile | null;   // AI-extracted brand analysis
  concepts: Concept[];                 // AI-generated game concepts
  selectedConcept: Concept | null;     // merchant-chosen concept
  gameSpec: GameSpec | null;           // full game configuration
  experience: Experience | null;       // published/saved experience
}
```

### AI Service — 3 Gemini Calls
1. **`analyzeBrand(url)`** → `BrandProfile` — extracts brand name, colors, USPs, playable attributes, interaction metaphors, tone, target customer
2. **`generateConcepts(brandProfile)`** → `Concept[]` — produces 3–5 brand-specific game concepts, each with primitive selection, skin suggestion, and 7-axis quality scoring
3. **`buildGameSpec(concept, brandProfile)`** → `GameSpec` — generates the full structured config the game renderer interprets

All calls return structured JSON via Gemini's response schema enforcement. Streaming used for `analyzeBrand` to show progressive reveal.

---

## 3. GameSpec Schema

The central data structure. AI generates it; the game engine renders it. Decouples AI from rendering.

```typescript
interface GameSpec {
  experience: {
    name: string;
    goal: 'lead_capture' | 'conversion' | 'aov' | 'brand_awareness';
    surface: 'popup' | 'embedded' | 'exit_intent' | 'cart';
  };
  branding: {
    primaryColor: string;      // hex
    backgroundColor: string;   // hex
    textColor: string;         // hex
    accentColor: string;       // hex
    fontStyle: 'sans' | 'serif' | 'mono' | 'display';
    tone: string;              // e.g. "cybersecurity", "playful", "premium"
  };
  intro: {
    headline: string;
    body: string;
    cta: string;               // button text
  };
  mechanic: {
    primitive: MechanicPrimitive;
    skin: string;              // e.g. 'ruler', 'combination_lock'
    config: SkinConfig;        // skin-specific params AI fills in
  };
  result: {
    headline: string;          // e.g. "ACCESS DENIED"
    body: string;              // e.g. "You didn't crack it. But you unlocked..."
    delayMs: number;           // suspense pause before result shows
    type: 'deny' | 'reveal' | 'near_miss' | 'success';
  };
  reward: {
    type: 'free_shipping' | 'percentage_off' | 'fixed_off' | 'free_product' | 'mystery';
    value?: string;            // e.g. "15", "FREE SHIPPING"
    message: string;           // full reward reveal copy
  };
  conversion: {
    provider: 'klaviyo' | 'none';
    winnerFormId?: string;
    standardFormId?: string;
  };
}
```

---

## 4. Game Engine: Primitive + Skin Model

**Core insight:** The interaction logic (what the player does, how scoring works, timing) is fully separate from the visual representation. A "stop a moving thing at the right moment" primitive can look like a stopwatch, a measuring tape, a fuel gauge, or anything else. Adding a new brand skin requires zero changes to primitive logic.

### 7 Core Primitives

| Primitive | Interaction | Use Case |
|---|---|---|
| `precision_stop` | Stop a moving thing at a target value | Timers, meters, gauges, tape measures |
| `multi_dial` | Set N dials/wheels to a unlock value | Locks, slots, recipes, combinations |
| `pick_one` | Choose one from N mystery options | Boxes, cards, capsules, doors |
| `hold_release` | Hold to charge, release at peak | Pour, inflate, draw, tension |
| `reaction` | Tap/click when visual signal fires | Catch, flash, grab, appear |
| `drag_target` | Drag item(s) to destination(s) | Pack, sort, measure, build |
| `fill_meter` | Fill to an exact target level | Pour, charge, grow, push |

### Skin Registry (MVP)

Each skin has a parameter schema. AI fills the params; the skin renderer interprets them.

**`precision_stop`:**
- `stopwatch` — classic circular timer face
- `ruler` — horizontal tape/ruler extends, stop at inch/cm mark; params: `unit`, `orientation`, `labelStyle`, `maxValue`, `targetValue`
- `fuel_gauge` — sweeping needle; params: `minLabel`, `maxLabel`, `dangerZone`
- `countdown_bar` — horizontal bar depletes

**`multi_dial`:**
- `combination_lock` — 3 vertical number wheels, drag up/down; params: `digits`, `digit_labels[]`
- `slot_reels` — spinning reels; params: `reels`, `symbols[]`
- `safe_dial` — single circular dial; params: `steps`, `sequence[]`

**`pick_one`:**
- `mystery_box` — N boxes, tap to reveal; params: `count`, `box_labels[]`
- `card_flip` — playing cards face-down; params: `count`
- `capsule_machine` — gumball-style capsule drop; params: `count`, `colors[]`

**`hold_release`:**
- `strength_meter` — charge bar fills while held, release at peak zone; params: `peak_zone_min`, `peak_zone_max`, `label`
- `tension_bow` — pull back to charge, release at optimal tension; params: `optimal_min`, `optimal_max`

**`precision_stop`** (addition — pour skin lives here, not hold_release):
- `pour_drink` — liquid auto-pours into a vessel, tap to stop at marked target line; params: `vessel_shape`, `targetValue`, `unit`, `maxValue`, `speed`

**`reaction`:**
- `flash_tap` — screen flashes a color, tap immediately; params: `flash_color`, `window_ms`
- `catch_object` — branded object falls, tap to catch; params: `object_label`, `fall_speed`

**`drag_target`:**
- `pack_bag` — drag product items into a bag/box; params: `item_labels[]`, `container_label`
- `sort_items` — drag items to correct labeled bins; params: `items[]`, `bins[]`

**`fill_meter`:**
- `charge_bar` — tap/hold to fill a progress bar to the target zone; params: `target_min`, `target_max`, `label`
- `stack_coins` — stack coins to reach a prize tier; params: `tiers[]`, `coin_label`

### Component Architecture

```
GameRenderer
  ↓ reads mechanic.primitive
PrecisionStopPrimitive (state machine: idle→playing→result)
  ↓ passes { phase, progress, value, targetValue, config, branding }
RulerSkin | StopwatchSkin | FuelGaugeSkin
```

Each primitive:
- Owns the game loop (requestAnimationFrame or interval)
- Owns scoring logic
- Calls `onResult(success: boolean)` when game ends
- Passes normalized state to its skin via render props / context

Each skin:
- Pure visual, no game logic
- Receives `MechanicState` and `SkinConfig`
- Uses `motion` for animations
- Mobile-first touch + mouse support

---

## 5. User Flow

```
Dashboard
  └→ "Create Experience" button
       └→ CreateExperience (URL input)
            └→ AnalyzeStore (Gemini streaming, brand profile reveals)
                 └→ SelectConcept (3–5 AI concept cards with scores)
                      └→ Editor (live game preview + sidebar)
                           └→ Targeting (rules configuration)
                                └→ Publish confirmation
```

ConnectStore is reachable from Dashboard sidebar (Settings) — not required before creating.

Dashboard shows Splitflask and CyberBackpack as pre-loaded demo experiences, clickable to open their Editor with full GameSpec loaded.

---

## 6. Views

### CreateExperience (new — replaces current AnalyzeStore entry point)
- Prominent URL input: "Paste your product or store URL"
- Goal selector (optional): lead capture / conversion / AOV / launch
- Reward type (optional): discount / free shipping / free product / mystery
- "Analyze Brand" CTA → navigates to AnalyzeStore and begins Gemini call

### AnalyzeStore (rewritten)
- Streams Gemini `analyzeBrand` output progressively
- Shows brand name, detected colors (swatches), category, playable attributes (each as a card appearing in sequence)
- Shows "Best interaction metaphors" list
- "Generate Experiences" CTA → triggers `generateConcepts`, navigates to SelectConcept

### SelectConcept (rewritten)
- Shows 3–5 concept cards, each with:
  - Game name + one-line premise
  - Primitive badge + skin badge
  - 7-axis quality scores (brand specificity, product demonstration, simplicity, suspense, reward fit, mobile usability, conversion potential)
  - "Build This Experience" button → triggers `buildGameSpec`
- "Regenerate" button with optional instruction input ("Make it funnier", "More premium")

### Editor (rewritten)
- Left sidebar (tabs): Content | Design | Rewards | Integration
- Center: live `GameRenderer` using current `gameSpec` — fully interactive, playable
- Top right: device switcher (mobile / desktop)
- Edits in sidebar update `gameSpec` in `AppContext` → game re-renders live
- "Save & Continue" → Targeting

### Targeting (functional)
- Time on site trigger (slider: 0–60s)
- Scroll depth (slider: 0–100%)
- Visitor type (new / returning / all)
- Device (all / mobile / desktop)
- Placement (popup / embedded / exit intent / cart)
- Frequency cap (once per N days)
- "Publish Experience" CTA

### Dashboard (updated)
- Demo experiences: Splitflask + CyberBackpack as pre-built rows with "Edit" buttons
- Stats section (static demo data for MVP)
- "Create Experience" button → CreateExperience

---

## 7. Demo Brands

Pre-built `GameSpec` objects in `src/data/demos.ts`, loaded directly into Editor.

### Splitflask
```
primitive: precision_stop
skin: pour_drink
config: { vessel_shape: "flask", targetValue: 50, unit: "%", maxValue: 100, speed: "medium" }
branding: { primaryColor: "#FF6B35", backgroundColor: "#1A1A2E" }
intro: { headline: "TRY YOUR LUCK", body: "Stop the pour at exactly 50% to win a free Splitflask." }
result: { headline: "SO CLOSE.", body: "You didn't nail it. But you still get 15% off." }
reward: { type: "percentage_off", value: "15", message: "15% off your order" }
```

### CyberBackpack
```
primitive: multi_dial
skin: combination_lock
config: { digits: 3 }
branding: { primaryColor: "#E51B23", backgroundColor: "#080808", textColor: "#00FF41" }
intro: { headline: "BREAK INTO THE BACKPACK", body: "Think you can crack our TSA lock?" }
result: { headline: "ACCESS DENIED", body: "You didn't crack it. But you unlocked FREE SHIPPING.", type: "deny" }
reward: { type: "free_shipping", message: "Free shipping on your order" }
```

---

## 8. Concept Quality Scoring

When Gemini generates concepts, each is scored 1–10 on 7 axes. Concepts scoring below 5 on Brand Specificity or below 4 on Mobile Usability are automatically regenerated. Displayed to merchant as a radar-style breakdown on the concept card.

- Brand Specificity
- Product Demonstration
- Interaction Simplicity
- Suspense
- Reward Fit
- Mobile Usability
- Conversion Potential

---

## 9. New File Map

```
src/
  context/
    AppContext.tsx               # Global state + actions
  services/
    geminiService.ts             # analyzeBrand, generateConcepts, buildGameSpec
  types.ts                       # Extended: BrandProfile, Concept, GameSpec, MechanicPrimitive, etc.
  data/
    demos.ts                     # Splitflask + CyberBackpack pre-built GameSpecs
    skins.ts                     # Skin registry + param schemas
  views/
    CreateExperience.tsx         # URL input entry point (new)
    AnalyzeStore.tsx             # Rewritten — real Gemini streaming
    SelectConcept.tsx            # Rewritten — real AI concepts with scores
    Editor.tsx                   # Rewritten — live GameRenderer preview
    Dashboard.tsx                # Updated — demo brands, working Edit buttons
    Targeting.tsx                # Functional (currently skeleton)
  components/
    games/
      GameRenderer.tsx           # Routes primitive+skin, orchestrates game flow
      primitives/
        PrecisionStop.tsx
        MultiDial.tsx
        PickOne.tsx
        HoldRelease.tsx
        Reaction.tsx
        DragTarget.tsx
        FillMeter.tsx
      skins/
        precision_stop/
          Stopwatch.tsx
          Ruler.tsx
          FuelGauge.tsx
          PourDrink.tsx    # pour liquid, tap to stop at target fill level
        multi_dial/
          CombinationLock.tsx
          SlotReels.tsx
        pick_one/
          MysteryBox.tsx
          CardFlip.tsx
        hold_release/
          StrengthMeter.tsx
        reaction/
          FlashTap.tsx
          CatchObject.tsx
        drag_target/
          PackBag.tsx
          SortItems.tsx
        fill_meter/
          ChargeBar.tsx
    ui/
      ConceptCard.tsx
      QualityScores.tsx
      BrandSwatch.tsx
      DeviceSwitcher.tsx
```

---

## 10. Out of Scope (Post-MVP)

- True generative skin DSL (AI describes a novel visual from scratch)
- Shopify App Store listing + real OAuth install
- Analytics event pipeline to real backend
- A/B testing engine
- Server-side Gemini proxy
- Klaviyo live validation (form ID check)
- Multi-store / team accounts
- Custom asset upload

---

## 11. Success Criteria for MVP

1. Merchant pastes a real product URL → Gemini returns a real brand analysis (not mocked)
2. Three game concepts generated with quality scores, all brand-specific (not generic)
3. Selecting a concept produces a live, interactive, playable game in the Editor
4. Splitflask and CyberBackpack demos are fully playable end-to-end
5. All 5 priority skins work on mobile (touch events) and desktop (mouse events)
6. Editing headline, reward, or colors in the sidebar updates the live preview in real time
7. Targeting page saves configuration and shows a "Published" confirmation
