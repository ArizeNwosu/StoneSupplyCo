# Stone Supply Co — Premium Digital Showroom
**Spec version:** 1.0  
**Date:** 2026-08-28  
**Scope:** All phases — Phase 1 (Showroom), Phase 2 (AI + Leads), Phase 3 (Visualizer, Projects, Compare, Trade, Admin)

---

## 1. Project Context

### What exists (V1)
- Next.js 16.3.3, React 19, TypeScript strict, Tailwind v4, App Router
- CSS-first design system in `globals.css` — Cormorant Garamond + DM Sans, stone/bronze palette
- Homepage with editorial hero, proof strip, inventory section, gallery, audience section, visit/map, final CTA
- 6 featured quartz slabs in `data/inventory.ts` (Supabase CDN images)
- `data/business.ts` — complete business info including Ali's contact, address, coordinates
- `data/reviews.ts` — currently empty, **17 real 5-star Google reviews now captured**
- `data/gallery.ts` — hero + yard images + 6 slab photos
- `lib/analytics.ts` — CustomEvent-based tracking, no third-party SDK
- `components/` — Header (with full a11y mobile menu), Footer, MapPanel, ReviewSection, RevealController, TrackedLink, MobileActionBar
- Existing routes: `/`, `/privacy`, `/accessibility`, `/robots.ts`, `/sitemap.ts`

### What does not exist yet
- `/materials`, `/materials/[slug]`, `/materials/[type]`
- `/stone-finder`, `/trade`, `/compare`, `/projects`, `/projects/[id]`, `/visualizer`
- `/admin/materials`, `/admin/leads`
- `/api/stone-finder`, `/api/leads`, `/api/search`, `/api/availability`, `/api/visualize`, `/api/admin/generate-content`
- Supabase database tables (only storage bucket exists)
- Any AI/Gemini integration

### What must be preserved
- Entire design system (CSS variables, typography, color palette, easing, animations)
- All existing components — refactor only where necessary
- All accessibility infrastructure (skip link, focus management, reduced-motion, ARIA)
- Analytics abstraction (`trackEvent()`)
- robots.ts, sitemap.ts

---

## 2. Business Context

**Owner:** Ali (named in 14 of 17 reviews — personal, patient, no-pressure service)  
**Location:** 9036 Winnetka Ave, Northridge, CA 91324  
**Phone:** (818) 818-5081  
**Google rating:** 5.0 · 17 reviews (all 5-star)  
**Brand differentiators:** Ali's personal service, candy wall, huge selection, no pressure, fair pricing  
**Primary conversion:** Discover material → Fall in love → Check availability → Visit showroom → Speak with Ali  
**Audiences:** Homeowners, interior designers, architects, fabricators, contractors, builders

---

## 3. Design System Extensions

Extend `globals.css` — do not rewrite it.

### New CSS variables
```css
--color-success: #7aaa6e;
--color-error: #cc5540;
--color-ai: #5588aa;        /* AI feature accents */
--color-clearance: #c05540; /* Clearance badge */
--radius-card: 0px;         /* All cards remain sharp */
```

### New utility classes
- `.badge` — base badge style (inline-block, uppercase, 0.52rem)
- `.badge-new` — bronze background
- `.badge-clearance` — red background
- `.availability-dot` — 0.4rem circle, green when in stock
- `.chip` — filter/tag chip (border, uppercase, 0.5rem)
- `.chip.active` — filled chip
- `.skeleton` — loading skeleton animation
- `.ai-accent` — blue accent for AI-powered elements

### Typography additions
- `.hero-stat` — large number display (serif, clamp 2.5rem–4rem)
- `.material-name` — slab title treatment (serif, clamp 2rem–4rem, tight tracking)
- `.finder-question` — Stone Finder section label (0.48rem, 0.18em spacing, uppercase)

---

## 4. Database Schema (Supabase)

