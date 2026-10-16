# Stone Visualizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock gradient visualizer with an AI-powered stone visualization tool where users upload a kitchen/bathroom photo, select stones for specific surfaces via a step-by-step wizard, and receive photorealistic composites from OpenAI — gated behind lead capture after 5 renders.

**Architecture:** Next.js App Router with new API routes for photo upload, render, lead capture, and share. Photos and renders stored in Supabase Storage. OpenAI `gpt-image-1` handles photorealistic compositing. Client-side wizard manages multi-surface stone selection with per-surface stone choice. Session tracking via server-side records + client `sessionStorage`.

**Tech Stack:** Next.js 16 (App Router), OpenAI Node SDK, Supabase Storage + DB, React 19, TypeScript, existing CSS design system.

**Design spec:** `docs/superpowers/specs/2026-10-16-stone-visualizer-design.md`

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `lib/openai.ts` | OpenAI client singleton |
| `lib/db/visualizer.ts` | All Supabase DB operations for visualizer (sessions, renders, leads) |
| `lib/visualizer-prompt.ts` | Build OpenAI prompt from material data + surface selections |
| `types/visualizer.ts` | Type definitions: RoomType, surfaces, SurfaceSelection, session/render/lead types |
| `app/api/visualize/upload/route.ts` | Photo upload → Supabase Storage + session creation |
| `app/api/visualize/render/route.ts` | Surface selections → OpenAI render → store result |
| `app/api/visualize/lead/route.ts` | Lead capture for gated actions |
| `app/api/visualize/shared/[token]/route.ts` | Fetch shared render data |
| `components/visualizer/PhotoUpload.tsx` | Drag-and-drop photo upload component |
| `components/visualizer/RoomPicker.tsx` | Kitchen/bathroom selector |
| `components/visualizer/SurfaceWizard.tsx` | Step-by-step surface + stone picker |
| `components/visualizer/StoneSearch.tsx` | Material search with dropdown (extracted from existing VisualizerClient) |
| `components/visualizer/RenderResult.tsx` | Before/after view + action buttons |
| `components/visualizer/LeadCaptureModal.tsx` | Email + phone gate modal |
| `components/visualizer/BeforeAfterSlider.tsx` | Drag slider comparing original vs render |
| `app/visualizer/shared/[token]/page.tsx` | Shared render page (server component) |
| `app/visualizer/shared/[token]/SharedVisualizerClient.tsx` | Client component for shared render |

### Modified files
| File | Change |
|------|--------|
| `app/visualizer/VisualizerClient.tsx` | Full rewrite — wizard flow replacing current search+room picker |
| `app/api/visualize/route.ts` | Delete (replaced by new route structure) |
| `lib/db/index.ts` | Add `export * from "./visualizer"` |
| `next.config.ts` | Add OpenAI image domain to `remotePatterns` |
| `.env.example` | Add `OPENAI_API_KEY` |
| `package.json` | Add `openai` dependency |

---

## Task 1: Types and constants

**Files:**
- Create: `types/visualizer.ts`

- [ ] **Step 1: Create the type definitions file**

```typescript
// types/visualizer.ts

export type RoomType = "kitchen" | "bathroom";

export type KitchenSurface = "countertop" | "island" | "backsplash";
export type BathroomSurface = "vanity_top" | "shower_walls" | "all_walls" | "floors";
export type Surface = KitchenSurface | BathroomSurface;

export type SurfaceOption = {
  value: Surface;
  label: string;
};

export const ROOM_SURFACES: Record<RoomType, SurfaceOption[]> = {
  kitchen: [
    { value: "countertop", label: "Countertop" },
    { value: "island", label: "Island" },
    { value: "backsplash", label: "Backsplash" },
  ],
  bathroom: [
    { value: "vanity_top", label: "Vanity Top" },
    { value: "shower_walls", label: "Shower Walls" },
    { value: "all_walls", label: "All Bathroom Walls" },
    { value: "floors", label: "Floors" },
  ],
};

export type SurfaceSelection = {
  surface: Surface;
  material_slug: string;
  material_name: string;
  waterfall?: boolean; // only for "island"
};

export type VisualizerSession = {
  id: string;
  photo_url: string;
  room_type: RoomType;
  render_count: number;
  lead_captured: boolean;
  created_at: string;
};

export type VisualizerRender = {
  id: string;
  session_id: string;
  render_url: string;
  surfaces: SurfaceSelection[];
  share_token: string;
  created_at: string;
};

export type VisualizerLead = {
  id: string;
  session_id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
};

export const MAX_RENDERS_SELF_SERVE = 5;
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_PHOTO_WIDTH = 1600;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors related to `types/visualizer.ts`

- [ ] **Step 3: Commit**

```bash
git add types/visualizer.ts
git commit -m "feat(visualizer): add type definitions and constants for stone visualizer"
```

---

## Task 2: OpenAI client and prompt builder

**Files:**
- Create: `lib/openai.ts`
- Create: `lib/visualizer-prompt.ts`
- Modify: `.env.example` — add `OPENAI_API_KEY`
- Modify: `package.json` — add `openai` dependency

- [ ] **Step 1: Install the OpenAI SDK**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npm install openai`

- [ ] **Step 2: Create the OpenAI client singleton**

```typescript
// lib/openai.ts
import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    client = new OpenAI({ apiKey });
  }
  return client;
}
```

- [ ] **Step 3: Create the prompt builder**

This function takes material data + surface selections and builds the OpenAI prompt.

```typescript
// lib/visualizer-prompt.ts
import type { Material } from "@/types/material";
import type { RoomType, SurfaceSelection } from "@/types/visualizer";

const SURFACE_LABELS: Record<string, string> = {
  countertop: "kitchen countertop",
  island: "kitchen island countertop",
  backsplash: "kitchen backsplash",
  vanity_top: "bathroom vanity top",
  shower_walls: "shower walls",
  all_walls: "bathroom walls",
  floors: "bathroom floor",
};

function describeMaterial(material: Material): string {
  const parts = [
    `${material.name}, a ${material.material_type.toLowerCase()}`,
    material.finish ? `with a ${material.finish.toLowerCase()} finish` : null,
    material.color_family ? `in the ${material.color_family.toLowerCase()} color family` : null,
  ];
  const base = parts.filter(Boolean).join(" ");
  if (material.description) {
    return `${base}. ${material.description}`;
  }
  return base;
}

export function buildVisualizerPrompt(
  roomType: RoomType,
  selections: { selection: SurfaceSelection; material: Material }[]
): string {
  const roomLabel = roomType === "kitchen" ? "kitchen" : "bathroom";

  const surfaceInstructions = selections.map(({ selection, material }) => {
    let surfaceLabel = SURFACE_LABELS[selection.surface] ?? selection.surface;
    if (selection.surface === "island" && selection.waterfall) {
      surfaceLabel = "kitchen island countertop with waterfall edges (stone continues down the sides)";
    }
    return `- Replace the ${surfaceLabel} with ${describeMaterial(material)}.`;
  });

  return [
    `Edit this ${roomLabel} photo. Replace the specified surfaces with natural stone, making the result look photorealistic.`,
    "",
    ...surfaceInstructions,
    "",
    "Important:",
    "- Match the lighting, shadows, and reflections of the original photo.",
    "- Preserve the exact perspective and geometry of each surface.",
    "- Show realistic stone veining, texture, and color variation.",
    "- Do NOT modify anything other than the specified surfaces.",
    "- The result should look like a professional interior design rendering.",
  ].join("\n");
}
```

