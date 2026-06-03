# PRD: instagramfollowerstracker.com
**Version:** 1.0  
**Status:** Ready for development  
**Stack:** Next.js 14 (App Router) · PostgreSQL · Prisma · Node.js cron · Tailwind CSS

---

## 1. Overview

A freemium SaaS tool that tracks follower counts for any public Instagram account over time. Users add accounts to monitor, the system snapshots follower counts daily, and displays growth charts and metrics. Public SEO pages are auto-generated for top accounts to drive organic traffic.

### Core value proposition
Instagram shows follower counts in real time but provides zero historical data. This tool fills that gap — for your own account, competitors, influencers, or anyone public.

### Why this works
- Keyword cluster: "instagram followers tracker" and 6 variants = 500K searches/month, competition index 2/100, 900% YoY growth
- Data source: public follower count visible on any Instagram profile page without login — one number per request, no private data
- Legal precedent: scraping public logged-out Instagram data ruled not a CFAA violation (Meta v. Bright Data, N.D. Cal. Jan. 2024)
- Monetization gate: history depth + account volume = natural freemium limits

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Database | PostgreSQL (via Supabase or Railway) |
| ORM | Prisma |
| Auth | NextAuth.js (email magic link + Google OAuth) |
| Cron | Node.js cron job (separate worker process or Vercel Cron) |
| Scraping | Playwright (headless Chromium) with rotating residential proxies |
| Email | Resend |
| Payments | Stripe |
| Hosting | Vercel (frontend + API) + Railway or Render (cron worker) |
| Analytics | Posthog |

---

## 3. Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  plan          Plan      @default(FREE)
  stripeCustomerId String?
  stripeSubId   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  trackedAccounts TrackedAccount[]
  alerts        Alert[]
}

enum Plan {
  FREE
  PRO
  AGENCY
}

model TrackedAccount {
  id          String     @id @default(cuid())
  userId      String
  handle      String     // lowercase, no @
  displayName String?
  avatarUrl   String?
  isPublic    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  lastChecked DateTime?
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  snapshots   Snapshot[]
  alerts      Alert[]

  @@unique([userId, handle])
  @@index([handle])
}

model Snapshot {
  id               String         @id @default(cuid())
  trackedAccountId String
  followerCount    Int
  followingCount   Int?
  postCount        Int?
  takenAt          DateTime       @default(now())
  trackedAccount   TrackedAccount @relation(fields: [trackedAccountId], references: [id], onDelete: Cascade)

  @@index([trackedAccountId, takenAt])
}

// Public accounts tracked for SEO pages (no user association)
model PublicAccount {
  id            String     @id @default(cuid())
  handle        String     @unique
  displayName   String?
  avatarUrl     String?
  bio           String?
  category      String?
  followerCount Int?
  followingCount Int?
  postCount     Int?
  lastChecked   DateTime?
  createdAt     DateTime   @default(now())
  snapshots     PublicSnapshot[]
}

model PublicSnapshot {
  id              String        @id @default(cuid())
  publicAccountId String
  followerCount   Int
  followingCount  Int?
  postCount       Int?
  takenAt         DateTime      @default(now())
  publicAccount   PublicAccount @relation(fields: [publicAccountId], references: [id], onDelete: Cascade)

  @@index([publicAccountId, takenAt])
}

model Alert {
  id               String         @id @default(cuid())
  userId           String
  trackedAccountId String
  type             AlertType
  threshold        Int?           // e.g. lose/gain N followers
  lastTriggered    DateTime?
  createdAt        DateTime       @default(now())
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  trackedAccount   TrackedAccount @relation(fields: [trackedAccountId], references: [id], onDelete: Cascade)
}