### Table: `materials`
```sql
create table materials (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  material_type text not null check (material_type in ('Quartzite','Marble','Granite','Quartz','Onyx','Other')),
  color_family text,                     -- 'White','Cream','Grey','Black','Brown','Green','Blue','Multi'
  primary_color text,
  secondary_colors text[],
  finish       text,
  origin       text,
  description  text,
  dimensions   text,                     -- e.g. '119" × 55"'
  thickness    text,                     -- e.g. '2 cm'
  quantity     integer default 0,
  availability text default 'available' check (availability in ('available','low','unavailable')),
  price        numeric(10,2),
  clearance_price numeric(10,2),
  applications text[],
  image_urls   text[],
  featured     boolean default false,
  new_arrival  boolean default false,
  clearance    boolean default false,
  bookmatch_available boolean default false,
  recommended_styles text[],
  tags         text[],
  seo_title    text,
  seo_description text,
  instagram_caption text,
  google_caption text,
  pinterest_caption text,
  email_snippet text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index on materials(material_type);
create index on materials(color_family);
create index on materials(availability);
create index on materials(featured);
```

### Table: `leads`
```sql
create table leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  name              text,
  email             text,
  phone             text,
  project_type      text,
  location          text,
  square_feet       integer,
  timeline          text,
  fabricator_status text,   -- 'yes','no','searching'
  customer_type     text,   -- 'homeowner','designer','architect','fabricator','contractor'
  preferred_materials text[],
  saved_material_ids uuid[],
  ai_preferences    jsonb,  -- raw Stone Finder input object
  notes             text,
  source            text,   -- 'stone-finder','availability-request','trade-application','contact'
  material_slug     text,   -- for availability requests
  status            text default 'new' check (status in ('new','contacted','qualified','closed'))
);
```

### Table: `projects` (saved project boards — optional server sync)
```sql
create table projects (
  id              uuid primary key default gen_random_uuid(),
  local_id        text unique,           -- localStorage key for anonymous users
  name            text not null,
  client_name     text,
  project_type    text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  notes           text,
  saved_materials uuid[],
  uploaded_images text[],
  visualizations  jsonb[],
  status          text default 'active'
);
```

### Table: `visualizations`
```sql
create table visualizations (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id),
  material_slug text,
  room_image_url text,
  result_url    text,
  surface_type  text,
  created_at    timestamptz default now(),
  disclaimer    text default 'Design visualization. Actual stone appearance may vary.'
);
```

---

## 5. Environment Variables

```env
# Existing
NEXT_PUBLIC_SITE_URL=https://stonesupplyco.com

# Supabase (existing project, new tables)
NEXT_PUBLIC_SUPABASE_URL=https://xjrlmcqlaqnktllvvaci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — server only>

# Gemini AI
GEMINI_API_KEY=<google ai studio key>

# Admin protection (simple env-var gate, no auth system required)
ADMIN_PASSWORD=<strong password>

# Optional future
RESEND_API_KEY=<for email notifications to Ali>
```

---

## 6. New Routes — Full List

### Public
| Route | Component | Notes |
|-------|-----------|-------|
| `/` | `app/page.tsx` | Refactor — add reviews, categories, AI CTA |
| `/materials` | `app/materials/page.tsx` | New — material library |
| `/materials/[slug]` | `app/materials/[slug]/page.tsx` | New — detail page |
| `/materials/quartzite` | `app/materials/quartzite/page.tsx` | New — category page (× 5 types) |
| `/materials/marble` | `app/materials/marble/page.tsx` | New |
| `/materials/granite` | `app/materials/granite/page.tsx` | New |
| `/materials/quartz` | `app/materials/quartz/page.tsx` | New |
| `/materials/onyx` | `app/materials/onyx/page.tsx` | New |
| `/stone-finder` | `app/stone-finder/page.tsx` | New — AI consultation |
| `/trade` | `app/trade/page.tsx` | New — trade portal |
| `/compare` | `app/compare/page.tsx` | New — material comparison |
| `/projects` | `app/projects/page.tsx` | New — saved project boards |
| `/projects/[id]` | `app/projects/[id]/page.tsx` | New — individual project |
| `/visualizer` | `app/visualizer/page.tsx` | New — room visualizer |
| `/privacy` | Keep as-is | |
| `/accessibility` | Keep as-is | |

### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/materials` | GET | List with filters, search, pagination |
| `/api/materials/[slug]` | GET | Single material |
| `/api/stone-finder` | POST | Scoring + Gemini recommendations |
| `/api/leads` | POST | Save qualified inquiry |
| `/api/search` | GET | Full-text material search |
| `/api/availability` | POST | Availability request → lead |
| `/api/visualize` | POST | Room visualization (mock adapter) |
| `/api/admin/materials` | GET/POST/PUT/DELETE | CRUD — admin only |
| `/api/admin/leads` | GET | View leads — admin only |
| `/api/admin/generate-content` | POST | Gemini content generation |

