# instagramfollowerstracker.com — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working freemium Instagram follower tracker SaaS — auth, dashboard, scraper, cron, plan limits — deployable to Vercel.

**Architecture:** Next.js 14 App Router (TypeScript, strict mode) with PostgreSQL via Prisma. Scraping is cron-only via Playwright; API routes serve pre-stored snapshots. Plan limits enforced on every write via `lib/limits.ts`.

**Tech Stack:** Next.js 14, TypeScript (strict), Tailwind CSS, Prisma, PostgreSQL (Supabase), NextAuth.js v5 (email magic link), Playwright, Chart.js, Zod, Stripe, Resend, Vercel Cron.

---

## File Map

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | DB schema — User, TrackedAccount, Snapshot, PublicAccount, PublicSnapshot, Alert |
| `prisma/seed.ts` | Seed top 500 public accounts (Phase 2) |
| `lib/prisma.ts` | Singleton Prisma client |
| `lib/auth.ts` | NextAuth config + `getServerSession` helper |
| `lib/limits.ts` | `PLAN_LIMITS` constant |
| `lib/handles.ts` | `parseHandle()` + validation regex |
| `lib/format.ts` | `formatCount()`, `formatDate()` |
| `lib/scraper.ts` | Playwright scraper (server-only) |
| `lib/wayback.ts` | Wayback CDX API client (Phase 2) |
| `lib/stripe.ts` | Stripe client + plan helpers (Phase 2) |
| `app/layout.tsx` | Root layout — title template, OG tags, fonts |
| `app/page.tsx` | Homepage — H1, features, FAQ (FAQPage JSON-LD), footer links |
| `app/globals.css` | Tailwind base |
| `app/dashboard/layout.tsx` | Auth guard + sidebar shell |
| `app/dashboard/page.tsx` | Dashboard — account list + chart |
| `app/dashboard/settings/page.tsx` | Plan, billing, alerts |
| `app/[handle]/page.tsx` | Public SEO page (Phase 2) |
| `app/pricing/page.tsx` | Pricing tiers (Phase 2) |
| `app/sitemap.ts` | Auto XML sitemap (Phase 2) |
| `app/robots.ts` | Crawler rules (Phase 2) |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth route handler |
| `app/api/accounts/route.ts` | GET list, POST add |
| `app/api/accounts/[id]/route.ts` | DELETE |
| `app/api/accounts/[id]/snapshots/route.ts` | GET chart data (plan-gated) |
| `app/api/public/[handle]/route.ts` | Public snapshot data, no auth (Phase 2) |
| `app/api/cron/snapshot/route.ts` | Bearer-token-gated cron trigger |
| `app/api/stripe/checkout/route.ts` | Stripe checkout (Phase 2) |
| `app/api/stripe/webhook/route.ts` | Stripe webhook (Phase 2) |
| `components/tracker/AccountCard.tsx` | Sidebar account entry |
| `components/tracker/AddAccountForm.tsx` | Handle input + validation |
| `components/tracker/FollowerChart.tsx` | Chart.js (client, dynamic import) |
| `components/tracker/MetricsRow.tsx` | current / 24h / 7d / 30d / avg |
| `components/tracker/EmptyState.tsx` | Empty dashboard state |
| `components/ui/Button.tsx` | Shared button |
| `components/ui/Input.tsx` | Shared input |
| `components/ui/Badge.tsx` | Plan badge |
| `components/ui/Modal.tsx` | Shared modal |
| `components/layout/Navbar.tsx` | Top nav |
| `components/layout/Sidebar.tsx` | Dashboard sidebar |
| `components/layout/Footer.tsx` | Marketing footer with account links |
| `worker/index.ts` | Cron entry point |
| `worker/snapshot.ts` | Daily snapshot job |
| `vercel.json` | Cron schedule config |
| `.env.example` | All env vars documented |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `app/globals.css`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /Users/riz/Documents/Claude/instagramfollowerstracker
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-git
```

When prompted: no ESLint (we'll configure manually), yes Tailwind, yes App Router.

- [ ] **Step 2: Install all dependencies**

```bash
npm install prisma @prisma/client
npm install next-auth@beta
npm install playwright
npm install stripe @stripe/stripe-js
npm install resend
npm install zod
npm install chart.js
npm install @types/node --save-dev
npx prisma init
```

- [ ] **Step 3: Configure TypeScript strict mode**

Open `tsconfig.json`. Ensure this block exists under `compilerOptions`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

- [ ] **Step 4: Create `.env.example`**

```bash
cat > .env.example << 'EOF'
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
EOF
cp .env.example .env
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 project with all dependencies"
```

---

## Task 2: Prisma Schema + Database

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

- [ ] **Step 1: Write the Prisma schema**

Replace the contents of `prisma/schema.prisma`:

```prisma
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
}