enum AlertType {
  GAIN_THRESHOLD
  LOSS_THRESHOLD
  DAILY_SUMMARY
}
```

---

## 4. Project File Structure

```
instagramfollowerstracker/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, analytics)
│   ├── page.tsx                  # Homepage / marketing + embedded tool
│   ├── dashboard/
│   │   ├── layout.tsx            # Auth guard + sidebar
│   │   ├── page.tsx              # Dashboard home (account list + charts)
│   │   └── settings/
│   │       └── page.tsx          # Plan, billing, alerts
│   ├── [handle]/
│   │   └── page.tsx              # Public SEO page: /nike, /cristiano
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/route.ts
│   │   ├── accounts/
│   │   │   ├── route.ts          # GET (list), POST (add account)
│   │   │   └── [id]/
│   │   │       ├── route.ts      # DELETE
│   │   │       └── snapshots/route.ts  # GET snapshots for chart
│   │   ├── public/
│   │   │   └── [handle]/route.ts # GET public account data (no auth)
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts
│   │   │   └── webhook/route.ts
│   │   └── cron/
│   │       └── snapshot/route.ts # Called by Vercel Cron (protected)
├── components/
│   ├── tracker/
│   │   ├── AccountCard.tsx
│   │   ├── AddAccountForm.tsx
│   │   ├── FollowerChart.tsx
│   │   ├── MetricsRow.tsx
│   │   └── EmptyState.tsx
│   ├── seo/
│   │   ├── PublicProfileHeader.tsx
│   │   └── PublicFollowerChart.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Modal.tsx
│   └── layout/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   ├── stripe.ts                 # Stripe client + plan helpers
│   ├── scraper.ts                # Playwright scraper (follower count fetch)
│   ├── wayback.ts                # Wayback Machine CDX API client
│   └── limits.ts                 # Plan limit constants
├── worker/
│   ├── index.ts                  # Cron worker entry point
│   ├── snapshot.ts               # Daily snapshot job
│   └── backfill.ts               # Wayback Machine historical backfill
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                   # Seed top 500 public accounts
├── .env.example
├── vercel.json                   # Cron config
└── package.json
```

---

## 5. Plan Limits

```typescript
// lib/limits.ts

export const PLAN_LIMITS = {
  FREE: {
    maxAccounts: 3,
    historyDays: 30,
    updateFrequency: 'daily',
    alerts: false,
    apiAccess: false,
    publicPages: true,
  },
  PRO: {
    maxAccounts: 25,
    historyDays: 365,
    updateFrequency: 'daily',
    alerts: true,
    apiAccess: false,
    publicPages: true,
  },
  AGENCY: {
    maxAccounts: 200,
    historyDays: 9999, // all time
    updateFrequency: 'daily',
    alerts: true,
    apiAccess: true,
    publicPages: true,
  },
} as const;

export const PLAN_PRICES = {
  PRO: { monthly: 9, annual: 7, stripePriceIdMonthly: 'price_pro_monthly', stripePriceIdAnnual: 'price_pro_annual' },
  AGENCY: { monthly: 49, annual: 39, stripePriceIdMonthly: 'price_agency_monthly', stripePriceIdAnnual: 'price_agency_annual' },
};
```

---

## 6. Scraper

```typescript
// lib/scraper.ts
// Uses Playwright to fetch follower count from public Instagram profile page
// Run server-side only — never in browser/client code

import { chromium } from 'playwright';

export interface InstagramProfileData {
  handle: string;
  followerCount: number | null;
  followingCount: number | null;
  postCount: number | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  fetchedAt: Date;
}

export async function fetchInstagramProfile(handle: string): Promise<InstagramProfileData> {
  // Proxy config: set PROXY_URL in env (e.g. residential proxy endpoint)
  const proxyUrl = process.env.PROXY_URL;

  const browser = await chromium.launch({
    proxy: proxyUrl ? { server: proxyUrl } : undefined,
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  let followerCount: number | null = null;
  let followingCount: number | null = null;
  let postCount: number | null = null;
  let displayName: string | null = null;
  let bio: string | null = null;
  let avatarUrl: string | null = null;
  let isPrivate = false;

  try {
    // Intercept JSON responses that contain profile data
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('instagram.com/api/v1/users/web_profile_info') || url.includes('?username=')) {
        try {
          const json = await response.json();
          const user = json?.data?.user;
          if (user) {
            followerCount = user.edge_followed_by?.count ?? user.follower_count ?? null;
            followingCount = user.edge_follow?.count ?? user.following_count ?? null;
            postCount = user.edge_owner_to_timeline_media?.count ?? user.media_count ?? null;
            displayName = user.full_name ?? null;
            bio = user.biography ?? null;
            avatarUrl = user.profile_pic_url_hd ?? user.profile_pic_url ?? null;
            isPrivate = user.is_private ?? false;
          }
        } catch {}
      }
    });

    await page.goto(`https://www.instagram.com/${handle}/`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Fallback: parse from meta tags if JSON intercept missed
    if (followerCount === null) {
      const metaDesc = await page.getAttribute('meta[name="description"]', 'content');
      if (metaDesc) {
        const match = metaDesc.match(/([\d,\.]+[KMB]?)\s+Followers/i);
        if (match) {
          followerCount = parseFollowerString(match[1]);
        }
      }
    }

  } finally {
    await browser.close();
  }

  return {
    handle,
    followerCount,
    followingCount,
    postCount,
    displayName,
    bio,
    avatarUrl,
    isPrivate,
    fetchedAt: new Date(),
  };
}

