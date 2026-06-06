# PRD: instagramfollowerstracker.com
**Version:** 2.0  
**Status:** Ready for development  
**Stack:** Next.js 14 (App Router) · PostgreSQL · Prisma · Node.js cron · Tailwind CSS

---

## 1. Overview

A freemium SaaS tool that tracks follower counts for any public Instagram account over time. Users add an account to monitor, the system snapshots follower counts daily, and displays growth charts and metrics as data accumulates. Public SEO pages with full history are auto-generated for top seeded accounts to drive organic traffic.

### Core value proposition
Instagram shows follower counts in real time but provides zero historical data. This tool fills that gap — for your own account, competitors, influencers, or anyone public. Data collection starts the moment you add an account. The chart builds over time.

### Why this works
- Keyword cluster: "instagram followers tracker" and 6 variants = 3.5M+ searches/month combined, competition index 2/100, 900% YoY growth
- Unfollow detection cluster: "unfollow tracker," "unfollowers track," "ig unfollow tracker" = 110K+/mo, competition index 1 — most underserved keyword group in the dataset
- Data source: public follower count visible on any Instagram profile page without login — one number per request, no private data
- Legal precedent: scraping public logged-out Instagram data ruled not a CFAA violation (Meta v. Bright Data, N.D. Cal. Jan. 2024)
- Monetization gate: account count is the natural freemium limit — not history depth

### The cold start problem (critical UX constraint)
When a user adds any account that is NOT in the seeded top-500 list, there is zero historical data. The chart cannot render. This is the default experience for the majority of users tracking their own account or a niche competitor.

**Solution:** Do not promise a chart on day one for unseeded accounts. Instead:
1. Take a snapshot immediately when the account is added
2. Show the current follower count large and prominently
3. Show a progress indicator: "Snapshot 1 of 7 collected — chart unlocks after 7 snapshots"
4. Send an automated email after snapshot 3: "Your chart is starting to take shape"
5. Send an automated email after snapshot 7: "Your follower chart is ready"

Only the seeded top-500 public accounts show a full chart immediately (Wayback backfill + daily snapshots since launch).

---

## 2. Tier Structure

| Tier | Accounts | History | Unfollow Detection | Alerts | Price |
|---|---|---|---|---|---|
| **Free** | 1 public account | Full history (all snapshots ever collected) | ❌ | ❌ | $0 |
| **Pro** | 10 accounts | Full history | ✅ via Instagram data export upload | ✅ Email alerts | $9/mo |
| **Agency** | 100 accounts | Full history + API access | ✅ + cross-account pattern alerts | ✅ Email + webhook | $49/mo |

### Why full history on all tiers
History depth is not what drives upgrades — account count is. Restricting history on free makes the product feel weak before the user decides to pay. Showing full history for the one free account demonstrates maximum value and makes the "I need to track a second account" realization hit harder and sooner.

### Free tier UX reality
- Free users tracking a non-seeded account will see a single data point on day one, not a chart
- This is honest and expected — communicate it clearly in onboarding
- The chart builds automatically with no action required from the user
- This creates a natural retention loop: users return to watch their chart grow

### Pro tier: unfollow detection via data export
The Instagram Graph API does not expose follower lists — not even for authenticated users. It returns follower *count* only. To deliver "who followed/unfollowed you" the Pro tier uses a compliant workaround:
- User downloads their Instagram data export from Instagram Settings → Your Activity → Download Your Information (JSON format)
- User uploads the export file to the dashboard
- System parses the followers and following lists from the export
- System diffs against the previous upload and shows exactly who followed and unfollowed
- No API required, no ToS violation — it is the user's own data
- This is genuinely differentiated — no current tool does this cleanly

---

## 3. Tech Stack

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

## 4. Database Schema

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
  id               String           @id @default(cuid())
  email            String           @unique
  name             String?
  plan             Plan             @default(FREE)
  stripeCustomerId String?
  stripeSubId      String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  trackedAccounts  TrackedAccount[]
  alerts           Alert[]
  dataExports      DataExport[]
}

enum Plan {
  FREE
  PRO
  AGENCY
}

