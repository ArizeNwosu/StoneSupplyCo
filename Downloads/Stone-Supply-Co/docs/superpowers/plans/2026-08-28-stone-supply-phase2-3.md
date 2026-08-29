# Stone Supply Co — Phase 2 + 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI Stone Finder (Gemini-powered guided consultation + lead capture), Trade portal, Saved Projects (localStorage), Material Comparison, Room Visualizer (mock adapter), Admin panel (material manager + lead inbox + AI content generator).

**Architecture:** Stone Finder uses a deterministic scoring engine (`lib/stoneRecommendationEngine.ts`) separate from Gemini — Gemini only writes the natural-language explanations. All AI calls are server-side only. Saved projects use localStorage with no auth system. Visualizer ships a complete UI backed by a mock adapter; real Gemini Vision swaps in with no UI changes.

**Tech Stack:** Same as Phase 1. `@google/genai` already installed. `GEMINI_API_KEY` already in `.env.local`.

**Prerequisite:** Phase 1 plan complete. Supabase tables exist. `lib/db/`, `lib/gemini.ts`, `types/material.ts` exist.

---

## File Map

**New files:**
- `lib/stoneRecommendationEngine.ts` — scoring logic (no Gemini)
- `app/api/stone-finder/route.ts` — POST → score + Gemini explain
- `app/api/leads/route.ts` — POST → Supabase leads table
- `app/api/availability/route.ts` — POST → lead with material_slug
- `app/api/visualize/route.ts` — POST → mock visualization
- `app/api/admin/materials/route.ts` — GET/POST/PUT/DELETE (admin)
- `app/api/admin/leads/route.ts` — GET (admin)
- `app/api/admin/generate-content/route.ts` — POST → Gemini
- `app/stone-finder/page.tsx`
- `app/trade/page.tsx`
- `app/compare/page.tsx`
- `app/projects/page.tsx`
- `app/projects/[id]/page.tsx`
- `app/visualizer/page.tsx`
- `app/admin/materials/page.tsx`
- `app/admin/leads/page.tsx`
- `components/stone-finder/FinderForm.tsx`
- `components/stone-finder/FinderResults.tsx`
- `components/stone-finder/FinderLeadCapture.tsx`
- `components/stone-finder/MovementSlider.tsx`
- `components/trade/TradeApplicationForm.tsx`
- `components/compare/ComparePanel.tsx`
- `components/projects/ProjectBoard.tsx`
- `components/projects/ProjectCard.tsx`
- `components/projects/SaveMaterialButton.tsx`
- `lib/projects.ts` — localStorage project helpers
- `components/visualizer/VisualizerUpload.tsx`
- `components/visualizer/SurfaceSelector.tsx`
- `components/visualizer/VisualizerResult.tsx`
- `components/admin/AdminMaterialForm.tsx`
- `components/admin/AdminLeadTable.tsx`
- `components/admin/ContentGeneratorPanel.tsx`

**Modified files:**
- `lib/gemini.ts` — implement `explainRecommendations()` and `parseNaturalLanguage()` (stubs filled)
- `app/globals.css` — add Stone Finder, Visualizer, Admin, Compare, Projects styles

---

## Task 1: Stone Recommendation Engine

**Files:** `lib/stoneRecommendationEngine.ts`

This module is pure TypeScript — no API calls. Gemini is NOT called here.

- [ ] **Step 1: Create lib/stoneRecommendationEngine.ts**

```typescript
import type { Material } from "@/types/material";
import type { FinderInput } from "@/lib/gemini";

export type ScoredMaterial = Material & { score: number };

const STYLE_MATERIAL_MAP: Record<string, string[]> = {
  Modern: ["Quartz", "Quartzite", "Granite"],
  Minimalist: ["Quartz", "Marble"],
  Transitional: ["Quartzite", "Marble", "Quartz"],
  Traditional: ["Marble", "Granite"],
  Organic: ["Quartzite", "Onyx", "Marble"],
};

const MOVEMENT_COLOR_MAP: Record<string, string[]> = {
  quiet: ["White", "Cream"],
  subtle: ["White", "Cream", "Grey"],
  moderate: ["Grey", "Brown", "Multi"],
  bold: ["Black", "Brown", "Multi", "Green"],
  dramatic: ["Black", "Multi", "Green", "Blue"],
};

function scoreColorFamily(
  colorFamily: string | null,
  desiredColor: string | undefined,
  movement: FinderInput["movement"]
): number {
  let score = 0;

  if (movement && colorFamily) {
    const preferred = MOVEMENT_COLOR_MAP[movement] ?? [];
    if (preferred.includes(colorFamily)) score += 15;
  }

  if (desiredColor && colorFamily) {
    const desired = desiredColor.toLowerCase();
    const family = colorFamily.toLowerCase();
    if (family.includes(desired) || desired.includes(family)) score += 10;
  }

  return score;
}

function scoreMaterialPreference(
  materialType: string,
  preferences: string[] | undefined
): number {
  if (!preferences || preferences.length === 0) return 0;
  const normalized = preferences.map((p) => p.toLowerCase());
  if (normalized.includes(materialType.toLowerCase())) return 30;
  return 0;
}

function scoreStyle(
  materialType: string,
  style: string | undefined
): number {
  if (!style) return 0;
  const preferred = STYLE_MATERIAL_MAP[style] ?? [];
  return preferred.includes(materialType) ? 20 : 0;
}

function scoreBudget(
  price: number | null,
  budget: FinderInput["budget"]
): number {
  if (!price || !budget) return 0;
  if (budget.min !== undefined && price < budget.min) return -10;
  if (budget.max !== undefined && price > budget.max) return -10;
  return 15;
}

export function scoreMaterials(
  input: FinderInput,
  materials: Material[]
): ScoredMaterial[] {
  return materials
    .map((m) => {
      let score = 0;

      score += scoreMaterialPreference(m.material_type, input.materialPreference);
      score += scoreColorFamily(m.color_family, input.desiredColor, input.movement);
      score += scoreStyle(m.material_type, input.style);
      score += scoreBudget(m.price, input.budget);

      if (m.featured) score += 5;
      if (m.new_arrival) score += 5;
      if (m.availability === "unavailable") score -= 50;

      return { ...m, score };
    })
    .filter((m) => m.availability !== "unavailable")
    .sort((a, b) => b.score - a.score);
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add lib/stoneRecommendationEngine.ts
git commit -m "lib: add deterministic stone recommendation scoring engine"
```

---

## Task 2: Complete Gemini Stone Finder Functions

**Files:** `lib/gemini.ts`

Replace the stub implementations of `explainRecommendations` and `parseNaturalLanguage`.

- [ ] **Step 1: Replace explainRecommendations stub in lib/gemini.ts**

Find the `explainRecommendations` function and replace it:

```typescript
export async function explainRecommendations(
  input: FinderInput,
  materials: Material[]
): Promise<Array<{ slug: string; explanation: string }>> {
  if (materials.length === 0) return [];

  const ai = getAI();

  const materialList = materials
    .slice(0, 6)
    .map(
      (m, i) =>
        `${i + 1}. ${m.name} (${m.material_type}, ${m.finish}, ${m.color_family ?? "mixed color"}, $${m.price ?? "call"})`
    )
    .join("\n");

  const context = [
    input.projectType && `Project: ${input.projectType}`,
    input.style && `Design style: ${input.style}`,
    input.movement && `Stone movement preference: ${input.movement}`,
    input.cabinetColor && `Cabinet color: ${input.cabinetColor}`,
    input.floorColor && `Floor color: ${input.floorColor}`,
    input.wallColor && `Wall color: ${input.wallColor}`,
    input.naturalLanguage && `Customer description: "${input.naturalLanguage}"`,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are Ali's design assistant at Stone Supply Co in Northridge, Los Angeles. A customer described their project:

${context}

These stones scored highest for their project:
${materialList}

Write one warm, specific explanation (2-3 sentences) for each stone explaining exactly why it fits this customer's space. Focus on visual harmony, practical fit, and what makes this stone special for their specific project. Be direct and editorial — like advice from a knowledgeable friend, not a sales pitch.

Return ONLY valid JSON, no markdown, no code fences:
[
  { "slug": "stone-slug", "explanation": "..." },
  ...
]

Use the slug format derived from the stone name (lowercase, hyphens). Example: "Carrara Jumbo" → "carrara-jumbo".`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  try {
    const parsed = JSON.parse(result.text ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return materials.slice(0, 6).map((m) => ({
      slug: m.slug,
      explanation: `${m.name} is a strong match for your ${input.projectType ?? "project"}.`,
    }));
  }
}
```

- [ ] **Step 2: Replace parseNaturalLanguage stub in lib/gemini.ts**

```typescript
export async function parseNaturalLanguage(
  text: string
): Promise<Partial<FinderInput>> {
  const ai = getAI();

  const prompt = `Extract stone preferences from this customer description. Return ONLY valid JSON with these optional fields:
{
  "materialPreference": string[],   // e.g. ["Marble","Quartzite"]
  "desiredColor": string,           // dominant color preference
  "movement": "quiet"|"subtle"|"moderate"|"bold"|"dramatic",
  "style": "Modern"|"Minimalist"|"Transitional"|"Traditional"|"Organic",
  "cabinetColor": string,
  "floorColor": string,
  "wallColor": string,
  "budget": { "max": number }       // only if mentioned
}

Only include fields explicitly or clearly implied in the text. Never fabricate.

Customer description: "${text}"`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  try {
    return JSON.parse(result.text ?? "{}");
  } catch {
    return {};
  }
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add lib/gemini.ts
git commit -m "lib: implement explainRecommendations and parseNaturalLanguage in gemini.ts"
```

---

## Task 3: Stone Finder API Route

**Files:** `app/api/stone-finder/route.ts`

- [ ] **Step 1: Create app/api/stone-finder/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getMaterials } from "@/lib/db/materials";
import { scoreMaterials } from "@/lib/stoneRecommendationEngine";
import { explainRecommendations, parseNaturalLanguage } from "@/lib/gemini";
import type { FinderInput } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  let body: { input: FinderInput };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { input } = body;
  if (!input) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  try {
    // Parse natural language if provided
    let mergedInput: FinderInput = { ...input };
    if (input.naturalLanguage?.trim()) {
      const parsed = await parseNaturalLanguage(input.naturalLanguage);
      // Structured inputs override NL parsing (user selections are explicit)
      mergedInput = { ...parsed, ...input };
    }

    // Fetch all available materials from Supabase
    const allMaterials = await getMaterials({ limit: 96 });

    // Import full material records for scoring
    const { getMaterial } = await import("@/lib/db/materials");
    const fullMaterials = await Promise.all(
      allMaterials.map((m) => getMaterial(m.slug))
    );
    const validMaterials = fullMaterials.filter(
      (m): m is NonNullable<typeof m> => m !== null
    );

    // Score deterministically
    const scored = scoreMaterials(mergedInput, validMaterials).slice(0, 6);

    // Get Gemini explanations for top results
    const explanations = await explainRecommendations(mergedInput, scored);

    // Merge explanations into results
    const materialsWithExplanations = scored.map((m) => ({
      ...m,
      explanation:
        explanations.find((e) => e.slug === m.slug)?.explanation ?? "",
    }));

    return NextResponse.json({
      materials: materialsWithExplanations,
      parsedInput: mergedInput,
    });
  } catch (err) {
    console.error("[api/stone-finder]", err);
    return NextResponse.json(
      { error: "Something went wrong — please try again." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Test the API**

```bash
npm run dev &
sleep 5
curl -s -X POST http://localhost:3000/api/stone-finder \
  -H "Content-Type: application/json" \
  -d '{"input":{"projectType":"Kitchen","style":"Modern","movement":"subtle","materialPreference":["Quartz"]}}' \
  | python3 -m json.tool | head -40
kill %1
```

Expected: JSON with `materials` array (up to 6 slabs) and `parsedInput`.

- [ ] **Step 3: Commit**

```bash
git add app/api/stone-finder/route.ts
git commit -m "api: add /api/stone-finder POST route with scoring + Gemini explanations"
```

---

## Task 4: Lead Capture API

**Files:** `app/api/leads/route.ts`, `app/api/availability/route.ts`

- [ ] **Step 1: Create app/api/leads/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/db/leads";
import type { LeadInput } from "@/lib/db/leads";

const VALID_SOURCES = [
  "stone-finder",
  "availability-request",
  "trade-application",
  "contact",
] as const;

export async function POST(request: NextRequest) {
  let body: Partial<LeadInput>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.source || !VALID_SOURCES.includes(body.source as typeof VALID_SOURCES[number])) {
    return NextResponse.json(
      { error: "source must be one of: " + VALID_SOURCES.join(", ") },
      { status: 400 }
    );
  }

  // Require at minimum one contact method
  if (!body.email && !body.phone && !body.name) {
    return NextResponse.json(
      { error: "At least one of name, email, or phone is required" },
      { status: 400 }
    );
  }

  try {
    const result = await createLead(body as LeadInput);
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (err) {
    console.error("[api/leads]", err);
    return NextResponse.json(
      { error: "Failed to save inquiry" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create app/api/availability/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/db/leads";

export async function POST(request: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    material_slug?: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.material_slug) {
    return NextResponse.json(
      { error: "material_slug is required" },
      { status: 400 }
    );
  }

  try {
    const result = await createLead({
      ...body,
      source: "availability-request",
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (err) {
    console.error("[api/availability]", err);
    return NextResponse.json(
      { error: "Failed to save request" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/leads/route.ts app/api/availability/route.ts
git commit -m "api: add /api/leads and /api/availability POST routes"
```

---

## Task 5: Stone Finder Form Components

**Files:** `components/stone-finder/MovementSlider.tsx`, `components/stone-finder/FinderForm.tsx`

- [ ] **Step 1: Add Stone Finder CSS to globals.css**

Append to `app/globals.css` (before the final `@media (prefers-reduced-motion)` block):

```css
/* ─── Stone Finder ───────────────────────────────────────────────────────── */
.finder-page {
  padding-top: var(--header-height);
  min-height: 100vh;
}
.finder-inner {
  max-width: 680px;
  margin: 0 auto;
  padding: 4rem var(--gutter) 8rem;
}
.finder-inner h1 {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  margin: 0 0 0.5rem;
}
.finder-intro {
  font-size: 0.88rem;
  color: var(--color-stone-dark);
  margin: 0 0 3rem;
  line-height: 1.65;
}
.finder-section {
  margin-bottom: 2.5rem;
}
.finder-section legend,
.finder-section-label {
  display: block;
  font-size: 0.48rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-stone-dark);
  margin-bottom: 0.85rem;
}
.finder-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.finder-text-inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
@media (max-width: 600px) {
  .finder-text-inputs { grid-template-columns: 1fr; }
}
.finder-text-input {
  width: 100%;
  padding: 0.6rem 0.85rem;
  font-size: 0.82rem;
  font-family: var(--font-sans);
  border: 1px solid var(--color-line);
  background: var(--color-white);
  color: var(--color-ink);
  outline: none;
  transition: border-color var(--duration-fast);
}
.finder-text-input:focus {
  border-color: var(--color-ink);
}
.movement-track {
  display: flex;
  gap: 0.25rem;
  align-items: stretch;
}
.movement-step {
  flex: 1;
  padding: 0.7rem 0.4rem;
  font-size: 0.5rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
  border: 1px solid var(--color-line);
  cursor: pointer;
  transition: all var(--duration-fast);
  color: var(--color-stone-dark);
  background: transparent;
}
.movement-step.active {
  background: var(--color-ink);
  border-color: var(--color-ink);
  color: var(--color-white);
}
.finder-textarea {
  width: 100%;
  padding: 0.85rem;
  font-size: 0.85rem;
  font-family: var(--font-sans);
  border: 1px solid var(--color-line);
  background: var(--color-white);
  color: var(--color-ink);
  outline: none;
  resize: vertical;
  min-height: 5rem;
  transition: border-color var(--duration-fast);
}
.finder-textarea:focus { border-color: var(--color-ink); }
.finder-submit {
  margin-top: 1rem;
}

/* Finder results */
.finder-results {
  padding-bottom: 6rem;
}
.finder-results-header {
  margin-bottom: 2rem;
}
.finder-results-header h2 {
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  margin: 0 0 0.3rem;
}
.finder-results-sub {
  font-size: 0.78rem;
  color: var(--color-stone-dark);
  margin: 0;
}
.finder-result-card {
  display: grid;
  grid-template-columns: 10rem 1fr;
  gap: 2rem;
  padding: 2rem 0;
  border-bottom: 1px solid var(--color-line);
  align-items: start;
}
@media (max-width: 600px) {
  .finder-result-card { grid-template-columns: 1fr; }
}
.finder-result-rank {
  font-size: 0.48rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-bronze);
  margin-bottom: 0.4rem;
}
.finder-result-name {
  font-family: var(--font-serif);
  font-size: 1.3rem;
  font-weight: 400;
  margin: 0 0 0.25rem;
}
.finder-result-meta {
  font-size: 0.7rem;
  color: var(--color-stone-dark);
  margin-bottom: 0.75rem;
}
.finder-result-explanation {
  font-family: var(--font-serif);
  font-size: 0.92rem;
  font-style: italic;
  line-height: 1.65;
  color: var(--color-stone-dark);
  margin: 0 0 1rem;
}
.finder-result-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Lead capture */
.finder-lead-capture {
  background: var(--color-warm);
  padding: 3rem;
  margin-top: 3rem;
}
.finder-lead-capture h3 {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 400;
  margin: 0 0 0.4rem;
}
.finder-lead-capture p {
  font-size: 0.82rem;
  color: var(--color-stone-dark);
  margin: 0 0 1.5rem;
}
.finder-lead-fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}
@media (max-width: 600px) {
  .finder-lead-fields { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Create components/stone-finder/MovementSlider.tsx**

```tsx
"use client";

const STEPS = [
  { value: "quiet", label: "Quiet" },
  { value: "subtle", label: "Subtle" },
  { value: "moderate", label: "Moderate" },
  { value: "bold", label: "Bold" },
  { value: "dramatic", label: "Dramatic" },
] as const;

type Movement = typeof STEPS[number]["value"];

export function MovementSlider({
  value,
  onChange,
}: {
  value: Movement | undefined;
  onChange: (v: Movement) => void;
}) {
  return (
    <fieldset className="finder-section" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend>Stone movement</legend>
      <div className="movement-track" role="group" aria-label="Stone movement preference">
        {STEPS.map((step) => (
          <button
            key={step.value}
            type="button"
            className={`movement-step ${value === step.value ? "active" : ""}`}
            onClick={() => onChange(step.value)}
            aria-pressed={value === step.value}
          >
            {step.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 3: Create components/stone-finder/FinderForm.tsx**

```tsx
"use client";

import { useState, useTransition } from "react";
import { MovementSlider } from "./MovementSlider";
import { trackEvent } from "@/lib/analytics";
import type { FinderInput } from "@/lib/gemini";

const PROJECT_TYPES = ["Kitchen", "Bathroom", "Fireplace", "Bar", "Commercial", "Other"];
const STYLES = ["Modern", "Transitional", "Traditional", "Organic", "Minimalist"];
const MATERIAL_TYPES = ["Quartzite", "Marble", "Granite", "Quartz", "Onyx"];

type Props = {
  onResults: (data: {
    materials: Array<Record<string, unknown>>;
    parsedInput: FinderInput;
  }) => void;
  onError: () => void;
};

export function FinderForm({ onResults, onError }: Props) {
  const [isPending, startTransition] = useTransition();

  const [projectType, setProjectType] = useState("");
  const [cabinetColor, setCabinetColor] = useState("");
  const [floorColor, setFloorColor] = useState("");
  const [wallColor, setWallColor] = useState("");
  const [style, setStyle] = useState("");
  const [movement, setMovement] = useState<FinderInput["movement"]>(undefined);
  const [materialPrefs, setMaterialPrefs] = useState<string[]>([]);
  const [naturalLanguage, setNaturalLanguage] = useState("");

  function toggleMaterial(mat: string) {
    setMaterialPrefs((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    trackEvent("stone_finder_start");

    const input: FinderInput = {
      projectType: projectType || undefined,
      cabinetColor: cabinetColor || undefined,
      floorColor: floorColor || undefined,
      wallColor: wallColor || undefined,
      style: style || undefined,
      movement,
      materialPreference: materialPrefs.length > 0 ? materialPrefs : undefined,
      naturalLanguage: naturalLanguage || undefined,
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/stone-finder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        trackEvent("stone_finder_complete");
        onResults(data);
      } catch {
        onError();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Project type */}
      <fieldset className="finder-section" style={{ border: 0, padding: 0, margin: "0 0 2.5rem" }}>
        <legend>What are you designing?</legend>
        <div className="finder-chips">
          {PROJECT_TYPES.map((pt) => (
            <button
              key={pt}
              type="button"
              className={`chip ${projectType === pt ? "active" : ""}`}
              onClick={() => setProjectType(projectType === pt ? "" : pt)}
              aria-pressed={projectType === pt}
            >
              {pt}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Colors */}
      <fieldset className="finder-section" style={{ border: 0, padding: 0, margin: "0 0 2.5rem" }}>
        <legend>Room colors (optional)</legend>
        <div className="finder-text-inputs">
          <input
            className="finder-text-input"
            placeholder="Cabinet color"
            value={cabinetColor}
            onChange={(e) => setCabinetColor(e.target.value)}
            aria-label="Cabinet color"
          />
          <input
            className="finder-text-input"
            placeholder="Floor color"
            value={floorColor}
            onChange={(e) => setFloorColor(e.target.value)}
            aria-label="Floor color"
          />
          <input
            className="finder-text-input"
            placeholder="Wall color"
            value={wallColor}
            onChange={(e) => setWallColor(e.target.value)}
            aria-label="Wall color"
          />
        </div>
      </fieldset>

      {/* Style */}
      <fieldset className="finder-section" style={{ border: 0, padding: 0, margin: "0 0 2.5rem" }}>
        <legend>Design style</legend>
        <div className="finder-chips">
          {STYLES.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${style === s ? "active" : ""}`}
              onClick={() => setStyle(style === s ? "" : s)}
              aria-pressed={style === s}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Movement */}
      <MovementSlider value={movement} onChange={setMovement} />

      {/* Material preference */}
      <fieldset className="finder-section" style={{ border: 0, padding: 0, margin: "0 0 2.5rem" }}>
        <legend>Material preference (select all that apply)</legend>
        <div className="finder-chips">
          {MATERIAL_TYPES.map((mt) => (
            <button
              key={mt}
              type="button"
              className={`chip ${materialPrefs.includes(mt) ? "active" : ""}`}
              onClick={() => toggleMaterial(mt)}
              aria-pressed={materialPrefs.includes(mt)}
            >
              {mt}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Natural language */}
      <fieldset className="finder-section" style={{ border: 0, padding: 0, margin: "0 0 2.5rem" }}>
        <legend>Or describe it in your own words</legend>
        <textarea
          className="finder-textarea"
          placeholder="e.g. I want something dramatic with a lot of movement for a modern kitchen — dark cabinets, light floors."
          value={naturalLanguage}
          onChange={(e) => setNaturalLanguage(e.target.value)}
          rows={4}
          aria-label="Describe your space in your own words"
        />
      </fieldset>

      <div className="finder-submit">
        <button
          type="submit"
          className="button"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? "Finding your stones…" : "Find My Stone →"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add components/stone-finder/ app/globals.css
git commit -m "components: add Stone Finder form components (FinderForm, MovementSlider)"
```

---

## Task 6: Stone Finder Results + Lead Capture

**Files:** `components/stone-finder/FinderResults.tsx`, `components/stone-finder/FinderLeadCapture.tsx`

- [ ] **Step 1: Create components/stone-finder/FinderLeadCapture.tsx**

```tsx
"use client";

import { useState, useTransition } from "react";
import type { FinderInput } from "@/lib/gemini";

type Props = {
  parsedInput: FinderInput;
  preferredMaterials: string[];
};

export function FinderLeadCapture({ parsedInput, preferredMaterials }: Props) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [timeline, setTimeline] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name && !email && !phone) {
      setError("Please enter your name, email, or phone.");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone,
            timeline,
            source: "stone-finder",
            project_type: parsedInput.projectType,
            preferred_materials: preferredMaterials,
            ai_preferences: parsedInput,
          }),
        });
        if (!res.ok) throw new Error("Failed");
        setSubmitted(true);
      } catch {
        setError("Something went wrong. Please call us at (818) 818-5081.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="finder-lead-capture">
        <h3>We'll be in touch.</h3>
        <p>
          Ali will have your stones ready when you arrive.{" "}
          <strong>(818) 818-5081</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="finder-lead-capture">
      <h3>Want Ali to pull these for you?</h3>
      <p>
        Leave your details and we'll set aside the stones that match your
        project before your visit.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="finder-lead-fields">
          <input
            className="finder-text-input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Name"
          />
          <input
            className="finder-text-input"
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-label="Phone"
          />
          <input
            className="finder-text-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
          />
          <input
            className="finder-text-input"
            placeholder="Timeline (e.g. 2 weeks)"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            aria-label="Timeline"
          />
        </div>
        {error && (
          <p style={{ color: "var(--color-error)", fontSize: "0.78rem", marginBottom: "0.5rem" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          className="button"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? "Sending…" : "Send my selections to Ali"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create components/stone-finder/FinderResults.tsx**

```tsx
import Image from "next/image";
import Link from "next/link";
import { FinderLeadCapture } from "./FinderLeadCapture";
import type { FinderInput } from "@/lib/gemini";

type ResultMaterial = {
  id: string;
  slug: string;
  name: string;
  material_type: string;
  finish: string;
  quantity: number;
  price: number | null;
  image_urls: string[];
  explanation: string;
  availability: string;
};

type Props = {
  materials: ResultMaterial[];
  parsedInput: FinderInput;
};

export function FinderResults({ materials, parsedInput }: Props) {
  const allAvailable = materials.every((m) => m.availability === "available");

  return (
    <div className="finder-results">
      <div className="finder-results-header">
        <h2>
          {materials.length} stone{materials.length !== 1 ? "s" : ""} for your{" "}
          {parsedInput.projectType ?? "project"}.
        </h2>
        {allAvailable && (
          <p className="finder-results-sub">
            All results are available at the Northridge yard today.
          </p>
        )}
      </div>

      {materials.map((m, i) => (
        <div key={m.id} className="finder-result-card">
          <div>
            {m.image_urls[0] && (
              <div
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  overflow: "hidden",
                  background: "var(--color-warm)",
                  marginBottom: "0.75rem",
                }}
              >
                <Image
                  src={m.image_urls[0]}
                  alt={m.name}
                  fill
                  sizes="200px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
          </div>
          <div>
            <p className="finder-result-rank">
              {i === 0 ? "Top match" : `Match ${i + 1}`}
            </p>
            <h3 className="finder-result-name">{m.name}</h3>
            <p className="finder-result-meta">
              {m.material_type} · {m.finish}
              {m.price && ` · $${m.price}`}
              {m.quantity > 0 && ` · ${m.quantity} slabs in stock`}
            </p>
            {m.explanation && (
              <p className="finder-result-explanation">"{m.explanation}"</p>
            )}
            <div className="finder-result-actions">
              <Link href={`/materials/${m.slug}`} className="button button-sm">
                View slab
              </Link>
              <Link
                href={`/compare?a=${m.slug}`}
                className="button button-sm button-outline"
              >
                Compare
              </Link>
            </div>
          </div>
        </div>
      ))}

      <FinderLeadCapture
        parsedInput={parsedInput}
        preferredMaterials={materials.map((m) => m.slug)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/stone-finder/FinderResults.tsx components/stone-finder/FinderLeadCapture.tsx
git commit -m "components: add FinderResults and FinderLeadCapture"
```

---

## Task 7: Stone Finder Page

**Files:** `app/stone-finder/page.tsx`

- [ ] **Step 1: Create app/stone-finder/page.tsx**

```tsx
"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { FinderForm } from "@/components/stone-finder/FinderForm";
import { FinderResults } from "@/components/stone-finder/FinderResults";
import type { FinderInput } from "@/lib/gemini";
import { getMaterials } from "@/lib/db/materials";

// Note: metadata export doesn't work in 'use client' — move to layout if SEO is needed.
// For now, set title via document.title or extract a server wrapper component.

type ResultState =
  | { status: "idle" }
  | { status: "results"; materials: Record<string, unknown>[]; parsedInput: FinderInput }
  | { status: "error" };

export default function StoneFinderPage() {
  const [state, setState] = useState<ResultState>({ status: "idle" });

  return (
    <main className="finder-page">
      <div className="finder-inner">
        {state.status === "idle" && (
          <>
            <h1>Find your stone.</h1>
            <p className="finder-intro">
              Answer a few questions about your project and we'll match you with
              the stones in our Northridge yard that fit your space best.
            </p>
            <FinderForm
              onResults={(data) =>
                setState({
                  status: "results",
                  materials: data.materials as Record<string, unknown>[],
                  parsedInput: data.parsedInput,
                })
              }
              onError={() => setState({ status: "error" })}
            />
          </>
        )}

        {state.status === "results" && (
          <>
            <div style={{ marginBottom: "2rem" }}>
              <button
                className="chip"
                onClick={() => setState({ status: "idle" })}
              >
                ← Start over
              </button>
            </div>
            <FinderResults
              materials={state.materials as Parameters<typeof FinderResults>[0]["materials"]}
              parsedInput={state.parsedInput}
            />
          </>
        )}

        {state.status === "error" && (
          <div>
            <p style={{ color: "var(--color-error)", marginBottom: "1rem" }}>
              Something went wrong. Please try again or call us directly.
            </p>
            <button
              className="button button-outline"
              onClick={() => setState({ status: "idle" })}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Test end-to-end**

```bash
npm run dev
```

Open `http://localhost:3000/stone-finder`. Select Kitchen + Modern + Quartz. Click "Find My Stone". Verify:
- Loading state shows "Finding your stones…"
- Results appear with 1–6 slabs
- Gemini explanation text appears in italic under each result
- Lead capture form appears at bottom
- Submitting the lead form POSTs to `/api/leads`

- [ ] **Step 3: Commit**

```bash
git add app/stone-finder/page.tsx
git commit -m "page: add /stone-finder with form, results, lead capture"
```

---

## Task 8: Trade Portal

**Files:** `app/trade/page.tsx`, `components/trade/TradeApplicationForm.tsx`

- [ ] **Step 1: Add Trade CSS to globals.css**

Append to `app/globals.css`:

```css
/* ─── Trade Portal ───────────────────────────────────────────────────────── */
.trade-page { padding-top: var(--header-height); }
.trade-hero {
  padding: 5rem var(--gutter) 4rem;
  border-bottom: 1px solid var(--color-line);
  max-width: 700px;
}
.trade-hero h1 {
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 400;
  letter-spacing: -0.03em;
  margin: 0 0 1rem;
}
.trade-hero p {
  font-size: 0.9rem;
  color: var(--color-stone-dark);
  line-height: 1.7;
  margin: 0;
  max-width: 50ch;
}
.trade-benefits {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid var(--color-line);
}
@media (max-width: 900px) {
  .trade-benefits { grid-template-columns: repeat(2, 1fr); }
}
.trade-benefit {
  padding: 2.5rem var(--gutter);
  border-right: 1px solid var(--color-line);
}
.trade-benefit:last-child { border-right: 0; }
.trade-benefit-label {
  font-size: 0.48rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-bronze);
  margin-bottom: 0.5rem;
}
.trade-benefit h3 {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 400;
  margin: 0 0 0.4rem;
}
.trade-benefit p {
  font-size: 0.75rem;
  color: var(--color-stone-dark);
  line-height: 1.6;
  margin: 0;
}
.trade-form-section {
  max-width: 680px;
  padding: 4rem var(--gutter) 6rem;
}
.trade-form-section h2 {
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  margin: 0 0 0.4rem;
}
.trade-form-section > p {
  font-size: 0.82rem;
  color: var(--color-stone-dark);
  margin: 0 0 2rem;
}
.trade-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
@media (max-width: 600px) {
  .trade-form-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Create components/trade/TradeApplicationForm.tsx**

```tsx
"use client";

import { useState, useTransition } from "react";
import { trackEvent } from "@/lib/analytics";

const PROFESSIONS = [
  "Interior Designer",
  "Architect",
  "Fabricator",
  "Contractor",
  "Builder",
  "Other",
];

export function TradeApplicationForm() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [profession, setProfession] = useState("");

  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    website: "",
    instagram: "",
    projectVolume: "",
    serviceArea: "",
  });

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError("Name and email are required.");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            customer_type: profession.toLowerCase().replace(" ", "_"),
            notes: [
              form.businessName && `Business: ${form.businessName}`,
              form.website && `Website: ${form.website}`,
              form.instagram && `Instagram: ${form.instagram}`,
              form.projectVolume && `Volume: ${form.projectVolume}`,
              form.serviceArea && `Service area: ${form.serviceArea}`,
            ]
              .filter(Boolean)
              .join("\n"),
            source: "trade-application",
          }),
        });
        if (!res.ok) throw new Error();
        trackEvent("trade_application");
        setSubmitted(true);
      } catch {
        setError("Something went wrong. Please call (818) 818-5081.");
      }
    });
  }

  if (submitted) {
    return (
      <div style={{ padding: "2rem", background: "var(--color-warm)" }}>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}>
          Application received. Ali will be in touch within 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="trade-form-grid">
        <input className="finder-text-input" placeholder="Your name *" value={form.name} onChange={update("name")} aria-required="true" />
        <input className="finder-text-input" placeholder="Business name" value={form.businessName} onChange={update("businessName")} />
        <input className="finder-text-input" type="email" placeholder="Email *" value={form.email} onChange={update("email")} aria-required="true" />
        <input className="finder-text-input" type="tel" placeholder="Phone" value={form.phone} onChange={update("phone")} />
        <input className="finder-text-input" placeholder="Website" value={form.website} onChange={update("website")} />
        <input className="finder-text-input" placeholder="Instagram @handle" value={form.instagram} onChange={update("instagram")} />
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <p className="finder-question" style={{ marginBottom: "0.5rem" }}>Profession</p>
        <div className="finder-chips">
          {PROFESSIONS.map((p) => (
            <button
              key={p}
              type="button"
              className={`chip ${profession === p ? "active" : ""}`}
              onClick={() => setProfession(profession === p ? "" : p)}
              aria-pressed={profession === p}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="trade-form-grid" style={{ marginTop: "0.5rem" }}>
        <input className="finder-text-input" placeholder="Annual project volume (sqft or $)" value={form.projectVolume} onChange={update("projectVolume")} />
        <input className="finder-text-input" placeholder="Primary service area" value={form.serviceArea} onChange={update("serviceArea")} />
      </div>

      {error && <p style={{ color: "var(--color-error)", fontSize: "0.78rem", margin: "0.5rem 0" }}>{error}</p>}

      <div style={{ marginTop: "1rem" }}>
        <button type="submit" className="button" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Sending…" : "Apply for trade access"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create app/trade/page.tsx**

```tsx
import type { Metadata } from "next";
import { TradeApplicationForm } from "@/components/trade/TradeApplicationForm";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Trade Portal — Designers & Fabricators | Stone Supply Co",
  description:
    "Stone Supply Co works directly with interior designers, architects, fabricators, and contractors across Los Angeles. Apply for trade access.",
  alternates: { canonical: "/trade" },
};

const BENEFITS = [
  {
    label: "Sourcing",
    title: "Material sourcing",
    body: "Access to the full yard before public listings. First look at new arrivals.",
  },
  {
    label: "Assistance",
    title: "Project assistance",
    body: "Ali works directly with your client — or stays in the background. Your call.",
  },
  {
    label: "Availability",
    title: "Availability requests",
    body: "Reserve slabs across multiple projects. Holds honored for qualified trade accounts.",
  },
  {
    label: "Showroom",
    title: "Showroom support",
    body: "Bring clients in. We'll treat them like they walked in on their own.",
  },
];

export default function TradePage() {
  return (
    <main className="trade-page">
      <div className="trade-hero">
        <h1>Built for the trade.</h1>
        <p>
          Stone Supply Co works directly with designers, architects, fabricators,
          and contractors across Los Angeles. Personal service, real availability,
          no runaround.
        </p>
      </div>

      <div className="trade-benefits">
        {BENEFITS.map((b) => (
          <div key={b.label} className="trade-benefit">
            <p className="trade-benefit-label">{b.label}</p>
            <h3>{b.title}</h3>
            <p>{b.body}</p>
          </div>
        ))}
      </div>

      <div className="trade-form-section">
        <h2>Apply for trade access.</h2>
        <p>
          Tell us about your practice. Ali reviews all applications personally.
        </p>
        <TradeApplicationForm />
        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--color-stone-dark)" }}>
            {business.address.street}, {business.address.city} ·{" "}
            <a href={business.phone.href}>{business.phone.display}</a> · Ask for Ali.
          </p>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Test trade page**

Open `http://localhost:3000/trade`. Submit the form and verify a lead appears in Supabase `leads` table with `source = 'trade-application'`.

- [ ] **Step 5: Commit**

```bash
git add app/trade/ components/trade/ app/globals.css
git commit -m "page: add /trade portal with benefits grid and application form"
```

---

## Task 9: Saved Projects (localStorage)

**Files:** `lib/projects.ts`, `components/projects/SaveMaterialButton.tsx`, `components/projects/ProjectCard.tsx`, `components/projects/ProjectBoard.tsx`

- [ ] **Step 1: Create lib/projects.ts**

```typescript
export type Project = {
  id: string;
  name: string;
  projectType?: string;
  clientName?: string;
  notes: string;
  savedMaterialSlugs: string[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "ssc-projects";

function readAll(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeAll(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProjects(): Project[] {
  return readAll();
}

export function getProject(id: string): Project | undefined {
  return readAll().find((p) => p.id === id);
}

export function createProject(
  name: string,
  projectType?: string
): Project {
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    projectType,
    notes: "",
    savedMaterialSlugs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const projects = readAll();
  projects.unshift(project);
  writeAll(projects);
  return project;
}

export function updateProject(id: string, updates: Partial<Project>) {
  const projects = readAll();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
  writeAll(projects);
}

export function addMaterialToProject(projectId: string, slug: string) {
  const project = getProject(projectId);
  if (!project) return;
  if (project.savedMaterialSlugs.includes(slug)) return;
  updateProject(projectId, {
    savedMaterialSlugs: [...project.savedMaterialSlugs, slug],
  });
}

export function removeMaterialFromProject(projectId: string, slug: string) {
  const project = getProject(projectId);
  if (!project) return;
  updateProject(projectId, {
    savedMaterialSlugs: project.savedMaterialSlugs.filter((s) => s !== slug),
  });
}

export function deleteProject(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
}

export function isMaterialSaved(slug: string): boolean {
  return readAll().some((p) => p.savedMaterialSlugs.includes(slug));
}
```

- [ ] **Step 2: Add Projects + Compare CSS to globals.css**

Append to `app/globals.css`:

```css
/* ─── Projects ───────────────────────────────────────────────────────────── */
.projects-page { padding-top: var(--header-height); min-height: 100vh; }
.projects-header {
  padding: 3rem var(--gutter) 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--color-line);
}
.projects-header h1 {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  margin: 0;
}
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--color-line);
  padding: 2rem var(--gutter);
}
@media (max-width: 900px) { .projects-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .projects-grid { grid-template-columns: 1fr; } }
.project-card {
  background: var(--color-paper);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  cursor: pointer;
  transition: background var(--duration-fast);
}
.project-card:hover { background: var(--color-warm); }
.project-card-name {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 400;
}
.project-card-meta { font-size: 0.7rem; color: var(--color-stone-dark); }

/* ─── Compare ────────────────────────────────────────────────────────────── */
.compare-page { padding-top: var(--header-height); min-height: 100vh; }
.compare-header {
  padding: 3rem var(--gutter) 1.5rem;
  border-bottom: 1px solid var(--color-line);
}
.compare-header h1 {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  margin: 0;
}
.compare-table-wrap {
  overflow-x: auto;
  padding: 2rem var(--gutter) 6rem;
}
.compare-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}
.compare-table th, .compare-table td {
  padding: 0.85rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-line);
  vertical-align: top;
}
.compare-table th {
  font-size: 0.48rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-stone-dark);
  background: var(--color-warm);
  white-space: nowrap;
}
.compare-table td { font-size: 0.82rem; }
.compare-material-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  margin-bottom: 0.5rem;
  background: var(--color-warm);
  position: relative;
  overflow: hidden;
}

/* ─── Visualizer ─────────────────────────────────────────────────────────── */
.visualizer-page { padding-top: var(--header-height); min-height: 100vh; }
.visualizer-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 4rem var(--gutter) 8rem;
}
.visualizer-inner h1 {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  margin: 0 0 0.5rem;
}
.visualizer-intro {
  font-size: 0.85rem;
  color: var(--color-stone-dark);
  margin: 0 0 3rem;
}
.visualizer-step {
  margin-bottom: 2.5rem;
}
.visualizer-step-label {
  font-size: 0.48rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-stone-dark);
  margin-bottom: 0.75rem;
  font-weight: 700;
}
.upload-zone {
  border: 2px dashed var(--color-line);
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: border-color var(--duration-fast);
}
.upload-zone:hover, .upload-zone.drag-over { border-color: var(--color-ink); }
.upload-zone p { font-size: 0.82rem; color: var(--color-stone-dark); margin: 0; }
.visualizer-result {
  margin-top: 2rem;
  border: 1px solid var(--color-line);
  overflow: hidden;
}
.visualizer-result-image { position: relative; aspect-ratio: 4/3; background: var(--color-warm); }
.visualizer-disclaimer {
  padding: 1rem;
  font-size: 0.65rem;
  color: var(--color-stone-dark);
  border-top: 1px solid var(--color-line);
}
```

- [ ] **Step 3: Create components/projects/ProjectCard.tsx**

```tsx
"use client";

import Link from "next/link";
import type { Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`} className="project-card">
      <p className="project-card-name">{project.name}</p>
      <p className="project-card-meta">
        {project.savedMaterialSlugs.length} stone
        {project.savedMaterialSlugs.length !== 1 ? "s" : ""} saved
        {project.projectType && ` · ${project.projectType}`}
      </p>
    </Link>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/projects.ts components/projects/ProjectCard.tsx app/globals.css
git commit -m "lib: add localStorage projects system + ProjectCard component"
```

---

## Task 10: Projects Pages

**Files:** `app/projects/page.tsx`, `app/projects/[id]/page.tsx`

- [ ] **Step 1: Create app/projects/page.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { getProjects, createProject } from "@/lib/projects";
import type { Project } from "@/lib/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { trackEvent } from "@/lib/analytics";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const p = createProject(newName.trim());
    trackEvent("project_created");
    setProjects(getProjects());
    setNewName("");
    setShowNew(false);
  }

  return (
    <main className="projects-page">
      <div className="projects-header">
        <h1>Saved projects.</h1>
        <button className="button button-sm" onClick={() => setShowNew(true)}>
          + New project
        </button>
      </div>

      {showNew && (
        <div style={{ padding: "1.5rem var(--gutter)", borderBottom: "1px solid var(--color-line)" }}>
          <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className="finder-text-input"
              placeholder="Project name (e.g. Johnson Kitchen)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              style={{ flex: 1 }}
              aria-label="New project name"
            />
            <button type="submit" className="button button-sm">Create</button>
            <button type="button" className="button button-sm button-outline" onClick={() => setShowNew(false)}>Cancel</button>
          </form>
        </div>
      )}

      {projects.length === 0 && !showNew ? (
        <div className="materials-empty">
          <p>No projects yet. Start by saving stones from the material library.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Create app/projects/[id]/page.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { getProject, updateProject, removeMaterialFromProject } from "@/lib/projects";
import type { Project } from "@/lib/projects";
import Link from "next/link";
import Image from "next/image";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState("");
  const [materials, setMaterials] = useState<Record<string, { name: string; image_urls: string[] }>[]>([]);

  useEffect(() => {
    const p = getProject(id);
    if (!p) return;
    setProject(p);
    setNotes(p.notes);

    // Fetch material data for saved slugs
    Promise.all(
      p.savedMaterialSlugs.map((slug) =>
        fetch(`/api/materials/${slug}`).then((r) => r.json()).then((d) => d.material).catch(() => null)
      )
    ).then((ms) => setMaterials(ms.filter(Boolean)));
  }, [id]);

  function handleNotesBlur() {
    if (!project) return;
    updateProject(project.id, { notes });
    setProject((prev) => prev ? { ...prev, notes } : prev);
  }

  function handleRemoveMaterial(slug: string) {
    if (!project) return;
    removeMaterialFromProject(project.id, slug);
    setProject(getProject(project.id) ?? project);
    setMaterials((prev) => prev.filter((m) => !m || Object.values(m).length === 0));
  }

  if (!project) {
    return <div style={{ padding: "8rem var(--gutter)", textAlign: "center" }}>Project not found.</div>;
  }

  return (
    <main style={{ paddingTop: "var(--header-height)" }}>
      <div style={{ padding: "2rem var(--gutter)", borderBottom: "1px solid var(--color-line)" }}>
        <Link href="/projects" style={{ fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-stone-dark)" }}>
          ← All projects
        </Link>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 400, margin: "0.75rem 0 0" }}>
          {project.name}
        </h1>
      </div>

      <div style={{ padding: "2rem var(--gutter) 6rem", display: "grid", gridTemplateColumns: "1fr 320px", gap: "3rem", alignItems: "start" }}>
        {/* Saved stones */}
        <div>
          <p style={{ fontSize: "0.48rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-stone-dark)", marginBottom: "1rem" }}>
            Saved stones ({materials.length})
          </p>
          {materials.length === 0 ? (
            <p style={{ color: "var(--color-stone-dark)", fontSize: "0.85rem" }}>
              No stones saved yet.{" "}
              <Link href="/materials">Browse materials →</Link>
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--color-line)" }}>
              {materials.map((m: Record<string, unknown>) => (
                <div key={m.slug as string} style={{ background: "var(--color-paper)", padding: "0.75rem" }}>
                  <div style={{ position: "relative", aspectRatio: "1", background: "var(--color-warm)", marginBottom: "0.5rem", overflow: "hidden" }}>
                    {(m.image_urls as string[])?.[0] && (
                      <Image src={(m.image_urls as string[])[0]} alt={m.name as string} fill sizes="150px" style={{ objectFit: "cover" }} />
                    )}
                  </div>
                  <p style={{ fontSize: "0.75rem", fontFamily: "var(--font-serif)", margin: "0 0 0.25rem" }}>{m.name as string}</p>
                  <button
                    style={{ fontSize: "0.55rem", color: "var(--color-stone-dark)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onClick={() => handleRemoveMaterial(m.slug as string)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes panel */}
        <div>
          <p style={{ fontSize: "0.48rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-stone-dark)", marginBottom: "0.75rem" }}>
            Notes
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            className="finder-textarea"
            style={{ minHeight: "8rem" }}
            placeholder="Add notes about this project…"
            aria-label="Project notes"
          />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/projects/
git commit -m "page: add /projects list and /projects/[id] board pages"
```

---

## Task 11: Compare Page

**Files:** `app/compare/page.tsx`

- [ ] **Step 1: Create app/compare/page.tsx**

```tsx
import type { Metadata } from "next";
import { getMaterial } from "@/lib/db/materials";
import Image from "next/image";
import Link from "next/link";
import { AvailabilityBadge } from "@/components/detail/AvailabilityBadge";

export const metadata: Metadata = {
  title: "Compare Stone Slabs | Stone Supply Co",
  description: "Compare natural stone slabs side-by-side. View dimensions, finish, availability, and price for up to 4 materials.",
};

type Props = {
  searchParams: Promise<{ a?: string; b?: string; c?: string; d?: string }>;
};

export default async function ComparePage({ searchParams }: Props) {
  const sp = await searchParams;
  const slugs = [sp.a, sp.b, sp.c, sp.d].filter((s): s is string => Boolean(s));

  const materials = await Promise.all(
    slugs.map((s) => getMaterial(s))
  );
  const valid = materials.filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <main className="compare-page">
      <div className="compare-header">
        <h1>Compare materials.</h1>
        {valid.length < 4 && (
          <p style={{ fontSize: "0.78rem", color: "var(--color-stone-dark)", marginTop: "0.3rem" }}>
            Add more stones from the{" "}
            <Link href="/materials">material library →</Link>
          </p>
        )}
      </div>

      {valid.length === 0 ? (
        <div className="materials-empty">
          <p>No materials selected. <Link href="/materials">Browse materials →</Link></p>
        </div>
      ) : (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: "140px" }}>Property</th>
                {valid.map((m) => (
                  <th key={m.id} scope="col">
                    <div className="compare-material-image">
                      {m.image_urls[0] && (
                        <Image src={m.image_urls[0]} alt={m.name} fill sizes="200px" style={{ objectFit: "cover" }} />
                      )}
                    </div>
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Type</td>
                {valid.map((m) => <td key={m.id}>{m.material_type}</td>)}
              </tr>
              <tr>
                <td>Color</td>
                {valid.map((m) => <td key={m.id}>{m.color_family ?? "—"}</td>)}
              </tr>
              <tr>
                <td>Finish</td>
                {valid.map((m) => <td key={m.id}>{m.finish}</td>)}
              </tr>
              <tr>
                <td>Dimensions</td>
                {valid.map((m) => <td key={m.id}>{m.dimensions ?? "—"}</td>)}
              </tr>
              <tr>
                <td>Applications</td>
                {valid.map((m) => <td key={m.id}>{m.applications.join(", ") || "—"}</td>)}
              </tr>
              <tr>
                <td>Availability</td>
                {valid.map((m) => (
                  <td key={m.id}>
                    <AvailabilityBadge availability={m.availability} />
                  </td>
                ))}
              </tr>
              {valid.some((m) => m.price) && (
                <tr>
                  <td>Price</td>
                  {valid.map((m) => <td key={m.id}>{m.price ? `$${m.price}` : "—"}</td>)}
                </tr>
              )}
              <tr>
                <td></td>
                {valid.map((m) => (
                  <td key={m.id}>
                    <Link href={`/materials/${m.slug}`} className="button button-sm">
                      View slab
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Test**

Open `http://localhost:3000/compare?a=emperador&b=pietra-grey`. Should show side-by-side table.

- [ ] **Step 3: Commit**

```bash
git add app/compare/page.tsx
git commit -m "page: add /compare side-by-side material comparison table"
```

---

## Task 12: Visualizer

**Files:** `app/api/visualize/route.ts`, `app/visualizer/page.tsx`

- [ ] **Step 1: Create app/api/visualize/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { visualizeRoom } from "@/lib/gemini";
import { getMaterial } from "@/lib/db/materials";

export async function POST(request: NextRequest) {
  let body: { materialSlug: string; roomImageUrl?: string; surfaceType: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const material = await getMaterial(body.materialSlug);
  if (!material) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  try {
    const result = await visualizeRoom(
      body.roomImageUrl ?? "",
      material.image_urls[0] ?? "",
      body.surfaceType
    );
    return NextResponse.json({
      ...result,
      disclaimer:
        "Design visualization. Actual stone appearance may vary. Lighting and texture in person may differ from this preview.",
    });
  } catch (err) {
    console.error("[api/visualize]", err);
    return NextResponse.json({ error: "Visualization failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create app/visualizer/page.tsx**

```tsx
"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

const SURFACES = [
  "Kitchen Countertops",
  "Island",
  "Backsplash",
  "Bathroom Vanity",
  "Shower Wall",
  "Fireplace",
  "Other",
];

type VisualizerState =
  | { status: "idle" }
  | { status: "result"; resultUrl: string; disclaimer: string };

export default function VisualizerPage() {
  const [roomImageUrl, setRoomImageUrl] = useState<string>("");
  const [surface, setSurface] = useState("");
  const [materialSlug, setMaterialSlug] = useState("");
  const [state, setState] = useState<VisualizerState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setRoomImageUrl(url);
  }

  function handleGenerate() {
    if (!surface || !materialSlug) return;
    trackEvent("visualizer_start");

    startTransition(async () => {
      try {
        const res = await fetch("/api/visualize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialSlug, roomImageUrl, surfaceType: surface }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        trackEvent("visualizer_complete");
        setState({ status: "result", resultUrl: data.resultUrl, disclaimer: data.disclaimer });
      } catch {
        alert("Visualization failed. Please try again.");
      }
    });
  }

  return (
    <main className="visualizer-page">
      <div className="visualizer-inner">
        <h1>See it in your room.</h1>
        <p className="visualizer-intro">
          Upload a photo of your space, choose a surface type and a stone, and
          see a preview of how it could look.
        </p>

        {/* Step 1: Upload */}
        <div className="visualizer-step">
          <p className="visualizer-step-label">Step 1 — Upload a room photo</p>
          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            {roomImageUrl ? (
              <div style={{ position: "relative", height: "200px" }}>
                <Image src={roomImageUrl} alt="Room preview" fill style={{ objectFit: "contain" }} />
              </div>
            ) : (
              <p>Drop a photo here, or click to choose · JPEG, PNG, WebP · max 10MB</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            aria-label="Upload room photo"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* Step 2: Surface */}
        <div className="visualizer-step">
          <p className="visualizer-step-label">Step 2 — Choose surface type</p>
          <div className="finder-chips">
            {SURFACES.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${surface === s ? "active" : ""}`}
                onClick={() => setSurface(surface === s ? "" : s)}
                aria-pressed={surface === s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Material slug */}
        <div className="visualizer-step">
          <p className="visualizer-step-label">Step 3 — Enter material slug</p>
          <p style={{ fontSize: "0.72rem", color: "var(--color-stone-dark)", marginBottom: "0.5rem" }}>
            Find the slug from the{" "}
            <Link href="/materials">materials page</Link> — it appears in the
            URL of the slab detail page (e.g. "emperor", "pietra-grey").
          </p>
          <input
            className="finder-text-input"
            placeholder="e.g. emperador, pietra-grey"
            value={materialSlug}
            onChange={(e) => setMaterialSlug(e.target.value)}
            aria-label="Material slug"
          />
        </div>

        <button
          className="button"
          disabled={isPending || !surface || !materialSlug}
          onClick={handleGenerate}
          aria-busy={isPending}
        >
          {isPending ? "Generating your room preview…" : "Generate Visualization"}
        </button>

        {state.status === "result" && (
          <div className="visualizer-result">
            <div className="visualizer-result-image">
              <Image
                src={state.resultUrl}
                alt="Room visualization preview"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className="visualizer-disclaimer">
              <p>{state.disclaimer}</p>
            </div>
            <div style={{ padding: "1rem", display: "flex", gap: "0.5rem" }}>
              <Link href={`/materials/${materialSlug}`} className="button button-sm">
                Request this material →
              </Link>
              <Link href="/stone-finder" className="button button-sm button-outline">
                Visit Showroom →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/visualizer/ app/api/visualize/
git commit -m "page: add /visualizer with upload, surface select, mock visualization result"
```

---

## Task 13: Admin — API Routes

**Files:** `app/api/admin/materials/route.ts`, `app/api/admin/leads/route.ts`, `app/api/admin/generate-content/route.ts`

The admin routes use a simple env-var password check (server-side on every request).

- [ ] **Step 1: Create a shared admin auth helper**

Create `lib/adminAuth.ts`:

```typescript
import { NextRequest } from "next/server";

export function checkAdminAuth(request: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  // Check Authorization header (Bearer <password>)
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${password}`) return true;

  // Check query param (for simple browser access from admin pages)
  const queryPw = request.nextUrl.searchParams.get("pw");
  if (queryPw === password) return true;

  return false;
}
```

- [ ] **Step 2: Create app/api/admin/leads/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { createPublicClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: data });
}
```

- [ ] **Step 3: Create app/api/admin/generate-content/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { generateMaterialContent } from "@/lib/gemini";
import { getMaterial } from "@/lib/db/materials";

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { slug: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const material = await getMaterial(body.slug);
  if (!material) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  try {
    const content = await generateMaterialContent(material);
    return NextResponse.json({ content });
  } catch (err) {
    console.error("[api/admin/generate-content]", err);
    return NextResponse.json({ error: "Content generation failed" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create app/api/admin/materials/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ materials: data });
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();
  const supabase = createServiceClient();
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { data, error } = await supabase.from("materials").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ material: data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();
  const supabase = createServiceClient();
  let body: Record<string, unknown> & { id: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { id, ...updates } = body;
  const { data, error } = await supabase
    .from("materials")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ material: data });
}

export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();
  const supabase = createServiceClient();
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/adminAuth.ts app/api/admin/
git commit -m "api: add admin routes (materials CRUD, leads list, content generation)"
```

---

## Task 14: Admin UI Pages

**Files:** `app/admin/materials/page.tsx`, `app/admin/leads/page.tsx`

- [ ] **Step 1: Add Admin CSS to globals.css**

Append to `app/globals.css`:

```css
/* ─── Admin ──────────────────────────────────────────────────────────────── */
.admin-page { padding-top: var(--header-height); min-height: 100vh; background: var(--color-warm); }
.admin-header {
  background: var(--color-ink);
  color: var(--color-white);
  padding: 1.5rem var(--gutter);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.admin-header h1 { font-family: var(--font-serif); font-size: 1.25rem; font-weight: 400; margin: 0; }
.admin-inner { padding: 2rem var(--gutter); }
.admin-table { width: 100%; border-collapse: collapse; background: var(--color-white); }
.admin-table th, .admin-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-line);
  font-size: 0.8rem;
}
.admin-table th { background: var(--color-warm); font-size: 0.48rem; letter-spacing: 0.12em; text-transform: uppercase; }
.admin-login {
  max-width: 360px;
  margin: 8rem auto;
  padding: 2rem;
  background: var(--color-white);
  border: 1px solid var(--color-line);
}
.admin-login h1 { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 400; margin: 0 0 1.5rem; }
```

- [ ] **Step 2: Create app/admin/leads/page.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";

type Lead = {
  id: string;
  created_at: string;
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  preferred_materials?: string[];
  status: string;
  project_type?: string;
};

export default function AdminLeadsPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/leads?pw=${encodeURIComponent(password)}`);
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads);
      setAuthed(true);
    } else {
      setError("Incorrect password.");
    }
  }

  if (!authed) {
    return (
      <main className="admin-page">
        <div className="admin-login">
          <h1>Admin</h1>
          <form onSubmit={handleLogin}>
            <input
              className="finder-text-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: "0.5rem", width: "100%" }}
              aria-label="Admin password"
            />
            {error && <p style={{ color: "var(--color-error)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>{error}</p>}
            <button type="submit" className="button" style={{ width: "100%" }}>Enter</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-header">
        <h1>Lead Inbox</h1>
        <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{leads.length} leads</span>
      </div>
      <div className="admin-inner" style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Name</th>
              <th scope="col">Contact</th>
              <th scope="col">Source</th>
              <th scope="col">Project</th>
              <th scope="col">Materials</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                <td>{lead.name ?? "—"}</td>
                <td>
                  {lead.email && <div>{lead.email}</div>}
                  {lead.phone && <div>{lead.phone}</div>}
                </td>
                <td>{lead.source ?? "—"}</td>
                <td>{lead.project_type ?? "—"}</td>
                <td>{lead.preferred_materials?.join(", ") ?? "—"}</td>
                <td>
                  <span className="badge">{lead.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create app/admin/materials/page.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Material = {
  id: string;
  slug: string;
  name: string;
  material_type: string;
  availability: string;
  featured: boolean;
  quantity: number;
};

export default function AdminMaterialsPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState("");
  const [pw, setPw] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/materials?pw=${encodeURIComponent(password)}`);
    if (res.ok) {
      const data = await res.json();
      setMaterials(data.materials);
      setPw(password);
      setAuthed(true);
    } else {
      setError("Incorrect password.");
    }
  }

  async function toggleAvailability(id: string, current: string) {
    const next = current === "available" ? "unavailable" : "available";
    await fetch("/api/admin/materials", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${pw}` },
      body: JSON.stringify({ id, availability: next }),
    });
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, availability: next } : m))
    );
  }

  async function toggleFeatured(id: string, current: boolean) {
    await fetch("/api/admin/materials", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${pw}` },
      body: JSON.stringify({ id, featured: !current }),
    });
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, featured: !current } : m))
    );
  }

  if (!authed) {
    return (
      <main className="admin-page">
        <div className="admin-login">
          <h1>Admin</h1>
          <form onSubmit={handleLogin}>
            <input
              className="finder-text-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: "0.5rem", width: "100%" }}
              aria-label="Admin password"
            />
            {error && <p style={{ color: "var(--color-error)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>{error}</p>}
            <button type="submit" className="button" style={{ width: "100%" }}>Enter</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-header">
        <h1>Material Manager</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/admin/leads" style={{ color: "rgba(255,253,248,0.6)", fontSize: "0.72rem" }}>Lead Inbox</Link>
        </div>
      </div>
      <div className="admin-inner" style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Qty</th>
              <th scope="col">Availability</th>
              <th scope="col">Featured</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id}>
                <td>
                  <Link href={`/materials/${m.slug}`} target="_blank" style={{ color: "var(--color-bronze)" }}>
                    {m.name}
                  </Link>
                </td>
                <td>{m.material_type}</td>
                <td>{m.quantity}</td>
                <td>
                  <button
                    className={`chip ${m.availability === "available" ? "active" : ""}`}
                    style={{ fontSize: "0.48rem" }}
                    onClick={() => toggleAvailability(m.id, m.availability)}
                  >
                    {m.availability}
                  </button>
                </td>
                <td>
                  <button
                    className={`chip ${m.featured ? "active" : ""}`}
                    style={{ fontSize: "0.48rem" }}
                    onClick={() => toggleFeatured(m.id, m.featured)}
                  >
                    {m.featured ? "Featured" : "—"}
                  </button>
                </td>
                <td>
                  <Link href={`/materials/${m.slug}`} className="chip" target="_blank">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Test admin**

```bash
npm run dev
```

Open `http://localhost:3000/admin/materials`. Enter the `ADMIN_PASSWORD` from `.env.local`. Verify material list appears. Toggle availability on a slab and reload `/materials` to see it reflected.

Open `http://localhost:3000/admin/leads`. Submit a lead via the Stone Finder and verify it appears.

- [ ] **Step 5: Commit**

```bash
git add app/admin/ lib/adminAuth.ts app/globals.css
git commit -m "admin: add /admin/materials manager and /admin/leads inbox with password gate"
```

---

## Task 15: Final Phase 2+3 QA

- [ ] **Step 1: Full build**

```bash
npm run build 2>&1 | tail -40
```

Expected: zero errors. Route list includes all new pages.

- [ ] **Step 2: End-to-end flows**

Run `npm run dev` and manually test each flow:

**Stone Finder flow:**
1. `http://localhost:3000/stone-finder`
2. Select Kitchen + Transitional + Quartzite
3. Click "Find My Stone"
4. Verify results appear with Gemini explanation text
5. Submit lead form → check Supabase `leads` table

**Trade application:**
1. `http://localhost:3000/trade`
2. Fill form and submit
3. Check Supabase `leads` table for `source = 'trade-application'`

**Projects:**
1. `http://localhost:3000/projects`
2. Create a new project
3. Visit `/materials/emperador`
4. Click "Save to Project" (wires up in SaveMaterialButton if implemented, or manually navigate to `/projects/[id]`)
5. Verify localStorage has the project

**Compare:**
1. `http://localhost:3000/compare?a=emperador&b=pietra-grey`
2. Verify side-by-side table renders

**Visualizer:**
1. `http://localhost:3000/visualizer`
2. Upload any room photo
3. Select surface + enter `emperador`
4. Click Generate — mock returns the uploaded photo

**Admin:**
1. `http://localhost:3000/admin/materials` — login, toggle availability
2. `http://localhost:3000/admin/leads` — verify leads from above flows appear

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Tag release**

```bash
git tag phase2-3-complete
git log --oneline | head -30
```

---

## Phase 2+3 Complete

**What is live:**
- AI Stone Finder — guided form, Gemini recommendations, lead capture
- `/api/leads` and `/api/availability` for storing all inquiries
- Trade portal with application form
- Saved Projects (localStorage)
- Material comparison table (`/compare`)
- Room Visualizer UI with mock adapter (ready for real Gemini Vision when available)
- Admin panel — material manager + lead inbox + AI content generation
- All admin operations password-protected

**Follow-up items (not in this plan):**
- Swap `visualizeRoom()` mock with real Gemini image editing when the API supports it
- Wire SaveMaterialButton to show project picker modal on `/materials/[slug]` and `MaterialCard`
- Add email notification to Ali via Resend when a lead is created (`RESEND_API_KEY`)
- Category hero images — ask Ali for type-specific photography
- Seed remaining ~38 slabs (from Stone Index) via admin panel
- Review Row hover on homepage "View material →" overlay
