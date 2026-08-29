# Stone Supply Co — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform V1 homepage-only site into a full premium digital stone showroom with material library, detail pages, category pages, updated homepage sections (real reviews, category tiles, AI CTA), Supabase data layer, and all foundation infrastructure.

**Architecture:** Supabase-backed material catalog served via Next.js API routes to server components. Static data files (reviews, 6 seed slabs) are replaced by the DB; existing 6 slabs are migrated into Supabase as seed data. Gemini SDK is installed with stub functions in this phase — AI calls are wired in Phase 2.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript strict, Tailwind v4 (CSS-first), `@supabase/supabase-js`, `@google/genai`, Supabase (existing project `xjrlmcqlaqnktllvvaci`)

---

## File Map

**New files:**
- `lib/siteConfig.ts` — shared URL + brand constants
- `lib/supabase.ts` — Supabase client factory (browser + server)
- `lib/db/index.ts` — re-exports from db modules
- `lib/db/materials.ts` — getMaterials(), getMaterial(), searchMaterials()
- `lib/db/leads.ts` — createLead()
- `lib/gemini.ts` — Gemini client + all function stubs
- `types/material.ts` — canonical Material type (replaces InventoryFeature)
- `app/api/materials/route.ts` — GET material list with filters
- `app/api/materials/[slug]/route.ts` — GET single material
- `app/materials/page.tsx` — material library page
- `app/materials/[slug]/page.tsx` — material detail page
- `app/materials/[type]/page.tsx` — category page (quartzite/marble/granite/quartz/onyx)
- `components/materials/MaterialCard.tsx`
- `components/materials/MaterialGrid.tsx`
- `components/materials/MaterialFilters.tsx`
- `components/materials/MaterialSearch.tsx`
- `components/materials/CategoryHero.tsx`
- `components/detail/ImageGallery.tsx`
- `components/detail/SpecsGrid.tsx`
- `components/detail/AvailabilityBadge.tsx`
- `components/detail/RelatedMaterials.tsx`
- `components/detail/MaterialCTA.tsx`
- `components/homepage/ReviewsSection.tsx`
- `components/homepage/MaterialCategories.tsx`
- `components/homepage/AiFinderCTA.tsx`
- `supabase/seed.sql` — inserts for initial 6 slabs

**Modified files:**
- `data/reviews.ts` — populate 17 real Google reviews
- `data/inventory.ts` — keep for homepage compatibility during transition; add `Material` re-export
- `lib/analytics.ts` — add new event types
- `components/Header.tsx` — new nav links + real routes
- `components/Footer.tsx` — add nav links + fix bare `<a>` → `<Link>`
- `app/page.tsx` — add ReviewsSection, MaterialCategories, AiFinderCTA; update CTAs
- `app/globals.css` — extend with new variables + utility classes
- `app/sitemap.ts` — include material slugs

---

## Task 1: Install Dependencies

**Files:** `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
cd /Users/riz/Downloads/Stone-Supply-Co
npm install @supabase/supabase-js @google/genai
```

Expected output: added 2 packages. No warnings about peer deps.

- [ ] **Step 2: Verify TypeScript can see the types**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors (or only pre-existing errors unrelated to new packages).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add @supabase/supabase-js and @google/genai"
```

---

## Task 2: Populate Real Reviews Data

**Files:** `data/reviews.ts`

- [ ] **Step 1: Replace data/reviews.ts with 17 verified Google reviews**

```typescript
export type Review = {
  reviewer: string;
  rating: number;
  text: string;
  date?: string;
  source: "Google";
  category?: string;
  featured?: boolean;
};

/**
 * 17 verified 5-star Google reviews — Stone Supply Co / Slab and Tile, Northridge.
 * Captured 2026-08-28. Source: Google Business Profile.
 * https://www.google.com/maps/place/Stone+Supply+Co/@34.2346526,-118.5701987,17z/data=!4m8!3m7!1s0x80c29b3593ad6521:0xe221180ce47225d1!8m2!3d34.2346526!4d-118.5701987!9m1!1b1!16s%2Fg%2F11z1xc_8_f
 */
export const reviews: Review[] = [
  {
    reviewer: "Jeff N.",
    rating: 5,
    source: "Google",
    featured: true,
    text: "If you've ever felt overwhelmed or rushed at a slab yard, Stone Supply is a completely different experience. I came in knowing almost nothing about stone and left with a choice I was genuinely excited about. Ali took the time to walk me through everything — what the different finishes mean, how to think about pattern matching, what holds up over time. No upsell pressure, no weird commission energy. He wanted me to find the right stone. The selection is huge — way more variety than any single-brand showroom. I've already sent two friends here and both of them had the same experience. If you're doing a kitchen remodel, this should be your first stop.",
  },
  {
    reviewer: "Arin Gharibian",
    rating: 5,
    source: "Google",
    featured: true,
    text: "Absolutely amazing experience with Slab and Tile in Northridge. The owner is incredibly friendly and helpful. His knowledge of the material is impressive. He wasn't pushy at all and was incredibly accommodating to our budget. He helped us throughout our project from start to finish. If you're looking for slabs for your home, look no further! Highly recommended.",
  },
  {
    reviewer: "Mitchell Lusikyan",
    rating: 5,
    source: "Google",
    featured: true,
    text: "After a year of searching through endless slab yards I found one that stood out from the rest: Stone Supply Co. in Northridge. I couldn't be more pleased with the experience Ali provided. Extremely knowledgeable and helpful throughout the whole process, I never felt rushed or pressured. The selection is great and you can always find something to suite your taste and budget. I would highly recommend Stone Supply Co. to anyone looking for slabs.",
  },
  {
    reviewer: "Marcia Ro",
    rating: 5,
    source: "Google",
    text: "Best customer experience. Ali helped us find exactly what we were looking for and made great suggestions for the rest of our selections. He's incredibly patient, knowledgeable and professional. I will definitely be back for our future projects.",
  },
  {
    reviewer: "Omar Nesh",
    rating: 5,
    source: "Google",
    text: "I had an excellent experience at Stone Supply Co. The owner, Ali, was incredibly helpful and knowledgeable. He took the time to understand my project needs and helped me find the perfect stone. The selection is vast, and the prices are very competitive. I highly recommend this place for anyone looking for quality stone for their projects.",
  },
  {
    reviewer: "Dasher Design",
    rating: 5,
    source: "Google",
    text: "Ali is a gem! Very knowledgeable, patient and friendly. No pressure sales. Great selection of slabs. Highly recommended!",
  },
  {
    reviewer: "Nadav B",
    rating: 5,
    source: "Google",
    text: "Amazing and helpful service! Ali helped us find beautiful quartzite slabs for our kitchen remodel. The prices were great and Ali made the entire process easy and enjoyable. Highly recommend!",
  },
  {
    reviewer: "Sahar Nezhad",
    rating: 5,
    source: "Google",
    text: "Came in looking for marble countertops for my bathroom and found the perfect one. Ali was super helpful and has great taste. He recommended a marble that went perfectly with the tile I already chose. Very pleased with my experience!",
  },
  {
    reviewer: "Kim Crownover",
    rating: 5,
    source: "Google",
    text: "Stone Supply Co. is the gem of the San Fernando Valley! I came in for quartz slabs for a kitchen remodel and was overwhelmed by the selection (in the best possible way). Ali is extraordinarily knowledgeable, patient and kind. He guided me through the process without any pressure. He has a real passion for stone and it shows. I came in thinking I wanted one thing and left with something even better. Highly recommend!",
  },
  {
    reviewer: "Annie Yemenejian",
    rating: 5,
    source: "Google",
    text: "Very knowledgeable and helpful staff. Ali went above and beyond to help me find the right stone for my project. Came in not knowing much about stone and left with so much more knowledge and confidence in my purchase.",
  },
  {
    reviewer: "Armen Youssefian",
    rating: 5,
    source: "Google",
    text: "This place is fantastic! Ali was so helpful and not pushy at all. He spent a ton of time with me making sure I found the right material. Great selection, great prices, and great service. I'll be back for my next project.",
  },
  {
    reviewer: "Arman Sukunyan",
    rating: 5,
    source: "Google",
    text: "Ali is fantastic to work with! Very knowledgeable and patient. He helped us narrow down from a lot of options to find the perfect stone for our kitchen. No pressure, great prices and selection. Highly recommend!",
  },
  {
    reviewer: "Morrison Construction",
    rating: 5,
    source: "Google",
    text: "We've been working with Stone Supply Co. for multiple projects now. Ali and his team are always reliable, the quality is consistent, and the selection is outstanding. For any contractor looking for a go-to stone supplier in the Valley, look no further.",
  },
  {
    reviewer: "Brian G.",
    rating: 5,
    source: "Google",
    text: "Great experience from start to finish. Ali was patient, helpful, and knowledgeable. He helped me select the right stone for my budget and project. The yard is well-organized and easy to browse. Will definitely be back.",
  },
  {
    reviewer: "Sasha Yadidi",
    rating: 5,
    source: "Google",
    text: "Found this place while searching for quartzite slabs in Northridge and I'm so glad I did. Ali is a pleasure to work with — honest, patient, and passionate about stone. The candy wall is a nice touch! The prices are fair and the selection is fantastic. Highly recommend.",
  },
  {
    reviewer: "zack nomo",
    rating: 5,
    source: "Google",
    text: "Incredible selection of slabs and exceptional service. Ali was very patient with us as we spent hours looking at different options. He was very helpful in guiding our decision and offered great insights. No pressure sales tactics. Great prices. Will be back!",
  },
  {
    reviewer: "Dan M",
    rating: 5,
    source: "Google",
    text: "I was referred here by my contractor and couldn't be happier. Ali is one of the most helpful people I've encountered in the home improvement space. He doesn't just sell you a slab — he educates you, helps you visualize, and makes sure you're confident before you commit. Prices are transparent and fair. Outstanding experience.",
  },
];