---

## 7. Component Architecture

### New components
```
components/
  materials/
    MaterialGrid.tsx          -- 3-col image grid with filters
    MaterialCard.tsx          -- individual slab card with hover actions
    MaterialFilters.tsx       -- filter strip (type, color, finish, availability)
    MaterialSearch.tsx        -- search input + results
    CategoryHero.tsx          -- category page hero section
  detail/
    ImageGallery.tsx          -- main image + thumbnail strip, fullscreen modal
    SpecsGrid.tsx             -- size/finish/available/price grid
    AvailabilityBadge.tsx     -- green dot + status text
    RelatedMaterials.tsx      -- 3-up related stones
    MaterialCTA.tsx           -- check availability / save / compare / ask AI
    MobileStickyBar.tsx       -- mobile bottom CTA bar
  stone-finder/
    FinderForm.tsx            -- multi-step input form
    FinderResults.tsx         -- ranked results with Gemini explanations
    FinderLeadCapture.tsx     -- lead form below results
    MovementSlider.tsx        -- quiet → dramatic selector
    NaturalLanguageInput.tsx  -- free-text description field
  homepage/
    ReviewsSection.tsx        -- editorial review grid (replaces empty ReviewSection)
    MaterialCategories.tsx    -- 5 category image tiles
    AiFinderCTA.tsx           -- dark panel CTA to /stone-finder
  compare/
    ComparePanel.tsx          -- side-by-side material comparison
    CompareSelector.tsx       -- add materials to compare
  projects/
    ProjectBoard.tsx          -- saved project board
    ProjectCard.tsx           -- project list card
    SaveMaterialButton.tsx    -- heart button, localStorage
  visualizer/
    VisualizerUpload.tsx      -- room photo upload
    VisualizerResult.tsx      -- before/after with disclaimer
    SurfaceSelector.tsx       -- surface type picker
  trade/
    TradeHero.tsx             -- benefits section
    TradeApplicationForm.tsx  -- application form → leads table
  admin/
    AdminMaterialForm.tsx     -- add/edit material
    AdminLeadTable.tsx        -- leads inbox
    ContentGeneratorPanel.tsx -- AI content generation UI
```

### Modified existing components
- `Header.tsx` — add new nav links: Materials, Stone Finder, Trade. Convert hash anchors to real routes.
- `Footer.tsx` — add Materials, Stone Finder, Trade links. Fix `<a>` → `<Link>` for internal routes.
- `ReviewSection.tsx` — replace empty-state logic with real 17-review data. New editorial layout.
- `data/reviews.ts` — populate with all 17 verified Google reviews.
- `data/inventory.ts` — expand `InventoryFeature` type to full `Material` model. Seed initial 6 slabs.
- `lib/analytics.ts` — add new event types: `material_view`, `material_save`, `material_compare`, `stone_finder_start`, `stone_finder_complete`, `visualizer_start`, `visualizer_complete`, `availability_request`, `trade_application`, `project_created`.

---

## 8. Data Access Layer

All data access goes through a single abstraction in `lib/db/`:

```
lib/
  db/
    index.ts              -- re-exports everything
    materials.ts          -- getMaterials(), getMaterial(), searchMaterials()
    leads.ts              -- createLead()
    projects.ts           -- getProject(), saveProject(), addMaterialToProject()
  supabase.ts             -- createClient() with correct key per context
  stoneRecommendationEngine.ts  -- scoring logic (no Gemini here)
  gemini.ts               -- all Gemini API calls
  analytics.ts            -- existing, extend event types
  siteConfig.ts           -- extract shared siteUrl, siteName constants
```

### `lib/stoneRecommendationEngine.ts`
```typescript
export type FinderInput = {
  projectType: string;
  cabinetColor?: string;
  floorColor?: string;
  wallColor?: string;
  style?: string;
  desiredColor?: string;
  movement?: 'quiet' | 'subtle' | 'moderate' | 'bold' | 'dramatic';
  materialPreference?: string[];
  budget?: { min?: number; max?: number };
  timeline?: string;
  naturalLanguage?: string;  // parsed by Gemini before scoring
};

export type ScoredMaterial = Material & { score: number };

export function scoreMaterials(input: FinderInput, materials: Material[]): ScoredMaterial[];
```

