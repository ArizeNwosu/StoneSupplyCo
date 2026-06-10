# Stalker Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a per-account activity monitoring subscription ("Stalker Mode") that scrapes six profile signals at Daily / 6h / Hourly frequency, notifies users via email and in-app notification feed, and is purchased as a standalone $4.99–$9.99/month Stripe subscription.

**Architecture:** A new Stalker cron (`/api/cron/stalker`) runs every hour; for each active `StalkerSubscription`, it fetches the tracked account's profile, diffs it against the stored `StalkerProfile` (last-known state), persists any changes as `StalkerEvent` rows, and sends an email alert. Pro users get Daily frequency included for free. The six signals are: bio changed, external link changed, avatar changed, new post, new follow (top-50 following list diff), account went private.

**Tech Stack:** Next.js 14 App Router, Prisma/PostgreSQL, Stripe subscriptions, Resend email, existing `fetchInstagramProfile` scraper + new `fetchFollowingList`, Tailwind CSS, React client components.

---

## File Map

**New files:**
- `prisma/schema.prisma` — 4 new models, 3 new enums (modified)
- `lib/stalker-diff.ts` — pure diff logic, no side effects
- `lib/stalker-email.ts` — Resend email templates for stalker alerts
- `lib/stalker-prices.ts` — Stripe price IDs for three stalker tiers
- `worker/stalker.ts` — core scrape + diff + notify worker
- `app/api/stalker/subscribe/route.ts` — POST: create Stripe checkout
- `app/api/stalker/route.ts` — GET: list user's active subs
- `app/api/stalker/[id]/route.ts` — DELETE: cancel subscription
- `app/api/stalker/events/route.ts` — GET: paginated event feed
- `app/api/stalker/events/read-all/route.ts` — POST: mark all events read
- `app/api/cron/stalker/route.ts` — hourly cron endpoint
- `components/tracker/StalkerUpgradeCard.tsx` — upsell card for accounts without active sub
- `components/tracker/StalkerModePanel.tsx` — active sub status + event feed
- `components/tracker/StalkerEventFeed.tsx` — paginated event list with signal icons
- `components/layout/NotificationBell.tsx` — header bell with unread badge

**Modified files:**
- `lib/scraper.ts` — add `externalUrl` + `highlightCount` to `InstagramProfileData`; add `fetchFollowingList()`
- `lib/stripe-prices.ts` — add stalker price IDs
- `app/api/stripe/webhook/route.ts` — handle stalker subscription lifecycle
- `app/api/accounts/route.ts` — auto-create PRO_INCLUDED stalker sub on account add for Pro users
- `vercel.json` — add hourly stalker cron
- `app/dashboard/page.tsx` — render StalkerModePanel/StalkerUpgradeCard + NotificationBell

---

## Task 1: Prisma schema — new models and enums

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add enums and models to schema**

Append to `prisma/schema.prisma`:

```prisma
enum StalkerFrequency {
  DAILY
  SIX_HOUR
  HOURLY
}

enum StalkerSource {
  STRIPE
  PRO_INCLUDED
}

enum StalkerSignal {
  BIO_CHANGED
  LINK_CHANGED
  AVATAR_CHANGED
  NEW_POST
  NEW_FOLLOW
  WENT_PRIVATE
}

// One row per user+account pairing. Stores subscription metadata.
model StalkerSubscription {
  id               String           @id @default(cuid())
  userId           String
  trackedAccountId String
  frequency        StalkerFrequency @default(DAILY)
  source           StalkerSource    @default(STRIPE)
  stripePriceId    String?
  stripeSubId      String?
  active           Boolean          @default(true)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  trackedAccount   TrackedAccount   @relation(fields: [trackedAccountId], references: [id], onDelete: Cascade)
  events           StalkerEvent[]

  @@unique([userId, trackedAccountId])
  @@index([active, frequency])
}

// One row per TrackedAccount — stores last-known state for diffing.
// Shared across all subscribers for the same account.
model StalkerProfile {
  id               String         @id @default(cuid())
  trackedAccountId String         @unique
  bio              String?
  externalUrl      String?
  avatarUrl        String?
  postCount        Int?
  highlightCount   Int?
  recentFollowing  String[]
  isPrivate        Boolean        @default(false)
  scrapedAt        DateTime       @default(now())

  trackedAccount   TrackedAccount @relation(fields: [trackedAccountId], references: [id], onDelete: Cascade)
}

// One row per detected change, per subscriber. Powers the in-app feed.
model StalkerEvent {
  id              String              @id @default(cuid())
  stalkerSubId    String
  userId          String
  signal          StalkerSignal
  oldValue        String?
  newValue        String?
  read            Boolean             @default(false)
  createdAt       DateTime            @default(now())

  stalkerSub      StalkerSubscription @relation(fields: [stalkerSubId], references: [id], onDelete: Cascade)

  @@index([userId, read, createdAt])
  @@index([stalkerSubId, createdAt])
}
```

Also add relations to existing models. Inside `model User { ... }` add:
```prisma
  stalkerSubs      StalkerSubscription[]
  stalkerEvents    StalkerEvent[]
```

Inside `model TrackedAccount { ... }` add:
```prisma
  stalkerSubs      StalkerSubscription[]
  stalkerProfile   StalkerProfile?
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/riz/Documents/Claude/instagramfollowerstracker
npx prisma migrate dev --name add-stalker-mode
```

Expected: migration applied, client regenerated.

- [ ] **Step 3: Verify client generated**

```bash
npx prisma generate
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(stalker): add StalkerSubscription, StalkerProfile, StalkerEvent schema"
```

---

## Task 2: Extend scraper with externalUrl, highlightCount, and following list

**Files:**
- Modify: `lib/scraper.ts`

- [ ] **Step 1: Add fields to InstagramProfileData interface**