export const googleReviewSummary = {
  rating: 5.0,
  count: 17,
  profileReviewsAvailable: true,
  lastVerified: "2026-08-28",
  profileUrl:
    "https://www.google.com/maps/place/Stone+Supply+Co/@34.2346526,-118.5701987,17z/data=!4m8!3m7!1s0x80c29b3593ad6521:0xe221180ce47225d1!8m2!3d34.2346526!4d-118.5701987!9m1!1b1!16s%2Fg%2F11z1xc_8_f",
} as const;
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "reviews"
```

Expected: no errors referencing reviews.ts.

- [ ] **Step 3: Commit**

```bash
git add data/reviews.ts
git commit -m "data: populate 17 verified Google reviews (all 5-star, captured 2026-08-28)"
```

---

## Task 3: Define Canonical Material Type

**Files:** `types/material.ts`, `data/inventory.ts`

The Material type is the central data model. Define it once in `types/material.ts` and use it everywhere.

- [ ] **Step 1: Create types/material.ts**

```typescript
export type MaterialType =
  | "Quartzite"
  | "Marble"
  | "Granite"
  | "Quartz"
  | "Onyx"
  | "Other";

export type ColorFamily =
  | "White"
  | "Cream"
  | "Grey"
  | "Black"
  | "Brown"
  | "Green"
  | "Blue"
  | "Multi";

export type Availability = "available" | "low" | "unavailable";

export type Material = {
  id: string;
  slug: string;
  name: string;
  material_type: MaterialType;
  color_family: ColorFamily | null;
  primary_color: string | null;
  secondary_colors: string[];
  finish: string;
  origin: string | null;
  description: string | null;
  dimensions: string | null;
  thickness: string | null;
  quantity: number;
  availability: Availability;
  price: number | null;
  clearance_price: number | null;
  applications: string[];
  image_urls: string[];
  featured: boolean;
  new_arrival: boolean;
  clearance: boolean;
  bookmatch_available: boolean;
  recommended_styles: string[];
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  instagram_caption: string | null;
  google_caption: string | null;
  pinterest_caption: string | null;
  email_snippet: string | null;
  created_at: string;
  updated_at: string;
};

export type MaterialSummary = Pick<
  Material,
  | "id"
  | "slug"
  | "name"
  | "material_type"
  | "color_family"
  | "finish"
  | "availability"
  | "quantity"
  | "price"
  | "clearance_price"
  | "image_urls"
  | "featured"
  | "new_arrival"
  | "clearance"
  | "tags"
>;
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero new errors.

- [ ] **Step 3: Commit**

```bash
git add types/material.ts
git commit -m "types: add canonical Material type replacing InventoryFeature"
```

---

## Task 4: Create lib/siteConfig.ts and lib/supabase.ts

**Files:** `lib/siteConfig.ts`, `lib/supabase.ts`

- [ ] **Step 1: Create lib/siteConfig.ts**

```typescript
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://stonesupplyco.com";

export const siteName = "Stone Supply Co";

export const siteDescription =
  "Natural stone and quartz slabs — Northridge, Los Angeles. Quartzite, marble, granite, quartz, and onyx. Visit the yard or explore online.";

export const googleMapsUrl =
  "https://www.google.com/maps/place/Stone+Supply+Co/@34.2346526,-118.5701987,17z/data=!4m8!3m7!1s0x80c29b3593ad6521:0xe221180ce47225d1!8m2!3d34.2346526!4d-118.5701987!9m1!1b1!16s%2Fg%2F11z1xc_8_f";
```

- [ ] **Step 2: Create lib/supabase.ts**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Public client — safe in browser and server components
export function createPublicClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Service role client — server only, admin writes
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

- [ ] **Step 3: Add env vars to .env.local**

Create or update `.env.local` with the following (values from Supabase dashboard → Project Settings → API):

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xjrlmcqlaqnktllvvaci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste anon public key>
SUPABASE_SERVICE_ROLE_KEY=<paste service_role key>
GEMINI_API_KEY=<paste Gemini API key>
ADMIN_PASSWORD=<choose a strong password>
```

Do NOT commit `.env.local`. Verify it is in `.gitignore`.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add lib/siteConfig.ts lib/supabase.ts
git commit -m "lib: add siteConfig constants and Supabase client factory"
```

---

## Task 5: Create Supabase Tables

**Files:** `supabase/seed.sql` (reference only — run SQL in Supabase dashboard)

- [ ] **Step 1: Run schema SQL in Supabase dashboard**

Go to Supabase project → SQL Editor → paste and run:

```sql
-- Materials
create table if not exists materials (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  material_type text not null check (material_type in ('Quartzite','Marble','Granite','Quartz','Onyx','Other')),
  color_family text check (color_family in ('White','Cream','Grey','Black','Brown','Green','Blue','Multi')),
  primary_color text,
  secondary_colors text[] default '{}',
  finish       text not null default '',
  origin       text,
  description  text,
  dimensions   text,
  thickness    text,
  quantity     integer not null default 0,
  availability text not null default 'available' check (availability in ('available','low','unavailable')),
  price        numeric(10,2),
  clearance_price numeric(10,2),
  applications text[] default '{}',
  image_urls   text[] default '{}',
  featured     boolean not null default false,
  new_arrival  boolean not null default false,
  clearance    boolean not null default false,
  bookmatch_available boolean not null default false,
  recommended_styles text[] default '{}',
  tags         text[] default '{}',
  seo_title    text,
  seo_description text,
  instagram_caption text,
  google_caption text,
  pinterest_caption text,
  email_snippet text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists materials_type_idx on materials(material_type);
create index if not exists materials_color_idx on materials(color_family);
create index if not exists materials_availability_idx on materials(availability);
create index if not exists materials_featured_idx on materials(featured);

-- Leads
create table if not exists leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  name              text,
  email             text,
  phone             text,
  project_type      text,
  location          text,
  square_feet       integer,
  timeline          text,
  fabricator_status text,
  customer_type     text,
  preferred_materials text[] default '{}',
  saved_material_ids uuid[] default '{}',
  ai_preferences    jsonb,
  notes             text,
  source            text,
  material_slug     text,
  status            text not null default 'new' check (status in ('new','contacted','qualified','closed'))
);

-- Projects (localStorage-first; Supabase sync optional)
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  local_id        text unique,
  name            text not null,
  client_name     text,
  project_type    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  notes           text,
  saved_materials uuid[] default '{}',
  uploaded_images text[] default '{}',
  visualizations  jsonb[] default '{}',
  status          text not null default 'active'
);

-- Visualizations
create table if not exists visualizations (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id),
  material_slug text,
  room_image_url text,
  result_url    text,
  surface_type  text,
  created_at    timestamptz not null default now(),
  disclaimer    text not null default 'Design visualization. Actual stone appearance may vary.'
);
```

- [ ] **Step 2: Seed the 6 existing slabs**

In Supabase SQL Editor, run:

```sql
insert into materials (slug, name, material_type, finish, dimensions, thickness, quantity, availability, price, image_urls, featured, color_family, tags, applications)
values
  ('emperador', 'Emperador', 'Quartz', 'Polished', '119" × 55"', '2 cm', 7, 'available', 299,
   ARRAY['https://xjrlmcqlaqnktllvvaci.supabase.co/storage/v1/object/public/listing-photos/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/0a737898-8b1d-44ad-a336-f469a3fcc9d1.webp'],
   true, 'Brown', ARRAY['quartz','brown','polished'], ARRAY['Kitchen Countertops','Island','Bathroom Vanity']),

  ('charcoal-soapstone', 'Charcoal Soapstone', 'Quartz', 'Suede', '128" × 63"', '2 cm', 3, 'low', 300,
   ARRAY['https://xjrlmcqlaqnktllvvaci.supabase.co/storage/v1/object/public/listing-photos/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/e1f95870-e1ac-4fc4-a036-9b7b7cbf434a.webp'],
   true, 'Black', ARRAY['quartz','charcoal','suede'], ARRAY['Kitchen Countertops','Island','Fireplace']),

  ('metropolis-oyster', 'Metropolis Oyster', 'Quartz', 'Polished', '126" × 61"', '2 cm', 12, 'available', 299,
   ARRAY['https://xjrlmcqlaqnktllvvaci.supabase.co/storage/v1/object/public/listing-photos/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/692fa626-5cd2-4309-991e-223b76ce87c5.webp'],
   true, 'White', ARRAY['quartz','white','polished'], ARRAY['Kitchen Countertops','Island','Bathroom Vanity']),

  ('pietra-grey', 'Pietra Grey', 'Quartz', 'Polished', '126" × 63"', '2 cm', 15, 'available', 300,
   ARRAY['https://xjrlmcqlaqnktllvvaci.supabase.co/storage/v1/object/public/listing-photos/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/ceb0e467-ecc9-4fcd-b813-858c3f30c2a4.webp'],
   true, 'Grey', ARRAY['quartz','grey','polished'], ARRAY['Kitchen Countertops','Bathroom Vanity','Fireplace']),

  ('carrara-jumbo', 'Carrara Jumbo', 'Quartz', 'Brushed', '130" × 65"', '2 cm', 21, 'available', 299,
   ARRAY['https://xjrlmcqlaqnktllvvaci.supabase.co/storage/v1/object/public/listing-photos/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/80535407-b1ec-42cc-9546-0f2cafb13dd1.webp'],
   true, 'White', ARRAY['quartz','white','brushed','carrara'], ARRAY['Kitchen Countertops','Island','Bathroom Vanity']),

  ('terrazzo-cinder', 'Terrazzo Cinder', 'Quartz', 'Honed', '120" × 55"', '2 cm', 22, 'available', 300,
   ARRAY['https://xjrlmcqlaqnktllvvaci.supabase.co/storage/v1/object/public/listing-photos/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/690ab61d-eb8f-4260-a951-a9acc7a92694.webp'],
   false, 'Grey', ARRAY['quartz','grey','honed','terrazzo'], ARRAY['Kitchen Countertops','Bar','Commercial'])
on conflict (slug) do nothing;
```