Scoring weights:
- Material preference match: 30 pts
- Color family match: 25 pts
- Style compatibility: 20 pts
- Budget fit: 15 pts
- Featured boost: 5 pts
- New arrival boost: 5 pts
- Availability boost: unavailable = –50 pts

### `lib/gemini.ts`
```typescript
// Stone Finder — explain recommendations
export async function explainRecommendations(
  input: FinderInput,
  materials: ScoredMaterial[]
): Promise<Array<{ slug: string; explanation: string }>>;

// Natural language → structured preferences
export async function parseNaturalLanguage(text: string): Promise<Partial<FinderInput>>;

// Material detail — generate description
export async function generateMaterialDescription(material: Material): Promise<string>;

// Admin — full content package
export async function generateMaterialContent(material: Material): Promise<{
  websiteDescription: string;
  metaTitle: string;
  metaDescription: string;
  instagramCaption: string;
  googleBusinessCaption: string;
  pinterestCaption: string;
  emailSnippet: string;
}>;

// Project AI assistant
export async function askAboutProject(
  question: string,
  savedMaterials: Material[],
  inventory: Material[]
): Promise<string>;

// Visualizer — provider-abstracted
export async function visualizeRoom(
  roomImageUrl: string,
  materialImageUrl: string,
  surfaceType: string
): Promise<{ resultUrl: string } | { error: string }>;
```

---

## 9. Page Specifications

### 9.1 Homepage (`/`)
**Changes from V1:**
- Hero: new headline "Stone worth designing around." / "Natural stone. Selected for remarkable spaces." Add 5.0 Google rating badge above headline. CTAs → "Explore Materials" (`/materials`) + "Visit the Showroom" (directions).
- Proof strip: replace "Verified on Stone Index" with "5.0 Google Rating · 17 Reviews".
- **New section 03** — Featured reviews: 3 reviews in editorial grid. Dark background. Jeff N featured (longest, most editorial). Arin G and Mitchell L as secondary. Link to Google profile.
- **New section 04** — Material categories: 5 large image tiles (Quartzite, Marble, Granite, Quartz, Onyx). Each links to `/materials/[type]`. Image-led, one-word labels.
- Inventory section: slab rows link to `/materials/[slug]` internally. "Browse all 44 listings" → "View all materials" linking to `/materials`.
- "How to choose" section: update material note to reflect full range.
- Gallery: hover on slab images reveals "View material →" overlay.
- **New section** — AI Stone Finder CTA panel: dark background, restrained. "Not sure where to start? Describe your space." → `Find My Stone →` `/stone-finder`.
- Audience section: add "Work with us →" CTA linking to `/trade` for designers + fabricators.
- Visit section: add "Ask for Ali." in showroom description. Subtle candy wall mention in image caption.
- Final CTA: add secondary "Try the Stone Finder →" alongside directions.

### 9.2 Material Library (`/materials`)
- Header: serif headline "Our materials." + italic em "Find your stone."
- Slab count + finish count displayed right-aligned.
- Filter strip: All / Quartzite / Marble / Granite / Quartz / Onyx / Available / New / Clearance. Inline search input right-aligned.
- 3-column grid on desktop, 2-column tablet, 1-column mobile.
- Each `MaterialCard`: image (aspect-ratio 0.82/1), hover reveals "View slab →" and "♡ Save to project", slab type eyebrow, name, finish + availability.
- New/Clearance badges on image top-left.
- No price shown on grid — price on detail page only.
- "Load more" button or infinite scroll.
- Empty state when filters return nothing: "No slabs match — try adjusting your filters."
- SEO: `generateMetadata()` with title "Natural Stone &amp; Quartz Slabs | Stone Supply Co" and local keywords.

### 9.3 Material Detail (`/materials/[slug]`)
- Breadcrumb: Materials → [Type] → [Name]
- Large image left (1.1:1 ratio) + 3 thumbnail strip right. Clicking thumb swaps main image. Fullscreen modal on main image click.
- Right column (below images): material type eyebrow, stone name (serif, large), origin + price + thickness subline.
- Specs grid: Size / Finish / Available (3 cells).
- Availability dot: green "In stock at Northridge yard" / amber "Limited availability" / red "Currently unavailable — inquire".
- Gemini-written description (1 paragraph, generated at build or on-demand via API, cached in Supabase).
- CTA stack: "Check Availability" (primary, dark) → "♡ Save to Project / ⇄ Compare" (secondary row) → "✦ Ask AI about this stone" (tertiary, bronze text link).
- Recommended applications: chip tags.
- Related materials: 3 stones from same type or similar color family.
- Mobile: sticky bottom bar "Check Availability" + "♡ Save".
- SEO: `generateMetadata()` per slug. JSON-LD: `Product` schema with name, description, image, offers.

