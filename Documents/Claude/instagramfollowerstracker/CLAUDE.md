# CLAUDE.md — instagramfollowerstracker.com
**PRD version:** 2.0

Read this file fully before touching any code. Then read PRD.md fully.

---

## What you are building

**instagramfollowerstracker.com** — A freemium SaaS that tracks follower counts for any public Instagram account over time, with daily snapshots, growth charts, and SEO-optimized public pages for top accounts.

Full spec is in PRD.md. This file covers coding conventions, build order, and rules.

---

## Stack

- **Next.js 14** — App Router only. No Pages Router.
- **TypeScript** — strict mode. No `any` without a comment explaining why.
- **Tailwind CSS** — utility classes only.
- **Prisma** — all DB access through Prisma client. No raw SQL except analytics.
- **PostgreSQL** — schema in `prisma/schema.prisma`.
- **NextAuth.js v5** — email magic link + Google OAuth.
- **Playwright** — scraper only, server-side only, never in client components.
- **Stripe** — server-side only.
- **Resend** — transactional email.
- **Chart.js** — follower growth charts, client-side only, dynamic import.
- **Zod** — validate all API request bodies.

---

## File conventions

- One component per file, named exports only (except Next.js page files)
- `'use client'` only when needed — interactivity, hooks, browser APIs
- Server components are the default
- API routes: always validate with Zod, always check auth first, return `{ error: string }` on failure

---

## Build order — follow exactly, do not skip ahead

### Step 1: Project setup
```bash
npx create-next-app@latest instagramfollowerstracker --typescript --tailwind --app --src-dir=false
cd instagramfollowerstracker
npm install prisma @prisma/client next-auth@beta playwright stripe @stripe/stripe-js resend zod chart.js
npx prisma init
```

### Step 2: Database
1. Copy schema from PRD.md section 4 into `prisma/schema.prisma`
2. Set `DATABASE_URL` in `.env`
3. `npx prisma migrate dev --name init`
4. `npx prisma generate`

### Step 3: Auth
- `app/api/auth/[...nextauth]/route.ts`
- `lib/auth.ts` with `getServerSession` helper

### Step 4: Core API routes (in this order)
1. `POST /api/accounts` — add account, take first snapshot immediately
2. `GET /api/accounts` — list with latest snapshot + snapshotCount + chartReady
3. `DELETE /api/accounts/[id]`
4. `GET /api/accounts/[id]/snapshots` — chart data

### Step 5: Scraper
- Build `lib/scraper.ts` using Playwright
- Test against 3–5 public accounts locally
- Proxy via `PROXY_URL` env var (optional locally, required in prod)

### Step 6: Dashboard UI
- Cold start UI first (SnapshotProgress component) — this is the default experience
- AccountCard with progress state
- AddAccountForm
- FollowerChart (only renders when snapshotCount >= 7)
- MetricsRow

### Step 7: Cron + milestone emails
- `worker/snapshot.ts`
- `app/api/cron/snapshot/route.ts` with Bearer token auth
- `vercel.json` cron config
- Milestone emails at snapshots 1, 3, 7

### Step 8: Public SEO pages
- `app/[handle]/page.tsx` — server component, no auth required
- `GET /api/public/[handle]`
- `generateMetadata()` for dynamic SEO
- JSON-LD: FAQPage on homepage, ProfilePage + BreadcrumbList on handle pages

### Step 9: Stripe + plan enforcement
- Products/prices in Stripe dashboard
- Checkout + webhook handler
- Enforce `maxAccounts: 1` for FREE in `POST /api/accounts`

### Step 10: Pro features
- `POST /api/exports` — upload Instagram data export
- `lib/export-parser.ts` — parse + diff
- `UnfollowDetector` component (Pro gate)

### Step 11: Seed + SEO infrastructure
- `prisma/seed.ts` — top 500 Instagram accounts
- `worker/backfill.ts` — Wayback Machine backfill
- `app/sitemap.ts` — auto-generated
- `app/robots.ts`