function parseFollowerString(str: string): number {
  const cleaned = str.replace(/,/g, '');
  if (cleaned.endsWith('K')) return Math.round(parseFloat(cleaned) * 1000);
  if (cleaned.endsWith('M')) return Math.round(parseFloat(cleaned) * 1000000);
  if (cleaned.endsWith('B')) return Math.round(parseFloat(cleaned) * 1000000000);
  return parseInt(cleaned, 10);
}
```

---

## 7. Wayback Machine Backfill

```typescript
// lib/wayback.ts
// Fetches historical follower count snapshots from Wayback Machine CDX API
// Used to backfill history for public SEO pages on launch

export interface WaybackSnapshot {
  timestamp: Date;
  followerCount: number | null;
}

export async function getWaybackSnapshots(handle: string, limit = 50): Promise<WaybackSnapshot[]> {
  const url = `https://instagram.com/${handle}/`;
  const cdxUrl = `http://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&fl=timestamp,statuscode&filter=statuscode:200&limit=${limit}&from=20200101`;

  const res = await fetch(cdxUrl, { next: { revalidate: 86400 } });
  const rows: string[][] = await res.json();

  // First row is header
  const snapshots: WaybackSnapshot[] = [];
  for (const [timestamp] of rows.slice(1)) {
    const archivedUrl = `https://web.archive.org/web/${timestamp}if_/https://www.instagram.com/${handle}/`;
    const followerCount = await extractFollowerCountFromArchive(archivedUrl);
    if (followerCount !== null) {
      snapshots.push({
        timestamp: parseWaybackTimestamp(timestamp),
        followerCount,
      });
    }
    // Rate limit: don't hammer Wayback
    await sleep(1500);
  }

  return snapshots;
}

async function extractFollowerCountFromArchive(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const html = await res.text();

    // Try JSON embedded in page
    const jsonMatch = html.match(/"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
    if (jsonMatch) return parseInt(jsonMatch[1]);

    const jsonMatch2 = html.match(/"follower_count"\s*:\s*(\d+)/);
    if (jsonMatch2) return parseInt(jsonMatch2[1]);

    return null;
  } catch {
    return null;
  }
}