### 9.4 Category Pages (`/materials/[type]`)
- One file per type OR a single `[type]` dynamic route with type validation.
- Hero: large editorial heading for the stone type. Short description (2–3 sentences — from static copy, not AI).
- Filtered `MaterialGrid` showing only that type.
- SEO optimised for "[type] slabs Los Angeles", "[type] slabs Northridge", etc.
- Breadcrumb: Materials → [Type].

### 9.5 Stone Finder (`/stone-finder`)
**Form (single page, sections revealed progressively):**
1. Project type chips (Kitchen / Bathroom / Fireplace / Bar / Commercial / Other)
2. Room colors (Cabinet, Floor, Wall — text inputs)
3. Design style chips (Modern / Transitional / Traditional / Organic / Minimalist)
4. Movement selector (Quiet / Subtle / Moderate / Bold / Dramatic — 5-step bar)
5. Material preference chips (multiselect)
6. Budget range (optional — text or chips: Under $300 / $300–500 / $500+ / No preference)
7. Natural language textarea ("Or describe it in your own words")
8. "Find My Stone →" button

**Results:**
- Heading: "X stones for your [projectType]."
- Sub: "All results are available at the Northridge yard today." (only if all have qty > 0)
- Cards: rank label, stone name, type/finish/qty/price line, Gemini explanation paragraph (italic, serif), three action buttons (View slab, Save, Check availability).
- Lead capture panel below results with headline "Want Ali to pull these for you?" — Name, Phone, Email, Timeline. Pre-fills stone interest. Submits to `/api/leads`.
- Loading state: skeleton cards with "Finding your stones..." message.
- Error state: "Something went wrong — here are our featured stones instead." → show featured inventory.

**API `/api/stone-finder` POST:**
```typescript
// Request
{ input: FinderInput }

// Response
{
  materials: Array<ScoredMaterial & { explanation: string }>;
  parsedInput: FinderInput;  // for lead capture pre-fill
}
```
Flow: if `naturalLanguage` present → Gemini parse → merge with structured input → score all available Supabase materials → top 3–6 → Gemini explain → return.

### 9.6 Trade Portal (`/trade`)
- Hero: "Built for the trade." Subtitle: "Stone Supply Co works directly with designers, architects, fabricators, and contractors across Los Angeles."
- Benefits grid (4 columns): Material sourcing / Project assistance / Availability requests / Showroom support.
- Trade application form: Name, Business name, Email, Phone, Profession (chips), Website (optional), Instagram (optional), Project volume, Primary service area. Submits to `/api/leads` with `source: 'trade-application'`.
- Below form: showroom address + phone + "Ask for Ali."

### 9.7 Compare (`/compare`)
- URL: `/compare?a=[slug]&b=[slug]&c=[slug]`
- Up to 4 stones. "Add stone" selector links to `/materials`.
- Side-by-side columns: Image / Name / Type / Color / Finish / Applications / Availability / Dimensions / Price.
- "Check Availability" CTA per column.
- No fabricated specifications — only show fields that exist in data.
- LocalStorage: remember compare selection across sessions.

### 9.8 Saved Projects (`/projects`)
- LocalStorage-backed — no auth required.
- Project list page: grid of project cards (name, type, saved stone count, last updated).
- "New Project" → modal: project name + type.
- Project detail (`/projects/[id]`): saved stones grid, notes textarea (auto-save), "Ask Stone Supply" AI chat panel (Gemini, queries saved materials + inventory), share link (base64-encoded localStorage state).
- Save button appears on MaterialCard hover and MaterialDetail page. Triggers sheet: "Save to project" → list of projects → add.

### 9.9 Visualizer (`/visualizer`)
**UI (complete, fully functional):**
1. Upload room photo (drag-and-drop + file picker, max 10MB, JPEG/PNG/WebP)
2. Choose surface type (chips: Kitchen Countertops / Island / Backsplash / Bathroom Vanity / Shower Wall / Fireplace / Other)
3. Choose stone (material picker linked to `/api/materials`)
4. "Generate Visualization" button

**Loading state:** spinner + "Generating your room preview..." (15–30s message)