---

## The cold start problem — most important UX rule

**The chart will be empty for most new users on day one.** Only the seeded top-500 accounts have historical data. For everyone else, data collection starts when they add the account.

Rules:
- Never show an empty chart. Show the `EmptyChart` / `SnapshotProgress` component instead.
- `chartReady = snapshotCount >= CHART_UNLOCK_THRESHOLD (7)`
- Show current follower count immediately — this is always available after snapshot 1
- Show progress: "Snapshot X of 7 — chart unlocks after 7 snapshots"
- Show "Next snapshot in ~{hours} hours"
- Send milestone emails at snapshots 1, 3, and 7

The SnapshotProgress component should feel like engagement, not a broken product.

---

## Plan limits — enforce on every write

```typescript
// Always check this before creating any user data
import { PLAN_LIMITS } from '@/lib/limits';

const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  include: { _count: { select: { trackedAccounts: true } } }
});

const limit = PLAN_LIMITS[user.plan].maxAccounts;  // FREE = 1
if (user._count.trackedAccounts >= limit) {
  return NextResponse.json(
    { error: 'Plan limit reached', limit, upgrade: '/pricing' },
    { status: 402 }
  );
}
```

The free tier limit is **1 account**. This is intentional and must not be changed without updating this file.

There is **no history limit on any tier** — `historyDays: null` means return all snapshots ever collected.

---

## Handle parsing — use everywhere, consistently

```typescript
export function parseHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/\/$/, '')
    .split('?')[0]
    .split('/')[0];
}

// Validation regex
export const HANDLE_REGEX = /^[a-z0-9._]{1,30}$/;
```

---

## SEO implementation — non-negotiable, built in from the start

### Every page needs
- `generateMetadata()` with title, description, canonical, OpenGraph, Twitter card
- Title template: `"%s | Instagram Followers Tracker"`

### Homepage H1 and copy rules
- H1 must be exactly: "Instagram Followers Tracker"
- Subheadline must include: "track Instagram follower growth"
- Features section headings must use: "Unfollow Tracker", "Growth Tracker", "Follower Count History", "New Followers Tracker"
- CTA button: "Start Tracking Free" — not "Sign Up"
- Footer tagline: "The most accurate Instagram follower tracker. Track any public account."

### Public handle pages
```typescript
// Title
`@${handle} Instagram Followers — Live Count & Growth History`

// Description  
`Track @${handle}'s Instagram follower count over time. Currently ${formatCount(count)} followers. See full growth history, daily changes, and trends.`
```

### FAQ on homepage (FAQPage JSON-LD schema)
Include all 8 questions from PRD.md section 14. These target the long-tail keyword cluster directly.

### Sitemap priorities
- `/` → priority 1.0, changefreq daily
- `/pricing` → priority 0.8
- `/[handle]` pages → priority 0.6, changefreq weekly

### robots.ts
```typescript
export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard', '/api', '/settings'] }
    ],
    sitemap: 'https://instagramfollowerstracker.com/sitemap.xml',
  };
}
```

### Internal linking
- Homepage footer: grid of top 100 seeded accounts linked as `@handle`
- Each `/[handle]` page: "Similar accounts to track" section with 6 related accounts
- Every page max 2 clicks from homepage

---

## Scraper rules

- **Server-side only.** Never import `lib/scraper.ts` in any `'use client'` file.
- **Proxy required in production.** `PROXY_URL` must be set. Without it, Instagram blocks the server IP within hours.
- **Rate limit.** Sleep 2–5 seconds between requests with random jitter: `await sleep(2000 + Math.random() * 3000)`
- **Error handling.** Every scrape in try/catch. Log failures, never throw. A failed scrape must not crash the cron job.
- **Never scrape in a request handler.** Only the cron worker calls the scraper. API routes serve stored snapshot data.
- **One exception:** `POST /api/accounts` calls the scraper once immediately to take the first snapshot. This is acceptable because it's a single request and the user is waiting for confirmation.

---

## HTTP error codes

- `200` — success
- `400` — bad input (Zod validation failed)
- `401` — not authenticated
- `402` — plan limit reached (include `upgrade: '/pricing'` in body)
- `403` — forbidden (accessing another user's data)
- `404` — not found
- `429` — rate limited
- `500` — server error (log internally, return generic message to client)

Never expose stack traces to the client.

---

## What NOT to do

- Do not call the scraper from any route handler except `POST /api/accounts` (first snapshot only)
- Do not create `new PrismaClient()` outside `lib/prisma.ts`
- Do not use `getStaticProps` or `getServerSideProps` — App Router only
- Do not expose `PROXY_URL`, `STRIPE_SECRET_KEY`, or `CRON_SECRET` to the client bundle
- Do not skip auth checks on any route that reads or writes user data
- Do not show an empty chart — always show `SnapshotProgress` when `chartReady === false`
- Do not restrict history for any tier — full history is always returned
- Do not allow more than 1 account on the FREE plan under any circumstance

---

## Local development

```bash
npm install
cp .env.example .env
# Fill in DATABASE_URL (Supabase free tier works)
# PROXY_URL can be omitted locally