model TrackedAccount {
  id           String     @id @default(cuid())
  userId       String
  handle       String     // lowercase, no @
  displayName  String?
  avatarUrl    String?
  isPublic     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  lastChecked  DateTime?
  snapshotCount Int       @default(0)  // track progress toward chart unlock
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  snapshots    Snapshot[]
  alerts       Alert[]

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
  id             String          @id @default(cuid())
  handle         String          @unique
  displayName    String?
  avatarUrl      String?
  bio            String?
  category       String?
  followerCount  Int?
  followingCount Int?
  postCount      Int?
  lastChecked    DateTime?
  createdAt      DateTime        @default(now())
  snapshots      PublicSnapshot[]
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

// Pro tier: user-uploaded Instagram data exports for unfollow detection
model DataExport {
  id            String         @id @default(cuid())
  userId        String
  uploadedAt    DateTime       @default(now())
  followerCount Int?
  followingCount Int?
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  followers     ExportFollower[]
  following     ExportFollowing[]
}

model ExportFollower {
  id           String     @id @default(cuid())
  dataExportId String
  handle       String
  displayName  String?
  followedAt   DateTime?  // from export if available
  dataExport   DataExport @relation(fields: [dataExportId], references: [id], onDelete: Cascade)

  @@index([dataExportId])
  @@index([handle])
}

model ExportFollowing {
  id           String     @id @default(cuid())
  dataExportId String
  handle       String
  displayName  String?
  followedAt   DateTime?
  dataExport   DataExport @relation(fields: [dataExportId], references: [id], onDelete: Cascade)

  @@index([dataExportId])
  @@index([handle])
}

model Alert {
  id               String         @id @default(cuid())
  userId           String
  trackedAccountId String
  type             AlertType
  threshold        Int?
  lastTriggered    DateTime?
  createdAt        DateTime       @default(now())
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  trackedAccount   TrackedAccount @relation(fields: [trackedAccountId], references: [id], onDelete: Cascade)
}

enum AlertType {
  SNAPSHOT_MILESTONE  // 3 snapshots, 7 snapshots — triggers onboarding emails
  GAIN_THRESHOLD
  LOSS_THRESHOLD
  DAILY_SUMMARY
  WEEKLY_SUMMARY
}
```

---

## 5. Project File Structure

```
instagramfollowerstracker/
├── app/
│   ├── layout.tsx                # Root layout — fonts, analytics, global metadata
│   ├── page.tsx                  # Homepage: hero + embedded single-account tracker + FAQ
│   ├── pricing/
│   │   └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx            # Auth guard + sidebar
│   │   ├── page.tsx              # Main dashboard
│   │   └── settings/
│   │       └── page.tsx          # Plan, billing, alerts
│   ├── [handle]/
│   │   └── page.tsx              # Public SEO page: /nike, /cristiano
│   ├── sitemap.ts                # Auto-generated XML sitemap
│   ├── robots.ts
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── accounts/
│       │   ├── route.ts                    # GET list, POST add
│       │   └── [id]/
│       │       ├── route.ts                # DELETE
│       │       └── snapshots/route.ts      # GET chart data
│       ├── exports/
│       │   └── route.ts                    # POST upload Instagram data export (Pro)
│       ├── public/
│       │   └── [handle]/route.ts           # GET public account data (no auth)
│       ├── stripe/
│       │   ├── checkout/route.ts
│       │   └── webhook/route.ts
│       └── cron/
│           └── snapshot/route.ts           # Protected, called by Vercel Cron
├── components/
│   ├── tracker/
│   │   ├── AccountCard.tsx           # Account in sidebar: handle, count, change, progress
│   │   ├── AddAccountForm.tsx        # Handle input + add button
│   │   ├── FollowerChart.tsx         # Chart.js line chart
│   │   ├── MetricsRow.tsx            # Current, 24h, 7d, 30d, avg/day
│   │   ├── SnapshotProgress.tsx      # "Snapshot X of 7" progress bar (cold start)
│   │   ├── EmptyChart.tsx            # State shown before 7 snapshots collected
│   │   └── UnfollowDetector.tsx      # Pro: upload export, show diff (Pro only)
│   ├── seo/
│   │   ├── PublicProfileHeader.tsx
│   │   └── PublicFollowerChart.tsx
│   ├── onboarding/
│   │   └── ColdStartBanner.tsx       # "Chart builds over time" explainer
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   └── UpgradeGate.tsx           # Wrapper that shows upgrade prompt at limit
│   └── layout/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── stripe.ts
│   ├── scraper.ts                # Playwright — server-side only
│   ├── wayback.ts                # Wayback CDX API client
│   ├── export-parser.ts          # Parse Instagram JSON data export (Pro feature)
│   └── limits.ts                 # Plan limit constants
├── worker/
│   ├── index.ts
│   ├── snapshot.ts               # Daily snapshot job
│   └── backfill.ts               # Wayback backfill for seeded accounts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                   # Top 500 Instagram accounts
├── .env.example
├── vercel.json
└── package.json
```

---

## 6. Plan Limits

```typescript
// lib/limits.ts

export const PLAN_LIMITS = {
  FREE: {
    maxAccounts: 1,
    historyDays: null,        // null = no limit, full history
    unfollowDetection: false,
    alerts: false,
    apiAccess: false,
  },
  PRO: {
    maxAccounts: 10,
    historyDays: null,
    unfollowDetection: true,  // via Instagram data export upload
    alerts: true,
    apiAccess: false,
  },
  AGENCY: {
    maxAccounts: 100,
    historyDays: null,
    unfollowDetection: true,
    alerts: true,
    apiAccess: true,
  },
} as const;

export const CHART_UNLOCK_THRESHOLD = 7; // snapshots needed before chart renders

export const PLAN_PRICES = {
  PRO: {
    monthly: 9,
    annual: 7,
    stripePriceIdMonthly: 'price_pro_monthly',
    stripePriceIdAnnual: 'price_pro_annual',
  },
  AGENCY: {
    monthly: 49,
    annual: 39,
    stripePriceIdMonthly: 'price_agency_monthly',
    stripePriceIdAnnual: 'price_agency_annual',
  },
};
```

---

## 7. Cold Start UX Flow

This is the default experience for any account NOT in the seeded top-500 list.

```
User adds @theirusername
        │
        ▼
System takes snapshot immediately (followerCount = 84,231)
        │
        ▼
Dashboard shows:
┌─────────────────────────────────────┐
│  @theirusername                     │
│                                     │
│  84,231  followers right now        │
│                                     │
│  ████░░░░░░░░░  Snapshot 1 of 7    │
│  Chart unlocks after 7 snapshots    │
│  Next snapshot in ~23 hours         │
│                                     │
│  We'll email you when your chart    │
│  is ready.                          │
└─────────────────────────────────────┘
        │
        ▼ (after 3 snapshots)
Email: "Your first data points are in — 
        growth trend starting to appear"
        │
        ▼ (after 7 snapshots)
Email: "Your follower chart is ready 🎉"
Chart now renders with 7 data points
```

### Milestone emails (trigger via SNAPSHOT_MILESTONE alert type)
- Snapshot 1: Confirmation email — "Tracking started for @handle. First snapshot taken: 84,231 followers."
- Snapshot 3: "Your chart is starting to take shape — 3 data points collected."
- Snapshot 7: "Your chart is ready — see your follower growth over the past week."

---

## 8. Scraper

```typescript
// lib/scraper.ts
// Playwright-based. Server-side only. Never import in client components.

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
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('web_profile_info') || url.includes('?username=')) {
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

    // Fallback: parse from meta description
    if (followerCount === null) {
      const metaDesc = await page.getAttribute('meta[name="description"]', 'content');
      if (metaDesc) {
        const match = metaDesc.match(/([\d,\.]+[KMB]?)\s+Followers/i);
        if (match) followerCount = parseFollowerString(match[1]);
      }
    }

  } finally {
    await browser.close();
  }

  return { handle, followerCount, followingCount, postCount, displayName, bio, avatarUrl, isPrivate, fetchedAt: new Date() };
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

