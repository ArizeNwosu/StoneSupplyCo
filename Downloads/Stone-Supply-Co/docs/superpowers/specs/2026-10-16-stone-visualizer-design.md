# Stone Visualizer — Design Spec

**Date:** 2026-10-16
**Status:** Approved for implementation
**Branch:** `feature/playable-commerce-build`

---

## 1. What it is

An AI-powered stone visualization tool that lets users upload a photo of their kitchen or bathroom and see how specific stones from Stone Supply Co's inventory would look installed on their counters, islands, backsplashes, walls, and floors. The tool uses OpenAI's image generation API for photorealistic compositing and serves as the primary top-of-funnel lead capture mechanism.

## 2. User flow — step-by-step wizard

### Step 1: Upload photo
- User uploads a photo of their kitchen or bathroom (JPEG, PNG, HEIC)
- HEIC → JPEG conversion handled client-side
- Max file size: 10MB
- Client-side downscale to max 1600px width before upload
- Photo is uploaded to Supabase Storage (private bucket) immediately

### Step 2: Select room type
- **Kitchen** — surfaces: countertop, island, backsplash
- **Bathroom** — surfaces: vanity top, shower walls, all walls, floors

Room type determines which surfaces are offered in the next steps.

### Step 3: Surface wizard (one surface at a time)
For each available surface in the selected room type:

1. Show the surface name (e.g. "Countertop")
2. User chooses: **Apply stone** or **Skip**
3. If applying: search/select a stone from the materials library (same search as existing visualizer)
4. **Island-specific:** if "Island" is selected, show a toggle: "Waterfall edges? Yes / No"
5. "Next" advances to the next surface
6. After all surfaces: **Review screen** showing all selections before rendering

Each surface gets its own independent stone selection. Users can pick the same stone for all surfaces or different stones per surface.

### Step 4: Render
- Single API call to the backend
- Backend calls OpenAI image generation with:
  - The uploaded photo
  - A prompt describing which surfaces to replace with which stones
  - Stone descriptions derived from material data (color family, material type, finish, veining patterns)
- Loading state while rendering (~10-20 seconds)
- Result: photorealistic composite image displayed in a before/after view

### Step 5: Actions (post-render)
- **Try a different stone** — goes back to surface wizard, photo preserved (no gate)
- **Share** — generates a shareable link (no gate)
- **Download** — requires email + phone first
- **Request a quote** — requires email + phone first
- **Book a yard visit** — requires email + phone first

Lead capture form: name, email, phone. Once captured, download/quote/visit actions unlock for the session. Lead capture does NOT unlock additional renders — the 3-render cap is a hard limit for self-serve.

## 3. Rate limiting & cost control

- **5 free renders per session** (tracked via session cookie or localStorage)
- After 5 renders: hard gate requiring email + phone number
- After lead capture: no additional self-serve renders. Display message: "A Stone Supply Co representative will reach out to help you explore more options."
- **Total max: 5 renders self-serve.** Sales reps can perform additional renders for qualified leads.
- Existing IP-based rate limit on `api/visualize` remains as abuse protection (10/hour)

## 4. Share links

- Share link format: `/visualizer/shared/[render_id]`
- Shared page loads a **live, re-renderable session**:
  - Shows the original photo + stone selections
  - Recipient can modify stone selections and re-render
  - Recipient gets their own 3-render limit
- Requires storing: uploaded photo (Supabase Storage), stone selections, render result

## 5. Data model

### New tables / storage

**Supabase Storage buckets:**
- `visualizer-photos` (private) — uploaded kitchen/bathroom photos
- `visualizer-renders` (public) — generated composite images (for share links)

**New data (stored in Supabase, schema TBD during implementation):**

`visualizer_sessions`:
- `id` (uuid, primary key)
- `photo_url` (text) — Supabase Storage path to uploaded photo
- `room_type` (text) — "kitchen" | "bathroom"
- `render_count` (int, default 0)
- `lead_captured` (boolean, default false)
- `created_at` (timestamptz)

`visualizer_renders`:
- `id` (uuid, primary key)
- `session_id` (uuid, FK → visualizer_sessions)
- `render_url` (text) — Supabase Storage path to rendered image
- `surfaces` (jsonb) — array of `{ surface: string, material_slug: string, waterfall?: boolean }`
- `share_token` (text, unique) — short token for share URLs
- `created_at` (timestamptz)

`visualizer_leads`:
- `id` (uuid, primary key)
- `session_id` (uuid, FK → visualizer_sessions)
- `name` (text)
- `email` (text)
- `phone` (text)
- `created_at` (timestamptz)

## 6. API routes