npx prisma migrate dev
npx prisma generate
npm run dev

# Test scraper
npx ts-node -e "import('./lib/scraper').then(m => m.fetchInstagramProfile('instagram').then(console.log))"

# Run cron manually
npx ts-node worker/index.ts
```

---

## Default assumptions (ask before changing)

- Supabase for database
- Skip proxy for initial local build
- Email magic link only for MVP auth (add Google OAuth in Phase 2)
- Vercel Cron for daily snapshots
- `CHART_UNLOCK_THRESHOLD = 7` snapshots before chart renders

---

## After each phase, output

1. Files created/modified
2. Any PRD deviations and why
3. What is next
4. Any blockers or questions

---

## Phase 2: Meta EYI API (add after Phase 1 is live and stable)

### What it is
Meta's Export Your Information (EYI) API allows users to authorize your app once and have Meta automatically push their Instagram data — including full followers and following lists — to your webhook on a recurring daily basis. This replaces the manual upload flow entirely.

### Apply for access immediately after Phase 1 launch
Do not wait until you are ready to build Phase 2 to apply. Meta's app review takes 4–6 weeks. Apply on launch day so the approval arrives by the time you are ready to build.

Apply at: developers.facebook.com
Scope needed: `instagram_data_portability`
Use case description: "Help users track their own Instagram follower and unfollow history over time using their own data."

### New files to build in Phase 2
- `app/api/eyi/connect/route.ts` — initiates Meta EYI OAuth
- `app/api/eyi/callback/route.ts` — handles OAuth callback, stores metaUserId
- `app/api/eyi/webhook/route.ts` — receives automatic daily data pushes from Meta

### Schema changes for Phase 2
- Add `metaUserId String?` and `eyiConnected Boolean @default(false)` to User model
- Add `source ExportSource @default(MANUAL_UPLOAD)` to DataExport model
- Add `ExportSource` enum with `MANUAL_UPLOAD` and `EYI_AUTO`

### Webhook security
Always verify Meta's `x-hub-signature-256` header before processing any EYI webhook payload. Use `META_APP_SECRET` to validate. Reject any request that fails signature verification with a 401.

### Data flow
1. User clicks "Connect Instagram Data" → redirected to Meta OAuth
2. User approves → callback stores metaUserId, sets eyiConnected = true
3. Meta sends initial full export to webhook endpoint
4. Meta sends daily incremental exports automatically
5. Each delivery: parse → store as DataExport with source EYI_AUTO → diff against previous → send alert if changes

### Do not break Phase 1
Manual upload must continue to work after Phase 2 ships. Some users will not connect via EYI. The `source` field on DataExport distinguishes between the two. Diff logic is identical regardless of source.

### New env vars needed
```
META_APP_ID
META_APP_SECRET  
META_EYI_WEBHOOK_SECRET
```