## 9. Instagram Data Export Parser (Pro Feature)

```typescript
// lib/export-parser.ts
// Parses Instagram's JSON data export to extract follower/following lists
// Users download their export from Instagram Settings → Your Activity → Download Your Information

export interface ExportData {
  followers: ExportPerson[];
  following: ExportPerson[];
}

export interface ExportPerson {
  handle: string;
  displayName?: string;
  followedAt?: Date;
}

export interface UnfollowDiff {
  newFollowers: ExportPerson[];      // in new export, not in previous
  lostFollowers: ExportPerson[];     // in previous export, not in new
  newFollowing: ExportPerson[];      // accounts you newly followed
  unfollowed: ExportPerson[];        // accounts you unfollowed
}

export function parseInstagramExport(fileContent: string): ExportData {
  const data = JSON.parse(fileContent);

  // Instagram export structure varies by version
  // Handle both formats
  const followers: ExportPerson[] = [];
  const following: ExportPerson[] = [];

  // Format 1: { relationships_followers: [{ string_list_data: [{ value, timestamp }] }] }
  const followerData = data.relationships_followers || data.followers_1 || [];
  for (const item of followerData) {
    const entries = item.string_list_data || [];
    for (const entry of entries) {
      if (entry.value) {
        followers.push({
          handle: entry.value.replace(/^@/, '').toLowerCase(),
          followedAt: entry.timestamp ? new Date(entry.timestamp * 1000) : undefined,
        });
      }
    }
  }

  // Format 1: { relationships_following: [...] }
  const followingData = data.relationships_following?.relationships_following || 
                        data.following?.relationships_following || [];
  for (const item of followingData) {
    const entries = item.string_list_data || [];
    for (const entry of entries) {
      if (entry.value) {
        following.push({
          handle: entry.value.replace(/^@/, '').toLowerCase(),
          followedAt: entry.timestamp ? new Date(entry.timestamp * 1000) : undefined,
        });
      }
    }
  }

  return { followers, following };
}

export function diffExports(previous: ExportData, current: ExportData): UnfollowDiff {
  const prevFollowerHandles = new Set(previous.followers.map(f => f.handle));
  const currFollowerHandles = new Set(current.followers.map(f => f.handle));
  const prevFollowingHandles = new Set(previous.following.map(f => f.handle));
  const currFollowingHandles = new Set(current.following.map(f => f.handle));

  return {
    newFollowers:  current.followers.filter(f => !prevFollowerHandles.has(f.handle)),
    lostFollowers: previous.followers.filter(f => !currFollowerHandles.has(f.handle)),
    newFollowing:  current.following.filter(f => !prevFollowingHandles.has(f.handle)),
    unfollowed:    previous.following.filter(f => !currFollowingHandles.has(f.handle)),
  };
}
```