**Result state:**
- Before/After toggle
- Disclaimer: "Design visualization. Actual stone appearance may vary. Lighting and texture in person may differ from this preview."
- Actions: Download / Save to Project / "Request This Material →" / "Visit Showroom →"

**API `/api/visualize` POST (mock adapter):**
```typescript
// Request
{ roomImageUrl: string; materialSlug: string; surfaceType: string; }

// Response (mock)
{ resultUrl: string; disclaimer: string; }
// OR
{ error: string; }
```
Provider abstraction — `lib/gemini.ts` has `visualizeRoom()`. When Gemini image editing supports this use case, swap the implementation in one place. Mock returns the original room image with an overlay caption.

### 9.10 Admin — Material Manager (`/admin/materials`)
- Password gate: `ADMIN_PASSWORD` env var checked server-side on every request.
- Material list: table with name, type, availability toggle, featured toggle, edit link.
- Add/Edit form: all `Material` fields. Image upload to Supabase bucket.
- "Generate Content" button → calls `/api/admin/generate-content` → populates SEO + caption fields.
- Availability toggle: one click → updates Supabase, reflects immediately on site.

### 9.11 Admin — Lead Inbox (`/admin/leads`)
- Table: name, email, phone, source, stones interested, AI preferences summary, created date, status.
- Status update: new / contacted / qualified / closed.
- Click row → full lead detail.

---

## 10. Reviews Data

Populate `data/reviews.ts` with all 17 verified Google reviews (all 5 stars, verified 2026-08-28):

**Featured (use in homepage editorial section):**
1. Jeff N — "If you've ever felt overwhelmed or rushed at a slab yard, Stone Supply is a completely different experience..." (full text)
2. Arin Gharibian — "Absolutely amazing experience with Slab and Tile in Northridge. The owner is incredibly friendly..." (full text)
3. Mitchell Lusikyan — "After a year of searching through endless slab yards I found one that stood out..." (full text)

**Also in grid:** Marcia Ro, Omar Nesh, Dasher Design, Nadav B, Sahar Nezhad, Kim Crownover, Annie Yemenejian, Armen Youssefian, Arman Sukunyan, Morrison Construction, Brian G., Sasha Yadidi, zack nomo, Dan M

**Google profile link:** `https://www.google.com/maps/place/Stone+Supply+Co/@34.2346526,-118.5701987,17z/data=!4m8!3m7!1s0x80c29b3593ad6521:0xe221180ce47225d1!8m2!3d34.2346526!4d-118.5701987!9m1!1b1!16s%2Fg%2F11z1xc_8_f`

**`googleReviewSummary` update:**
```typescript
export const googleReviewSummary = {
  rating: 5.0,
  count: 17,
  profileReviewsAvailable: true,
  lastVerified: "2026-08-28",
};
```

---

## 11. SEO

### Pages + targets
| Page | Primary keyword | Secondary |
|------|----------------|-----------|
| `/` | stone supplier Northridge | natural stone slabs Los Angeles |
| `/materials` | stone slabs Los Angeles | quartz marble granite slabs |
| `/materials/quartzite` | quartzite slabs Los Angeles | quartzite countertops San Fernando Valley |
| `/materials/marble` | marble slabs Los Angeles | marble countertops Northridge |
| `/materials/granite` | granite slabs Los Angeles | granite countertops San Fernando Valley |
| `/materials/quartz` | quartz slabs Northridge | engineered quartz Los Angeles |
| `/materials/onyx` | onyx slabs Los Angeles | onyx stone supplier |
| `/stone-finder` | stone finder Los Angeles | find the right countertop stone |
| `/trade` | stone supplier for designers Los Angeles | trade stone account |

### Schema
- `/` — `LocalBusiness` (already exists, keep + update `knowsAbout` and `hasOfferCatalog`)
- `/materials/[slug]` — `Product` schema
- `/materials/[type]` — `BreadcrumbList`
- All pages — `BreadcrumbList`

### Sitemap
Update `app/sitemap.ts` to include all material slugs from Supabase.

### Metadata
Extract `siteUrl` to `lib/siteConfig.ts`. Use `generateMetadata()` on every new page.

---

## 12. Analytics Events

Extend `ConversionEvent` in `lib/analytics.ts`:
```typescript
| "material_view"
| "material_save"
| "material_compare"
| "stone_finder_start"
| "stone_finder_complete"
| "visualizer_start"
| "visualizer_complete"
| "availability_request"
| "directions_click"       // existing
| "phone_click"            // existing
| "trade_application"
| "project_created"
| "showroom_request"
| "review_click"           // existing
| "ai_content_generate"
```