- [ ] **Step 4: Add OPENAI_API_KEY to .env.example**

Add `OPENAI_API_KEY=your-openai-api-key` to the end of `.env.example`.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add lib/openai.ts lib/visualizer-prompt.ts .env.example package.json package-lock.json
git commit -m "feat(visualizer): add OpenAI client and prompt builder for stone compositing"
```

---

## Task 3: Supabase DB operations for visualizer

**Files:**
- Create: `lib/db/visualizer.ts`
- Modify: `lib/db/index.ts`

- [ ] **Step 1: Create the visualizer DB module**

This module handles all Supabase operations for sessions, renders, and leads. It follows the same pattern as `lib/db/materials.ts` and `lib/db/leads.ts`.

```typescript
// lib/db/visualizer.ts
import { createServiceClient } from "@/lib/supabase";
import type {
  RoomType,
  SurfaceSelection,
  VisualizerSession,
  VisualizerRender,
  VisualizerLead,
} from "@/types/visualizer";

// ── Sessions ──────────────────────────────────────────────

export async function createVisualizerSession(input: {
  photo_url: string;
  room_type: RoomType;
}): Promise<VisualizerSession> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("visualizer_sessions")
    .insert({
      photo_url: input.photo_url,
      room_type: input.room_type,
      render_count: 0,
      lead_captured: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(`createVisualizerSession: ${error.message}`);
  return data as VisualizerSession;
}

export async function getVisualizerSession(
  id: string
): Promise<VisualizerSession | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("visualizer_sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getVisualizerSession: ${error.message}`);
  }
  return data as VisualizerSession;
}

export async function incrementRenderCount(sessionId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("increment_render_count", {
    session_id: sessionId,
  });
  if (error) {
    // Fallback: read-then-write if RPC not available
    const session = await getVisualizerSession(sessionId);
    if (!session) throw new Error("Session not found");
    const { error: updateError } = await supabase
      .from("visualizer_sessions")
      .update({ render_count: session.render_count + 1 })
      .eq("id", sessionId);
    if (updateError)
      throw new Error(`incrementRenderCount: ${updateError.message}`);
  }
}

export async function markLeadCaptured(sessionId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("visualizer_sessions")
    .update({ lead_captured: true })
    .eq("id", sessionId);
  if (error) throw new Error(`markLeadCaptured: ${error.message}`);
}

// ── Renders ───────────────────────────────────────────────

export async function createVisualizerRender(input: {
  session_id: string;
  render_url: string;
  surfaces: SurfaceSelection[];
  share_token: string;
}): Promise<VisualizerRender> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("visualizer_renders")
    .insert({
      session_id: input.session_id,
      render_url: input.render_url,
      surfaces: input.surfaces,
      share_token: input.share_token,
    })
    .select("*")
    .single();
  if (error) throw new Error(`createVisualizerRender: ${error.message}`);
  return data as VisualizerRender;
}

export async function getVisualizerRenderByToken(
  token: string
): Promise<(VisualizerRender & { session: VisualizerSession }) | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("visualizer_renders")
    .select("*, session:visualizer_sessions(*)")
    .eq("share_token", token)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getVisualizerRenderByToken: ${error.message}`);
  }
  return data as VisualizerRender & { session: VisualizerSession };
}

// ── Leads ─────────────────────────────────────────────────

export async function createVisualizerLead(input: {
  session_id: string;
  name: string;
  email: string;
  phone: string;
}): Promise<VisualizerLead> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("visualizer_leads")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(`createVisualizerLead: ${error.message}`);
  return data as VisualizerLead;
}
```

- [ ] **Step 2: Add export to db index**

In `lib/db/index.ts`, add the new export:

```typescript
export * from "./materials";
export * from "./leads";
export * from "./visualizer";
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/db/visualizer.ts lib/db/index.ts
git commit -m "feat(visualizer): add Supabase DB operations for sessions, renders, and leads"
```

---

## Task 4: Photo upload API route

**Files:**
- Create: `app/api/visualize/upload/route.ts`

- [ ] **Step 1: Create the upload route**

This route receives a photo as base64 in JSON (simpler than multipart for the client), uploads it to Supabase Storage, and creates a session.