---

## 10. Wayback Machine Backfill

```typescript
// lib/wayback.ts
// Used only during seed/launch to backfill history for top-500 public accounts

export async function getWaybackSnapshots(handle: string, limit = 50) {
  const url = `https://instagram.com/${handle}/`;
  const cdxUrl = `http://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&fl=timestamp,statuscode&filter=statuscode:200&limit=${limit}&from=20200101`;

  const res = await fetch(cdxUrl, { next: { revalidate: 86400 } });
  const rows: string[][] = await res.json();

  const snapshots = [];
  for (const [timestamp] of rows.slice(1)) {
    const archivedUrl = `https://web.archive.org/web/${timestamp}if_/https://www.instagram.com/${handle}/`;
    const followerCount = await extractFollowerCountFromArchive(archivedUrl);
    if (followerCount !== null) {
      snapshots.push({ timestamp: parseWaybackTimestamp(timestamp), followerCount });
    }
    await sleep(1500);
  }
  return snapshots;
}

async function extractFollowerCountFromArchive(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    const m = html.match(/"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
    if (m) return parseInt(m[1]);
    const m2 = html.match(/"follower_count"\s*:\s*(\d+)/);
    if (m2) return parseInt(m2[1]);
    return null;
  } catch { return null; }
}

function parseWaybackTimestamp(ts: string): Date {
  return new Date(`${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)}T${ts.slice(8,10)}:${ts.slice(10,12)}:${ts.slice(12,14)}Z`);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
```

---

## 11. Cron Worker

```typescript
// worker/snapshot.ts

import { PrismaClient } from '@prisma/client';
import { fetchInstagramProfile } from '../lib/scraper';
import { sendMilestoneEmail } from '../lib/email';
import { CHART_UNLOCK_THRESHOLD } from '../lib/limits';

const prisma = new PrismaClient();

export async function runDailySnapshot() {
  // 1. Snapshot all user-tracked accounts
  const trackedAccounts = await prisma.trackedAccount.findMany({
    include: { user: true },
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

        const newCount = account.snapshotCount + 1;

        await prisma.trackedAccount.update({
          where: { id: account.id },
          data: {
            lastChecked: new Date(),
            snapshotCount: newCount,
            displayName: profile.displayName ?? undefined,
            avatarUrl: profile.avatarUrl ?? undefined,
          },
        });

        // Cold start milestone emails
        if (newCount === 1) {
          await sendMilestoneEmail(account.user.email, account.handle, profile.followerCount, 1);
        }
        if (newCount === 3) {
          await sendMilestoneEmail(account.user.email, account.handle, profile.followerCount, 3);
        }
        if (newCount === CHART_UNLOCK_THRESHOLD) {
          await sendMilestoneEmail(account.user.email, account.handle, profile.followerCount, 7);
        }
      }

      await sleep(2000 + Math.random() * 3000);
    } catch (err) {
      console.error(`[snapshot] Failed for @${account.handle}:`, err);
    }
  }

  // 2. Snapshot public SEO accounts
  const publicAccounts = await prisma.publicAccount.findMany();

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
          data: { followerCount: profile.followerCount, lastChecked: new Date() },
        });
      }
      await sleep(2000 + Math.random() * 3000);
    } catch (err) {
      console.error(`[snapshot] Public failed @${account.handle}:`, err);
    }
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
```

---

## 12. API Routes

### POST /api/accounts — Add account
```
Request:  { handle: string }
Response 200: { id, handle, followerCount, snapshotCount: 1, chartReady: false }
Response 402: { error: 'Plan limit reached', limit: 1, upgrade: '/pricing' }
Response 404: { error: 'Account not found or private' }
```
Takes first snapshot immediately on add. Returns `chartReady: false` for unseeded accounts.

### GET /api/accounts — List accounts
```
Response 200: [{
  id, handle, displayName, avatarUrl,
  snapshotCount,
  chartReady: boolean,          // true when snapshotCount >= 7
  latestCount: number | null,
  change24h: number | null,     // null if < 2 snapshots
  change7d: number | null,
  snapshots: [{ takenAt, followerCount }]
}]
```

### GET /api/accounts/[id]/snapshots
```
Response 200: {
  handle,
  chartReady: boolean,
  snapshotCount: number,
  snapshots: [{ takenAt, followerCount }],
  stats: { current, change, changePct, avgDailyGain, peakCount, peakDate } | null
}
```
`stats` is null when chartReady is false.

### POST /api/exports — Upload Instagram data export (Pro only)
```
Request:  multipart/form-data with JSON file
Response 200: {
  uploadId,
  followerCount,
  followingCount,
  diff: {
    newFollowers: [{ handle, displayName }],
    lostFollowers: [{ handle, displayName }],
    newFollowing: [{ handle, displayName }],
    unfollowed: [{ handle, displayName }]
  } | null  // null if first upload (no previous to diff against)
}
Response 402: { error: 'Pro plan required', upgrade: '/pricing' }
```

### GET /api/public/[handle] — Public SEO data (no auth)
```
Response 200: {
  handle, displayName, bio, avatarUrl,
  currentCount, snapshots, stats
}
```

---

## 13. Pages

### Homepage (`/`)
- Hero: H1 = "Instagram Followers Tracker" — paste any username, see live count + progress state
- If unseeded account: show current count + progress bar, not a chart
- If seeded account: show full chart immediately (demo the product)
- Features: Unfollow Tracker, Growth Tracker, Follower Count History, New Followers Tracker
- FAQ: 8 questions targeting long-tail keywords (FAQPage JSON-LD)
- Pricing section
- Footer: grid of top 100 seeded accounts as internal links

### Dashboard (`/dashboard`)
- Sidebar: account list with current count + snapshot progress
- Main: selected account — chart OR cold start progress UI
- Add account button (disabled + upgrade tooltip when at plan limit)
- Pro badge on unfollow detection section

### Public SEO Page (`/[handle]`)
- Only renders for accounts in PublicAccount table (seeded top-500+)
- Full chart with Wayback backfill history
- Profile header, stats, related accounts
- CTA: "Track this account" → sign up

### Pricing (`/pricing`)

| | Free | Pro | Agency |
|---|---|---|---|
| Accounts | 1 | 10 | 100 |
| History | Full | Full | Full |
| Unfollow detection | — | ✅ | ✅ |
| Alerts | — | ✅ | ✅ |
| API | — | — | ✅ |
| Price | $0 | $9/mo | $49/mo |

---

## 14. SEO Strategy

### Keyword groups to own

**Primary (3.5M+/mo, competition index ≤ 3):**
"instagram followers tracker," "ig follower tracker," "instagram follow tracker," "instagram tracker followers," "followers on instagram tracker," "ig follow track"

**Unfollow cluster (110K+/mo, competition index ≤ 9 — most underserved):**
"unfollow tracker," "unfollowers track," "instagram unfollow tracker," "ig unfollow tracker," "track followers and unfollowers on instagram"

**Secondary (5K–50K/mo):**
"instagram follower tracker free," "instagram new followers tracker," "instagram tracking tools," "insta track"

**Long-tail / transactional:**
"best instagram follower tracker app," "instagram follower tracker online free," "free follower tracker for instagram," "instagram growth tracker," "track instagram follower growth"

### Auto-generated public pages
Seed top-500 accounts on launch. Each gets `/[handle]` with full chart.

**Title:** `@{handle} Instagram Followers — Live Count & Growth History`
**Description:** `Track @{handle}'s Instagram follower count over time. Currently {count} followers. See full growth history, daily changes, and trends.`