enum Plan {
  FREE
  PRO
  AGENCY
}

model TrackedAccount {
  id          String      @id @default(cuid())
  userId      String
  handle      String
  displayName String?
  avatarUrl   String?
  isPublic    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  lastChecked DateTime?
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
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

model PublicAccount {
  id             String           @id @default(cuid())
  handle         String           @unique
  displayName    String?
  avatarUrl      String?
  bio            String?
  category       String?
  followerCount  Int?
  followingCount Int?
  postCount      Int?
  lastChecked    DateTime?
  createdAt      DateTime         @default(now())
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
  GAIN_THRESHOLD
  LOSS_THRESHOLD
  DAILY_SUMMARY
}
```

- [ ] **Step 2: Set DATABASE_URL in .env, then migrate**

```bash
# Edit .env and set DATABASE_URL to your Supabase connection string, then:
npx prisma migrate dev --name init
npx prisma generate
```

Expected: "Your database is now in sync with your schema."

- [ ] **Step 3: Create Prisma singleton**

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma lib/prisma.ts
git commit -m "feat: add Prisma schema and singleton client"
```

---

## Task 3: Lib Utilities

**Files:**
- Create: `lib/limits.ts`, `lib/handles.ts`, `lib/format.ts`

- [ ] **Step 1: Create `lib/limits.ts`**

```typescript
export const PLAN_LIMITS = {
  FREE: {
    maxAccounts: 3,
    historyDays: 30,
    updateFrequency: 'daily' as const,
    alerts: false,
    apiAccess: false,
    publicPages: true,
  },
  PRO: {
    maxAccounts: 25,
    historyDays: 365,
    updateFrequency: 'daily' as const,
    alerts: true,
    apiAccess: false,
    publicPages: true,
  },
  AGENCY: {
    maxAccounts: 200,
    historyDays: 9999,
    updateFrequency: 'daily' as const,
    alerts: true,
    apiAccess: true,
    publicPages: true,
  },
} as const;

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
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
```

- [ ] **Step 2: Create `lib/handles.ts`**

```typescript
const HANDLE_REGEX = /^[a-z0-9._]{1,30}$/;

export function parseHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/\/$/, '')
    .split('?')[0]
    .split('/')[0] ?? '';
}

export function isValidHandle(handle: string): boolean {
  return HANDLE_REGEX.test(handle);
}
```

- [ ] **Step 3: Create `lib/format.ts`**

```typescript
export function formatCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatChange(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${formatCount(n)}`;
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/limits.ts lib/handles.ts lib/format.ts
git commit -m "feat: add plan limits, handle parser, and format utilities"
```

---

## Task 4: Auth Setup

**Files:**
- Create: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create `lib/auth.ts`**

```typescript
import { NextAuthOptions, getServerSession as nextAuthGetServerSession } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.EMAIL_FROM ?? 'noreply@instagramfollowerstracker.com',
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
};

export function getServerSession() {
  return nextAuthGetServerSession(authOptions);
}
```

- [ ] **Step 2: Install Prisma adapter**

```bash
npm install @auth/prisma-adapter
```

- [ ] **Step 3: Add NextAuth models to Prisma schema**

Append to `prisma/schema.prisma` (NextAuth requires these tables):

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

Also add to the `User` model:
```prisma
  accounts Account[]
  sessions Session[]
```

- [ ] **Step 4: Re-migrate**

```bash
npx prisma migrate dev --name add-nextauth-tables
npx prisma generate
```

- [ ] **Step 5: Create route handler**

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 6: Add NEXTAUTH_SECRET to .env, then commit**

```bash
# Generate a secret:
openssl rand -base64 32
# Paste into .env as NEXTAUTH_SECRET

git add prisma/schema.prisma lib/auth.ts app/api/auth/
git commit -m "feat: add NextAuth email magic link auth"
```

---

## Task 5: Scraper

**Files:**
- Create: `lib/scraper.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 2: Create `lib/scraper.ts`**