### `POST /api/visualize/upload`
- Receives photo file (multipart/form-data)
- Validates file type + size
- Downscales if needed (server-side safety net)
- Uploads to `visualizer-photos` bucket in Supabase Storage
- Creates `visualizer_sessions` record
- Returns: `{ session_id, photo_url }`

### `POST /api/visualize/render`
- Body: `{ session_id, surfaces: [{ surface, material_slug, waterfall? }] }`
- Checks render count (max 5 without lead capture, hard max 5 self-serve)
- Fetches material data for each selected stone
- Fetches photo from Supabase Storage
- Calls OpenAI image generation API
- Stores result in `visualizer-renders` bucket
- Creates `visualizer_renders` record with share token
- Increments `render_count` on session
- Returns: `{ render_id, render_url, share_token }`

### `POST /api/visualize/lead`
- Body: `{ session_id, name, email, phone }`
- Creates `visualizer_leads` record
- Sets `lead_captured = true` on session
- Returns: `{ ok: true }`

### `GET /api/visualize/shared/[token]`
- Looks up render by share token
- Returns: `{ photo_url, room_type, surfaces, render_url, material_details[] }`

### Existing routes unchanged
- `GET /api/materials?q=...` — used for stone search in the wizard
- `POST /api/visualize` — existing mock route, will be replaced by the new routes above

## 7. OpenAI integration

### API usage
- Model: `gpt-4o` (image generation / editing)
- Input: uploaded photo + text prompt describing the replacement
- The prompt is constructed from material data:

```
Replace the [surface] in this [room_type] photo with [material_name].
The stone is a [material_type] with a [finish] finish, [color_family] color family.
[Additional description from material.description if available]
Keep the lighting, shadows, and reflections consistent with the original photo.
Only modify the specified surface — leave everything else untouched.
```

- For multi-surface renders: all surface replacements described in a single prompt
- Response: base64 image or URL

### Cost estimate
- ~$0.02–0.08 per render
- At 5 renders/session, max ~$0.40 per visitor
- Acceptable for lead gen (one qualified lead justifies hundreds of renders)

## 8. Frontend architecture

### Updated file structure
- `app/visualizer/page.tsx` — server component wrapper (unchanged)
- `app/visualizer/VisualizerClient.tsx` — **rewrite** to implement wizard flow
- `app/visualizer/shared/[token]/page.tsx` — shared render page (new)
- `components/visualizer/PhotoUpload.tsx` — drag-and-drop photo upload (new)
- `components/visualizer/RoomPicker.tsx` — room type selector (new)
- `components/visualizer/SurfaceWizard.tsx` — step-by-step surface + stone picker (new)
- `components/visualizer/RenderResult.tsx` — before/after view + action buttons (new)
- `components/visualizer/LeadCaptureModal.tsx` — email + phone gate (new)
- `components/visualizer/BeforeAfterSlider.tsx` — drag slider comparing original vs render (new)

### State management
- All wizard state in `VisualizerClient.tsx` via `useState`
- Session ID stored in state + `sessionStorage` (survives page refreshes within tab)
- Render count tracked server-side (session record) and client-side (sessionStorage)

## 9. Surface definitions

```typescript
type RoomType = "kitchen" | "bathroom";

type KitchenSurface = "countertop" | "island" | "backsplash";
type BathroomSurface = "vanity_top" | "shower_walls" | "all_walls" | "floors";

type SurfaceSelection = {
  surface: KitchenSurface | BathroomSurface;
  material_slug: string;
  waterfall?: boolean; // only for "island"
};

const ROOM_SURFACES: Record<RoomType, { value: string; label: string }[]> = {
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
```

## 10. Dependencies

### New
- `openai` — OpenAI Node.js SDK for image generation

### Existing (already in stack)
- `@supabase/supabase-js` — storage for photos and renders
- `@google/genai` — not used for this feature (OpenAI handles image gen)
- `next` — App Router, API routes

### Environment variables (new)
- `OPENAI_API_KEY` — OpenAI API key for image generation
- `SUPABASE_URL` — already exists
- `SUPABASE_SERVICE_KEY` — server-side Supabase access for storage uploads

## 11. What stays the same

- The existing `app/visualizer/page.tsx` server component wrapper
- The hero section copy and breadcrumb structure
- Material search using `GET /api/materials`
- The site's design system (CSS variables, button classes, layout patterns)
- Existing room types as a starting point (kitchen, bathroom — dropping floor/wall/outdoor for now since they don't map to the surface-specific wizard)

## 12. What gets replaced

- `app/api/visualize/route.ts` — the mock gradient-based visualizer is replaced by the real OpenAI-powered render pipeline
- `VisualizerClient.tsx` — complete rewrite from the current search + room picker to the full wizard flow