### FAQ section on homepage (FAQPage JSON-LD)
1. What is the best Instagram follower tracker app?
2. How do I track Instagram follower growth for free?
3. Can I track who unfollowed me on Instagram?
4. Is there a free unfollow tracker for Instagram?
5. How do I see my Instagram follower count history?
6. Is there a website that tracks Instagram followers?
7. How do I track followers and unfollowers on Instagram?
8. Does this work as an Instagram growth tracker?

### Internal linking
- Homepage footer: top 100 seeded accounts
- Each `/[handle]` page: 6 related accounts
- Creates crawlable mesh, every public page ≤ 2 clicks from homepage

---

## 15. Environment Variables

```bash
# .env.example

DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://instagramfollowerstracker.com"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
RESEND_API_KEY="..."
EMAIL_FROM="noreply@instagramfollowerstracker.com"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
PROXY_URL="http://user:pass@proxy.provider.com:port"
CRON_SECRET="..."
NEXT_PUBLIC_APP_URL="https://instagramfollowerstracker.com"
```

---

## 16. Vercel Cron

```json
{
  "crons": [{ "path": "/api/cron/snapshot", "schedule": "0 6 * * *" }]
}
```

---

## 17. Build Phases

### Phase 1 — MVP (Week 1–2)
- [ ] Next.js setup + Prisma schema + DB
- [ ] Auth (email magic link)
- [ ] Add account → immediate first snapshot → cold start UI
- [ ] Scraper (Playwright + proxy)
- [ ] Daily cron + milestone emails
- [ ] Free tier limit enforced (1 account)
- [ ] Deploy