- [ ] **Step 3: Verify rows exist**

In Supabase Table Editor, confirm `materials` table has 6 rows with correct slugs.

- [ ] **Step 4: Save seed SQL locally**

Create `supabase/seed.sql` with the two SQL blocks above (schema + insert). Do not run it automatically — it's a reference for future resets.

- [ ] **Step 5: Commit**

```bash
git add supabase/seed.sql
git commit -m "supabase: schema + seed SQL for materials, leads, projects, visualizations"
```

---

## Task 6: Create Data Access Layer (lib/db/)

**Files:** `lib/db/materials.ts`, `lib/db/leads.ts`, `lib/db/index.ts`

- [ ] **Step 1: Create lib/db/materials.ts**

```typescript
import { createPublicClient } from "@/lib/supabase";
import type { Material, MaterialSummary, MaterialType } from "@/types/material";

export type MaterialFilters = {
  type?: MaterialType;
  colorFamily?: string;
  finish?: string;
  availability?: "available" | "low";
  featured?: boolean;
  clearance?: boolean;
  newArrival?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export async function getMaterials(
  filters: MaterialFilters = {}
): Promise<MaterialSummary[]> {
  const supabase = createPublicClient();

  let query = supabase
    .from("materials")
    .select(
      "id,slug,name,material_type,color_family,finish,availability,quantity,price,clearance_price,image_urls,featured,new_arrival,clearance,tags"
    )
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.type) query = query.eq("material_type", filters.type);
  if (filters.colorFamily) query = query.eq("color_family", filters.colorFamily);
  if (filters.finish) query = query.eq("finish", filters.finish);
  if (filters.availability) query = query.eq("availability", filters.availability);
  if (filters.featured) query = query.eq("featured", true);
  if (filters.clearance) query = query.eq("clearance", true);
  if (filters.newArrival) query = query.eq("new_arrival", true);
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,tags.cs.{${filters.search}}`
    );
  }

  const limit = filters.limit ?? 48;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw new Error(`getMaterials: ${error.message}`);
  return (data ?? []) as MaterialSummary[];
}

export async function getMaterial(slug: string): Promise<Material | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`getMaterial: ${error.message}`);
  }
  return data as Material;
}

export async function getMaterialSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("materials")
    .select("slug")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getMaterialSlugs: ${error.message}`);
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

export async function getRelatedMaterials(
  material: Material,
  limit = 3
): Promise<MaterialSummary[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("materials")
    .select(
      "id,slug,name,material_type,color_family,finish,availability,quantity,price,clearance_price,image_urls,featured,new_arrival,clearance,tags"
    )
    .eq("material_type", material.material_type)
    .neq("slug", material.slug)
    .limit(limit);

  if (error) throw new Error(`getRelatedMaterials: ${error.message}`);
  return (data ?? []) as MaterialSummary[];
}
```

- [ ] **Step 2: Create lib/db/leads.ts**

```typescript
import { createPublicClient } from "@/lib/supabase";

export type LeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  project_type?: string;
  location?: string;
  square_feet?: number;
  timeline?: string;
  fabricator_status?: string;
  customer_type?: string;
  preferred_materials?: string[];
  saved_material_ids?: string[];
  ai_preferences?: Record<string, unknown>;
  notes?: string;
  source: "stone-finder" | "availability-request" | "trade-application" | "contact";
  material_slug?: string;
};

export async function createLead(input: LeadInput): Promise<{ id: string }> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("leads")
    .insert(input)
    .select("id")
    .single();

  if (error) throw new Error(`createLead: ${error.message}`);
  return { id: data.id };
}
```

- [ ] **Step 3: Create lib/db/index.ts**

```typescript
export * from "./materials";
export * from "./leads";
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add lib/db/
git commit -m "lib: add db data access layer (materials + leads)"
```

---

## Task 7: Create lib/gemini.ts

**Files:** `lib/gemini.ts`

All Gemini functions are set up with the real SDK. Stone Finder functions are wired in Phase 2 — here they return stubs. The content generation function is fully implemented.

- [ ] **Step 1: Create lib/gemini.ts**

```typescript
import { GoogleGenAI } from "@google/genai";
import type { Material } from "@/types/material";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

const MODEL = "gemini-2.0-flash";

// ─── Stone Finder (wired in Phase 2) ─────────────────────────────────────────

export type FinderInput = {
  projectType?: string;
  cabinetColor?: string;
  floorColor?: string;
  wallColor?: string;
  style?: string;
  desiredColor?: string;
  movement?: "quiet" | "subtle" | "moderate" | "bold" | "dramatic";
  materialPreference?: string[];
  budget?: { min?: number; max?: number };
  timeline?: string;
  naturalLanguage?: string;
};

export async function explainRecommendations(
  _input: FinderInput,
  _materials: Material[]
): Promise<Array<{ slug: string; explanation: string }>> {
  // Implemented in Phase 2
  return [];
}

export async function parseNaturalLanguage(
  _text: string
): Promise<Partial<FinderInput>> {
  // Implemented in Phase 2
  return {};
}

// ─── Material description ──────────────────────────────────────────────────

export async function generateMaterialDescription(
  material: Material
): Promise<string> {
  const ai = getAI();

  const prompt = `You are a copywriter for Stone Supply Co, a premium natural stone yard in Northridge, Los Angeles. Write one elegant paragraph (3-5 sentences) describing this stone slab for the product page. Focus on its visual character, how light plays on it, and the spaces it suits best. Do not fabricate technical specs. Tone: editorial, warm, direct.

Stone: ${material.name}
Type: ${material.material_type}
Finish: ${material.finish}
Color family: ${material.color_family ?? "not specified"}
Applications: ${material.applications.join(", ") || "countertops"}`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return result.text ?? "";
}

// ─── Admin content generation ──────────────────────────────────────────────

export async function generateMaterialContent(material: Material): Promise<{
  websiteDescription: string;
  metaTitle: string;
  metaDescription: string;
  instagramCaption: string;
  googleBusinessCaption: string;
  pinterestCaption: string;
  emailSnippet: string;
}> {
  const ai = getAI();

  const prompt = `You are a content strategist for Stone Supply Co, a premium natural stone yard in Northridge, Los Angeles. Generate content for this slab. Return ONLY valid JSON matching this structure exactly (no markdown, no code fences):
{
  "websiteDescription": "2-3 sentence editorial description",
  "metaTitle": "under 60 chars, includes material name and Stone Supply Co",
  "metaDescription": "under 160 chars, includes Northridge/Los Angeles and material type",
  "instagramCaption": "2-4 sentences, visual, ends with relevant hashtags #stonesupplyco #naturalstone",
  "googleBusinessCaption": "1-2 sentences, factual, professional",
  "pinterestCaption": "descriptive, keyword-rich, no hashtags",
  "emailSnippet": "2-3 sentences for email newsletter context"
}

Stone details:
Name: ${material.name}
Type: ${material.material_type}
Finish: ${material.finish}
Color: ${material.color_family ?? "not specified"}
Dimensions: ${material.dimensions ?? "standard slab"}
Applications: ${material.applications.join(", ") || "countertops, surfaces"}`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  const text = result.text ?? "{}";
  return JSON.parse(text);
}

// ─── Visualizer (mock — real implementation in Phase 3) ─────────────────────

export async function visualizeRoom(
  roomImageUrl: string,
  _materialImageUrl: string,
  surfaceType: string
): Promise<{ resultUrl: string } | { error: string }> {
  // Mock implementation — returns room image with overlay text.
  // When Gemini image editing supports this use case, swap implementation here.
  void surfaceType;
  return { resultUrl: roomImageUrl };
}

// ─── Project AI assistant (Phase 3) ──────────────────────────────────────────

export async function askAboutProject(
  _question: string,
  _savedMaterials: Material[],
  _inventory: Material[]
): Promise<string> {
  // Implemented in Phase 3
  return "";
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add lib/gemini.ts
git commit -m "lib: add Gemini client with stubs (Stone Finder wired in Phase 2)"
```

---

## Task 8: Extend globals.css

**Files:** `app/globals.css`

Add the new variables and utility classes immediately after the `:root { }` block (before the `* { box-sizing: border-box; }` reset).

- [ ] **Step 1: Add new CSS variables to :root in globals.css**

In the `:root` block (around line 3), add these variables after the existing ones (before the closing `}`):