```typescript
// SERVER-SIDE ONLY. Never import in any client component.
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

function parseFollowerString(str: string): number {
  const cleaned = str.replace(/,/g, '');
  if (cleaned.endsWith('K')) return Math.round(parseFloat(cleaned) * 1_000);
  if (cleaned.endsWith('M')) return Math.round(parseFloat(cleaned) * 1_000_000);
  if (cleaned.endsWith('B')) return Math.round(parseFloat(cleaned) * 1_000_000_000);
  return parseInt(cleaned, 10);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function fetchInstagramProfile(
  handle: string
): Promise<InstagramProfileData> {
  const proxyUrl = process.env.PROXY_URL;

  const browser = await chromium.launch({
    proxy: proxyUrl ? { server: proxyUrl } : undefined,
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
      if (
        url.includes('instagram.com/api/v1/users/web_profile_info') ||
        url.includes('?username=')
      ) {
        try {
          const json = await response.json();
          const user = json?.data?.user;
          if (user) {
            followerCount =
              user.edge_followed_by?.count ?? user.follower_count ?? null;
            followingCount =
              user.edge_follow?.count ?? user.following_count ?? null;
            postCount =
              user.edge_owner_to_timeline_media?.count ??
              user.media_count ??
              null;
            displayName = user.full_name ?? null;
            bio = user.biography ?? null;
            avatarUrl =
              user.profile_pic_url_hd ?? user.profile_pic_url ?? null;
            isPrivate = user.is_private ?? false;
          }
        } catch {
          // silently ignore parse errors
        }
      }
    });

    await page.goto(`https://www.instagram.com/${handle}/`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });

    // Fallback: parse from meta description
    if (followerCount === null) {
      const metaDesc = await page.getAttribute(
        'meta[name="description"]',
        'content'
      );
      if (metaDesc) {
        const match = metaDesc.match(/([\d,\.]+[KMB]?)\s+Followers/i);
        if (match?.[1]) {
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

export { sleep };
```

- [ ] **Step 3: Smoke-test locally**

```bash
npx ts-node --esm -e "
import { fetchInstagramProfile } from './lib/scraper.js';
fetchInstagramProfile('instagram').then(console.log).catch(console.error);
"
```

Expected: object with `followerCount` as an integer (or null if Instagram is blocking without proxy).

- [ ] **Step 4: Commit**

```bash
git add lib/scraper.ts
git commit -m "feat: add Playwright Instagram scraper (server-only)"
```

---

## Task 6: API Routes

**Files:**
- Create: `app/api/accounts/route.ts`
- Create: `app/api/accounts/[id]/route.ts`
- Create: `app/api/accounts/[id]/snapshots/route.ts`

- [ ] **Step 1: Create `app/api/accounts/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { PLAN_LIMITS } from '@/lib/limits';
import { parseHandle, isValidHandle } from '@/lib/handles';

const AddAccountSchema = z.object({
  handle: z.string().min(1).max(60),
});

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await prisma.trackedAccount.findMany({
    where: { userId: session.user.id },
    include: {
      snapshots: {
        orderBy: { takenAt: 'desc' },
        take: 2,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const result = accounts.map((account) => {
    const [latest, previous] = account.snapshots;
    const latestCount = latest?.followerCount ?? null;
    const change24h =
      latest && previous
        ? latest.followerCount - previous.followerCount
        : null;
    return {
      id: account.id,
      handle: account.handle,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      latestCount,
      change24h,
      lastChecked: account.lastChecked,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = AddAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid handle' }, { status: 400 });
  }

  const handle = parseHandle(parsed.data.handle);
  if (!isValidHandle(handle)) {
    return NextResponse.json({ error: 'Invalid Instagram handle' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { trackedAccounts: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const limit = PLAN_LIMITS[user.plan].maxAccounts;
  if (user._count.trackedAccounts >= limit) {
    return NextResponse.json(
      { error: 'Plan limit reached', limit, upgrade: '/pricing' },
      { status: 402 }
    );
  }

  // Check for duplicate
  const existing = await prisma.trackedAccount.findUnique({
    where: { userId_handle: { userId: user.id, handle } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Already tracking this account' }, { status: 400 });
  }

  const account = await prisma.trackedAccount.create({
    data: { userId: user.id, handle },
  });

  return NextResponse.json(account, { status: 200 });
}
```

- [ ] **Step 2: Create `app/api/accounts/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const account = await prisma.trackedAccount.findUnique({
    where: { id: params.id },
  });

  if (!account) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (account.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.trackedAccount.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create `app/api/accounts/[id]/snapshots/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { PLAN_LIMITS } from '@/lib/limits';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const account = await prisma.trackedAccount.findUnique({
    where: { id: params.id },
  });

  if (!account) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (account.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const historyDays = PLAN_LIMITS[user.plan].historyDays;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - historyDays);

  const snapshots = await prisma.snapshot.findMany({
    where: { trackedAccountId: params.id, takenAt: { gte: cutoff } },
    orderBy: { takenAt: 'asc' },
    select: { takenAt: true, followerCount: true },
  });

  const current = snapshots.at(-1)?.followerCount ?? null;
  const oldest = snapshots[0]?.followerCount ?? null;
  const change = current !== null && oldest !== null ? current - oldest : null;
  const changePct =
    change !== null && oldest ? Math.round((change / oldest) * 100) : null;
  const peak = snapshots.reduce(
    (max, s) => (s.followerCount > (max?.followerCount ?? 0) ? s : max),
    snapshots[0]
  );

  return NextResponse.json({
    handle: account.handle,
    snapshots,
    stats: {
      current,
      change,
      changePct,
      avgDailyGain:
        change !== null && snapshots.length > 1
          ? Math.round(change / (snapshots.length - 1))
          : null,
      peakCount: peak?.followerCount ?? null,
      peakDate: peak?.takenAt ?? null,
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/accounts/
git commit -m "feat: add accounts API routes (list, add, delete, snapshots)"
```

---

## Task 7: Cron Endpoint + Worker

**Files:**
- Create: `app/api/cron/snapshot/route.ts`
- Create: `worker/snapshot.ts`
- Create: `worker/index.ts`
- Create: `vercel.json`

- [ ] **Step 1: Create `app/api/cron/snapshot/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { runDailySnapshot } from '@/worker/snapshot';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Run async, don't await — respond immediately so Vercel doesn't timeout
  runDailySnapshot().catch((err) =>
    console.error('[cron] snapshot job failed:', err)
  );

  return NextResponse.json({ ok: true, started: new Date().toISOString() });
}
```

- [ ] **Step 2: Create `worker/snapshot.ts`**

```typescript
import { prisma } from '@/lib/prisma';
import { fetchInstagramProfile, sleep } from '@/lib/scraper';

export async function runDailySnapshot() {
  console.log(`[snapshot] Starting daily run at ${new Date().toISOString()}`);

  // 1. User-tracked accounts
  const trackedAccounts = await prisma.trackedAccount.findMany({
    include: {
      snapshots: { orderBy: { takenAt: 'desc' }, take: 1 },
      user: true,
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
      }

      await sleep(2000 + Math.random() * 3000);
    } catch (err) {
      console.error(`[snapshot] Failed for @${account.handle}:`, err);
    }
  }

  // 2. Public SEO accounts
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
      console.error(`[snapshot] Public @${account.handle} failed:`, err);
    }
  }

  console.log(`[snapshot] Daily run complete`);
}
```

- [ ] **Step 3: Create `worker/index.ts`**

```typescript
import { runDailySnapshot } from './snapshot';

runDailySnapshot()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
```

- [ ] **Step 4: Create `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/snapshot",
      "schedule": "0 6 * * *"
    }
  ]
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/ worker/ vercel.json
git commit -m "feat: add cron snapshot endpoint and daily worker"
```

---

## Task 8: UI Components

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/Input.tsx`, `components/ui/Badge.tsx`, `components/ui/Modal.tsx`
- Create: `components/tracker/AccountCard.tsx`, `components/tracker/AddAccountForm.tsx`, `components/tracker/FollowerChart.tsx`, `components/tracker/MetricsRow.tsx`, `components/tracker/EmptyState.tsx`
- Create: `components/layout/Navbar.tsx`, `components/layout/Sidebar.tsx`, `components/layout/Footer.tsx`

- [ ] **Step 1: Create `components/ui/Button.tsx`**

```typescript
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90',
  secondary: 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50',
  ghost: 'text-gray-600 hover:bg-gray-100',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create `components/ui/Input.tsx`**

```typescript
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-purple-500 ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${className}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
```

- [ ] **Step 3: Create `components/ui/Badge.tsx`**

```typescript
interface BadgeProps {
  plan: 'FREE' | 'PRO' | 'AGENCY';
}

const styles = {
  FREE: 'bg-gray-100 text-gray-600',
  PRO: 'bg-purple-100 text-purple-700',
  AGENCY: 'bg-amber-100 text-amber-700',
};

export function Badge({ plan }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[plan]}`}>
      {plan}
    </span>
  );
}
```

- [ ] **Step 4: Create `components/ui/Modal.tsx`**

```typescript
'use client';

import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `components/tracker/EmptyState.tsx`**

```typescript
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">📊</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        No accounts tracked yet
      </h2>
      <p className="text-gray-500 mb-6 max-w-sm">
        Add any public Instagram account to start tracking follower growth over time.
      </p>
      <Button onClick={onAdd}>Start Tracking Free</Button>
    </div>
  );
}
```

- [ ] **Step 6: Create `components/tracker/MetricsRow.tsx`**

```typescript
import { formatCount, formatChange } from '@/lib/format';

interface MetricsRowProps {
  current: number | null;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  avgDailyGain: number | null;
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <span className={`text-2xl font-bold ${highlight ? 'text-purple-600' : 'text-gray-900'}`}>
        {value}
      </span>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
}

export function MetricsRow({ current, change24h, change7d, change30d, avgDailyGain }: MetricsRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <Metric label="Followers" value={current !== null ? formatCount(current) : '—'} highlight />
      <Metric label="24h change" value={change24h !== null ? formatChange(change24h) : '—'} />
      <Metric label="7d change" value={change7d !== null ? formatChange(change7d) : '—'} />
      <Metric label="30d change" value={change30d !== null ? formatChange(change30d) : '—'} />
      <Metric label="Avg/day" value={avgDailyGain !== null ? formatChange(avgDailyGain) : '—'} />
    </div>
  );
}
```

- [ ] **Step 7: Create `components/tracker/FollowerChart.tsx`**

```typescript
'use client';

import { useEffect, useRef } from 'react';
import type { Chart as ChartType } from 'chart.js';
import { formatDate, formatCount } from '@/lib/format';

interface Snapshot {
  takenAt: string;
  followerCount: number;
}

interface FollowerChartProps {
  snapshots: Snapshot[];
  handle: string;
}

export function FollowerChart({ snapshots, handle }: FollowerChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartType | null>(null);

  useEffect(() => {
    if (!canvasRef.current || snapshots.length === 0) return;

    let chart: ChartType | null = null;

    // Dynamic import so Chart.js never blocks SSR
    import('chart.js').then(({ Chart, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler, registerables }) => {
      Chart.register(...registerables);

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvasRef.current!.getContext('2d');
      if (!ctx) return;

      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: snapshots.map((s) => formatDate(s.takenAt)),
          datasets: [
            {
              label: `@${handle} followers`,
              data: snapshots.map((s) => s.followerCount),
              borderColor: '#9333ea',
              backgroundColor: 'rgba(147,51,234,0.08)',
              fill: true,
              tension: 0.4,
              pointRadius: snapshots.length > 60 ? 0 : 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${formatCount(ctx.parsed.y)} followers`,
              },
            },
          },
          scales: {
            y: {
              ticks: {
                callback: (v) => formatCount(Number(v)),
              },
              grid: { color: 'rgba(0,0,0,0.04)' },
            },
            x: {
              grid: { display: false },
              ticks: { maxTicksLimit: 8 },
            },
          },
        },
      });

      chartRef.current = chart;
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [snapshots, handle]);

  if (snapshots.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl text-gray-400 text-sm">
        No snapshot data yet — check back after the first daily sync.
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
```

- [ ] **Step 8: Create `components/tracker/AccountCard.tsx`**

```typescript
'use client';

import { formatCount, formatChange } from '@/lib/format';

interface AccountCardProps {
  id: string;
  handle: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  latestCount: number | null;
  change24h: number | null;
  selected: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export function AccountCard({
  id, handle, displayName, avatarUrl, latestCount, change24h, selected, onClick, onDelete,
}: AccountCardProps) {
  const changePositive = change24h !== null && change24h > 0;
  const changeNegative = change24h !== null && change24h < 0;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
        selected ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={`@${handle} avatar`} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
          {handle[0]?.toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">@{handle}</p>
        {displayName && <p className="text-xs text-gray-500 truncate">{displayName}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gray-900">
          {latestCount !== null ? formatCount(latestCount) : '—'}
        </p>
        {change24h !== null && (
          <p className={`text-xs ${changePositive ? 'text-green-500' : changeNegative ? 'text-red-400' : 'text-gray-400'}`}>
            {formatChange(change24h)}
          </p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(id); }}
        className="ml-1 text-gray-300 hover:text-red-400 transition text-xs"
        aria-label={`Remove @${handle}`}
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 9: Create `components/tracker/AddAccountForm.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface AddAccountFormProps {
  onAdd: (handle: string) => Promise<{ error?: string }>;
  onCancel: () => void;
}

export function AddAccountForm({ onAdd, onCancel }: AddAccountFormProps) {
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await onAdd(handle.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setHandle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Instagram handle"
        placeholder="@nike or instagram.com/nike"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        error={error}
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="submit" loading={loading} className="flex-1">
          Start Tracking Free
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 10: Create layout components**

Create `components/layout/Navbar.tsx`:

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-bold text-gray-900 text-sm">
          📊 Instagram Followers Tracker
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          <Link href="/dashboard">
            <Button size="sm">Start Tracking Free</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

Create `components/layout/Sidebar.tsx`:

```typescript
'use client';

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-72 shrink-0 border-r border-gray-100 bg-white h-full overflow-y-auto">
      <div className="p-4">{children}</div>
    </aside>
  );
}
```

Create `components/layout/Footer.tsx`:

```typescript
import Link from 'next/link';

interface FooterProps {
  topAccounts?: { handle: string }[];
}

export function Footer({ topAccounts = [] }: FooterProps) {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 mt-24">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-sm text-gray-500 mb-6">
          The most accurate Instagram follower tracker. Track any public account.
        </p>
        {topAccounts.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Popular accounts to track
            </p>
            <div className="flex flex-wrap gap-2">
              {topAccounts.slice(0, 100).map((a) => (
                <Link
                  key={a.handle}
                  href={`/${a.handle}`}
                  className="text-xs text-gray-500 hover:text-purple-600 transition"
                >
                  @{a.handle}
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-6 text-xs text-gray-400">
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 11: Commit**

```bash
git add components/
git commit -m "feat: add UI components (tracker, ui, layout)"
```

---

## Task 9: Dashboard Pages

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`

- [ ] **Step 1: Update `app/layout.tsx` with SEO metadata**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://instagramfollowerstracker.com'),
  title: {
    default: 'Instagram Followers Tracker — Track Any Account Free',
    template: '%s | Instagram Followers Tracker',
  },
  description:
    'Track Instagram follower counts for any public account. See growth history, daily changes, and trends. The best free Instagram followers tracker — no login required for public pages.',
  keywords: [
    'instagram followers tracker',
    'ig follower tracker',
    'instagram follow tracker',
    'unfollow tracker',
    'instagram growth tracker',
    'instagram follower count tracker',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Instagram Followers Tracker',
    title: 'Instagram Followers Tracker — Track Any Account Free',
    description:
      'Track Instagram follower counts for any public account. See growth history and daily changes.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instagram Followers Tracker',
    description: 'Track Instagram follower counts for any public account.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create `app/dashboard/layout.tsx`**

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/dashboard/page.tsx`**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AccountCard } from '@/components/tracker/AccountCard';
import { AddAccountForm } from '@/components/tracker/AddAccountForm';
import { FollowerChart } from '@/components/tracker/FollowerChart';
import { MetricsRow } from '@/components/tracker/MetricsRow';
import { EmptyState } from '@/components/tracker/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface Account {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  latestCount: number | null;
  change24h: number | null;
}

interface SnapshotData {
  handle: string;
  snapshots: { takenAt: string; followerCount: number }[];
  stats: {
    current: number | null;
    change: number | null;
    changePct: number | null;
    avgDailyGain: number | null;
    peakCount: number | null;
    peakDate: string | null;
  };
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    const res = await fetch('/api/accounts');
    if (res.ok) {
      const data: Account[] = await res.json();
      setAccounts(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0]?.id ?? null);
      }
    }
    setLoading(false);
  }, [selectedId]);

  const fetchSnapshots = useCallback(async (id: string) => {
    const res = await fetch(`/api/accounts/${id}/snapshots?days=30`);
    if (res.ok) {
      setSnapshotData(await res.json());
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => {
    if (selectedId) fetchSnapshots(selectedId);
  }, [selectedId, fetchSnapshots]);

  const handleAdd = async (handle: string): Promise<{ error?: string }> => {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    await fetchAccounts();
    setShowAddModal(false);
    return {};
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(accounts[0]?.id ?? null);
  };

  const selected = accounts.find((a) => a.id === selectedId);

  return (
    <>
      <Sidebar>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-sm font-semibold text-gray-900">Tracked Accounts</h1>
          <Button size="sm" onClick={() => setShowAddModal(true)}>+ Add</Button>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                {...account}
                selected={account.id === selectedId}
                onClick={() => setSelectedId(account.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Sidebar>

      <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {!loading && accounts.length === 0 ? (
          <EmptyState onAdd={() => setShowAddModal(true)} />
        ) : selected && snapshotData ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">@{selected.handle}</h2>
              {selected.displayName && (
                <p className="text-sm text-gray-500">{selected.displayName}</p>
              )}
            </div>
            <MetricsRow
              current={snapshotData.stats.current}
              change24h={selected.change24h}
              change7d={null}
              change30d={snapshotData.stats.change}
              avgDailyGain={snapshotData.stats.avgDailyGain}
            />
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Follower Count History</h3>
              <FollowerChart snapshots={snapshotData.snapshots} handle={selected.handle} />
            </div>
          </div>
        ) : null}
      </main>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Track Instagram Account">
        <AddAccountForm onAdd={handleAdd} onCancel={() => setShowAddModal(false)} />
      </Modal>
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/dashboard/
git commit -m "feat: add dashboard UI with account list, chart, and metrics"
```

---

## Task 10: Homepage (SEO-First)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Write `app/page.tsx`**

```typescript
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Instagram Followers Tracker — Track Any Account Free',
  description:
    'The best free Instagram followers tracker. Track follower counts, growth history, and unfollowers for any public Instagram account. No login required.',
  alternates: { canonical: 'https://instagramfollowerstracker.com' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the best Instagram follower tracker app?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Instagram Followers Tracker is the best free option — it tracks any public account, shows full growth history, and requires no login to view public stats.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I track Instagram follower growth for free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sign up for a free account, add any public Instagram handle, and our system automatically snapshots follower counts daily so you can see growth trends over time.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I track who unfollowed me on Instagram?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Our unfollow tracker shows you day-by-day follower changes so you can see exactly when drops occurred and estimate who unfollowed you.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the best free follower tracker for Instagram?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'This tool. Free users get 3 tracked accounts with 30 days of history. No credit card required.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I see my Instagram follower count history?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Add your account to the tracker. We snapshot follower counts daily and display them as an interactive chart. Pro plans unlock up to 1 year of history.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a website that tracks Instagram followers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — instagramfollowerstracker.com. Public pages for top accounts are available without an account. Sign up to track any account you choose.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I track followers and unfollowers on Instagram?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our tool tracks followers and unfollowers on Instagram by comparing daily snapshots. Add your account, and we show you every gain and loss on a timeline.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this work as an Instagram growth tracker?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The Instagram growth tracker feature shows daily, weekly, and monthly follower trends, average daily gain, and peak follower counts — everything you need to understand account growth.',
      },
    },
  ],
};

const features = [
  {
    icon: '📉',
    title: 'Unfollow Tracker',
    description: 'See exactly when followers drop. Know who unfollowed you by tracking day-by-day changes.',
  },
  {
    icon: '📈',
    title: 'Instagram Growth Tracker',
    description: 'Visualize follower growth over days, weeks, and months. Spot trends before your competition does.',
  },
  {
    icon: '🔢',
    title: 'Follower Count History',
    description: 'Every daily snapshot stored. See your full follower count tracker history going back up to a year.',
  },
  {
    icon: '🔔',
    title: 'New Followers Tracker',
    description: 'Get alerts when accounts hit milestones. Track spikes from viral posts in real time.',
  },
];

export default async function HomePage() {
  // Fetch top accounts for footer internal linking
  const topAccounts = await prisma.publicAccount
    .findMany({
      orderBy: { followerCount: 'desc' },
      take: 100,
      select: { handle: true },
    })
    .catch(() => []);

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
          Instagram Followers Tracker
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          The fastest ig follower tracker on the web. Track any public account — your own, a
          competitor's, or your favorite creator. See growth history, spot unfollowers, and
          understand what drives instagram follow tracker trends.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-8 py-4 text-lg hover:opacity-90 transition shadow-lg shadow-purple-200"
        >
          Start Tracking Free
        </Link>
        <p className="mt-3 text-sm text-gray-400">Free forever · No credit card · 3 accounts included</p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h2 className="font-semibold text-gray-900 mb-2">{f.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {faqSchema.mainEntity.map((item) => (
            <div key={item.name} className="border-b border-gray-100 pb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.acceptedAnswer.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer topAccounts={topAccounts} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add SEO-optimized homepage with FAQ JSON-LD and keyword targeting"
```

---

## Task 11: Robots + Sitemap

**Files:**
- Create: `app/robots.ts`, `app/sitemap.ts`

- [ ] **Step 1: Create `app/robots.ts`**

```typescript
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/api/', '/settings'],
      },
    ],
    sitemap: 'https://instagramfollowerstracker.com/sitemap.xml',
  };
}
```

- [ ] **Step 2: Create `app/sitemap.ts`**

```typescript
import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://instagramfollowerstracker.com';

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  const publicAccounts = await prisma.publicAccount
    .findMany({ select: { handle: true, lastChecked: true } })
    .catch(() => []);

  const accountPages: MetadataRoute.Sitemap = publicAccounts.map((a) => ({
    url: `${base}/${a.handle}`,
    lastModified: a.lastChecked ?? new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...accountPages];
}
```

- [ ] **Step 3: Commit**

```bash
git add app/robots.ts app/sitemap.ts
git commit -m "feat: add robots.txt and auto-generated sitemap"
```

---

## Task 12: Final Wiring + Deploy Check

- [ ] **Step 1: Add `next.config.ts` server-only guard for scraper**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: 'scontent.**.fbcdn.net' },
    ],
  },
  // Prevent Playwright from being bundled client-side
  serverExternalPackages: ['playwright', 'playwright-core'],
};

export default nextConfig;
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Fix any type errors before proceeding. Expected: 0 errors.

- [ ] **Step 3: Run dev server and smoke-test**

```bash
npm run dev
```

Navigate to:
- `http://localhost:3000` — homepage loads, H1 visible, FAQ renders
- `http://localhost:3000/dashboard` — redirects to sign-in (auth guard works)
- `http://localhost:3000/sitemap.xml` — returns XML
- `http://localhost:3000/robots.txt` — returns correct directives

- [ ] **Step 4: Final commit**

```bash
git add next.config.ts
git commit -m "feat: configure Next.js image domains and server-only packages"
```

- [ ] **Step 5: Deploy to Vercel**

```bash
vercel --prod
```

Set these env vars in the Vercel dashboard before deploying:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production URL)
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `CRON_SECRET` (generate with `openssl rand -base64 32`)
- `NEXT_PUBLIC_APP_URL`

After deploy, trigger the cron manually to verify it works:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/snapshot
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Next.js 14 App Router + TypeScript strict | Task 1 |
| Prisma schema (all 6 models) | Task 2 |
| PLAN_LIMITS enforced on writes | Task 6 (POST /api/accounts) |
| History depth gated by plan | Task 6 (GET snapshots) |
| Auth on every user route | Tasks 6–9 |
| Playwright scraper server-only | Task 5 + Task 12 next.config.ts |
| Scraper never called from API routes | Worker only — cron route calls worker |
| Handle normalization everywhere | Task 3 + Task 6 |
| Dashboard UI (list, chart, metrics) | Tasks 8–9 |
| Homepage SEO: H1, features, FAQ, JSON-LD | Task 10 |
| Robots.txt + sitemap | Task 11 |
| vercel.json cron config | Task 7 |
| .env.example documented | Task 1 |

**Gaps / Phase 2 items deferred intentionally:**
- Public SEO pages (`/[handle]`) — Phase 2, Task 8 in PRD
- Pricing page + Stripe — Phase 2
- Prisma seed (top 500 accounts) — Phase 2
- Wayback backfill — Phase 2
- Email alerts (Resend) — Phase 2
- Google OAuth — deferred per CLAUDE.md defaults