### Phase 2 — Growth (Week 3–4)
- [ ] Stripe (Pro + Agency)
- [ ] Public SEO pages (`/[handle]`)
- [ ] Wayback backfill for top-500 seeded accounts
- [ ] Sitemap + robots.txt
- [ ] Unfollow detection via data export upload (Pro)
- [ ] Email alerts

### Phase 3 — Moat (Month 2+)
- [ ] Cross-account pattern detection (Agency)
- [ ] Fake follower score
- [ ] Agency API endpoints
- [ ] Chrome extension
- [ ] Embeddable widget

---

## 18. Key Decisions & Constraints

**Why 1 account free instead of 3?**
One account creates a faster, cleaner conversion trigger. Any user who wants to track their own account AND a competitor hits the wall on day one. The upgrade reason is immediately obvious.

**Why full history on all tiers?**
History depth does not drive upgrades. Account count does. Restricting history makes the product feel weak before the user decides to pay. Full history for one account demonstrates maximum value and makes the "I need more accounts" realization hit faster.

**Why not promise a chart on day one?**
Only the seeded top-500 accounts have historical data from Wayback backfill. For all other accounts the chart starts empty and builds over 7 days. This is the honest experience. Faking a chart or hiding the product until data exists both hurt conversion. The cold start progress UI turns waiting into engagement.