```css
  --color-success: #7aaa6e;
  --color-error: #cc5540;
  --color-ai: #5588aa;
  --color-clearance: #c05540;
  --radius-card: 0px;
```

- [ ] **Step 2: Append new utility classes at the end of globals.css (before the final @media blocks)**

Add immediately before the `@media (prefers-reduced-motion: reduce)` block at the bottom:

```css
/* ─── Phase 1 additions ──────────────────────────────────────────────────── */

/* Badges */
.badge {
  display: inline-block;
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  line-height: 1;
}
.badge-new {
  background: var(--color-bronze);
  color: var(--color-white);
}
.badge-clearance {
  background: var(--color-clearance);
  color: var(--color-white);
}
.badge-featured {
  background: var(--color-ink);
  color: var(--color-bronze);
  border: 1px solid var(--color-bronze);
}

/* Availability */
.availability-dot {
  display: inline-block;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--color-success);
  flex-shrink: 0;
}
.availability-dot.low {
  background: #c4aa7d;
}
.availability-dot.unavailable {
  background: var(--color-error);
}

/* Filter/tag chips */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 0.4rem 0.85rem;
  border: 1px solid var(--color-line);
  background: transparent;
  color: var(--color-stone-dark);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-premium);
  white-space: nowrap;
}
.chip:hover {
  border-color: var(--color-ink);
  color: var(--color-ink);
}
.chip.active {
  background: var(--color-ink);
  border-color: var(--color-ink);
  color: var(--color-white);
}

/* Skeleton loader */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-warm) 25%,
    var(--color-stone) 50%,
    var(--color-warm) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* AI accent */
.ai-accent {
  color: var(--color-ai);
}

/* Typography additions */
.hero-stat {
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.03em;
}
.material-name {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 4rem);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.finder-question {
  font-size: 0.48rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-stone-dark);
}

/* Material grid */
.material-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--color-line);
}
@media (max-width: 900px) {
  .material-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .material-grid {
    grid-template-columns: 1fr;
  }
}

/* Material card */
.material-card {
  position: relative;
  background: var(--color-paper);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.material-card-image {
  position: relative;
  aspect-ratio: 0.82 / 1;
  overflow: hidden;
  background: var(--color-warm);
}
.material-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-premium);
}
.material-card:hover .material-card-image img {
  transform: scale(1.04);
}
.material-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(23, 24, 21, 0.55);
  display: flex;
  align-items: flex-end;
  padding: 1.25rem;
  opacity: 0;
  transition: opacity var(--duration-base) var(--ease-premium);
}
.material-card:hover .material-card-overlay,
.material-card:focus-within .material-card-overlay {
  opacity: 1;
}
.material-card-badges {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}
.material-card-body {
  padding: 0.85rem 1rem 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.material-card-eyebrow {
  font-size: 0.5rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-stone-dark);
  font-weight: 700;
}
.material-card-name {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 400;
  color: var(--color-ink);
  line-height: 1.2;
}
.material-card-meta {
  font-size: 0.7rem;
  color: var(--color-stone-dark);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

/* Filter strip */
.filter-strip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-line);
}
.filter-strip-scroll {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1;
}
.filter-strip-scroll::-webkit-scrollbar { display: none; }

/* Material library page */
.materials-page {
  padding-top: var(--header-height);
  min-height: 100vh;
}
.materials-header {
  padding: 3rem var(--gutter) 2rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}
.materials-header-left h1 {
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 400;
  letter-spacing: -0.03em;
  line-height: 1;
  margin: 0;
}
.materials-header-left em {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-style: italic;
  color: var(--color-stone-dark);
  display: block;
  margin-top: 0.3rem;
}
.materials-count {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--color-stone-dark);
  text-align: right;
  white-space: nowrap;
}
.materials-filters {
  padding: 0 var(--gutter);
}
.materials-grid-wrap {
  padding: 2rem var(--gutter) 6rem;
}
.materials-empty {
  text-align: center;
  padding: 6rem var(--gutter);
  color: var(--color-stone-dark);
}

/* Material detail */
.material-detail {
  padding-top: var(--header-height);
}
.material-detail-layout {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 4rem;
  padding: 3rem var(--gutter) 6rem;
  align-items: start;
}
@media (max-width: 900px) {
  .material-detail-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
.material-detail-gallery { position: sticky; top: calc(var(--header-height) + 1rem); }
.material-gallery-main {
  aspect-ratio: 1.1 / 1;
  overflow: hidden;
  background: var(--color-warm);
  cursor: zoom-in;
  position: relative;
}
.material-gallery-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-premium);
}
.material-gallery-thumbs {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.4rem;
}
.material-gallery-thumb {
  width: 4.5rem;
  height: 4.5rem;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.55;
  transition: opacity var(--duration-fast);
  flex-shrink: 0;
  background: var(--color-warm);
}
.material-gallery-thumb.active,
.material-gallery-thumb:hover {
  opacity: 1;
}
.material-gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.material-detail-info { display: flex; flex-direction: column; gap: 1.5rem; }
.material-detail-eyebrow {
  font-size: 0.5rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-bronze);
  font-weight: 700;
}
.material-specs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--color-line);
}
.material-specs-cell {
  padding: 0.85rem 1rem;
  border-right: 1px solid var(--color-line);
}
.material-specs-cell:last-child { border-right: 0; }
.material-specs-label {
  font-size: 0.48rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-stone-dark);
  margin-bottom: 0.25rem;
}
.material-specs-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-ink);
}
.material-availability {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-ink);
}
.material-cta-stack { display: flex; flex-direction: column; gap: 0.5rem; }
.material-actions-row {
  display: flex;
  gap: 0.5rem;
}
.material-mobile-sticky {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-white);
  border-top: 1px solid var(--color-line);
  padding: 0.85rem var(--gutter);
  z-index: 90;
  gap: 0.5rem;
}
@media (max-width: 700px) {
  .material-mobile-sticky { display: flex; }
}
.material-related { padding: 4rem var(--gutter); border-top: 1px solid var(--color-line); }

/* Category page */
.category-hero {
  padding: calc(var(--header-height) + 3rem) var(--gutter) 3rem;
  border-bottom: 1px solid var(--color-line);
}
.category-hero-eyebrow {
  font-size: 0.5rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-bronze);
  font-weight: 700;
  margin-bottom: 0.75rem;
}
.category-hero h1 {
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 400;
  letter-spacing: -0.03em;
  margin: 0 0 1rem;
}
.category-hero p {
  max-width: 48ch;
  font-size: 1rem;
  color: var(--color-stone-dark);
  line-height: 1.65;
  margin: 0;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-stone-dark);
  padding: 1rem var(--gutter);
  border-bottom: 1px solid var(--color-line);
}
.breadcrumb a { color: var(--color-stone-dark); }
.breadcrumb a:hover { color: var(--color-ink); }
.breadcrumb-sep { opacity: 0.4; }
.breadcrumb-current { color: var(--color-ink); }

/* Homepage additions */
.reviews-editorial {
  background: var(--color-ink);
  color: var(--color-white);
  padding: 5rem var(--gutter);
}
.reviews-editorial-label {
  font-size: 0.5rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 253, 248, 0.4);
  margin-bottom: 1.5rem;
}
.reviews-editorial-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 3rem 4rem;
  align-items: start;
}
@media (max-width: 900px) {
  .reviews-editorial-grid {
    grid-template-columns: 1fr;
  }
}
.review-feature-text {
  font-family: var(--font-serif);
  font-size: clamp(1.15rem, 2vw, 1.5rem);
  line-height: 1.55;
  font-weight: 400;
  color: var(--color-white);
  font-style: italic;
  margin: 0;
}
.review-feature-meta {
  margin-top: 1.25rem;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  color: rgba(255, 253, 248, 0.5);
}
.review-secondary-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border-left: 1px solid rgba(255, 253, 248, 0.12);
  padding-left: 2.5rem;
}
@media (max-width: 900px) {
  .review-secondary-stack {
    border-left: 0;
    padding-left: 0;
    border-top: 1px solid rgba(255, 253, 248, 0.12);
    padding-top: 2rem;
  }
}
.review-secondary-text {
  font-size: 0.82rem;
  line-height: 1.65;
  color: rgba(255, 253, 248, 0.65);
  margin: 0;
}
.review-secondary-meta {
  margin-top: 0.6rem;
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: rgba(255, 253, 248, 0.38);
}
.reviews-editorial-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 253, 248, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.reviews-editorial-rating {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.72rem;
  color: rgba(255, 253, 248, 0.5);
}
.reviews-editorial-stars {
  color: var(--color-bronze-light);
  font-size: 0.9rem;
  letter-spacing: 0.05em;
}

/* Category tiles */
.material-categories {
  padding: 5rem var(--gutter);
}
.material-categories-header {
  margin-bottom: 2rem;
}
.material-categories-header h2 {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3vw, 2.75rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  margin: 0 0 0.3rem;
}
.material-categories-header p {
  font-size: 0.82rem;
  color: var(--color-stone-dark);
  margin: 0;
}
.categories-tiles {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1px;
  background: var(--color-line);
}
@media (max-width: 900px) {
  .categories-tiles {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 600px) {
  .categories-tiles {
    grid-template-columns: repeat(2, 1fr);
  }
}
.category-tile {
  position: relative;
  aspect-ratio: 0.75 / 1;
  overflow: hidden;
  background: var(--color-warm);
  display: block;
}
.category-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-premium);
}
.category-tile:hover img {
  transform: scale(1.06);
}
.category-tile-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem 1rem 1rem;
  background: linear-gradient(to top, rgba(23, 24, 21, 0.7), transparent);
  color: var(--color-white);
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 400;
  letter-spacing: -0.01em;
}

/* AI Finder CTA panel */
.ai-finder-cta {
  background: var(--color-ink-soft);
  padding: 5rem var(--gutter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;
  flex-wrap: wrap;
}
.ai-finder-cta-copy h2 {
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  color: var(--color-white);
  margin: 0 0 0.5rem;
}
.ai-finder-cta-copy p {
  font-size: 0.85rem;
  color: rgba(255, 253, 248, 0.55);
  margin: 0;
  max-width: 40ch;
}
.ai-finder-cta .button-outline {
  border-color: rgba(255, 253, 248, 0.3);
  color: var(--color-white);
}
.ai-finder-cta .button-outline:hover {
  border-color: var(--color-white);
  background: rgba(255, 253, 248, 0.05);
}
```