---

## 13. Mobile Requirements

- Library: 1-column on mobile, filters collapse into a horizontal scroll strip.
- Detail: sticky bottom bar (Check Availability + Save). Image gallery: swipe between thumbnails.
- Stone Finder: each section is a full-width step. "Find My Stone" stays visible as sticky CTA.
- Compare: horizontal scroll table on mobile.
- Projects: full-width cards.
- Admin: not required to work perfectly on mobile — desktop-only acceptable.

---

## 14. Accessibility

- All new forms: `<label>` elements, `aria-required`, `aria-invalid`, error messages linked via `aria-describedby`.
- Modals (image fullscreen, project name): `role="dialog"`, `aria-modal`, focus trap, Escape to close.
- Stone Finder: form sections use `<fieldset>` + `<legend>`.
- Image gallery: keyboard arrow navigation.
- Availability badge: `role="status"` for live updates.
- Compare: `<table>` with `<th scope="col">` headers.
- All color choices: AA contrast minimum.

---

## 15. Performance

- Material images: `next/image` with `sizes` prop, lazy loading (except hero/LCP image).
- Stone Finder: dynamic import — do not load Gemini client code on homepage.
- Visualizer: dynamic import — heavy, only load on `/visualizer`.
- Admin: dynamic import — not needed on public routes.
- Category images: if not available in current bucket, use existing slab photos from same material type.
- Fonts: already optimised via `next/font/google` — no changes needed.

---

## 16. Implementation Order

1. **Populate real data** — `data/reviews.ts` (17 reviews), expand `data/inventory.ts` to full Material model, extract `lib/siteConfig.ts`
2. **Supabase setup** — create tables, install `@supabase/supabase-js`, create `lib/supabase.ts` and `lib/db/`
3. **Install Gemini SDK** — `@google/genai`, create `lib/gemini.ts` with all functions
4. **Design system** — extend `globals.css` with new variables and utilities
5. **Update nav + footer** — new routes, fix `<a>` → `<Link>`
6. **Homepage refactor** — reviews section, category tiles, AI CTA panel, updated CTAs
7. **Material library** — `/materials` page, filters, grid, search
8. **Material detail** — `/materials/[slug]`, gallery, specs, CTAs, related
9. **Category pages** — `/materials/[type]` × 5
10. **Stone Finder** — form, API route, scoring engine, Gemini integration, lead capture
11. **Lead API** — `/api/leads` → Supabase
12. **Trade portal** — `/trade` page + form
13. **Saved projects** — localStorage, save button, project board
14. **Compare** — `/compare` with query params
15. **Visualizer** — full UI + mock API adapter
16. **Admin** — material manager + lead inbox + content generator
17. **SEO** — sitemap update, schema, metadata per page
18. **Analytics** — new event types wired to all new interactions
19. **Mobile polish** — sticky bars, filter collapse, swipe gallery
20. **Final QA** — 375px / 768px / 1440px, all states, all forms, empty states, error states

---

## 17. What Ships Without External Services

The following work with no API keys connected:

- Full materials library (Supabase data required)
- Material detail pages
- Category pages
- Reviews section (static data)
- Trade portal form (stores to Supabase)
- Saved projects (localStorage)
- Compare page

The following require `GEMINI_API_KEY`:
- Stone Finder recommendations + explanations
- Natural language parsing
- Visualizer (mock adapter works without key)
- Admin content generator
- Project AI assistant

The following require `SUPABASE_SERVICE_ROLE_KEY`:
- Admin panel (write operations)
- Lead storage

The following require `RESEND_API_KEY` (optional):
- Email notification to Ali when a lead comes in

---

## 18. Open Questions (non-blocking)

1. **Category hero images** — Quartzite, Marble, Granite, Onyx category pages need strong hero images. Current bucket has Quartz slabs. Owner to supply or we use best available from bucket as placeholder.
2. **Full slab count** — 44 active listings on Stone Index but only 6 in current data. Owner to supply remaining slab photos + names for Supabase seeding, or we seed with what exists and admin panel handles the rest.
3. **Resend** — optional for email notifications. Can be connected after launch.
4. **Candy wall photo** — would be ideal for showroom section. If available, add to gallery.