**Why is unfollow detection a data export feature, not API-based?**
The Instagram Graph API does not expose follower lists for any account, even authenticated ones. It returns follower count only. The user's own Instagram data export (downloadable from Instagram Settings) contains full follower and following lists. Parsing and diffing exports is compliant, accurate, and genuinely differentiated — no current tool does this cleanly.

**Why Playwright over raw HTTP?**
Instagram blocks datacenter IPs on first request, TLS-fingerprints Python's requests library, and rotates internal GraphQL parameters every 2–4 weeks. Playwright with residential proxy mimics a real browser reliably.

**One existential risk:**
If Instagram puts follower counts behind a login wall, the public scraping model breaks. Mitigation: build SEO asset and email list fast. Wayback historical data retains value regardless.

---

## 19. Phase 2: Meta EYI API Integration (Automatic Unfollow Detection)

### What it is
Meta's **Export Your Information (EYI)** API is an official Meta developer program that allows users to authorize a third-party app to receive their Instagram data automatically on a recurring basis. Unlike the Graph API, this includes full followers and following lists. Unlike manual export upload, it requires zero ongoing action from the user after initial authorization.

This is the legitimate, fully compliant path to automatic unfollow detection. No scraping. No ToS risk. Meta built it specifically for this use case.

### How it works
1. User clicks "Connect Instagram Data" in dashboard
2. Meta's EYI OAuth flow opens (similar to standard OAuth)
3. User approves access — one time, ~3 clicks
4. Meta immediately sends full Instagram data export to your registered endpoint
5. Meta automatically pushes updated data daily going forward
6. Your server parses each delivery, diffs against previous, surfaces new followers/unfollowers
7. User sees fresh results every time they log in — no manual action ever required again

### What data Meta sends via EYI
- Full followers list (handle, display name, follow timestamp where available)
- Full following list (handle, display name, follow timestamp where available)
- Posts, stories, reels, likes, DMs (ignore these — only parse followers/following)

### Developer requirements
- Apply for Meta EYI API access at developers.facebook.com
- Describe use case: "Help users track their own Instagram follower changes over time"
- Complete Meta app review process (estimated 4–6 weeks)
- Register a webhook endpoint that Meta pushes data to
- Must be in production (Live mode) — Development mode only works for test accounts

### Implementation

#### Webhook endpoint to receive EYI data pushes
```typescript
// app/api/eyi/webhook/route.ts
// Meta pushes Instagram export data here automatically on recurring schedule

import { NextRequest, NextResponse } from 'next/server';
import { parseInstagramExport, diffExports } from '@/lib/export-parser';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  // Verify the request is from Meta (signature validation)
  const signature = req.headers.get('x-hub-signature-256');
  const body = await req.text();
  
  if (!verifyMetaSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  
  // payload.user_id is Meta's user ID
  // payload.data_url is a signed URL to download the export ZIP
  const { user_id, data_url } = payload;

  // Find the user who authorized this
  const user = await prisma.user.findFirst({
    where: { metaUserId: user_id }
  });
  
  if (!user || user.plan === 'FREE') return NextResponse.json({ ok: true });

  // Download and parse the export
  const exportZip = await fetch(data_url);
  const exportData = await parseInstagramExport(await exportZip.text());

  // Get previous export for diffing
  const previousExport = await prisma.dataExport.findFirst({
    where: { userId: user.id },
    orderBy: { uploadedAt: 'desc' },
    include: { followers: true, following: true }
  });

  // Store new export
  const newExport = await prisma.dataExport.create({
    data: {
      userId: user.id,
      source: 'EYI_AUTO',  // vs 'MANUAL_UPLOAD'
      followerCount: exportData.followers.length,
      followingCount: exportData.following.length,
      followers: { create: exportData.followers },
      following: { create: exportData.following },
    }
  });

  // Compute diff if previous export exists
  if (previousExport) {
    const diff = diffExports(
      { followers: previousExport.followers, following: previousExport.following },
      exportData
    );

    // Send alert email if meaningful changes
    if (diff.lostFollowers.length > 0 || diff.newFollowers.length > 0) {
      await sendUnfollowAlertEmail(user.email, diff);
    }
  }

  return NextResponse.json({ ok: true });
}

function verifyMetaSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const crypto = require('crypto');
  const expected = crypto
    .createHmac('sha256', process.env.META_APP_SECRET!)
    .update(body)
    .digest('hex');
  return `sha256=${expected}` === signature;
}
```