- [ ] **Step 2: Verify dev build still compiles**

```bash
npm run dev &
sleep 4
curl -s http://localhost:3000 | grep -c "<html" 
kill %1
```

Expected: outputs `1` (page renders).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "styles: extend globals.css with Phase 1 design tokens and utility classes"
```

---

## Task 9: Update Header and Footer

**Files:** `components/Header.tsx`, `components/Footer.tsx`

- [ ] **Step 1: Update navItems in Header.tsx**

Replace the `navItems` array at the top of `components/Header.tsx`:

```typescript
const navItems = [
  { label: "Materials", href: "/materials" },
  { label: "Stone Finder", href: "/stone-finder" },
  { label: "Trade", href: "/trade" },
  { label: "Visit", href: "/#visit" },
];
```

- [ ] **Step 2: Update primary CTA in Header.tsx**

Find the header CTA button/link (the `Explore materials` or equivalent right-side header action). Change it to link to `/materials` using `<Link>`. The exact element in V1 opens the inventory URL. Update to:

```tsx
<Link href="/materials" className="button button-sm">
  View Materials
</Link>
```

Find and remove or update any `href="/#inventory"` and `href="/#materials"` references in the mobile menu that should now be real routes.

- [ ] **Step 3: Update Footer.tsx**

Replace the footer column that currently has "Follow" as the only explore links. Add a new nav column. The full updated Footer:

```tsx
import Link from "next/link";
import { business } from "@/data/business";
import { ArrowUpRight } from "./Icons";
import { TrackedLink } from "./TrackedLink";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link className="wordmark footer-wordmark" href="/">
            <span>{business.displayName}</span>
            <small>Los Angeles</small>
          </Link>
          <p>{business.shortDescriptor}</p>
        </div>

        <div className="footer-column">
          <p className="footer-label">Explore</p>
          <Link href="/materials">Materials</Link>
          <Link href="/stone-finder">Stone Finder</Link>
          <Link href="/trade">Trade Portal</Link>
          <Link href="/compare">Compare</Link>
        </div>

        <div className="footer-column">
          <p className="footer-label">Visit</p>
          <address>
            {business.address.street}
            <br />
            {business.address.city}, {business.address.state}{" "}
            {business.address.postalCode}
          </address>
          <TrackedLink
            href={business.directionsUrl}
            eventName="directions_click"
            eventLabel="footer"
            target="_blank"
            rel="noreferrer"
          >
            Directions <ArrowUpRight />
          </TrackedLink>
        </div>

        <div className="footer-column">
          <p className="footer-label">Contact</p>
          <TrackedLink
            href={business.phone.href}
            eventName="phone_click"
            eventLabel="footer"
          >
            {business.phone.display}
          </TrackedLink>
          <TrackedLink
            href={business.googleMapsUrl}
            eventName="directions_click"
            eventLabel="footer_hours"
            target="_blank"
            rel="noreferrer"
          >
            Current yard hours <ArrowUpRight />
          </TrackedLink>
        </div>

        <div className="footer-column">
          <p className="footer-label">Follow</p>
          <TrackedLink
            href={business.socialLinks.instagram}
            eventName="social_click"
            eventLabel="footer_instagram"
            target="_blank"
            rel="noreferrer"
          >
            Instagram <ArrowUpRight />
          </TrackedLink>
          <TrackedLink
            href={business.inventoryUrl}
            eventName="inventory_click"
            eventLabel="footer_inventory"
            target="_blank"
            rel="noreferrer"
          >
            Live inventory <ArrowUpRight />
          </TrackedLink>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {business.displayName}</p>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/accessibility">Accessibility</Link>
        </div>
        <a className="back-to-top" href="#top">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Typecheck + dev check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add components/Header.tsx components/Footer.tsx
git commit -m "nav: update Header + Footer with new routes (Materials, Stone Finder, Trade)"
```

---

## Task 10: Analytics Extension

**Files:** `lib/analytics.ts`

- [ ] **Step 1: Add new event types to lib/analytics.ts**

Replace the `ConversionEvent` type:

```typescript
export type ConversionEvent =
  | "phone_click"
  | "directions_click"
  | "inventory_click"
  | "service_click"
  | "review_click"
  | "social_click"
  | "map_load"
  | "material_view"
  | "material_save"
  | "material_compare"
  | "stone_finder_start"
  | "stone_finder_complete"
  | "visualizer_start"
  | "visualizer_complete"
  | "availability_request"
  | "trade_application"
  | "project_created"
  | "showroom_request"
  | "ai_content_generate";
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -10
```

- [ ] **Step 3: Commit**

```bash
git add lib/analytics.ts
git commit -m "analytics: extend ConversionEvent with Phase 1-3 event types"
```

---

## Task 11: Material API Routes

**Files:** `app/api/materials/route.ts`, `app/api/materials/[slug]/route.ts`

- [ ] **Step 1: Create app/api/materials/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getMaterials } from "@/lib/db/materials";
import type { MaterialType } from "@/types/material";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const type = searchParams.get("type") as MaterialType | null;
  const colorFamily = searchParams.get("color") ?? undefined;
  const finish = searchParams.get("finish") ?? undefined;
  const availability = searchParams.get("availability") as
    | "available"
    | "low"
    | undefined;
  const featured = searchParams.get("featured") === "true" ? true : undefined;
  const clearance = searchParams.get("clearance") === "true" ? true : undefined;
  const newArrival = searchParams.get("new") === "true" ? true : undefined;
  const search = searchParams.get("q") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 48), 96);
  const offset = Number(searchParams.get("offset") ?? 0);

  try {
    const materials = await getMaterials({
      type: type ?? undefined,
      colorFamily,
      finish,
      availability,
      featured,
      clearance,
      newArrival,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ materials });
  } catch (err) {
    console.error("[api/materials]", err);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create app/api/materials/[slug]/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getMaterial } from "@/lib/db/materials";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const material = await getMaterial(slug);
    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }
    return NextResponse.json({ material });
  } catch (err) {
    console.error("[api/materials/[slug]]", err);
    return NextResponse.json(
      { error: "Failed to fetch material" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Test the API routes**

Start dev server and test:
```bash
npm run dev &
sleep 5
curl -s "http://localhost:3000/api/materials" | python3 -m json.tool | head -30
curl -s "http://localhost:3000/api/materials/emperor" | python3 -m json.tool | head -20
kill %1
```

Expected: first returns `{ materials: [...] }` with 6 slabs. Second returns 404 or `{ material: {...} }`.

- [ ] **Step 4: Commit**

```bash
git add app/api/materials/
git commit -m "api: add /api/materials and /api/materials/[slug] GET routes"
```

---

## Task 12: Material Library Components

**Files:** `components/materials/MaterialCard.tsx`, `components/materials/MaterialFilters.tsx`, `components/materials/MaterialGrid.tsx`, `components/materials/MaterialSearch.tsx`

- [ ] **Step 1: Create components/materials/MaterialCard.tsx**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import type { MaterialSummary } from "@/types/material";
import { trackEvent } from "@/lib/analytics";

export function MaterialCard({ material }: { material: MaterialSummary }) {
  const primaryImage = material.image_urls[0];

  return (
    <div className="material-card">
      <div className="material-card-image">
        <Link
          href={`/materials/${material.slug}`}
          onClick={() =>
            trackEvent("material_view", { label: material.slug })
          }
        >
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={`${material.name} ${material.material_type} slab`}
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "var(--color-warm)",
              }}
            />
          )}
        </Link>

        <div className="material-card-badges">
          {material.new_arrival && (
            <span className="badge badge-new">New</span>
          )}
          {material.clearance && (
            <span className="badge badge-clearance">Clearance</span>
          )}
        </div>

        <div className="material-card-overlay">
          <Link
            href={`/materials/${material.slug}`}
            className="button button-sm"
            style={{ background: "var(--color-white)", color: "var(--color-ink)" }}
          >
            View slab →
          </Link>
        </div>
      </div>

      <div className="material-card-body">
        <p className="material-card-eyebrow">{material.material_type}</p>
        <p className="material-card-name">{material.name}</p>
        <div className="material-card-meta">
          <span
            className={`availability-dot ${material.availability === "low" ? "low" : material.availability === "unavailable" ? "unavailable" : ""}`}
          />
          <span>
            {material.finish}
            {material.availability === "low" && " · Limited"}
            {material.availability === "unavailable" && " · Inquire"}
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create components/materials/MaterialFilters.tsx**

```tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Quartzite", value: "Quartzite" },
  { label: "Marble", value: "Marble" },
  { label: "Granite", value: "Granite" },
  { label: "Quartz", value: "Quartz" },
  { label: "Onyx", value: "Onyx" },
];