```typescript
// app/api/visualize/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { createVisualizerSession } from "@/lib/db/visualizer";
import { isRateLimited, getIp } from "@/lib/rateLimiter";
import type { RoomType } from "@/types/visualizer";

export const dynamic = "force-dynamic";

const RATE = { limit: 10, windowMs: 60 * 60 * 1000, key: "viz-upload" };
const VALID_ROOMS: RoomType[] = ["kitchen", "bathroom"];

export async function POST(request: NextRequest) {
  if (isRateLimited(getIp(request), RATE)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const photoData = body.photo_data as string | undefined;
  const roomType = body.room_type as string | undefined;

  if (!photoData || !String(photoData).startsWith("data:image/")) {
    return NextResponse.json(
      { error: "photo_data must be a data:image/* data URL." },
      { status: 400 }
    );
  }

  if (!roomType || !VALID_ROOMS.includes(roomType as RoomType)) {
    return NextResponse.json(
      { error: "room_type must be 'kitchen' or 'bathroom'." },
      { status: 400 }
    );
  }

  // Extract binary from data URL
  const base64Match = photoData.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!base64Match) {
    return NextResponse.json(
      { error: "Invalid photo_data format." },
      { status: 400 }
    );
  }

  const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
  const buffer = Buffer.from(base64Match[2], "base64");

  // 10MB limit
  if (buffer.length > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Photo exceeds 10MB limit." },
      { status: 413 }
    );
  }

  const supabase = createServiceClient();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `visualizer-photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("visualizer-photos")
    .upload(fileName, buffer, {
      contentType: `image/${base64Match[1]}`,
      upsert: false,
    });

  if (uploadError) {
    console.error("[POST /api/visualize/upload] storage:", uploadError.message);
    return NextResponse.json(
      { error: "Failed to upload photo." },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from("visualizer-photos")
    .getPublicUrl(fileName);

  try {
    const session = await createVisualizerSession({
      photo_url: urlData.publicUrl,
      room_type: roomType as RoomType,
    });

    return NextResponse.json(
      { session_id: session.id, photo_url: urlData.publicUrl },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/visualize/upload] db:", err);
    return NextResponse.json(
      { error: "Failed to create session." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/api/visualize/upload/route.ts
git commit -m "feat(visualizer): add photo upload API route with Supabase Storage"
```

---

## Task 5: Render API route (OpenAI compositing)

**Files:**
- Create: `app/api/visualize/render/route.ts`

- [ ] **Step 1: Create the render route**

This is the core route — it takes a session + surface selections, fetches material data, calls OpenAI, stores the result, and returns the render URL.

```typescript
// app/api/visualize/render/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getVisualizerSession, incrementRenderCount, createVisualizerRender } from "@/lib/db/visualizer";
import { getMaterial } from "@/lib/db/materials";
import { getOpenAIClient } from "@/lib/openai";
import { buildVisualizerPrompt } from "@/lib/visualizer-prompt";
import { isRateLimited, getIp } from "@/lib/rateLimiter";
import type { SurfaceSelection } from "@/types/visualizer";
import { MAX_RENDERS_SELF_SERVE } from "@/types/visualizer";

export const dynamic = "force-dynamic";

const RATE = { limit: 10, windowMs: 60 * 60 * 1000, key: "viz-render" };

export async function POST(request: NextRequest) {
  if (isRateLimited(getIp(request), RATE)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const sessionId = body.session_id as string | undefined;
  const surfaces = body.surfaces as SurfaceSelection[] | undefined;

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required." }, { status: 400 });
  }
  if (!surfaces || !Array.isArray(surfaces) || surfaces.length === 0) {
    return NextResponse.json(
      { error: "surfaces must be a non-empty array." },
      { status: 400 }
    );
  }

  // Validate session exists and check render limit
  let session;
  try {
    session = await getVisualizerSession(sessionId);
  } catch (err) {
    console.error("[POST /api/visualize/render] session lookup:", err);
    return NextResponse.json({ error: "Failed to look up session." }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (session.render_count >= MAX_RENDERS_SELF_SERVE) {
    return NextResponse.json(
      {
        error: "Render limit reached. A Stone Supply Co representative will reach out to help you explore more options.",
        limit_reached: true,
      },
      { status: 402 }
    );
  }

  // Fetch material data for each selected surface
  let materialLookups: { selection: SurfaceSelection; material: Awaited<ReturnType<typeof getMaterial>> & {} }[];
  try {
    materialLookups = await Promise.all(
      surfaces.map(async (sel) => {
        const material = await getMaterial(sel.material_slug);
        if (!material) throw new Error(`Material not found: ${sel.material_slug}`);
        return { selection: sel, material };
      })
    );
  } catch {
    return NextResponse.json(
      { error: "One or more selected materials not found." },
      { status: 400 }
    );
  }

  // Build prompt and call OpenAI
  const prompt = buildVisualizerPrompt(session.room_type, materialLookups);

  try {
    const openai = getOpenAIClient();

    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: await fetchImageAsFile(session.photo_url),
      prompt,
      size: "1024x1024",
    });

    const imageBase64 = response.data?.[0]?.b64_json;
    if (!imageBase64) {
      throw new Error("OpenAI returned no image data");
    }

    // Upload render to Supabase Storage
    const supabase = createServiceClient();
    const renderFileName = `${crypto.randomUUID()}.png`;
    const renderBuffer = Buffer.from(imageBase64, "base64");

    const { error: uploadError } = await supabase.storage
      .from("visualizer-renders")
      .upload(renderFileName, renderBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("visualizer-renders")
      .getPublicUrl(renderFileName);

    // Create render record + increment count
    const shareToken = crypto.randomUUID().slice(0, 12);
    const render = await createVisualizerRender({
      session_id: sessionId,
      render_url: urlData.publicUrl,
      surfaces,
      share_token: shareToken,
    });

    await incrementRenderCount(sessionId);

    return NextResponse.json({
      render_id: render.id,
      render_url: urlData.publicUrl,
      share_token: shareToken,
      renders_remaining: MAX_RENDERS_SELF_SERVE - (session.render_count + 1),
    });
  } catch (err) {
    console.error("[POST /api/visualize/render] OpenAI/storage:", err);
    return NextResponse.json(
      { error: "Failed to generate visualization. Please try again." },
      { status: 500 }
    );
  }
}

/** Fetch an image URL and return it as a File object for the OpenAI API. */
async function fetchImageAsFile(url: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch photo: ${res.status}`);
  const blob = await res.blob();
  return new File([blob], "photo.png", { type: blob.type });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/api/visualize/render/route.ts
git commit -m "feat(visualizer): add render API route with OpenAI image compositing"
```

---

## Task 6: Lead capture and share API routes

**Files:**
- Create: `app/api/visualize/lead/route.ts`
- Create: `app/api/visualize/shared/[token]/route.ts`

- [ ] **Step 1: Create the lead capture route**

```typescript
// app/api/visualize/lead/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVisualizerSession, createVisualizerLead, markLeadCaptured } from "@/lib/db/visualizer";
import { isRateLimited, getIp } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

const RATE = { limit: 5, windowMs: 10 * 60 * 1000, key: "viz-lead" };

export async function POST(request: NextRequest) {
  if (isRateLimited(getIp(request), RATE)) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const sessionId = body.session_id as string | undefined;
  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 160);
  const phone = String(body.phone ?? "").trim().slice(0, 40);

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required." }, { status: 400 });
  }
  if (!email && !phone) {
    return NextResponse.json(
      { error: "Email or phone is required." },
      { status: 400 }
    );
  }

  try {
    const session = await getVisualizerSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const lead = await createVisualizerLead({
      session_id: sessionId,
      name,
      email,
      phone,
    });

    await markLeadCaptured(sessionId);

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/visualize/lead]", err);
    return NextResponse.json(
      { error: "Failed to save contact info." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create the shared render route**

```typescript
// app/api/visualize/shared/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVisualizerRenderByToken } from "@/lib/db/visualizer";
import { getMaterial } from "@/lib/db/materials";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 8) {
    return NextResponse.json({ error: "Invalid share token." }, { status: 400 });
  }

  try {
    const render = await getVisualizerRenderByToken(token);
    if (!render) {
      return NextResponse.json({ error: "Render not found." }, { status: 404 });
    }

    // Fetch material details for each surface
    const materialDetails = await Promise.all(
      render.surfaces.map(async (sel) => {
        const mat = await getMaterial(sel.material_slug);
        return {
          surface: sel.surface,
          material_slug: sel.material_slug,
          material_name: mat?.name ?? sel.material_name,
          material_type: mat?.material_type ?? null,
          finish: mat?.finish ?? null,
          image_url: mat?.image_urls?.[0] ?? null,
          waterfall: sel.waterfall ?? false,
        };
      })
    );

    return NextResponse.json({
      photo_url: render.session.photo_url,
      room_type: render.session.room_type,
      render_url: render.render_url,
      surfaces: materialDetails,
    });
  } catch (err) {
    console.error("[GET /api/visualize/shared]", err);
    return NextResponse.json(
      { error: "Failed to load shared render." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/api/visualize/lead/route.ts app/api/visualize/shared/\[token\]/route.ts
git commit -m "feat(visualizer): add lead capture and shared render API routes"
```

---

## Task 7: Delete the old mock visualize route

**Files:**
- Delete: `app/api/visualize/route.ts`

- [ ] **Step 1: Remove the old mock route**

```bash
cd /Users/riz/Downloads/Stone-Supply-Co && git rm app/api/visualize/route.ts
```

- [ ] **Step 2: Verify no imports reference the old route**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && grep -r "api/visualize\"" --include="*.ts" --include="*.tsx" app/ lib/ components/ 2>/dev/null`

The only reference should be in `VisualizerClient.tsx` which we're rewriting in Task 10. If other files reference it, note them for Task 10.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(visualizer): remove legacy mock visualize route"
```

---

## Task 8: Update next.config.ts for OpenAI image domains

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add OpenAI image domain to remotePatterns**

OpenAI returns images from `oaidalleapiprodscus.blob.core.windows.net` (DALL-E/image generation). Since we upload to Supabase Storage and serve from there, we mainly need the existing Supabase patterns. But add the OpenAI domain as a safety net in case we ever serve directly.

In `next.config.ts`, add to the `remotePatterns` array:

```typescript
{ protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net", pathname: "/**" },
```

- [ ] **Step 2: Verify the config is valid**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -10`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: add OpenAI image domain to Next.js remote patterns"
```

---

## Task 9: Frontend components — PhotoUpload, RoomPicker, StoneSearch

**Files:**
- Create: `components/visualizer/PhotoUpload.tsx`
- Create: `components/visualizer/RoomPicker.tsx`
- Create: `components/visualizer/StoneSearch.tsx`

- [ ] **Step 1: Create PhotoUpload component**

Drag-and-drop + click-to-browse photo upload with client-side downscaling.

```tsx
// components/visualizer/PhotoUpload.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { MAX_PHOTO_SIZE_BYTES, MAX_PHOTO_WIDTH } from "@/types/visualizer";

type Props = {
  onUpload: (dataUrl: string) => void;
  disabled?: boolean;
};

export function PhotoUpload({ onUpload, disabled }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError("");
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPEG, PNG, or HEIC).");
        return;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        setError("Photo exceeds 10MB. Please choose a smaller file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, MAX_PHOTO_WIDTH / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          onUpload(dataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [onUpload]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? "var(--color-ink)" : "var(--color-line)"}`,
          borderRadius: "var(--radius-card)",
          padding: "3rem 1.5rem",
          textAlign: "center",
          cursor: disabled ? "default" : "pointer",
          background: dragOver ? "var(--color-warm)" : "var(--color-white)",
          transition: "all 0.15s",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "1rem",
            color: "var(--color-ink)",
            fontWeight: 500,
          }}
        >
          Drop your photo here, or click to browse
        </p>
        <p
          style={{
            margin: "0.5rem 0 0",
            fontSize: "0.82rem",
            color: "var(--color-stone-dark)",
          }}
        >
          JPEG, PNG, or HEIC · Max 10MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
          style={{ display: "none" }}
        />
      </div>
      {error && (
        <p style={{ color: "var(--color-error)", fontSize: "0.82rem", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create RoomPicker component**

```tsx
// components/visualizer/RoomPicker.tsx
"use client";

import type { RoomType } from "@/types/visualizer";

type Props = {
  value: RoomType | null;
  onChange: (room: RoomType) => void;
};

const ROOMS: { value: RoomType; label: string; description: string }[] = [
  {
    value: "kitchen",
    label: "Kitchen",
    description: "Countertops, islands, backsplashes",
  },
  {
    value: "bathroom",
    label: "Bathroom",
    description: "Vanity tops, shower walls, floors",
  },
];

export function RoomPicker({ value, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {ROOMS.map((room) => (
        <button
          key={room.value}
          type="button"
          onClick={() => onChange(room.value)}
          style={{
            flex: "1 1 200px",
            padding: "1.25rem 1rem",
            borderRadius: "var(--radius-card)",
            border: "2px solid",
            borderColor:
              value === room.value ? "var(--color-ink)" : "var(--color-line)",
            background:
              value === room.value ? "var(--color-ink)" : "var(--color-white)",
            color: value === room.value ? "var(--color-white)" : "var(--color-ink)",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.15s",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, fontSize: "1rem" }}>
            {room.label}
          </p>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.78rem",
              opacity: 0.8,
            }}
          >
            {room.description}
          </p>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create StoneSearch component**

Extracted from the existing VisualizerClient search logic — a reusable material search with dropdown.

```tsx
// components/visualizer/StoneSearch.tsx
"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import type { MaterialSummary } from "@/types/material";

type Props = {
  onSelect: (material: MaterialSummary) => void;
  selected?: MaterialSummary | null;
  label?: string;
};

export function StoneSearch({ onSelect, selected, label = "Stone material" }: Props) {
  const [query, setQuery] = useState(selected?.name ?? "");
  const [suggestions, setSuggestions] = useState<MaterialSummary[]>([]);
  const [open, setOpen] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    setOpen(true);
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/materials?q=${encodeURIComponent(q)}&limit=6`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  const selectMaterial = (mat: MaterialSummary) => {
    setQuery(mat.name);
    setSuggestions([]);
    setOpen(false);
    onSelect(mat);
  };

  return (
    <div className="finder-field" style={{ position: "relative" }}>
      <label>{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Search — e.g., Calacatta, Blue Bahia…"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--color-white)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
            zIndex: 20,
            overflow: "hidden",
          }}
        >
          {suggestions.map((mat) => (
            <button
              key={mat.slug}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectMaterial(mat)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.75rem 1rem",
                background: "none",
                border: "none",
                borderBottom: "1px solid var(--color-line)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {mat.image_urls?.[0] && (
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    position: "relative",
                    borderRadius: "2px",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={mat.image_urls[0]}
                    alt={mat.name}
                    fill
                    sizes="40px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "var(--color-ink)",
                    fontWeight: 500,
                  }}
                >
                  {mat.name}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color: "var(--color-stone-dark)",
                  }}
                >
                  {mat.material_type} · {mat.finish}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/visualizer/PhotoUpload.tsx components/visualizer/RoomPicker.tsx components/visualizer/StoneSearch.tsx
git commit -m "feat(visualizer): add PhotoUpload, RoomPicker, and StoneSearch components"
```

---

## Task 10: Frontend components — SurfaceWizard

**Files:**
- Create: `components/visualizer/SurfaceWizard.tsx`

- [ ] **Step 1: Create the SurfaceWizard component**

This is the core wizard: iterates through surfaces for the selected room, lets user pick a stone or skip each one, and shows a review screen at the end.

```tsx
// components/visualizer/SurfaceWizard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { ROOM_SURFACES } from "@/types/visualizer";
import type { RoomType, SurfaceSelection, SurfaceOption } from "@/types/visualizer";
import type { MaterialSummary } from "@/types/material";
import { StoneSearch } from "./StoneSearch";

type Props = {
  roomType: RoomType;
  onComplete: (selections: SurfaceSelection[]) => void;
  onBack: () => void;
};

type SurfaceStep = {
  option: SurfaceOption;
  action: "apply" | "skip" | null;
  material: MaterialSummary | null;
  waterfall: boolean;
};

export function SurfaceWizard({ roomType, onComplete, onBack }: Props) {
  const surfaceOptions = ROOM_SURFACES[roomType];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [steps, setSteps] = useState<SurfaceStep[]>(
    surfaceOptions.map((opt) => ({
      option: opt,
      action: null,
      material: null,
      waterfall: false,
    }))
  );
  const [reviewing, setReviewing] = useState(false);

  const current = steps[currentIndex];
  const isLast = currentIndex === steps.length - 1;

  const updateStep = (patch: Partial<SurfaceStep>) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, ...patch } : s))
    );
  };

  const goNext = () => {
    if (isLast) {
      setReviewing(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const goBack = () => {
    if (reviewing) {
      setReviewing(false);
      setCurrentIndex(steps.length - 1);
    } else if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = () => {
    const selections: SurfaceSelection[] = steps
      .filter((s) => s.action === "apply" && s.material)
      .map((s) => ({
        surface: s.option.value,
        material_slug: s.material!.slug,
        material_name: s.material!.name,
        waterfall: s.option.value === "island" ? s.waterfall : undefined,
      }));
    onComplete(selections);
  };

  const appliedCount = steps.filter(
    (s) => s.action === "apply" && s.material
  ).length;

  // ── Review screen ─────────────────────────────────────
  if (reviewing) {
    const applied = steps.filter((s) => s.action === "apply" && s.material);
    return (
      <div>
        <p
          className="eyebrow"
          style={{ color: "var(--color-stone-dark)", marginBottom: "0.75rem" }}
        >
          Review your selections
        </p>

        {applied.length === 0 ? (
          <p style={{ color: "var(--color-error)", fontSize: "0.88rem" }}>
            No surfaces selected. Go back and pick at least one stone.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {applied.map((s) => (
              <div
                key={s.option.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  background: "var(--color-white)",
                  border: "1px solid var(--color-line)",
                  borderRadius: "var(--radius-card)",
                }}
              >
                {s.material!.image_urls?.[0] && (
                  <div
                    style={{
                      width: "3rem",
                      height: "3rem",
                      position: "relative",
                      borderRadius: "2px",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={s.material!.image_urls[0]}
                      alt={s.material!.name}
                      fill
                      sizes="48px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                    }}
                  >
                    {s.option.label}
                    {s.waterfall ? " (waterfall)" : ""}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.78rem",
                      color: "var(--color-stone-dark)",
                    }}
                  >
                    {s.material!.name} · {s.material!.material_type} ·{" "}
                    {s.material!.finish}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginTop: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={goBack}
            style={{
              padding: "0.55rem 1.1rem",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-card)",
              background: "transparent",
              color: "var(--color-ink)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <button
            type="button"
            className="button button-ink"
            disabled={appliedCount === 0}
            onClick={handleSubmit}
          >
            Visualize
          </button>
        </div>
      </div>
    );
  }

  // ── Surface step ──────────────────────────────────────
  return (
    <div>
      <p
        className="eyebrow"
        style={{ color: "var(--color-stone-dark)", marginBottom: "0.5rem" }}
      >
        Surface {currentIndex + 1} of {steps.length}
      </p>
      <h3
        style={{
          margin: "0 0 1rem",
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 400,
        }}
      >
        {current.option.label}
      </h3>

      {/* Apply / Skip toggle */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {(["apply", "skip"] as const).map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => updateStep({ action })}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "999px",
              border: "1px solid",
              borderColor:
                current.action === action
                  ? "var(--color-ink)"
                  : "var(--color-line)",
              background:
                current.action === action ? "var(--color-ink)" : "transparent",
              color:
                current.action === action
                  ? "var(--color-white)"
                  : "var(--color-ink)",
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {action === "apply" ? "Apply stone" : "Skip"}
          </button>
        ))}
      </div>

      {/* Stone search — only when applying */}
      {current.action === "apply" && (
        <div style={{ marginBottom: "1.25rem" }}>
          <StoneSearch
            label={`Choose stone for ${current.option.label.toLowerCase()}`}
            selected={current.material}
            onSelect={(mat) => updateStep({ material: mat })}
          />

          {/* Waterfall toggle for island */}
          {current.option.value === "island" && current.material && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.75rem",
                fontSize: "0.88rem",
                color: "var(--color-ink)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={current.waterfall}
                onChange={(e) => updateStep({ waterfall: e.target.checked })}
              />
              Waterfall edges (stone continues down the sides)
            </label>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={goBack}
          style={{
            padding: "0.55rem 1.1rem",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            background: "transparent",
            color: "var(--color-ink)",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          className="button button-ink"
          disabled={current.action === "apply" && !current.material}
          onClick={goNext}
        >
          {current.action === null
            ? "Choose an option above"
            : isLast
              ? "Review selections"
              : "Next surface →"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/visualizer/SurfaceWizard.tsx
git commit -m "feat(visualizer): add SurfaceWizard step-by-step component"
```

---

## Task 11: Frontend components — BeforeAfterSlider, LeadCaptureModal, RenderResult

**Files:**
- Create: `components/visualizer/BeforeAfterSlider.tsx`
- Create: `components/visualizer/LeadCaptureModal.tsx`
- Create: `components/visualizer/RenderResult.tsx`

- [ ] **Step 1: Create BeforeAfterSlider component**

A draggable slider that reveals the original photo vs the rendered composite.

```tsx
// components/visualizer/BeforeAfterSlider.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
};

export function BeforeAfterSlider({ beforeSrc, afterSrc, alt }: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPosition(x);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging.current) updatePosition(e.clientX);
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: "66.67%",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
        cursor: "col-resize",
        userSelect: "none",
        touchAction: "none",
        border: "1px solid var(--color-line)",
      }}
    >
      {/* After (full) */}
      <Image src={afterSrc} alt={`${alt} — after`} fill sizes="(max-width: 768px) 100vw, 52rem" style={{ objectFit: "cover" }} />

      {/* Before (clipped) */}
      <div style={{ position: "absolute", inset: 0, width: `${position}%`, overflow: "hidden" }}>
        <Image src={beforeSrc} alt={`${alt} — before`} fill sizes="(max-width: 768px) 100vw, 52rem" style={{ objectFit: "cover" }} />
      </div>

      {/* Slider line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${position}%`,
          width: "3px",
          background: "var(--color-white)",
          boxShadow: "0 0 6px rgba(0,0,0,0.4)",
          transform: "translateX(-50%)",
          zIndex: 2,
        }}
      />

      {/* Slider handle */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `${position}%`,
          transform: "translate(-50%, -50%)",
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "50%",
          background: "var(--color-white)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3,
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "var(--color-ink)",
        }}
      >
        ◄►
      </div>

      {/* Labels */}
      <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", background: "rgba(23,24,21,0.75)", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", zIndex: 4 }}>
        Before
      </div>
      <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "rgba(23,24,21,0.75)", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", zIndex: 4 }}>
        After
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create LeadCaptureModal component**

```tsx
// components/visualizer/LeadCaptureModal.tsx
"use client";

import { useState } from "react";

type Props = {
  sessionId: string;
  action: string; // "download" | "quote" | "visit" — shown in the prompt
  onCaptured: () => void;
  onClose: () => void;
};

export function LeadCaptureModal({ sessionId, action, onCaptured, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ACTION_LABELS: Record<string, string> = {
    download: "download your visualization",
    quote: "request a quote",
    visit: "book a yard visit",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      setError("Please provide your email or phone number.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/visualize/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save.");
      }

      onCaptured();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--color-white)",
          borderRadius: "var(--radius-card)",
          padding: "2rem",
          maxWidth: "26rem",
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        <h3
          style={{
            margin: "0 0 0.5rem",
            fontFamily: "var(--font-serif)",
            fontSize: "1.5rem",
            fontWeight: 400,
          }}
        >
          Almost there
        </h3>
        <p
          style={{
            margin: "0 0 1.25rem",
            fontSize: "0.88rem",
            color: "var(--color-stone-dark)",
            lineHeight: 1.6,
          }}
        >
          Enter your contact info to {ACTION_LABELS[action] ?? action}. A Stone
          Supply Co representative may follow up to help with your project.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="finder-field" style={{ marginBottom: "0.75rem" }}>
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </div>
          <div className="finder-field" style={{ marginBottom: "0.75rem" }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="finder-field" style={{ marginBottom: "0.75rem" }}>
            <label>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              autoComplete="tel"
            />
          </div>

          {error && (
            <p style={{ color: "var(--color-error)", fontSize: "0.82rem", margin: "0 0 0.75rem" }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.55rem 1.1rem",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-card)",
                background: "transparent",
                color: "var(--color-ink)",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-ink"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create RenderResult component**

The post-render view with before/after slider and action buttons.

```tsx
// components/visualizer/RenderResult.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { LeadCaptureModal } from "./LeadCaptureModal";
import type { SurfaceSelection } from "@/types/visualizer";

type Props = {
  photoUrl: string;
  renderUrl: string;
  surfaces: SurfaceSelection[];
  shareToken: string;
  rendersRemaining: number;
  sessionId: string;
  leadCaptured: boolean;
  onLeadCaptured: () => void;
  onTryDifferent: () => void;
};

export function RenderResult({
  photoUrl,
  renderUrl,
  surfaces,
  shareToken,
  rendersRemaining,
  sessionId,
  leadCaptured,
  onLeadCaptured,
  onTryDifferent,
}: Props) {
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/visualizer/shared/${shareToken}`
      : "";

  const handleGatedAction = (action: string) => {
    if (leadCaptured) {
      executeAction(action);
    } else {
      setModalAction(action);
    }
  };

  const executeAction = (action: string) => {
    if (action === "download") {
      const a = document.createElement("a");
      a.href = renderUrl;
      a.download = "stone-visualization.png";
      a.click();
    }
    // quote and visit just confirm — the lead was already captured
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a hidden input
    }
  };

  const surfaceLabel = surfaces
    .map((s) => s.material_name)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");

  return (
    <div style={{ maxWidth: "52rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <span className="eyebrow" style={{ color: "var(--color-bronze-ink)" }}>
          {surfaceLabel}
        </span>
      </div>

      <BeforeAfterSlider
        beforeSrc={photoUrl}
        afterSrc={renderUrl}
        alt={`Stone visualization — ${surfaceLabel}`}
      />

      <p
        style={{
          marginTop: "0.75rem",
          fontSize: "0.78rem",
          color: "var(--color-stone-dark)",
        }}
      >
        {rendersRemaining > 0
          ? `${rendersRemaining} visualization${rendersRemaining === 1 ? "" : "s"} remaining`
          : "You've used all your free visualizations."}
      </p>

      {/* Action buttons */}
      <div
        style={{
          marginTop: "1.25rem",
          display: "flex",
          gap: "0.6rem",
          flexWrap: "wrap",
        }}
      >
        {rendersRemaining > 0 && (
          <button
            type="button"
            onClick={onTryDifferent}
            className="button button-ink"
            style={{ fontSize: "0.85rem" }}
          >
            Try a different stone
          </button>
        )}

        <button
          type="button"
          onClick={() => handleGatedAction("download")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "transparent",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            padding: "0.55rem 1.1rem",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          Download
        </button>

        <button
          type="button"
          onClick={handleShare}
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "transparent",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            padding: "0.55rem 1.1rem",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          {copied ? "Link copied!" : "Share"}
        </button>

        <button
          type="button"
          onClick={() => handleGatedAction("quote")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "transparent",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            padding: "0.55rem 1.1rem",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          Request a quote
        </button>

        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleGatedAction("visit");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "transparent",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-card)",
            padding: "0.55rem 1.1rem",
            fontSize: "0.82rem",
            textDecoration: "none",
          }}
        >
          Book a yard visit
        </Link>
      </div>

      {/* Lead capture modal */}
      {modalAction && (
        <LeadCaptureModal
          sessionId={sessionId}
          action={modalAction}
          onCaptured={() => {
            setModalAction(null);
            onLeadCaptured();
            executeAction(modalAction);
          }}
          onClose={() => setModalAction(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/visualizer/BeforeAfterSlider.tsx components/visualizer/LeadCaptureModal.tsx components/visualizer/RenderResult.tsx
git commit -m "feat(visualizer): add BeforeAfterSlider, LeadCaptureModal, and RenderResult components"
```

---

## Task 12: Rewrite VisualizerClient — full wizard flow

**Files:**
- Modify: `app/visualizer/VisualizerClient.tsx` (full rewrite)

- [ ] **Step 1: Rewrite VisualizerClient.tsx**

This replaces the entire file with the wizard flow: upload → room → surfaces → render → result.

```tsx
// app/visualizer/VisualizerClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { PhotoUpload } from "@/components/visualizer/PhotoUpload";
import { RoomPicker } from "@/components/visualizer/RoomPicker";
import { SurfaceWizard } from "@/components/visualizer/SurfaceWizard";
import { RenderResult } from "@/components/visualizer/RenderResult";
import type { RoomType, SurfaceSelection } from "@/types/visualizer";
import { MAX_RENDERS_SELF_SERVE } from "@/types/visualizer";

type WizardStep = "upload" | "room" | "surfaces" | "rendering" | "result";

export function VisualizerClient() {
  const [step, setStep] = useState<WizardStep>("upload");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [rendersRemaining, setRendersRemaining] = useState(MAX_RENDERS_SELF_SERVE);
  const [surfaces, setSurfaces] = useState<SurfaceSelection[]>([]);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // ── Upload photo + select room, then create session ──
  const handlePhotoUpload = (dataUrl: string) => {
    setPhotoDataUrl(dataUrl);
    setStep("room");
  };

  const handleRoomSelect = async (room: RoomType) => {
    setRoomType(room);
    setUploading(true);
    setError("");

    try {
      const res = await fetch("/api/visualize/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_data: photoDataUrl, room_type: room }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setSessionId(data.session_id);
      setPhotoUrl(data.photo_url);
      setStep("surfaces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ── Render ──
  const handleSurfacesComplete = async (selections: SurfaceSelection[]) => {
    setSurfaces(selections);
    setStep("rendering");
    setError("");

    try {
      const res = await fetch("/api/visualize/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, surfaces: selections }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.limit_reached) {
          setError(data.error);
          setRendersRemaining(0);
          setStep("result");
          return;
        }
        throw new Error(data.error ?? "Render failed.");
      }
      setRenderUrl(data.render_url);
      setShareToken(data.share_token);
      setRendersRemaining(data.renders_remaining);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Render failed.");
      setStep("surfaces");
    }
  };

  // ── Try different stone ──
  const handleTryDifferent = () => {
    setRenderUrl(null);
    setShareToken(null);
    setStep("surfaces");
  };

  // ── Step bar ──
  const STEPS: WizardStep[] = ["upload", "room", "surfaces", "rendering", "result"];
  const stepIndex = STEPS.indexOf(step);

  return (
    <>
      {/* Hero */}
      <div
        style={{
          padding:
            "calc(var(--header-height) + clamp(4rem, 7vw, 7rem)) var(--gutter) clamp(3rem, 5vw, 5rem)",
          background: "var(--color-warm)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <nav className="breadcrumb breadcrumb-ink" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep" aria-hidden>
            ›
          </span>
          <Link href="/materials">Materials</Link>
          <span className="breadcrumb-sep" aria-hidden>
            ›
          </span>
          <span className="breadcrumb-current">Stone Visualizer</span>
        </nav>

        <h1
          style={{
            margin: "1.5rem 0 0",
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(3rem, 6vw, 6rem)",
            fontWeight: 400,
            letterSpacing: "-0.05em",
            lineHeight: 0.9,
            maxWidth: "14ch",
          }}
        >
          See it in your space.
        </h1>
        <p
          style={{
            margin: "1.5rem 0 0",
            color: "var(--color-stone-dark)",
            fontSize: "1rem",
            lineHeight: 1.7,
            maxWidth: "38rem",
          }}
        >
          Upload a photo of your kitchen or bathroom, pick your stone for each
          surface, and our AI will show you exactly how it looks — photorealistic,
          in seconds.
        </p>
      </div>

      {/* Step progress bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "0.75rem var(--gutter)",
          background: "var(--color-paper)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        {["Upload", "Room", "Surfaces", "Rendering", "Result"].map((label, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "2px",
              background: i <= stepIndex ? "var(--color-ink)" : "var(--color-line)",
              transition: "background 0.3s",
            }}
            title={label}
          />
        ))}
      </div>

      {/* Content */}
      <section
        style={{
          padding: "clamp(3rem, 5vw, 5rem) var(--gutter)",
          background: "var(--color-white)",
          minHeight: "50vh",
        }}
      >
        <div style={{ maxWidth: "52rem" }}>
          {error && step !== "result" && (
            <p
              style={{
                color: "var(--color-error)",
                fontSize: "0.88rem",
                marginBottom: "1rem",
              }}
            >
              {error}
            </p>
          )}

          {/* Step: Upload */}
          {step === "upload" && (
            <div>
              <h2
                style={{
                  margin: "0 0 0.5rem",
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 400,
                }}
              >
                Upload your photo
              </h2>
              <p
                style={{
                  margin: "0 0 1.5rem",
                  fontSize: "0.88rem",
                  color: "var(--color-stone-dark)",
                  lineHeight: 1.6,
                }}
              >
                Take a photo of your kitchen or bathroom. For best results, shoot
                straight on so the countertops and surfaces are clearly visible.
              </p>
              <PhotoUpload onUpload={handlePhotoUpload} />
            </div>
          )}

          {/* Step: Room */}
          {step === "room" && (
            <div>
              <h2
                style={{
                  margin: "0 0 0.5rem",
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 400,
                }}
              >
                What room is this?
              </h2>
              <p
                style={{
                  margin: "0 0 1.5rem",
                  fontSize: "0.88rem",
                  color: "var(--color-stone-dark)",
                  lineHeight: 1.6,
                }}
              >
                This helps us identify the right surfaces to visualize.
              </p>

              {/* Photo preview */}
              {photoDataUrl && (
                <div
                  style={{
                    marginBottom: "1.5rem",
                    borderRadius: "var(--radius-card)",
                    overflow: "hidden",
                    border: "1px solid var(--color-line)",
                    maxWidth: "24rem",
                  }}
                >
                  <Image
                    src={photoDataUrl}
                    alt="Your uploaded photo"
                    width={400}
                    height={300}
                    style={{ width: "100%", height: "auto", display: "block" }}
                    unoptimized
                  />
                </div>
              )}

              <RoomPicker value={roomType} onChange={handleRoomSelect} />

              {uploading && (
                <p
                  style={{
                    marginTop: "1rem",
                    fontSize: "0.82rem",
                    color: "var(--color-stone-dark)",
                  }}
                >
                  Uploading photo…
                </p>
              )}
            </div>
          )}

          {/* Step: Surfaces */}
          {step === "surfaces" && roomType && (
            <SurfaceWizard
              roomType={roomType}
              onComplete={handleSurfacesComplete}
              onBack={() => setStep("room")}
            />
          )}

          {/* Step: Rendering */}
          {step === "rendering" && (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <div
                className="skeleton"
                style={{
                  height: "24rem",
                  borderRadius: "var(--radius-card)",
                  maxWidth: "40rem",
                  margin: "0 auto 1.5rem",
                }}
              />
              <p
                style={{
                  fontSize: "1rem",
                  color: "var(--color-ink)",
                  fontWeight: 500,
                }}
              >
                Generating your visualization…
              </p>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--color-stone-dark)",
                  marginTop: "0.5rem",
                }}
              >
                This usually takes 10–20 seconds. Our AI is compositing your
                stone selections into the photo.
              </p>
            </div>
          )}

          {/* Step: Result */}
          {step === "result" && renderUrl && photoUrl && shareToken && sessionId && (
            <RenderResult
              photoUrl={photoUrl}
              renderUrl={renderUrl}
              surfaces={surfaces}
              shareToken={shareToken}
              rendersRemaining={rendersRemaining}
              sessionId={sessionId}
              leadCaptured={leadCaptured}
              onLeadCaptured={() => setLeadCaptured(true)}
              onTryDifferent={handleTryDifferent}
            />
          )}

          {/* Limit reached message */}
          {step === "result" && rendersRemaining <= 0 && !renderUrl && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.5rem",
                  fontWeight: 400,
                  margin: "0 0 1rem",
                }}
              >
                You&rsquo;ve used all your free visualizations
              </h2>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--color-stone-dark)",
                  lineHeight: 1.6,
                  maxWidth: "32rem",
                  margin: "0 auto",
                }}
              >
                A Stone Supply Co representative will reach out to help you
                explore more options. Visit us at our Northridge yard to see
                these stones in person.
              </p>
              <Link
                href="/materials"
                className="button button-ink"
                style={{ marginTop: "1.5rem", display: "inline-flex" }}
              >
                Browse all materials
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/visualizer/VisualizerClient.tsx
git commit -m "feat(visualizer): rewrite VisualizerClient with full wizard flow"
```

---

## Task 13: Shared render page

**Files:**
- Create: `app/visualizer/shared/[token]/page.tsx`
- Create: `app/visualizer/shared/[token]/SharedVisualizerClient.tsx`

- [ ] **Step 1: Create the shared render server page**

```tsx
// app/visualizer/shared/[token]/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SharedVisualizerClient } from "./SharedVisualizerClient";

export const metadata: Metadata = {
  title: "Shared Stone Visualization",
  description:
    "See how natural stone looks in a real kitchen or bathroom — visualized with AI by Stone Supply Co.",
  robots: { index: false, follow: false },
};

export default async function SharedVisualizerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <>
      <Header solid />
      <main>
        <Suspense>
          <SharedVisualizerClient token={token} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Create the shared render client component**

```tsx
// app/visualizer/shared/[token]/SharedVisualizerClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BeforeAfterSlider } from "@/components/visualizer/BeforeAfterSlider";

type SharedData = {
  photo_url: string;
  room_type: string;
  render_url: string;
  surfaces: {
    surface: string;
    material_name: string;
    material_type: string | null;
    finish: string | null;
    image_url: string | null;
    waterfall: boolean;
  }[];
};

export function SharedVisualizerClient({ token }: { token: string }) {
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/visualize/shared/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Visualization not found.");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <div
        style={{
          padding:
            "calc(var(--header-height) + clamp(3rem, 5vw, 5rem)) var(--gutter) clamp(2rem, 4vw, 4rem)",
          background: "var(--color-warm)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            fontWeight: 400,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          Stone Visualization
        </h1>
        <p
          style={{
            margin: "1rem 0 0",
            fontSize: "0.92rem",
            color: "var(--color-stone-dark)",
            lineHeight: 1.6,
          }}
        >
          Shared from Stone Supply Co&rsquo;s AI visualizer.
        </p>
      </div>

      <section
        style={{
          padding: "clamp(3rem, 5vw, 5rem) var(--gutter)",
          background: "var(--color-white)",
        }}
      >
        {loading && (
          <div
            className="skeleton"
            style={{
              height: "24rem",
              maxWidth: "52rem",
              borderRadius: "var(--radius-card)",
            }}
          />
        )}

        {error && (
          <p style={{ color: "var(--color-error)", fontSize: "0.88rem" }}>
            {error}
          </p>
        )}

        {data && (
          <div style={{ maxWidth: "52rem" }}>
            <BeforeAfterSlider
              beforeSrc={data.photo_url}
              afterSrc={data.render_url}
              alt="Shared stone visualization"
            />

            {/* Surface list */}
            <div style={{ marginTop: "1.5rem" }}>
              <p
                className="eyebrow"
                style={{
                  color: "var(--color-stone-dark)",
                  marginBottom: "0.75rem",
                }}
              >
                Stones used
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {data.surfaces.map((s) => (
                  <div
                    key={s.surface}
                    style={{
                      padding: "0.6rem 0.75rem",
                      background: "var(--color-paper)",
                      borderRadius: "var(--radius-card)",
                      fontSize: "0.88rem",
                    }}
                  >
                    <strong style={{ textTransform: "capitalize" }}>
                      {s.surface.replace(/_/g, " ")}
                      {s.waterfall ? " (waterfall)" : ""}:
                    </strong>{" "}
                    {s.material_name}
                    {s.material_type ? ` · ${s.material_type}` : ""}
                    {s.finish ? ` · ${s.finish}` : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <Link href="/visualizer" className="button button-ink">
                Try the visualizer yourself
              </Link>
              <Link
                href="/materials"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "transparent",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-line)",
                  borderRadius: "var(--radius-card)",
                  padding: "0.55rem 1.1rem",
                  fontSize: "0.82rem",
                  textDecoration: "none",
                }}
              >
                Browse all materials
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/visualizer/shared/\[token\]/page.tsx app/visualizer/shared/\[token\]/SharedVisualizerClient.tsx
git commit -m "feat(visualizer): add shared render page for shareable visualization links"
```

---

## Task 14: Supabase schema migration

**Files:**
- Create: `scripts/visualizer-schema.sql`

This SQL creates the tables and storage buckets in Supabase. Run manually via the Supabase dashboard SQL editor or CLI.

- [ ] **Step 1: Create the migration script**

```sql
-- scripts/visualizer-schema.sql
-- Run this in the Supabase SQL editor to set up visualizer tables.

-- Sessions
create table if not exists visualizer_sessions (
  id uuid primary key default gen_random_uuid(),
  photo_url text not null,
  room_type text not null check (room_type in ('kitchen', 'bathroom')),
  render_count integer not null default 0,
  lead_captured boolean not null default false,
  created_at timestamptz not null default now()
);

-- Renders
create table if not exists visualizer_renders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references visualizer_sessions(id) on delete cascade,
  render_url text not null,
  surfaces jsonb not null default '[]'::jsonb,
  share_token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_visualizer_renders_share_token
  on visualizer_renders(share_token);

create index if not exists idx_visualizer_renders_session_id
  on visualizer_renders(session_id);

-- Leads
create table if not exists visualizer_leads (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references visualizer_sessions(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_visualizer_leads_session_id
  on visualizer_leads(session_id);

-- RPC for atomic render count increment
create or replace function increment_render_count(session_id uuid)
returns void as $$
  update visualizer_sessions
  set render_count = render_count + 1
  where id = session_id;
$$ language sql;
```

- [ ] **Step 2: Document storage bucket setup**

Add a comment at the top of the file explaining the manual steps:

The two Supabase Storage buckets must be created in the dashboard:
1. `visualizer-photos` — **private** bucket (photos contain user homes)
2. `visualizer-renders` — **public** bucket (renders are shared via links)

- [ ] **Step 3: Commit**

```bash
git add scripts/visualizer-schema.sql
git commit -m "feat(visualizer): add Supabase schema migration for visualizer tables"
```

---

## Task 15: Dev server smoke test

- [ ] **Step 1: Run TypeScript check**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npx tsc --noEmit --pretty 2>&1`

Fix any type errors before proceeding.

- [ ] **Step 2: Run the dev server**

Run: `cd /Users/riz/Downloads/Stone-Supply-Co && npm run dev`

- [ ] **Step 3: Navigate to `/visualizer` in the browser**

Verify:
- The page loads without errors
- The wizard shows "Upload your photo" step
- The progress bar shows 5 segments
- The hero text reads "See it in your space."
- The upload drop zone is visible and functional

- [ ] **Step 4: Test the upload flow (without Supabase/OpenAI)**

Attempt an upload — it will fail at the API level if Supabase/OpenAI keys aren't configured, but the client-side flow should work:
- Photo preview appears
- Room picker shows kitchen/bathroom
- Clicking a room attempts the upload API call

- [ ] **Step 5: Navigate to `/visualizer/shared/test-token`**

Verify:
- Page loads
- Shows "Visualization not found" error (expected — no real data)

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix(visualizer): resolve smoke test issues"
```

Only commit if there were fixes needed. Skip this step if everything passed clean.