function parseWaybackTimestamp(ts: string): Date {
  // Format: YYYYMMDDHHmmss
  return new Date(
    `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)}T${ts.slice(8,10)}:${ts.slice(10,12)}:${ts.slice(12,14)}Z`
  );
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 8. Cron Worker

```typescript
// worker/snapshot.ts
// Run this daily: processes all tracked accounts + public accounts

import { PrismaClient } from '@prisma/client';
import { fetchInstagramProfile } from '../lib/scraper';
import { sendAlertEmail } from '../lib/email';

const prisma = new PrismaClient();

export async function runDailySnapshot() {
  console.log(`[snapshot] Starting daily run at ${new Date().toISOString()}`);

  // 1. Snapshot all user-tracked accounts
  const trackedAccounts = await prisma.trackedAccount.findMany({
    include: {
      user: true,
      snapshots: { orderBy: { takenAt: 'desc' }, take: 1 },
    },
  });

  for (const account of trackedAccounts) {
    try {
      const profile = await fetchInstagramProfile(account.handle);

      if (profile.followerCount !== null) {
        await prisma.snapshot.create({
          data: {
            trackedAccountId: account.id,
            followerCount: profile.followerCount,
            followingCount: profile.followingCount ?? undefined,
            postCount: profile.postCount ?? undefined,
          },
        });

        await prisma.trackedAccount.update({
          where: { id: account.id },
          data: {
            lastChecked: new Date(),
            displayName: profile.displayName ?? undefined,
            avatarUrl: profile.avatarUrl ?? undefined,
          },
        });

        // Check alerts
        await checkAndSendAlerts(account, profile.followerCount);
      }

      // Respect rate limits
      await sleep(2000 + Math.random() * 3000);

    } catch (err) {
      console.error(`[snapshot] Failed for @${account.handle}:`, err);
    }
  }

  // 2. Snapshot public SEO accounts
  const publicAccounts = await prisma.publicAccount.findMany({
    orderBy: { followerCount: 'desc' },
  });

  for (const account of publicAccounts) {
    try {
      const profile = await fetchInstagramProfile(account.handle);

      if (profile.followerCount !== null) {
        await prisma.publicSnapshot.create({
          data: {
            publicAccountId: account.id,
            followerCount: profile.followerCount,
            followingCount: profile.followingCount ?? undefined,
            postCount: profile.postCount ?? undefined,
          },
        });

        await prisma.publicAccount.update({
          where: { id: account.id },
          data: {
            followerCount: profile.followerCount,
            lastChecked: new Date(),
          },
        });
      }

      await sleep(2000 + Math.random() * 3000);
    } catch (err) {
      console.error(`[snapshot] Public account failed @${account.handle}:`, err);
    }
  }

  console.log(`[snapshot] Daily run complete`);
}

async function checkAndSendAlerts(account: any, newCount: number) {
  const alerts = await prisma.alert.findMany({
    where: { trackedAccountId: account.id },
    include: { user: true },
  });

  for (const alert of alerts) {
    if (alert.type === 'DAILY_SUMMARY') {
      // Always send daily summary
      await sendAlertEmail(alert.user.email, account.handle, newCount, alert.type);
    }

    if (alert.threshold && (alert.type === 'GAIN_THRESHOLD' || alert.type === 'LOSS_THRESHOLD')) {
      const lastSnap = account.snapshots[0];
      if (!lastSnap) continue;
      const diff = newCount - lastSnap.followerCount;

      if (alert.type === 'GAIN_THRESHOLD' && diff >= alert.threshold) {
        await sendAlertEmail(alert.user.email, account.handle, newCount, alert.type, diff);
        await prisma.alert.update({ where: { id: alert.id }, data: { lastTriggered: new Date() } });
      }
      if (alert.type === 'LOSS_THRESHOLD' && Math.abs(diff) >= alert.threshold && diff < 0) {
        await sendAlertEmail(alert.user.email, account.handle, newCount, alert.type, diff);
        await prisma.alert.update({ where: { id: alert.id }, data: { lastTriggered: new Date() } });
      }
    }
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 9. API Routes

### POST /api/accounts — Add account to track

```typescript
// Validate handle, check plan limits, fetch initial count, create record

Request body: { handle: string }

Response 200: { id, handle, followerCount, snapshots: [] }
Response 400: { error: 'Invalid handle' }
Response 402: { error: 'Plan limit reached', limit: 3, upgrade: '/pricing' }
Response 404: { error: 'Account not found or private' }
```

### GET /api/accounts — List user's tracked accounts

```typescript
// Returns accounts with latest snapshot for each

Response 200: [{
  id, handle, displayName, avatarUrl,
  latestCount: number,
  change24h: number,
  change7d: number,
  change30d: number,
  snapshots: [{ takenAt, followerCount }]  // respects plan history limit
}]
```

### GET /api/accounts/[id]/snapshots — Chart data

```typescript
Query: ?days=30&granularity=daily

Response 200: {
  handle,
  snapshots: [{ takenAt: string, followerCount: number }],
  stats: {
    current: number,
    change: number,
    changePct: number,
    avgDailyGain: number,
    peakCount: number,
    peakDate: string,
  }
}
```

### GET /api/public/[handle] — Public SEO data (no auth)

```typescript
Response 200: {
  handle,
  displayName,
  bio,
  avatarUrl,
  currentCount: number,
  snapshots: [{ takenAt, followerCount }],  // last 90 days
  stats: { ... }
}
Response 404: { error: 'Not found' }
```

---

## 10. Pages

### Homepage (`/`)

- Hero: headline + username input (add to tracker without signup)
- If not logged in: show demo chart with fake data, prompt to sign up
- Features section: what you can track
- Pricing section (3 tiers)
- Footer with SEO links to top 50 public account pages

### Dashboard (`/dashboard`)

- Left sidebar: list of tracked accounts (name + current count + 24h change)
- Main area: selected account chart (30/90/365 day toggle)
- Metrics row: current, 24h change, 7d change, 30d change, avg/day
- Add account button (disabled + tooltip at plan limit)
- Upgrade banner when near limit

### Public SEO Page (`/[handle]`)

- No auth required
- Profile header: avatar, name, bio, current follower count
- Growth chart (all available history)
- Stats: total growth, growth rate, estimated monthly gain
- CTA: "Track this account" → sign up
- Related accounts section (same follower tier)
- Schema.org structured data for SEO

### Pricing (`/pricing`)

| | Free | Pro | Agency |
|---|---|---|---|
| Accounts | 3 | 25 | 200 |
| History | 30 days | 1 year | All time |
| Alerts | — | ✓ | ✓ |
| API access | — | — | ✓ |
| Price | $0 | $9/mo | $49/mo |

---

## 11. SEO Strategy

### Auto-generated public pages

Seed `PublicAccount` table on launch with top 500 Instagram accounts by follower count. Each gets a public page at `instagramfollowerstracker.com/[handle]`.

**Page title format:** `@[handle] Instagram Followers — Live Count & Growth History`  
**Meta description:** `Track @[handle]'s Instagram follower count over time. Current count: [X]. See growth history, daily changes, and trends.`

### Programmatic SEO targets
- `[username] instagram followers` — highest volume
- `how many followers does [username] have` — question intent
- `[username] instagram follower count` — direct lookup intent

### Sitemap
Auto-generate `/sitemap.xml` listing all public account pages. Update weekly.

### Internal linking
Homepage footer links to top 50 accounts. Each public page links to 6 related accounts (similar follower count tier).

---

## 12. Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://instagramfollowerstracker.com"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Email (Resend)
RESEND_API_KEY="..."
EMAIL_FROM="noreply@instagramfollowerstracker.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Proxy (residential proxy for scraper)
PROXY_URL="http://user:pass@proxy.provider.com:port"

# Cron security
CRON_SECRET="..."

# App
NEXT_PUBLIC_APP_URL="https://instagramfollowerstracker.com"
```

---

## 13. Vercel Cron Config

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/snapshot",
      "schedule": "0 6 * * *"
    }
  ]
}
```

The `/api/cron/snapshot` route must validate `Authorization: Bearer ${CRON_SECRET}` before running.

---

## 14. Build Phases

### Phase 1 — MVP (Week 1–2)
- [ ] Next.js project setup + Prisma schema + DB
- [ ] Auth (NextAuth, email magic link)
- [ ] Core UI: add account, account list, chart
- [ ] Scraper (Playwright, basic proxy support)
- [ ] Daily cron snapshot job
- [ ] Free tier limits enforced
- [ ] Deploy to Vercel + Railway

### Phase 2 — Growth (Week 3–4)
- [ ] Stripe integration (Pro + Agency plans)
- [ ] Public SEO pages (`/[handle]`)
- [ ] Wayback Machine backfill for top 500 accounts
- [ ] Auto-sitemap
- [ ] Email alerts (daily summary + threshold)
- [ ] Seed top 500 public accounts

### Phase 3 — Moat (Month 2+)
- [ ] Anomaly detection (spike/drop alerts)
- [ ] Fake follower score (growth pattern analysis)
- [ ] Competitor comparison sets
- [ ] Agency API endpoints
- [ ] Embeddable widget (iframe)
- [ ] Chrome extension (show follower history inline on Instagram)

---

## 15. Key Decisions & Constraints

**Why not use Instagram's official API?**  
The Graph API only works for Business/Creator accounts that explicitly authorize your app. It cannot fetch data for arbitrary public accounts. The Basic Display API was shut down Dec 4, 2024.

**Why Playwright over raw HTTP scraping?**  
Instagram's anti-bot measures block datacenter IPs on first request, TLS-fingerprint Python's `requests` library, and rotate internal API parameters every 2–4 weeks. Playwright with a residential proxy mimics a real browser and is far more resilient.

**What if Instagram requires login to see follower counts?**  
This is the one existential risk. Mitigation: build SEO asset and email list fast so the audience exists regardless of data source. Wayback historical data retains value. Monitor for login wall — if it happens, pivot to "connect your own account" model using official Graph API for user's own data.

**Why store snapshots instead of computing on the fly?**  
Historical data cannot be reconstructed. Storing every daily snapshot is cheap (one INT per account per day) and gives us the full time series. At 10,000 tracked accounts, that's 3.65M rows/year — trivial for PostgreSQL.

**CORS proxy vs. server-side scraping?**  
All scraping happens server-side (cron worker). The browser never touches Instagram. Public CORS proxies are only used in the MVP demo widget — production replaces this with real server data.