#### Schema additions for EYI
```prisma
// Add to schema.prisma

model User {
  // ... existing fields ...
  metaUserId        String?   // Meta's user ID from EYI OAuth
  eyiConnected      Boolean   @default(false)
  eyiConnectedAt    DateTime?
}

model DataExport {
  // ... existing fields ...
  source    ExportSource  @default(MANUAL_UPLOAD)
}

enum ExportSource {
  MANUAL_UPLOAD   // Phase 1: user manually downloads and uploads
  EYI_AUTO        // Phase 2: Meta pushes automatically via EYI API
}
```

#### EYI OAuth connect flow
```typescript
// app/api/eyi/connect/route.ts
// Initiates Meta EYI OAuth — user clicks "Connect Instagram Data" in Pro dashboard

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect('/login');
  
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/eyi/callback`,
    scope: 'instagram_data_portability',  // EYI-specific scope
    state: session.user.id,
    response_type: 'code',
  });

  return NextResponse.redirect(
    `https://www.facebook.com/dialog/oauth?${params.toString()}`
  );
}
```

### UX: Phase 1 → Phase 2 upgrade path

**Phase 1 (manual upload) state in Pro dashboard:**
```
┌─────────────────────────────────────────────────┐
│  Unfollow Detector                    [PRO]      │
│                                                  │
│  See exactly who followed and unfollowed you.    │
│                                                  │
│  How it works:                                   │
│  1. Go to Instagram → Settings → Your Activity  │
│     → Download Your Information                  │
│  2. Request JSON format                          │
│  3. Download the ZIP when ready (24–48 hrs)      │
│  4. Upload it here                               │
│                                                  │
│  [Upload Instagram Export]                       │
│                                                  │
│  ⚡ Upgrade tip: Connect once for automatic      │
│     daily updates — no more manual uploads.      │
│     Coming soon.                                 │
└─────────────────────────────────────────────────┘
```

**Phase 2 (EYI connected) state:**
```
┌─────────────────────────────────────────────────┐
│  Unfollow Detector          ✓ Auto-syncing [PRO] │
│                                                  │
│  Last updated: 2 hours ago                       │
│                                                  │
│  Since your last sync:                           │
│  +12 new followers                               │
│  -3 unfollowers: @handle1, @handle2, @handle3   │
│  +2 new following                                │
│  -1 unfollowed: @handle4                         │
│                                                  │
│  [View Full Diff]  [View History]                │
└─────────────────────────────────────────────────┘
```

### Migration path for Phase 1 users
When EYI is approved and live, send email to all Pro users:
> "Good news — Unfollow Detector just got automatic. Connect your Instagram once and we'll update your data daily with zero effort. Takes 30 seconds."

Users who have manual uploads already have historical data. EYI connects forward from that point. No data is lost.

### Environment variables to add for Phase 2
```bash
META_APP_ID="..."
META_APP_SECRET="..."
META_EYI_WEBHOOK_SECRET="..."
```

### Timeline estimate
- Apply for Meta EYI API access: Week 1 of Phase 2 sprint
- App review turnaround: 4–6 weeks (apply immediately after Phase 1 launch)
- Build webhook + OAuth flow: 1 week engineering
- Ship to Pro users: ~6–8 weeks after launch

### Why this is the right long-term architecture
Every competitor in this space either scrapes (fragile, ToS risk) or asks users to manually upload exports (high friction, low retention). The EYI integration is the only compliant path to automatic, reliable, recurring follower/unfollow data. Once approved it becomes a durable moat — competitors have to go through the same 4–6 week review process to match it.