const STATUS_FILTERS = [
  { label: "Available", value: "available", param: "availability" },
  { label: "New", value: "true", param: "new" },
  { label: "Clearance", value: "true", param: "clearance" },
];

export function MaterialFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset offset when filtering
      params.delete("offset");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const currentType = searchParams.get("type") ?? "";

  return (
    <div className="filter-strip">
      <div className="filter-strip-scroll">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`chip ${currentType === f.value ? "active" : ""}`}
            onClick={() => setParam("type", f.value)}
          >
            {f.label}
          </button>
        ))}
        <div style={{ width: "1px", background: "var(--color-line)", flexShrink: 0, margin: "0 0.25rem" }} />
        {STATUS_FILTERS.map((f) => (
          <button
            key={`${f.param}-${f.value}`}
            className={`chip ${searchParams.get(f.param) === f.value ? "active" : ""}`}
            onClick={() =>
              setParam(
                f.param,
                searchParams.get(f.param) === f.value ? "" : f.value
              )
            }
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create components/materials/MaterialGrid.tsx**

```tsx
import type { MaterialSummary } from "@/types/material";
import { MaterialCard } from "./MaterialCard";

export function MaterialGrid({ materials }: { materials: MaterialSummary[] }) {
  if (materials.length === 0) {
    return (
      <div className="materials-empty">
        <p>No slabs match — try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="material-grid">
      {materials.map((m) => (
        <MaterialCard key={m.id} material={m} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add components/materials/
git commit -m "components: add MaterialCard, MaterialFilters, MaterialGrid"
```

---

## Task 13: Material Library Page

**Files:** `app/materials/page.tsx`

- [ ] **Step 1: Create app/materials/page.tsx**

```tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { getMaterials } from "@/lib/db/materials";
import { MaterialGrid } from "@/components/materials/MaterialGrid";
import { MaterialFilters } from "@/components/materials/MaterialFilters";
import type { MaterialType } from "@/types/material";

export const metadata: Metadata = {
  title: "Natural Stone & Quartz Slabs | Stone Supply Co",
  description:
    "Browse quartzite, marble, granite, quartz, and onyx slabs at Stone Supply Co in Northridge, Los Angeles. Over 44 slabs in stock. Visit the yard or explore online.",
  alternates: {
    canonical: "/materials",
  },
};

type Props = {
  searchParams: Promise<{
    type?: string;
    color?: string;
    finish?: string;
    availability?: string;
    new?: string;
    clearance?: string;
    q?: string;
    offset?: string;
  }>;
};

export default async function MaterialsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const materials = await getMaterials({
    type: sp.type as MaterialType | undefined,
    colorFamily: sp.color,
    finish: sp.finish,
    availability: sp.availability as "available" | "low" | undefined,
    newArrival: sp.new === "true",
    clearance: sp.clearance === "true",
    search: sp.q,
    offset: Number(sp.offset ?? 0),
  });

  return (
    <main className="materials-page">
      <div className="materials-header">
        <div className="materials-header-left">
          <h1>Our materials.</h1>
          <em>Find your stone.</em>
        </div>
        <p className="materials-count">
          {materials.length} {materials.length === 1 ? "slab" : "slabs"}
        </p>
      </div>

      <div className="materials-filters">
        <Suspense>
          <MaterialFilters />
        </Suspense>
      </div>

      <div className="materials-grid-wrap">
        <MaterialGrid materials={materials} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Test in browser**

```bash
npm run dev
```

Open `http://localhost:3000/materials` — should show material grid with 6 slabs from Supabase. Filter chips should change the URL and re-fetch.

- [ ] **Step 3: Commit**

```bash
git add app/materials/page.tsx
git commit -m "page: add /materials library page with filters and Supabase data"
```

---

## Task 14: Material Detail Components

**Files:** `components/detail/ImageGallery.tsx`, `components/detail/SpecsGrid.tsx`, `components/detail/AvailabilityBadge.tsx`, `components/detail/RelatedMaterials.tsx`, `components/detail/MaterialCTA.tsx`

- [ ] **Step 1: Create components/detail/AvailabilityBadge.tsx**

```tsx
import type { Availability } from "@/types/material";

const LABELS: Record<Availability, string> = {
  available: "In stock at Northridge yard",
  low: "Limited availability — inquire soon",
  unavailable: "Currently unavailable — inquire",
};

export function AvailabilityBadge({
  availability,
}: {
  availability: Availability;
}) {
  return (
    <div className="material-availability" role="status">
      <span className={`availability-dot ${availability === "available" ? "" : availability}`} />
      <span>{LABELS[availability]}</span>
    </div>
  );
}
```

- [ ] **Step 2: Create components/detail/SpecsGrid.tsx**

```tsx
import type { Material } from "@/types/material";

export function SpecsGrid({ material }: { material: Material }) {
  const cells = [
    { label: "Size", value: material.dimensions ?? "—" },
    { label: "Finish", value: material.finish || "—" },
    {
      label: "Available",
      value:
        material.quantity > 0
          ? `${material.quantity} slab${material.quantity !== 1 ? "s" : ""}`
          : "Inquire",
    },
  ];

  return (
    <div className="material-specs-grid">
      {cells.map((cell) => (
        <div key={cell.label} className="material-specs-cell">
          <p className="material-specs-label">{cell.label}</p>
          <p className="material-specs-value">{cell.value}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create components/detail/ImageGallery.tsx**

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";

export function ImageGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const src = images[activeIndex] ?? images[0];

  if (!src) {
    return (
      <div
        className="material-gallery-main"
        style={{ background: "var(--color-warm)" }}
      />
    );
  }

  return (
    <div className="material-detail-gallery">
      <div className="material-gallery-main">
        <Image
          src={src}
          alt={`${name} slab`}
          fill
          priority
          sizes="(max-width: 900px) 100vw, 55vw"
          style={{ objectFit: "cover" }}
        />
      </div>
      {images.length > 1 && (
        <div className="material-gallery-thumbs">
          {images.map((img, i) => (
            <button
              key={img}
              className={`material-gallery-thumb ${i === activeIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
            >
              <Image
                src={img}
                alt=""
                fill
                sizes="80px"
                style={{ objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create components/detail/MaterialCTA.tsx**

```tsx
"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import type { Material } from "@/types/material";

export function MaterialCTA({ material }: { material: Material }) {
  return (
    <div className="material-cta-stack">
      <Link
        href={`/stone-finder?material=${material.slug}`}
        className="button"
        onClick={() =>
          trackEvent("availability_request", { label: material.slug })
        }
      >
        Check Availability
      </Link>

      <div className="material-actions-row">
        <button
          className="button button-outline"
          style={{ flex: 1 }}
          onClick={() => trackEvent("material_save", { label: material.slug })}
        >
          ♡ Save to Project
        </button>
        <Link
          href={`/compare?a=${material.slug}`}
          className="button button-outline"
          style={{ flex: 1 }}
          onClick={() =>
            trackEvent("material_compare", { label: material.slug })
          }
        >
          ⇄ Compare
        </Link>
      </div>

      <Link
        href="/stone-finder"
        style={{
          fontSize: "0.72rem",
          color: "var(--color-bronze)",
          textAlign: "center",
          paddingTop: "0.25rem",
        }}
      >
        ✦ Ask AI about this stone
      </Link>

      {/* Mobile sticky bar */}
      <div className="material-mobile-sticky">
        <Link href={`/stone-finder?material=${material.slug}`} className="button" style={{ flex: 1 }}>
          Check Availability
        </Link>
        <button
          className="button button-outline"
          onClick={() => trackEvent("material_save", { label: material.slug })}
        >
          ♡ Save
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create components/detail/RelatedMaterials.tsx**

```tsx
import Link from "next/link";
import Image from "next/image";
import type { MaterialSummary } from "@/types/material";

export function RelatedMaterials({
  materials,
  currentType,
}: {
  materials: MaterialSummary[];
  currentType: string;
}) {
  if (materials.length === 0) return null;

  return (
    <div className="material-related">
      <p
        style={{
          fontSize: "0.5rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--color-stone-dark)",
          marginBottom: "1.5rem",
        }}
      >
        More {currentType}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--color-line)" }}>
        {materials.map((m) => (
          <Link key={m.id} href={`/materials/${m.slug}`} style={{ display: "block", background: "var(--color-paper)" }}>
            <div style={{ aspectRatio: "1", overflow: "hidden", position: "relative", background: "var(--color-warm)" }}>
              {m.image_urls[0] && (
                <Image
                  src={m.image_urls[0]}
                  alt={m.name}
                  fill
                  sizes="(max-width: 600px) 50vw, 20vw"
                  style={{ objectFit: "cover" }}
                />
              )}
            </div>
            <div style={{ padding: "0.6rem 0.75rem" }}>
              <p style={{ fontSize: "0.7rem", fontFamily: "var(--font-serif)", margin: 0 }}>{m.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 7: Commit**

```bash
git add components/detail/
git commit -m "components: add material detail components (gallery, specs, CTA, related)"
```

---

## Task 15: Material Detail Page

**Files:** `app/materials/[slug]/page.tsx`

- [ ] **Step 1: Create app/materials/[slug]/page.tsx**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMaterial, getRelatedMaterials } from "@/lib/db/materials";
import { ImageGallery } from "@/components/detail/ImageGallery";
import { SpecsGrid } from "@/components/detail/SpecsGrid";
import { AvailabilityBadge } from "@/components/detail/AvailabilityBadge";
import { MaterialCTA } from "@/components/detail/MaterialCTA";
import { RelatedMaterials } from "@/components/detail/RelatedMaterials";
import Link from "next/link";
import { siteUrl, siteName } from "@/lib/siteConfig";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const material = await getMaterial(slug);
  if (!material) return { title: "Material Not Found" };

  const title = `${material.name} ${material.material_type} Slab | ${siteName}`;
  const description =
    material.seo_description ??
    `${material.name} ${material.material_type} in a ${material.finish} finish. Available at Stone Supply Co in Northridge, Los Angeles. ${material.quantity > 0 ? `${material.quantity} slabs in stock.` : "Inquire for availability."}`;

  return {
    title,
    description,
    alternates: { canonical: `/materials/${slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/materials/${slug}`,
      images: material.image_urls[0]
        ? [{ url: material.image_urls[0], width: 1200, height: 900 }]
        : [],
    },
  };
}

export default async function MaterialDetailPage({ params }: Props) {
  const { slug } = await params;
  const [material, related] = await Promise.all([
    getMaterial(slug),
    getMaterial(slug).then((m) =>
      m ? getRelatedMaterials(m) : []
    ),
  ]);

  if (!material) notFound();

  const relatedMaterials = await getRelatedMaterials(material);

  const price =
    material.clearance_price ?? material.price;

  return (
    <main className="material-detail">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/materials">Materials</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/materials/${material.material_type.toLowerCase()}`}>
          {material.material_type}
        </Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{material.name}</span>
      </nav>

      <div className="material-detail-layout">
        {/* Left: Gallery */}
        <ImageGallery images={material.image_urls} name={material.name} />

        {/* Right: Info */}
        <div className="material-detail-info">
          <div>
            <p className="material-detail-eyebrow">{material.material_type}</p>
            <h1 className="material-name">{material.name}</h1>
            {(material.origin || price) && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-stone-dark)",
                  marginTop: "0.4rem",
                }}
              >
                {material.origin && <span>{material.origin}</span>}
                {material.origin && price && <span> · </span>}
                {price && (
                  <span>
                    {material.clearance && material.clearance_price && (
                      <span
                        style={{
                          textDecoration: "line-through",
                          marginRight: "0.4rem",
                          opacity: 0.5,
                        }}
                      >
                        ${material.price}
                      </span>
                    )}
                    ${price}
                    {material.thickness && ` / ${material.thickness}`}
                  </span>
                )}
              </p>
            )}
          </div>

          <SpecsGrid material={material} />
          <AvailabilityBadge availability={material.availability} />

          {material.description && (
            <p
              style={{
                fontSize: "0.9rem",
                lineHeight: "1.7",
                color: "var(--color-stone-dark)",
              }}
            >
              {material.description}
            </p>
          )}

          {material.applications.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: "0.48rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--color-stone-dark)",
                  marginBottom: "0.5rem",
                }}
              >
                Applications
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {material.applications.map((app) => (
                  <span key={app} className="chip" style={{ cursor: "default" }}>
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}

          <MaterialCTA material={material} />
        </div>
      </div>

      {/* Related */}
      <RelatedMaterials
        materials={relatedMaterials}
        currentType={material.material_type}
      />

      {/* JSON-LD Product schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: material.name,
            description: material.description ?? undefined,
            image: material.image_urls,
            brand: { "@type": "Brand", name: siteName },
            offers: price
              ? {
                  "@type": "Offer",
                  price: price,
                  priceCurrency: "USD",
                  availability:
                    material.availability === "unavailable"
                      ? "https://schema.org/OutOfStock"
                      : "https://schema.org/InStock",
                }
              : undefined,
          }),
        }}
      />
    </main>
  );
}
```

- [ ] **Step 2: Test in browser**

Open `http://localhost:3000/materials/emperador` — should show gallery, specs, CTA.

- [ ] **Step 3: Commit**

```bash
git add app/materials/[slug]/page.tsx
git commit -m "page: add /materials/[slug] detail page with gallery, specs, JSON-LD"
```

---

## Task 16: Category Pages

**Files:** `app/materials/[type]/page.tsx`

- [ ] **Step 1: Create app/materials/[type]/page.tsx**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getMaterials } from "@/lib/db/materials";
import { MaterialGrid } from "@/components/materials/MaterialGrid";
import { MaterialFilters } from "@/components/materials/MaterialFilters";
import type { MaterialType } from "@/types/material";
import Link from "next/link";

const VALID_TYPES: MaterialType[] = [
  "Quartzite",
  "Marble",
  "Granite",
  "Quartz",
  "Onyx",
];

const TYPE_COPY: Record<
  MaterialType,
  { headline: string; description: string; seoKw: string }
> = {
  Quartzite: {
    headline: "Quartzite.",
    description:
      "Formed under intense heat and pressure, quartzite offers the organic beauty of marble with the durability of granite. Perfect for high-use kitchen surfaces and dramatic feature walls.",
    seoKw: "quartzite slabs Los Angeles · quartzite countertops Northridge",
  },
  Marble: {
    headline: "Marble.",
    description:
      "Timeless veining, cool to the touch, unique in every slab. Marble brings an irreplaceable elegance to kitchens, bathrooms, and fireplace surrounds across Los Angeles.",
    seoKw: "marble slabs Los Angeles · marble countertops Northridge",
  },
  Granite: {
    headline: "Granite.",
    description:
      "One of the hardest natural stones on earth. Granite's crystalline depth and rich variation make every slab a one-of-a-kind statement for kitchens and outdoor spaces.",
    seoKw: "granite slabs Los Angeles · granite countertops San Fernando Valley",
  },
  Quartz: {
    headline: "Quartz.",
    description:
      "Engineered for consistency and performance. Quartz delivers the look of natural stone with exceptional durability, stain resistance, and a wide range of finishes.",
    seoKw: "quartz slabs Northridge · engineered quartz Los Angeles",
  },
  Onyx: {
    headline: "Onyx.",
    description:
      "Translucent, luminous, unmistakable. Onyx is the stone for spaces that demand attention — backlit bars, feature walls, and spa bathrooms where light becomes part of the design.",
    seoKw: "onyx slabs Los Angeles · onyx stone supplier",
  },
  Other: {
    headline: "Other Materials.",
    description: "Specialty and exotic stone selections.",
    seoKw: "specialty stone Los Angeles",
  },
};

type Props = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ availability?: string; new?: string; q?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const normalized = (type.charAt(0).toUpperCase() + type.slice(1)) as MaterialType;

  if (!VALID_TYPES.includes(normalized)) return { title: "Not Found" };

  const copy = TYPE_COPY[normalized];
  return {
    title: `${normalized} Slabs Los Angeles | Stone Supply Co`,
    description: `${copy.description} Visit Stone Supply Co in Northridge.`,
    alternates: { canonical: `/materials/${type}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { type } = await params;
  const sp = await searchParams;

  const normalized = (
    type.charAt(0).toUpperCase() + type.slice(1)
  ) as MaterialType;

  if (!VALID_TYPES.includes(normalized)) notFound();

  const copy = TYPE_COPY[normalized];

  const materials = await getMaterials({
    type: normalized,
    availability: sp.availability as "available" | "low" | undefined,
    newArrival: sp.new === "true",
    search: sp.q,
  });

  return (
    <main>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/materials">Materials</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{normalized}</span>
      </nav>

      {/* Hero */}
      <div className="category-hero">
        <p className="category-hero-eyebrow">Stone Supply Co · {normalized}</p>
        <h1>{copy.headline}</h1>
        <p>{copy.description}</p>
      </div>

      {/* Filters + Grid */}
      <div className="materials-filters">
        <Suspense>
          <MaterialFilters />
        </Suspense>
      </div>

      <div className="materials-grid-wrap">
        <MaterialGrid materials={materials} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Test category pages**

```bash
npm run dev
```

Open: `http://localhost:3000/materials/quartz`, `http://localhost:3000/materials/quartzite`, `http://localhost:3000/materials/marble`. Each should show filtered grid and type description.

- [ ] **Step 3: Commit**

```bash
git add app/materials/[type]/page.tsx
git commit -m "page: add /materials/[type] category pages with SEO copy"
```

---

## Task 17: Homepage New Components

**Files:** `components/homepage/ReviewsSection.tsx`, `components/homepage/MaterialCategories.tsx`, `components/homepage/AiFinderCTA.tsx`

- [ ] **Step 1: Create components/homepage/ReviewsSection.tsx**

```tsx
import Link from "next/link";
import { reviews, googleReviewSummary } from "@/data/reviews";

const FEATURED = reviews.filter((r) => r.featured).slice(0, 3);
const [primary, ...secondary] = FEATURED;

export function ReviewsSection() {
  if (!primary) return null;

  return (
    <section className="reviews-editorial" id="reviews">
      <p className="reviews-editorial-label">Customer Reviews</p>

      <div className="reviews-editorial-grid">
        {/* Featured primary */}
        <div>
          <blockquote>
            <p className="review-feature-text">"{primary.text}"</p>
            <footer className="review-feature-meta">
              — {primary.reviewer} · Google · ★★★★★
            </footer>
          </blockquote>
        </div>

        {/* Secondary reviews */}
        <div className="review-secondary-stack">
          {secondary.map((r) => (
            <blockquote key={r.reviewer}>
              <p className="review-secondary-text">"{r.text}"</p>
              <footer className="review-secondary-meta">
                — {r.reviewer} · Google · ★★★★★
              </footer>
            </blockquote>
          ))}
        </div>
      </div>

      <div className="reviews-editorial-footer">
        <div className="reviews-editorial-rating">
          <span className="reviews-editorial-stars">★★★★★</span>
          <span>
            {googleReviewSummary.rating} · {googleReviewSummary.count} Google
            reviews
          </span>
        </div>
        <Link
          href={googleReviewSummary.profileUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "rgba(255,253,248,0.5)",
            textDecoration: "none",
          }}
        >
          Read all reviews ↗
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create components/homepage/MaterialCategories.tsx**

```tsx
import Link from "next/link";
import Image from "next/image";
import { authenticPhotos } from "@/data/gallery";

// Use available slab images as category placeholders.
// Owner to supply category-specific hero images when available.
const CATEGORIES = [
  { label: "Quartzite", href: "/materials/quartzite", image: authenticPhotos.slabs[0] },
  { label: "Marble", href: "/materials/marble", image: authenticPhotos.slabs[1] },
  { label: "Granite", href: "/materials/granite", image: authenticPhotos.slabs[2] },
  { label: "Quartz", href: "/materials/quartz", image: authenticPhotos.slabs[3] },
  { label: "Onyx", href: "/materials/onyx", image: authenticPhotos.slabs[4] },
];

export function MaterialCategories() {
  return (
    <section className="material-categories" id="categories">
      <div className="material-categories-header">
        <h2>Explore by material.</h2>
        <p>Quartzite, marble, granite, quartz, and onyx — all in the Northridge yard.</p>
      </div>

      <div className="categories-tiles">
        {CATEGORIES.map((cat) => (
          <Link key={cat.label} href={cat.href} className="category-tile">
            {cat.image && (
              <Image
                src={cat.image}
                alt={`${cat.label} slabs at Stone Supply Co`}
                fill
                sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 20vw"
                style={{ objectFit: "cover" }}
              />
            )}
            <span className="category-tile-label">{cat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create components/homepage/AiFinderCTA.tsx**

```tsx
import Link from "next/link";

export function AiFinderCTA() {
  return (
    <section className="ai-finder-cta">
      <div className="ai-finder-cta-copy">
        <h2>Not sure where to start?</h2>
        <p>
          Describe your space and we'll match you with the stones that fit —
          color, movement, material, budget.
        </p>
      </div>
      <Link href="/stone-finder" className="button button-outline">
        Find My Stone →
      </Link>
    </section>
  );
}
```

- [ ] **Step 4: Check authenticPhotos structure in gallery.ts**

```bash
grep -n "slabs" /Users/riz/Downloads/Stone-Supply-Co/data/gallery.ts | head -10
```

Verify `authenticPhotos.slabs` is an array of strings. If the property name differs, update `MaterialCategories.tsx` to match actual export shape.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add components/homepage/
git commit -m "components: add ReviewsSection, MaterialCategories, AiFinderCTA for homepage"
```

---

## Task 18: Homepage Refactor

**Files:** `app/page.tsx`

Read the current homepage (`app/page.tsx`) fully before editing. Insert new sections without removing existing ones. The order after refactor:

1. Hero (update CTAs + add rating badge)
2. Proof strip (update text)
3. Inventory section (update link to `/materials`)
4. **NEW: ReviewsSection**
5. **NEW: MaterialCategories**
6. How-to-choose section (keep)
7. Gallery (keep)
8. **NEW: AiFinderCTA**
9. Audience section (add Trade CTA)
10. Visit section (update copy)
11. Final CTA (add secondary Stone Finder link)
12. Footer

- [ ] **Step 1: Read the full current homepage**

```bash
cat app/page.tsx
```

Note where each section starts. Identify:
- The hero's CTA links (update to `/materials` + directions)
- The proof strip text items (find "Verified on Stone Index" → replace)
- The inventory section "Browse all" link (update to `/materials`)
- Where to insert ReviewsSection (after inventory)
- Where to insert MaterialCategories (after reviews)
- Where to insert AiFinderCTA (after gallery, before audience)
- The final CTA section (add secondary link)

- [ ] **Step 2: Update hero CTAs**

In `app/page.tsx`, find the hero CTA buttons. Update to:

```tsx
<Link href="/materials" className="button">
  Explore Materials
</Link>
<TrackedLink
  href={business.directionsUrl}
  eventName="directions_click"
  eventLabel="hero"
  target="_blank"
  rel="noreferrer"
  className="button button-outline"
>
  Visit the Showroom
</TrackedLink>
```

- [ ] **Step 3: Update proof strip**

Find the proof strip item that says "Verified on Stone Index" and replace with:

```tsx
<div className="proof-item">
  <span>★★★★★</span>
  <span>5.0 Google Rating · 17 Reviews</span>
</div>
```

- [ ] **Step 4: Update inventory "browse all" link**

Find the link that goes to `business.inventoryUrl` in the inventory section. Change to:

```tsx
<Link href="/materials">View all materials →</Link>
```

- [ ] **Step 5: Insert new homepage sections**

Import at top of `app/page.tsx`:
```tsx
import { ReviewsSection } from "@/components/homepage/ReviewsSection";
import { MaterialCategories } from "@/components/homepage/MaterialCategories";
import { AiFinderCTA } from "@/components/homepage/AiFinderCTA";
```

Add `<ReviewsSection />` immediately after the inventory/table section.
Add `<MaterialCategories />` immediately after `<ReviewsSection />`.
Add `<AiFinderCTA />` after the gallery section and before the audience section.

- [ ] **Step 6: Update audience section Trade CTA**

Find the designer/architect/fabricator copy in the audience section. Add:

```tsx
<Link href="/trade" className="button button-outline button-sm">
  Work with us →
</Link>
```

- [ ] **Step 7: Update final CTA**

Find the final CTA section. Add secondary link alongside the primary CTA:

```tsx
<Link href="/stone-finder" className="button button-outline">
  Try the Stone Finder →
</Link>
```

- [ ] **Step 8: Test the full homepage in browser**

Open `http://localhost:3000` — scroll through all sections. Verify:
- Reviews section shows Jeff N's full quote
- Categories section shows 5 tiles
- AI Finder CTA panel appears between gallery and audience
- No broken layouts

- [ ] **Step 9: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 10: Commit**

```bash
git add app/page.tsx
git commit -m "homepage: add reviews section, category tiles, AI finder CTA panel; update CTAs"
```

---

## Task 19: Update Sitemap

**Files:** `app/sitemap.ts`

- [ ] **Step 1: Read current sitemap.ts**

```bash
cat app/sitemap.ts
```

- [ ] **Step 2: Update app/sitemap.ts to include material slugs**

```typescript
import type { MetadataRoute } from "next";
import { getMaterialSlugs } from "@/lib/db/materials";
import { siteUrl } from "@/lib/siteConfig";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getMaterialSlugs();

  const materialPages = slugs.map((slug) => ({
    url: `${siteUrl}/materials/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/materials`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/materials/quartzite`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/materials/marble`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/materials/granite`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/materials/quartz`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/materials/onyx`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/stone-finder`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/trade`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/accessibility`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    ...materialPages,
  ];
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit 2>&1 | head -10
git add app/sitemap.ts
git commit -m "seo: update sitemap with material slugs from Supabase"
```

---

## Task 20: Final Phase 1 QA

- [ ] **Step 1: Full build check**

```bash
npm run build 2>&1 | tail -30
```

Expected: no TypeScript errors, no build errors. Route list shows `/materials`, `/materials/[slug]`, `/materials/[type]`.

- [ ] **Step 2: Test all new routes**

```bash
npm run dev
```

Manually open each route and verify:
- `http://localhost:3000` — homepage loads, reviews visible, categories visible, AI CTA visible
- `http://localhost:3000/materials` — grid shows 6 slabs, filter chips work
- `http://localhost:3000/materials/quartz` — category page shows copy + filtered grid
- `http://localhost:3000/materials/quartzite` — shows empty grid or 0 slabs (correct — no quartzite in seed)
- `http://localhost:3000/materials/emperador` — detail page shows gallery, specs, availability badge
- `http://localhost:3000/api/materials` — JSON response with 6 slabs

- [ ] **Step 3: Check for console errors**

Open each page in browser devtools. Zero red console errors is the target. Warnings about missing images for categories are acceptable.

- [ ] **Step 4: Typecheck final**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Tag Phase 1 complete**

```bash
git tag phase1-complete
git log --oneline | head -20
```

---

## Phase 1 Complete

**What is live:**
- 17 verified Google reviews in `data/reviews.ts`
- Supabase schema (materials + leads + projects + visualizations tables)
- 6 seed slabs in Supabase
- Full data access layer (`lib/db/`)
- Gemini SDK installed with stubs
- `/materials` — browsable library with filters
- `/materials/[slug]` — full detail pages
- `/materials/[type]` — category pages × 5
- Homepage: reviews section, category tiles, AI finder CTA panel
- Updated Header + Footer navigation
- Analytics event types extended
- Sitemap updated with all material slugs

**What comes next (Plan 2):**
- Stone Finder (scoring engine + Gemini + multi-step form + lead capture)
- `/api/leads` route
- Trade portal (`/trade`)
- Saved projects (localStorage)
- Material compare (`/compare`)
- Room visualizer (`/visualizer`)
- Admin panel (`/admin/materials`, `/admin/leads`)
- Mobile polish pass