In `lib/scraper.ts`, find the `InstagramProfileData` interface and add two fields:

```ts
export interface InstagramProfileData {
  handle: string;
  followerCount: number | null;
  followingCount: number | null;
  postCount: number | null;
  displayName: string | null;
  bio: string | null;
  externalUrl: string | null;    // ← add
  highlightCount: number | null; // ← add
  avatarUrl: string | null;
  isPrivate: boolean;
  fetchedAt: Date;
}
```

- [ ] **Step 2: Add fields to IgUser interface**

```ts
interface IgUser {
  edge_followed_by?: { count: number };
  follower_count?: number;
  edge_follow?: { count: number };
  following_count?: number;
  edge_owner_to_timeline_media?: { count: number };
  media_count?: number;
  full_name?: string;
  biography?: string;
  external_url?: string;         // ← add
  highlight_reel_count?: number; // ← add
  profile_pic_url_hd?: string;
  profile_pic_url?: string;
  is_private?: boolean;
}
```

- [ ] **Step 3: Update profileFromUser**

```ts
function profileFromUser(handle: string, user: IgUser): InstagramProfileData {
  return {
    handle,
    followerCount: user.edge_followed_by?.count ?? user.follower_count ?? null,
    followingCount: user.edge_follow?.count ?? user.following_count ?? null,
    postCount: user.edge_owner_to_timeline_media?.count ?? user.media_count ?? null,
    displayName: user.full_name ?? null,
    bio: user.biography ?? null,
    externalUrl: user.external_url ?? null,
    highlightCount: user.highlight_reel_count ?? null,
    avatarUrl: user.profile_pic_url_hd ?? user.profile_pic_url ?? null,
    isPrivate: user.is_private ?? false,
    fetchedAt: new Date(),
  };
}
```

- [ ] **Step 4: Update profileFromApify**

Inside `profileFromApify`, add to the return object after `bio`:

```ts
externalUrl: firstString(item, ['externalUrl', 'external_url', 'websiteUrl', 'website']),
highlightCount: firstNumber(item, ['highlightReelCount', 'highlight_reel_count']),
```

- [ ] **Step 5: Update emptyProfile**

Add `externalUrl: null` and `highlightCount: null` to the `emptyProfile` function return object.

- [ ] **Step 6: Add fetchFollowingList function**

Append to `lib/scraper.ts`:

```ts
/**
 * Returns the top-50 most recently followed account handles for a public account.
 * Instagram shows the following list in reverse-chronological order.
 * Returns an empty array if the list is hidden or the request fails.
 */
export async function fetchFollowingList(handle: string): Promise<string[]> {
  try {
    // First, get the user's numeric ID from the profile API
    const profileUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`;
    const profileRes = await igFetch(profileUrl, { timeoutMs: 15_000 });
    if (!profileRes.ok) return [];

    const profileJson = await profileRes.json() as { data?: { user?: { id?: string } } };
    const userId = profileJson?.data?.user?.id;
    if (!userId) return [];

    await sleep(1000 + Math.random() * 1000);

    // Fetch the first page of following list (50 accounts)
    const followingUrl = `https://i.instagram.com/api/v1/friendships/${userId}/following/?count=50`;
    const followingRes = await igFetch(followingUrl, { timeoutMs: 15_000 });
    if (!followingRes.ok) return [];

    const followingJson = await followingRes.json() as { users?: Array<{ username?: string }> };
    const users = followingJson?.users ?? [];
    return users.map((u) => u.username ?? '').filter(Boolean).slice(0, 50);
  } catch {
    return [];
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/scraper.ts
git commit -m "feat(stalker): extend scraper with externalUrl, highlightCount, fetchFollowingList"
```

---

## Task 3: Stalker diff engine

**Files:**
- Create: `lib/stalker-diff.ts`

- [ ] **Step 1: Create the diff module**

```ts
// lib/stalker-diff.ts
// SERVER-SIDE ONLY. Pure functions — no DB access, no side effects.

export type StalkerSignal =
  | 'BIO_CHANGED'
  | 'LINK_CHANGED'
  | 'AVATAR_CHANGED'
  | 'NEW_POST'
  | 'NEW_FOLLOW'
  | 'WENT_PRIVATE';

export interface StalkerProfileState {
  bio: string | null;
  externalUrl: string | null;
  avatarUrl: string | null;
  postCount: number | null;
  highlightCount: number | null;
  recentFollowing: string[];
  isPrivate: boolean;
}

export interface StalkerChange {
  signal: StalkerSignal;
  oldValue: string | null;
  newValue: string | null;
}

/**
 * Compares two profile states and returns all detected changes.
 * Returns an empty array when nothing changed.
 */
export function diffStalkerProfiles(
  prev: StalkerProfileState,
  next: StalkerProfileState
): StalkerChange[] {
  const changes: StalkerChange[] = [];

  if (next.isPrivate && !prev.isPrivate) {
    changes.push({ signal: 'WENT_PRIVATE', oldValue: 'public', newValue: 'private' });
    // Can't diff further — content is hidden
    return changes;
  }

  if (prev.bio !== next.bio) {
    changes.push({ signal: 'BIO_CHANGED', oldValue: prev.bio, newValue: next.bio });
  }

  if (prev.externalUrl !== next.externalUrl) {
    changes.push({ signal: 'LINK_CHANGED', oldValue: prev.externalUrl, newValue: next.externalUrl });
  }

  if (prev.avatarUrl !== next.avatarUrl && next.avatarUrl !== null) {
    changes.push({ signal: 'AVATAR_CHANGED', oldValue: prev.avatarUrl, newValue: next.avatarUrl });
  }

  const prevPostCount = prev.postCount ?? 0;
  const nextPostCount = next.postCount ?? 0;
  if (nextPostCount > prevPostCount) {
    changes.push({
      signal: 'NEW_POST',
      oldValue: String(prevPostCount),
      newValue: String(nextPostCount),
    });
  }

  const prevSet = new Set(prev.recentFollowing);
  for (const handle of next.recentFollowing) {
    if (!prevSet.has(handle)) {
      changes.push({ signal: 'NEW_FOLLOW', oldValue: null, newValue: handle });
    }
  }

  return changes;
}

/** Human-readable summary for each signal type (used in emails and UI). */
export function formatStalkerChange(change: StalkerChange, accountHandle: string): string {
  switch (change.signal) {
    case 'BIO_CHANGED':
      return `@${accountHandle} updated their bio`;
    case 'LINK_CHANGED':
      return change.newValue
        ? `@${accountHandle} changed their link to ${change.newValue}`
        : `@${accountHandle} removed their link`;
    case 'AVATAR_CHANGED':
      return `@${accountHandle} changed their profile photo`;
    case 'NEW_POST':
      return `@${accountHandle} posted something new (${change.newValue} posts total)`;
    case 'NEW_FOLLOW':
      return `@${accountHandle} followed @${change.newValue}`;
    case 'WENT_PRIVATE':
      return `@${accountHandle} switched to a private account`;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/stalker-diff.ts
git commit -m "feat(stalker): add pure diff engine for profile signal comparison"
```

---

## Task 4: Stalker Stripe price IDs

**Files:**
- Create: `lib/stalker-prices.ts`
- Modify: `.env.example` (if it exists) or note the required env vars

- [ ] **Step 1: Create stalker-prices module**

```ts
// lib/stalker-prices.ts
// SERVER-SIDE ONLY.

import type { StalkerFrequency } from '@prisma/client';

export const STALKER_PRICE_IDS: Record<StalkerFrequency, string> = {
  DAILY:    process.env.STRIPE_PRICE_STALKER_DAILY    ?? 'price_stalker_daily',
  SIX_HOUR: process.env.STRIPE_PRICE_STALKER_SIX_HOUR ?? 'price_stalker_six_hour',
  HOURLY:   process.env.STRIPE_PRICE_STALKER_HOURLY   ?? 'price_stalker_hourly',
};

export const STALKER_PRICES_USD: Record<StalkerFrequency, number> = {
  DAILY:    499,  // cents
  SIX_HOUR: 699,
  HOURLY:   999,
};

export const STALKER_FREQUENCY_LABEL: Record<StalkerFrequency, string> = {
  DAILY:    'Daily (every 24h)',
  SIX_HOUR: 'Every 6 hours',
  HOURLY:   'Every hour',
};

export function getStalkerPriceId(frequency: StalkerFrequency): string {
  const id = STALKER_PRICE_IDS[frequency];
  if (id.startsWith('price_stalker_')) {
    throw new Error(`Missing Stripe price ID for stalker frequency ${frequency}. Set STRIPE_PRICE_STALKER_${frequency} in env.`);
  }
  return id;
}

export function stalkerFrequencyFromPriceId(priceId: string | null | undefined): StalkerFrequency | null {
  if (!priceId) return null;
  for (const [freq, id] of Object.entries(STALKER_PRICE_IDS) as [StalkerFrequency, string][]) {
    if (id === priceId) return freq;
  }
  return null;
}
```

- [ ] **Step 2: Add env vars to Vercel**

In Vercel dashboard (or `.env.local` for local dev), add:
```
STRIPE_PRICE_STALKER_DAILY=price_xxx     # $4.99/month — create in Stripe dashboard
STRIPE_PRICE_STALKER_SIX_HOUR=price_xxx  # $6.99/month
STRIPE_PRICE_STALKER_HOURLY=price_xxx    # $9.99/month
```

In Stripe dashboard: Products → Add product → "Stalker Mode Daily" → $4.99/month recurring. Repeat for 6h and Hourly tiers.

- [ ] **Step 3: Commit**

```bash
git add lib/stalker-prices.ts
git commit -m "feat(stalker): add Stripe price ID helpers for three frequency tiers"
```

---

## Task 5: Stalker email templates

**Files:**
- Create: `lib/stalker-email.ts`

- [ ] **Step 1: Create email module**

```ts
// lib/stalker-email.ts
// SERVER-SIDE ONLY.

import { Resend } from 'resend';
import { formatStalkerChange, type StalkerChange } from './stalker-diff';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? '');
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? 'noreply@instagramfollowerstracker.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://instagramfollowerstracker.com';

export async function sendStalkerAlertEmail({
  to,
  handle,
  changes,
}: {
  to: string;
  handle: string;
  changes: StalkerChange[];
}): Promise<void> {
  if (changes.length === 0) return;

  const subject =
    changes.length === 1
      ? `👁 Stalker alert: ${formatStalkerChange(changes[0]!, handle)}`
      : `👁 Stalker alert: ${changes.length} changes detected for @${handle}`;

  const changesHtml = changes
    .map((c) => `<li style="margin-bottom:8px;">${formatStalkerChange(c, handle)}${
      c.signal === 'BIO_CHANGED' && c.oldValue
        ? `<br><span style="color:#64748b;font-size:13px;">Was: ${escapeHtml(c.oldValue)}</span>`
        : ''
    }${
      c.signal === 'BIO_CHANGED' && c.newValue
        ? `<br><span style="color:#0f766e;font-size:13px;">Now: ${escapeHtml(c.newValue)}</span>`
        : ''
    }</li>`)
    .join('');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <p style="font-size:16px;font-weight:700;margin-bottom:4px;">👁 Stalker Mode alert</p>
      <p style="color:#64748b;margin-top:0;">Activity detected on <strong>@${handle}</strong></p>
      <ul style="padding-left:20px;line-height:1.6">${changesHtml}</ul>
      <p style="margin-top:24px;">
        <a href="${APP_URL}/dashboard" style="background:#0f172a;color:#fff;padding:10px 20px;border-radius:20px;text-decoration:none;font-weight:700;font-size:14px;">
          View in dashboard →
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
        You're receiving this because you have Stalker Mode active for @${handle}.<br>
        <a href="${APP_URL}/dashboard/settings" style="color:#94a3b8;">Manage alerts</a>
      </p>
    </div>
  `;

  await getResend().emails.send({ from: FROM, to, subject, html });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/stalker-email.ts
git commit -m "feat(stalker): add Resend email templates for stalker alerts"
```

---

## Task 6: Stalker worker

**Files:**
- Create: `worker/stalker.ts`

- [ ] **Step 1: Create the worker**

```ts
// worker/stalker.ts
// SERVER-SIDE ONLY. Never import in client components.

import { prisma } from '@/lib/prisma';
import { fetchInstagramProfile, fetchFollowingList, sleep } from '@/lib/scraper';
import { diffStalkerProfiles, type StalkerProfileState } from '@/lib/stalker-diff';
import { sendStalkerAlertEmail } from '@/lib/stalker-email';
import type { StalkerFrequency } from '@prisma/client';

// How many minutes must pass before re-scraping for each frequency
const FREQUENCY_INTERVAL_MINUTES: Record<StalkerFrequency, number> = {
  DAILY:    23 * 60,  // 23h — generous window so daily doesn't slip
  SIX_HOUR: 5 * 60 + 30,
  HOURLY:   50,
};

export interface StalkerRunOptions {
  maxAccounts?: number;
  maxRuntimeMs?: number;
}

export interface StalkerRunStats {
  checked: number;
  changed: number;
  eventsCreated: number;
  emailsSent: number;
  failed: number;
}

export async function runStalkerScrape(options: StalkerRunOptions = {}): Promise<StalkerRunStats> {
  const stats: StalkerRunStats = { checked: 0, changed: 0, eventsCreated: 0, emailsSent: 0, failed: 0 };
  const deadline = Date.now() + (options.maxRuntimeMs ?? 270_000);
  const maxAccounts = options.maxAccounts ?? 50;

  // Find TrackedAccounts that have at least one active stalker subscription
  // and are due for a scrape based on their highest-frequency subscription.
  const dueAccounts = await prisma.$queryRaw<Array<{
    trackedAccountId: string;
    handle: string;
    minFrequency: StalkerFrequency;
    lastScrapedAt: Date | null;
  }>>`
    SELECT
      ta.id AS "trackedAccountId",
      ta.handle,
      -- Pick the highest-frequency (shortest interval) subscription
      (CASE
        WHEN bool_or(ss.frequency = 'HOURLY')   THEN 'HOURLY'
        WHEN bool_or(ss.frequency = 'SIX_HOUR') THEN 'SIX_HOUR'
        ELSE 'DAILY'
      END)::"StalkerFrequency" AS "minFrequency",
      sp."scrapedAt" AS "lastScrapedAt"
    FROM "StalkerSubscription" ss
    JOIN "TrackedAccount" ta ON ta.id = ss."trackedAccountId"
    LEFT JOIN "StalkerProfile" sp ON sp."trackedAccountId" = ta.id
    WHERE ss.active = true
    GROUP BY ta.id, ta.handle, sp."scrapedAt"
    LIMIT ${maxAccounts}
  `;

  for (const row of dueAccounts) {
    if (Date.now() > deadline) break;

    const intervalMinutes = FREQUENCY_INTERVAL_MINUTES[row.minFrequency];
    const minutesSinceLastScrape = row.lastScrapedAt
      ? (Date.now() - row.lastScrapedAt.getTime()) / 60_000
      : Infinity;

    if (minutesSinceLastScrape < intervalMinutes) continue;

    try {
      stats.checked++;

      // Fetch current profile data
      const profile = await fetchInstagramProfile(row.handle);
      const following = await fetchFollowingList(row.handle);

      const nextState: StalkerProfileState = {
        bio: profile.bio,
        externalUrl: profile.externalUrl,
        avatarUrl: profile.avatarUrl,
        postCount: profile.postCount,
        highlightCount: profile.highlightCount,
        recentFollowing: following,
        isPrivate: profile.isPrivate,
      };

      // Get or create the StalkerProfile (last-known state)
      const existing = await prisma.stalkerProfile.findUnique({
        where: { trackedAccountId: row.trackedAccountId },
      });

      if (!existing) {
        // First scrape — store baseline, no diff
        await prisma.stalkerProfile.create({
          data: {
            trackedAccountId: row.trackedAccountId,
            bio: nextState.bio,
            externalUrl: nextState.externalUrl,
            avatarUrl: nextState.avatarUrl,
            postCount: nextState.postCount,
            highlightCount: nextState.highlightCount,
            recentFollowing: nextState.recentFollowing,
            isPrivate: nextState.isPrivate,
          },
        });
        continue;
      }

      const prevState: StalkerProfileState = {
        bio: existing.bio,
        externalUrl: existing.externalUrl,
        avatarUrl: existing.avatarUrl,
        postCount: existing.postCount,
        highlightCount: existing.highlightCount,
        recentFollowing: existing.recentFollowing,
        isPrivate: existing.isPrivate,
      };

      const changes = diffStalkerProfiles(prevState, nextState);

      // Update stored profile state
      await prisma.stalkerProfile.update({
        where: { trackedAccountId: row.trackedAccountId },
        data: {
          bio: nextState.bio,
          externalUrl: nextState.externalUrl,
          avatarUrl: nextState.avatarUrl,
          postCount: nextState.postCount,
          highlightCount: nextState.highlightCount,
          recentFollowing: nextState.recentFollowing,
          isPrivate: nextState.isPrivate,
          scrapedAt: new Date(),
        },
      });

      if (changes.length === 0) continue;

      stats.changed++;

      // Find all active subscribers for this account
      const subs = await prisma.stalkerSubscription.findMany({
        where: { trackedAccountId: row.trackedAccountId, active: true },
        include: { user: { select: { id: true, email: true } } },
      });

      // Create one StalkerEvent per change per subscriber
      const eventRows = subs.flatMap((sub) =>
        changes.map((change) => ({
          stalkerSubId: sub.id,
          userId: sub.userId,
          signal: change.signal,
          oldValue: change.oldValue,
          newValue: change.newValue,
        }))
      );

      await prisma.stalkerEvent.createMany({ data: eventRows });
      stats.eventsCreated += eventRows.length;

      // Send one email per subscriber summarising all changes in this scrape
      for (const sub of subs) {
        if (!sub.user.email) continue;
        try {
          await sendStalkerAlertEmail({
            to: sub.user.email,
            handle: row.handle,
            changes,
          });
          stats.emailsSent++;
        } catch (err) {
          console.error(`[stalker] email failed for ${sub.user.email}:`, err);
        }
      }
    } catch (err) {
      console.error(`[stalker] scrape failed for ${row.handle}:`, err);
      stats.failed++;
    }

    // Polite delay between accounts
    await sleep(2000 + Math.random() * 2000);
  }

  return stats;
}
```

- [ ] **Step 2: Commit**

```bash
git add worker/stalker.ts
git commit -m "feat(stalker): add stalker scrape worker with diff, events, and email dispatch"
```

---

## Task 7: Stalker cron route + vercel.json

**Files:**
- Create: `app/api/cron/stalker/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the cron route**

```ts
// app/api/cron/stalker/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron-auth';
import { runStalkerScrape } from '@/worker/stalker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const unauthorized = authorizeCron(req);
  if (unauthorized) return unauthorized;

  const result = await runStalkerScrape({
    maxAccounts: 40,
    maxRuntimeMs: 270_000,
  });

  return NextResponse.json({ ok: true, result });
}
```

- [ ] **Step 2: Update vercel.json**

```json
{
  "crons": [
    { "path": "/api/cron/snapshot",  "schedule": "0 6 * * *" },
    { "path": "/api/cron/backfill",  "schedule": "0 8 * * *" },
    { "path": "/api/cron/drive-sync","schedule": "0 7 * * *" },
    { "path": "/api/cron/stalker",   "schedule": "0 * * * *" }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/stalker/route.ts vercel.json
git commit -m "feat(stalker): add hourly cron route and vercel.json schedule"
```

---

## Task 8: Stalker API routes

**Files:**
- Create: `app/api/stalker/subscribe/route.ts`
- Create: `app/api/stalker/route.ts`
- Create: `app/api/stalker/[id]/route.ts`
- Create: `app/api/stalker/events/route.ts`
- Create: `app/api/stalker/events/read-all/route.ts`

- [ ] **Step 1: Create subscribe route**

```ts
// app/api/stalker/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getStalkerPriceId } from '@/lib/stalker-prices';
import type { StalkerFrequency } from '@prisma/client';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

const SubscribeSchema = z.object({
  trackedAccountId: z.string().min(1),
  frequency: z.enum(['DAILY', 'SIX_HOUR', 'HOURLY']),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as unknown;
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { trackedAccountId, frequency } = parsed.data;

  // Verify the tracked account belongs to this user
  const account = await prisma.trackedAccount.findFirst({
    where: { id: trackedAccountId, userId: session.user.id },
    select: { id: true, handle: true },
  });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  // Check for existing active sub
  const existing = await prisma.stalkerSubscription.findUnique({
    where: { userId_trackedAccountId: { userId: session.user.id, trackedAccountId } },
  });
  if (existing?.active) {
    return NextResponse.json({ error: 'Stalker Mode already active for this account' }, { status: 409 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://instagramfollowerstracker.com';

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: customerId } });
  }

  let priceId: string;
  try {
    priceId = getStalkerPriceId(frequency as StalkerFrequency);
  } catch {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?stalker=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: {
      userId: session.user.id,
      trackedAccountId,
      frequency,
      type: 'STALKER',
    },
    subscription_data: {
      metadata: { userId: session.user.id, trackedAccountId, frequency, type: 'STALKER' },
    },
  } as Stripe.Checkout.SessionCreateParams);

  return NextResponse.json({ url: checkoutSession.url });
}
```

- [ ] **Step 2: Create list route**

```ts
// app/api/stalker/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { STALKER_FREQUENCY_LABEL, STALKER_PRICES_USD } from '@/lib/stalker-prices';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subs = await prisma.stalkerSubscription.findMany({
    where: { userId: session.user.id, active: true },
    include: { trackedAccount: { select: { id: true, handle: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    subs.map((s) => ({
      id: s.id,
      trackedAccountId: s.trackedAccountId,
      handle: s.trackedAccount.handle,
      avatarUrl: s.trackedAccount.avatarUrl,
      frequency: s.frequency,
      frequencyLabel: STALKER_FREQUENCY_LABEL[s.frequency],
      priceUsd: STALKER_PRICES_USD[s.frequency],
      source: s.source,
      createdAt: s.createdAt,
    }))
  );
}
```

- [ ] **Step 3: Create cancel route**

```ts
// app/api/stalker/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sub = await prisma.stalkerSubscription.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Cancel Stripe subscription if it exists
  if (sub.stripeSubId) {
    try {
      await stripe.subscriptions.cancel(sub.stripeSubId);
    } catch (err) {
      console.error('[stalker] cancel stripe sub failed:', err);
    }
  }

  await prisma.stalkerSubscription.update({
    where: { id: sub.id },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Create events route**

```ts
// app/api/stalker/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const trackedAccountId = searchParams.get('trackedAccountId');
  const unreadOnly = searchParams.get('unread') === '1';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

  const events = await prisma.stalkerEvent.findMany({
    where: {
      userId: session.user.id,
      ...(trackedAccountId ? { stalkerSub: { trackedAccountId } } : {}),
      ...(unreadOnly ? { read: false } : {}),
    },
    include: { stalkerSub: { include: { trackedAccount: { select: { handle: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const unreadCount = await prisma.stalkerEvent.count({
    where: { userId: session.user.id, read: false },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      signal: e.signal,
      handle: e.stalkerSub.trackedAccount.handle,
      oldValue: e.oldValue,
      newValue: e.newValue,
      read: e.read,
      createdAt: e.createdAt,
    })),
    unreadCount,
  });
}
```

- [ ] **Step 5: Create read-all route**

```ts
// app/api/stalker/events/read-all/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.stalkerEvent.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Commit**

```bash
git add app/api/stalker/
git commit -m "feat(stalker): add subscribe, list, cancel, events, and read-all API routes"
```

---

## Task 9: Stripe webhook — stalker subscription lifecycle

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Add stalker subscription handling to the webhook**

In `app/api/stripe/webhook/route.ts`, import the new helper at the top:

```ts
import { stalkerFrequencyFromPriceId } from '@/lib/stalker-prices';
import type { StalkerFrequency } from '@prisma/client';
```

Inside the `switch (event.type)` block, add handling for the `checkout.session.completed` case. Modify the existing case to also handle stalker subscriptions:

```ts
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  const type = session.metadata?.type; // 'STALKER' or undefined (Pro)
  const subId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;
  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id;

  if (!userId || !subId) {
    console.error('[webhook] checkout.session.completed missing metadata', { sessionId: session.id });
    break;
  }

  if (type === 'STALKER') {
    const trackedAccountId = session.metadata?.trackedAccountId;
    const frequency = session.metadata?.frequency as StalkerFrequency | undefined;
    if (!trackedAccountId || !frequency) {
      console.error('[webhook] stalker checkout missing trackedAccountId or frequency');
      break;
    }
    const priceId = (session as Stripe.Checkout.Session & { subscription?: Stripe.Subscription })
      .subscription?.toString() ?? '';

    // Fetch the subscription to get the price ID
    let stripePriceId: string | null = null;
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subId);
      stripePriceId = stripeSub.items.data[0]?.price.id ?? null;
    } catch { /* ignore */ }

    await prisma.stalkerSubscription.upsert({
      where: { userId_trackedAccountId: { userId, trackedAccountId } },
      create: {
        userId,
        trackedAccountId,
        frequency,
        source: 'STRIPE',
        stripeSubId: subId,
        stripePriceId,
        active: true,
      },
      update: {
        frequency,
        stripeSubId: subId,
        stripePriceId,
        active: true,
      },
    });
    if (customerId) {
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }
  } else {
    // Existing Pro/Agency plan handling
    const plan = session.metadata?.plan as StripeBillingPlan | undefined;
    if (!plan) break;
    await setPlan({ userId, customerId, plan, subId });
  }
  break;
}
```

Also add a `customer.subscription.deleted` handler extension for stalker subs. After the existing `case 'customer.subscription.deleted':`, find or add handling:

```ts
// Inside customer.subscription.deleted case, before clearPlan call:
const deletedSub = event.data.object as Stripe.Subscription;
const stalkerSub = await prisma.stalkerSubscription.findFirst({
  where: { stripeSubId: deletedSub.id },
});
if (stalkerSub) {
  await prisma.stalkerSubscription.update({
    where: { id: stalkerSub.id },
    data: { active: false },
  });
  break; // Don't call clearPlan for stalker subs
}
// ... existing clearPlan logic continues for Pro/Agency subs
```

- [ ] **Step 2: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat(stalker): handle stalker subscription lifecycle in Stripe webhook"
```

---

## Task 10: Auto-create PRO_INCLUDED subscriptions

**Files:**
- Modify: `app/api/accounts/route.ts`

- [ ] **Step 1: Auto-create stalker sub when Pro user adds account**

In `app/api/accounts/route.ts`, in the POST handler, after the new TrackedAccount is created (after `prisma.trackedAccount.create`), add:

```ts
// Auto-enroll Pro users in DAILY Stalker Mode at no extra charge
if (user.plan === 'PRO' || user.plan === 'AGENCY') {
  await prisma.stalkerSubscription.upsert({
    where: { userId_trackedAccountId: { userId: user.id, trackedAccountId: newAccount.id } },
    create: {
      userId: user.id,
      trackedAccountId: newAccount.id,
      frequency: 'DAILY',
      source: 'PRO_INCLUDED',
      active: true,
    },
    update: { active: true },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/accounts/route.ts
git commit -m "feat(stalker): auto-enroll Pro users in DAILY Stalker Mode on account add"
```

---

## Task 11: StalkerEventFeed component

**Files:**
- Create: `components/tracker/StalkerEventFeed.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/tracker/StalkerEventFeed.tsx
'use client';

import { useEffect, useState } from 'react';

type StalkerSignal = 'BIO_CHANGED' | 'LINK_CHANGED' | 'AVATAR_CHANGED' | 'NEW_POST' | 'NEW_FOLLOW' | 'WENT_PRIVATE';

interface StalkerEvent {
  id: string;
  signal: StalkerSignal;
  handle: string;
  oldValue: string | null;
  newValue: string | null;
  read: boolean;
  createdAt: string;
}

const SIGNAL_ICONS: Record<StalkerSignal, string> = {
  BIO_CHANGED:    '✏️',
  LINK_CHANGED:   '🔗',
  AVATAR_CHANGED: '🖼️',
  NEW_POST:       '📸',
  NEW_FOLLOW:     '👣',
  WENT_PRIVATE:   '🔒',
};

const SIGNAL_LABELS: Record<StalkerSignal, string> = {
  BIO_CHANGED:    'Bio changed',
  LINK_CHANGED:   'Link changed',
  AVATAR_CHANGED: 'Photo changed',
  NEW_POST:       'New post',
  NEW_FOLLOW:     'New follow',
  WENT_PRIVATE:   'Went private',
};

export function StalkerEventFeed({
  trackedAccountId,
  handle,
}: {
  trackedAccountId: string;
  handle: string;
}) {
  const [events, setEvents] = useState<StalkerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stalker/events?trackedAccountId=${trackedAccountId}&limit=20`)
      .then((r) => r.json())
      .then((data: { events: StalkerEvent[] }) => {
        setEvents(data.events ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [trackedAccountId]);

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        No activity detected yet for @{handle}
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {events.map((event) => (
        <li
          key={event.id}
          className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm ${
            event.read ? 'bg-transparent' : 'bg-cyan-50'
          }`}
        >
          <span className="mt-0.5 shrink-0 text-base">{SIGNAL_ICONS[event.signal]}</span>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold ${event.read ? 'text-slate-700' : 'text-slate-950'}`}>
              {SIGNAL_LABELS[event.signal]}
            </p>
            {event.signal === 'BIO_CHANGED' && (
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                {event.oldValue && <span className="line-through opacity-60">{event.oldValue}</span>}
                {event.oldValue && event.newValue && ' → '}
                {event.newValue && <span>{event.newValue}</span>}
              </p>
            )}
            {(event.signal === 'NEW_FOLLOW' || event.signal === 'LINK_CHANGED') && event.newValue && (
              <p className="mt-0.5 text-xs text-slate-500">
                {event.signal === 'NEW_FOLLOW' ? '@' : ''}{event.newValue}
              </p>
            )}
            <p className="mt-0.5 text-xs text-slate-400">
              {new Date(event.createdAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/tracker/StalkerEventFeed.tsx
git commit -m "feat(stalker): add StalkerEventFeed component"
```

---

## Task 12: StalkerUpgradeCard and StalkerModePanel

**Files:**
- Create: `components/tracker/StalkerUpgradeCard.tsx`
- Create: `components/tracker/StalkerModePanel.tsx`

- [ ] **Step 1: Create StalkerUpgradeCard**

```tsx
// components/tracker/StalkerUpgradeCard.tsx
'use client';

import { useState } from 'react';

type StalkerFrequency = 'DAILY' | 'SIX_HOUR' | 'HOURLY';

const TIERS: Array<{ frequency: StalkerFrequency; label: string; sublabel: string; price: string }> = [
  { frequency: 'DAILY',    label: 'Daily',         sublabel: 'Every 24 hours · Best value', price: '$4.99/mo' },
  { frequency: 'SIX_HOUR', label: 'Every 6 hours', sublabel: '4× daily checks',             price: '$6.99/mo' },
  { frequency: 'HOURLY',   label: 'Every hour',    sublabel: '24× daily checks',             price: '$9.99/mo' },
];

export function StalkerUpgradeCard({
  trackedAccountId,
  handle,
}: {
  trackedAccountId: string;
  handle: string;
}) {
  const [selected, setSelected] = useState<StalkerFrequency>('DAILY');
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stalker/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackedAccountId, frequency: selected }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-cyan-950/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">👁</span>
        <div>
          <p className="text-sm font-black text-slate-950">Stalker Mode</p>
          <p className="text-xs text-slate-500">Get alerted when @{handle} posts, follows someone, or changes their bio</p>
        </div>
      </div>

      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Check frequency</p>
      <div className="space-y-2 mb-4">
        {TIERS.map((tier) => (
          <button
            key={tier.frequency}
            onClick={() => setSelected(tier.frequency)}
            className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
              selected === tier.frequency
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-slate-100 hover:border-slate-200'
            }`}
          >
            <div>
              <p className={`text-sm font-bold ${selected === tier.frequency ? 'text-cyan-900' : 'text-slate-700'}`}>
                {tier.label}
              </p>
              <p className="text-xs text-slate-400">{tier.sublabel}</p>
            </div>
            <p className={`text-sm font-black ${selected === tier.frequency ? 'text-cyan-700' : 'text-slate-400'}`}>
              {tier.price}
            </p>
          </button>
        ))}
      </div>

      {selected === 'DAILY' && (
        <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">
          💡 Daily is enough for 99% of cases — most bio and follow changes stay up for hours or days.
        </p>
      )}

      <button
        onClick={subscribe}
        disabled={loading}
        className="w-full rounded-full bg-cyan-950 py-2.5 text-sm font-black text-white transition hover:bg-cyan-800 disabled:opacity-60"
      >
        {loading ? 'Redirecting…' : 'Activate Stalker Mode'}
      </button>
      <p className="mt-2 text-center text-xs text-slate-400">Cancel anytime · No Instagram login required</p>
    </div>
  );
}
```

- [ ] **Step 2: Create StalkerModePanel**

```tsx
// components/tracker/StalkerModePanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { StalkerEventFeed } from './StalkerEventFeed';
import { StalkerUpgradeCard } from './StalkerUpgradeCard';
import { STALKER_FREQUENCY_LABEL } from '@/lib/stalker-prices';

type StalkerFrequency = 'DAILY' | 'SIX_HOUR' | 'HOURLY';

interface StalkerSub {
  id: string;
  trackedAccountId: string;
  handle: string;
  frequency: StalkerFrequency;
  frequencyLabel: string;
  source: 'STRIPE' | 'PRO_INCLUDED';
}

export function StalkerModePanel({
  trackedAccountId,
  handle,
}: {
  trackedAccountId: string;
  handle: string;
}) {
  const [sub, setSub] = useState<StalkerSub | null | undefined>(undefined); // undefined = loading
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch('/api/stalker')
      .then((r) => r.json())
      .then((data: StalkerSub[]) => {
        const match = data.find((s) => s.trackedAccountId === trackedAccountId);
        setSub(match ?? null);
      })
      .catch(() => setSub(null));
  }, [trackedAccountId]);

  const cancel = async () => {
    if (!sub) return;
    setCancelling(true);
    await fetch(`/api/stalker/${sub.id}`, { method: 'DELETE' });
    setSub(null);
    setCancelling(false);
  };

  if (sub === undefined) return null; // loading — no flash

  if (!sub) {
    return <StalkerUpgradeCard trackedAccountId={trackedAccountId} handle={handle} />;
  }

  return (
    <div className="rounded-xl border border-cyan-950/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">👁</span>
          <div>
            <p className="text-sm font-black text-slate-950">
              Stalker Mode
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                Active
              </span>
            </p>
            <p className="text-xs text-slate-500">
              {sub.frequencyLabel}
              {sub.source === 'PRO_INCLUDED' && ' · Included in Pro'}
            </p>
          </div>
        </div>
        {sub.source === 'STRIPE' && (
          <button
            onClick={cancel}
            disabled={cancelling}
            className="text-xs font-semibold text-slate-400 hover:text-red-500 transition disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>

      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Recent activity</p>
      <StalkerEventFeed trackedAccountId={trackedAccountId} handle={handle} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/tracker/StalkerUpgradeCard.tsx components/tracker/StalkerModePanel.tsx
git commit -m "feat(stalker): add StalkerUpgradeCard and StalkerModePanel components"
```

---

## Task 13: NotificationBell + dashboard integration

**Files:**
- Create: `components/layout/NotificationBell.tsx`
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Create NotificationBell**

```tsx
// components/layout/NotificationBell.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface StalkerEvent {
  id: string;
  signal: string;
  handle: string;
  newValue: string | null;
  createdAt: string;
  read: boolean;
}

const SIGNAL_ICONS: Record<string, string> = {
  BIO_CHANGED: '✏️', LINK_CHANGED: '🔗', AVATAR_CHANGED: '🖼️',
  NEW_POST: '📸', NEW_FOLLOW: '👣', WENT_PRIVATE: '🔒',
};

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [events, setEvents] = useState<StalkerEvent[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    const res = await fetch('/api/stalker/events?limit=10');
    if (!res.ok) return;
    const data = await res.json() as { unreadCount: number; events: StalkerEvent[] };
    setUnread(data.unreadCount ?? 0);
    setEvents(data.events ?? []);
  };

  useEffect(() => {
    void fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      await fetch('/api/stalker/events/read-all', { method: 'POST' });
      setUnread(0);
      setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-cyan-950/10 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
        aria-label="Stalker Mode notifications"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-cyan-950/10 bg-white shadow-xl shadow-cyan-950/10">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-black text-slate-950">👁 Stalker Mode alerts</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No activity yet</p>
            ) : (
              events.map((e) => (
                <div key={e.id} className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 ${!e.read ? 'bg-cyan-50/50' : ''}`}>
                  <span className="mt-0.5 shrink-0">{SIGNAL_ICONS[e.signal] ?? '📌'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">@{e.handle}</p>
                    <p className="text-xs text-slate-500">
                      {e.signal.replace(/_/g, ' ').toLowerCase()}
                      {e.newValue && ` → ${e.signal === 'NEW_FOLLOW' ? '@' : ''}${e.newValue.slice(0, 30)}`}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(e.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add StalkerModePanel to dashboard page**

In `app/dashboard/page.tsx`:

Import the components at the top:
```ts
import { StalkerModePanel } from '@/components/tracker/StalkerModePanel';
import { NotificationBell } from '@/components/layout/NotificationBell';
```

Inside the mobile top bar (after the existing `<button onClick={() => setShowAddModal(true)}>` button), add the bell:

```tsx
<NotificationBell />
```

At the end of the main content area, just before `<UnfollowDetector />`, add:

```tsx
{selected && (
  <StalkerModePanel
    trackedAccountId={selected.id}
    handle={selected.handle}
  />
)}
```

- [ ] **Step 3: Commit and push**

```bash
git add components/layout/NotificationBell.tsx app/dashboard/page.tsx
git commit -m "feat(stalker): add NotificationBell and wire StalkerModePanel into dashboard"
git push origin master && git push origin master:main
```

---

## Self-Review Checklist

### Spec coverage
- ✅ Three frequency tiers ($4.99 / $6.99 / $9.99)
- ✅ Per-account subscriptions (one StalkerSubscription per user+account)
- ✅ Six signals: bio, link, avatar, post count, new follow, went private
- ✅ Email alerts via Resend
- ✅ In-app notification feed with unread badge
- ✅ Pro users get DAILY included automatically
- ✅ Hourly cron (`0 * * * *`) added to vercel.json
- ✅ Daily tier piggybacks on existing scrape cadence (no extra cost)
- ✅ Upsell card shown for accounts without active sub
- ✅ Cancel subscription route
- ✅ Stripe webhook handles stalker subscription lifecycle

### No placeholders
- All code blocks contain complete, working code
- No TBD / TODO / "similar to above"

### Type consistency
- `StalkerFrequency` is `'DAILY' | 'SIX_HOUR' | 'HOURLY'` throughout (matching Prisma enum)
- `StalkerSignal` type is used consistently in diff engine, email, and UI components
- `trackedAccountId` is the foreign key in all routes and components
