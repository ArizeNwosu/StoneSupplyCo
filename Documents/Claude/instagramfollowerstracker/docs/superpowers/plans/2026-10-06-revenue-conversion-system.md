# Revenue Conversion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an attributed subscription funnel, contextual paid conversion surfaces, automated IONOS lifecycle outreach with reply ingestion, and an admin revenue dashboard.

**Architecture:** PostgreSQL is the durable boundary between event collection, Stripe billing, campaign evaluation, SMTP delivery, IMAP ingestion, and reporting. Route handlers perform authenticated user mutations, Stripe webhooks reconcile billing idempotently, and protected Vercel Cron routes process bounded batches. Outreach stays disabled and dry-run-only until an operator deliberately enables it.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript 5.9, Prisma 7/PostgreSQL, Stripe 22, Nodemailer, ImapFlow, mailparser, Node test runner, Playwright, Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-10-06-revenue-conversion-system-design.md`

## Global Constraints

- Keep the public product name **Stalker Mode**.
- Do not introduce a generic free trial.
- Do not send live email from tests, builds, previews, or the first production deployment.
- `OUTREACH_ENABLED=false` and `OUTREACH_DRY_RUN=true` are the safe defaults.
- Promotional outreach must honor suppression immediately and include unsubscribe controls.
- Test accounts configured through `REVENUE_TEST_EMAILS` never appear in revenue metrics or campaign eligibility.
- Create a Stripe Customer only after the requested Price ID is validated.
- All Stripe webhook processing and scheduled work must be idempotent.
- Store reply text only; never download attachments or render reply HTML.
- Read relevant files in `node_modules/next/dist/docs/` before changing Next.js route, cookie, or page conventions.

## Review Focus

1. Replayed Stripe webhooks must return success without duplicating events, attempts, or subscription changes; Task 4 pins this with a repeated-event integration test.
2. A user unsubscribing after queue creation but before delivery must still be suppressed; Task 8 checks suppression again at send time.
3. Two concurrent cron invocations must not send the same message; Task 8 tests atomic message claiming and stale-lock recovery.
4. Malformed or hostile email content must remain plain text and bounded in storage/admin rendering; Task 9 tests HTML-only messages, attachments, quoting, and oversized bodies.
5. A logged-out paid-plan click must survive both password signup and password sign-in without accepting an external redirect; Task 5 tests intent recovery and open-redirect rejection.

---

### Task 1: Test Harness and Revenue Domain Types

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tests/revenue-domain.test.ts`
- Create: `lib/revenue/types.ts`
- Create: `lib/revenue/config.ts`

**Interfaces:**
- Produces: `RevenueEventType`, `CheckoutSource`, `isRevenueTestEmail(email)`, `getOutreachMode()`.
- Consumes: environment variables only.

- [ ] **Step 1: Write the failing configuration tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { isRevenueTestEmail, getOutreachMode } from '@/lib/revenue/config';

test('test-account matching is normalized', () => {
  process.env.REVENUE_TEST_EMAILS = 'Owner@Example.com, test@example.com ';
  assert.equal(isRevenueTestEmail('owner@example.com'), true);
  assert.equal(isRevenueTestEmail('real@example.com'), false);
});

test('outreach defaults to disabled dry-run mode', () => {
  delete process.env.OUTREACH_ENABLED;
  delete process.env.OUTREACH_DRY_RUN;
  assert.deepEqual(getOutreachMode(), { enabled: false, dryRun: true, allowlist: [] });
});
```

- [ ] **Step 2: Add the revenue test command and verify RED**

Add `"test:revenue": "node --import tsx --test tests/revenue-*.test.ts"` to `scripts`.

Run: `npm run test:revenue`

Expected: FAIL because `lib/revenue/config.ts` does not exist.

- [ ] **Step 3: Implement normalized configuration and domain unions**

Define allowlisted event/source string unions in `types.ts`. Implement exact boolean parsing in `config.ts`; only the literal string `true` enables outreach and dry-run defaults to true unless explicitly `false`.

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:revenue`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tests/revenue-domain.test.ts lib/revenue/types.ts lib/revenue/config.ts
git commit -m "test: add revenue domain foundation"
```

### Task 2: Revenue and Outreach Database Schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261006_add_revenue_conversion_system/migration.sql`
- Create: `tests/revenue-schema.test.ts`

**Interfaces:**
- Produces: Prisma models `RevenueEvent`, `CheckoutAttempt`, `ProcessedStripeEvent`, `OutreachCampaign`, `OutreachMessage`, `OutreachReply`, `OutreachSuppression`, `OutreachMailboxCursor` and their enums.
- Consumes: existing `User`, `Plan`, and Stripe identifier fields.

- [ ] **Step 1: Write a failing Prisma schema contract test**

Read `prisma/schema.prisma` and assert the required models, unique keys, indexes, enum members, and relations exist. Include assertions for `RevenueEvent.idempotencyKey @unique`, `ProcessedStripeEvent.stripeEventId @id`, a unique campaign occurrence key, and mailbox UID deduplication.

- [ ] **Step 2: Verify RED**

Run: `npm run test:revenue -- --test-name-pattern="schema"`

Expected: FAIL naming the first missing model.

- [ ] **Step 3: Add schema models and SQL migration**

Use explicit PostgreSQL indexes for user/time, event type/time, checkout status/time, campaign/status/scheduled time, and reply admin status/time. Store bounded metadata in `Json?`. Add cascade behavior only for records that cannot remain meaningful after user deletion; preserve aggregate-safe billing/event rows by using nullable user relations where appropriate.

- [ ] **Step 4: Generate and validate Prisma**

Run: `npx prisma format && npx prisma validate && npx prisma generate`

Expected: all commands succeed.

- [ ] **Step 5: Verify GREEN**

Run: `npm run test:revenue -- --test-name-pattern="schema"`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20261006_add_revenue_conversion_system/migration.sql tests/revenue-schema.test.ts
git commit -m "feat: add revenue and outreach data model"
```

### Task 3: Revenue Event Recording and Activation

**Files:**
- Create: `lib/revenue/events.ts`
- Create: `app/api/revenue/events/route.ts`
- Modify: `app/api/auth/signup/route.ts`
- Modify: `app/api/accounts/route.ts`
- Create: `tests/revenue-events.test.ts`

**Interfaces:**
- Produces: `recordRevenueEvent(input)`, `RevenueEventInput`, authenticated `POST /api/revenue/events`.
- Consumes: Task 1 domain types and Task 2 Prisma model.

- [ ] **Step 1: Write failing event validation and idempotency tests**

Cover allowlisted browser events, rejection of server-only event types, 4 KB properties limit, unknown source rejection, and duplicate idempotency keys returning the existing event.

- [ ] **Step 2: Verify RED**

Run: `npm run test:revenue -- --test-name-pattern="revenue event"`

Expected: FAIL because `recordRevenueEvent` is missing.

- [ ] **Step 3: Implement the event service and authenticated route**

The route accepts only `PAYWALL_VIEWED`, `PRICING_VIEWED`, and `CHECKOUT_CLICKED`. It derives `userId` from `auth()`, never from the body. `recordRevenueEvent` catches Prisma's unique-key error and returns the existing record.

- [ ] **Step 4: Record authoritative signup and first-activation events**

After successful user creation, record `SIGNUP_COMPLETED`. After a user's first tracked account obtains its first snapshot, record `ACTIVATION_COMPLETED` with a deterministic idempotency key `activation:<userId>`.

- [ ] **Step 5: Verify GREEN and existing parser tests**

Run: `npm run test:revenue && npm run test:parser`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/revenue/events.ts app/api/revenue/events/route.ts app/api/auth/signup/route.ts app/api/accounts/route.ts tests/revenue-events.test.ts
git commit -m "feat: record revenue funnel events"
```

### Task 4: Attributed and Idempotent Stripe Lifecycle

**Files:**
- Create: `lib/revenue/checkout.ts`
- Create: `lib/revenue/subscriptions.ts`
- Modify: `app/api/stripe/checkout/route.ts`
- Modify: `app/api/stalker/subscribe/route.ts`
- Modify: `app/api/stripe/webhook/route.ts`
- Create: `tests/revenue-stripe.test.ts`

**Interfaces:**
- Produces: `createCheckoutAttempt`, `markCheckoutCreated`, `mapStripeStatusToAccess`, `processStripeEvent`.
- Consumes: Task 2 models and Task 3 event recorder.

- [ ] **Step 1: Write failing checkout-order and subscription-state tests**

Use injected Stripe/Prisma fakes to prove:

```ts
test('invalid price never creates a Stripe customer', async () => {
  const stripe = fakeStripe();
  await assert.rejects(() => createAttributedCheckout({ priceId: 'missing', stripe }));
  assert.equal(stripe.customers.create.calls.length, 0);
});
```

Also test access mapping for `active`, `trialing`, `past_due`, `unpaid`, `canceled`, and `incomplete_expired`.

- [ ] **Step 2: Verify RED**

Run: `npm run test:revenue -- --test-name-pattern="Stripe"`

Expected: FAIL because the services do not exist.

- [ ] **Step 3: Refactor checkout creation behind an injected service**

Validate plan, interval, source, and price before creating a customer. Create `CheckoutAttempt` before Stripe mutation. Copy `attemptId`, `userId`, `plan`, `interval`, `source`, `campaignId`, and `outreachMessageId` into Checkout and Subscription metadata.

- [ ] **Step 4: Make webhook processing idempotent and complete**

Within a transaction, claim `event.id` in `ProcessedStripeEvent`. Handle completed/expired Checkout, subscription created/updated/deleted, and invoice success/failure. Replayed events return HTTP 200 without repeated state transitions.

- [ ] **Step 5: Test repeated webhook delivery**

Call `processStripeEvent` twice with the same Stripe event. Assert one processed-event row, one checkout completion event, and one plan mutation.

- [ ] **Step 6: Verify GREEN**

Run: `npm run test:revenue`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/revenue/checkout.ts lib/revenue/subscriptions.ts app/api/stripe/checkout/route.ts app/api/stalker/subscribe/route.ts app/api/stripe/webhook/route.ts tests/revenue-stripe.test.ts
git commit -m "feat: attribute and reconcile Stripe lifecycle"
```

### Task 5: Preserve Checkout Intent Across Authentication

**Files:**
- Create: `lib/revenue/checkout-intent.ts`
- Create: `components/pricing/PendingCheckout.tsx`
- Modify: `components/pricing/CheckoutButton.tsx`
- Modify: `app/auth/signup/page.tsx`
- Modify: `app/auth/signin/page.tsx`
- Modify: `app/pricing/page.tsx`
- Create: `tests/checkout-intent.test.ts`
- Modify: `tests/e2e/public.spec.ts`

**Interfaces:**
- Produces: `saveCheckoutIntent`, `readCheckoutIntent`, `clearCheckoutIntent`, `safeReturnTo`.
- Consumes: attributed checkout route from Task 4.

- [ ] **Step 1: Write failing serialization and redirect-safety tests**

Test expiration, invalid plan/interval/source, corrupt JSON, safe relative paths, and rejection of `https://evil.example`, `//evil.example`, encoded protocol-relative URLs, and backslash variants.

- [ ] **Step 2: Verify RED**

Run: `npm run test:revenue -- --test-name-pattern="checkout intent"`

Expected: FAIL because the helper is missing.

- [ ] **Step 3: Implement short-lived session-storage intent**

Persist versioned JSON with a 30-minute expiry. On a 401 response, store intent and navigate to `/auth/signin?returnTo=/pricing?resumeCheckout=1`. Signup/sign-in preserve the safe return target.

- [ ] **Step 4: Add resume component**

`PendingCheckout` consumes the intent once authenticated, posts it to checkout, redirects to Stripe, and retains the intent on recoverable failure.

- [ ] **Step 5: Add Playwright coverage**

Intercept `/api/stripe/checkout`, simulate logged-out selection and authenticated return, and assert the original plan, interval, and source are posted. Add an external-return URL test that lands on `/dashboard` instead.

- [ ] **Step 6: Verify GREEN**

Run: `npm run test:revenue && npx playwright test tests/e2e/public.spec.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/revenue/checkout-intent.ts components/pricing/PendingCheckout.tsx components/pricing/CheckoutButton.tsx app/auth/signup/page.tsx app/auth/signin/page.tsx app/pricing/page.tsx tests/checkout-intent.test.ts tests/e2e/public.spec.ts
git commit -m "feat: preserve checkout intent through authentication"
```

### Task 6: Contextual Paywalls and Stalker Mode Offer

**Files:**
- Create: `components/pricing/RevenueEventBeacon.tsx`
- Create: `components/tracker/ResultPaywall.tsx`
- Create: `lib/revenue/prompt-caps.ts`
- Modify: `components/tracker/UpgradeModal.tsx`
- Modify: `components/tracker/UnfollowDetector.tsx`
- Modify: `components/tracker/StalkerUpgradeCard.tsx`
- Modify: `app/dashboard/page.tsx`
- Create: `tests/prompt-caps.test.ts`
- Modify: `tests/e2e/dashboard.spec.ts`

**Interfaces:**
- Produces: `canShowPrompt`, `dismissPrompt`, result-specific CTA components.
- Consumes: revenue event route and checkout source contract.

- [ ] **Step 1: Write failing prompt-cap tests**

Assert one modal per session, seven-day dismissal by prompt key, independent suppression between prompt types, and graceful behavior when storage is unavailable.

- [ ] **Step 2: Verify RED**

Run: `npm run test:revenue -- --test-name-pattern="prompt"`

Expected: FAIL.

- [ ] **Step 3: Implement prompt caps and event beacon**

The beacon posts once per stable event key and does not block rendering or checkout.

- [ ] **Step 4: Add contextual copy and attribution**

Show computed aggregate counts to free users while keeping identity rows and exports locked. Update account-limit and seven-day prompts to name the observed result. Pass `unfollowers`, `export`, `account_limit`, or `seven_day_summary` into checkout.

- [ ] **Step 5: Simplify Stalker Mode without renaming it**

Show Daily as the primary $4.99 option, a sample alert, start-time/privacy copy, and a collapsed “More frequencies” control for six-hour/hourly plans. Record view, selection, click, creation, expiration, and completion sources as `stalker`.

- [ ] **Step 6: Verify component behavior with Playwright**

Test aggregate-results visibility, locked identities, source attribution, dismissal cooldown, Daily default, and expansion of other Stalker frequencies.

- [ ] **Step 7: Run verification**

Run: `npm run test:revenue && npx playwright test tests/e2e/dashboard.spec.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add components/pricing/RevenueEventBeacon.tsx components/tracker/ResultPaywall.tsx lib/revenue/prompt-caps.ts components/tracker/UpgradeModal.tsx components/tracker/UnfollowDetector.tsx components/tracker/StalkerUpgradeCard.tsx app/dashboard/page.tsx tests/prompt-caps.test.ts tests/e2e/dashboard.spec.ts
git commit -m "feat: add contextual subscription paywalls"
```

### Task 7: Campaign Rules, Templates, and Unsubscribe

**Files:**
- Create: `lib/outreach/eligibility.ts`
- Create: `lib/outreach/templates.ts`
- Create: `lib/outreach/tokens.ts`
- Create: `lib/outreach/campaigns.ts`
- Create: `app/unsubscribe/page.tsx`
- Create: `app/api/outreach/unsubscribe/route.ts`
- Create: `app/api/outreach/one-click-unsubscribe/route.ts`
- Create: `tests/revenue-outreach.test.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Produces: `evaluateCampaigns(now)`, `renderOutreachTemplate`, `signOutreachToken`, `verifyOutreachToken`, unsubscribe routes.
- Consumes: campaign/message/suppression models and revenue events.

- [ ] **Step 1: Write failing eligibility tests**

Cover all eight campaign triggers, test-account exclusion, suppression, paid-user exclusion where relevant, duplicate occurrence prevention, two-per-seven-day promotional cap, and transactional-message exemption.

- [ ] **Step 2: Write failing template/security tests**

Assert HTML escaping, plain-text output, same-origin signed unsubscribe link, configured company address, stable reply token, and bounded subject/body lengths.

- [ ] **Step 3: Verify RED**

Run: `npm run test:revenue -- --test-name-pattern="outreach"`

Expected: FAIL.

- [ ] **Step 4: Implement deterministic eligibility and campaign seeds**

Use injected `now` and database access. Campaign creation is idempotent by stable key. `OUTREACH_ENABLED=false` returns counts without enqueuing. Dry-run enqueues preview messages marked as dry-run and never deliverable.

- [ ] **Step 5: Implement templates and unsubscribe**

Every promotional template renders one CTA, service identity, reason for contact, physical contact information, visible unsubscribe URL, and `List-Unsubscribe` values. POST suppression is idempotent.

- [ ] **Step 6: Test post-queue suppression**

Queue a message, unsubscribe its recipient, call the delivery-eligibility guard, and assert the message becomes `SUPPRESSED`.

- [ ] **Step 7: Verify GREEN**

Run: `npm run test:revenue`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/outreach app/unsubscribe app/api/outreach tests/revenue-outreach.test.ts prisma/seed.ts
git commit -m "feat: add lifecycle campaigns and unsubscribe"
```

### Task 8: IONOS SMTP Delivery and Cron Processing

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lib/outreach/smtp.ts`
- Create: `lib/outreach/sender.ts`
- Create: `app/api/cron/outreach-evaluate/route.ts`
- Create: `app/api/cron/outreach-send/route.ts`
- Modify: `vercel.json`
- Create: `tests/revenue-sender.test.ts`

**Interfaces:**
- Produces: `createSmtpTransport`, `claimOutreachBatch`, `sendOutreachBatch`.
- Consumes: Task 7 renderer/eligibility and existing `verifyCronRequest` pattern.

- [ ] **Step 1: Install mail transport dependency**

Run: `npm install nodemailer && npm install -D @types/nodemailer`

Expected: dependency manifests update successfully.

- [ ] **Step 2: Write failing safe-mode and claiming tests**

Assert disabled and dry-run modes never construct a transport. Simulate concurrent claims and assert a message appears in only one batch. Assert stale `SENDING` messages return to the queue, current locks do not, and suppression after queue creation prevents sending.

- [ ] **Step 3: Verify RED**

Run: `npm run test:revenue -- --test-name-pattern="sender"`

Expected: FAIL.

- [ ] **Step 4: Implement IONOS transport and sender**

Default to `smtp.ionos.com:465` with `secure: true`, authenticated by the full mailbox address. Support port 587 only when configured, using STARTTLS. Require TLS certificate validation. Attach `Message-ID`, reply token, and unsubscribe headers.

- [ ] **Step 5: Implement atomic bounded batch processing**

Use a transaction and status/update guard to claim rows. Retry transient network/4xx SMTP errors with bounded exponential backoff. Mark authentication and policy errors terminal and store only sanitized categories.

- [ ] **Step 6: Add protected cron routes and schedules**

Evaluation runs daily. Sender runs every 15 minutes. Both return JSON counts and duration and use `verifyCronRequest`.

- [ ] **Step 7: Verify with fake transport**

Inject a fake transporter and assert envelope sender, recipient, headers, plain/HTML content, and status transitions. Do not connect to IONOS.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json lib/outreach/smtp.ts lib/outreach/sender.ts app/api/cron/outreach-evaluate/route.ts app/api/cron/outreach-send/route.ts vercel.json tests/revenue-sender.test.ts
git commit -m "feat: deliver lifecycle outreach through IONOS"
```

### Task 9: IONOS IMAP Reply Ingestion

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lib/outreach/reply-parser.ts`
- Create: `lib/outreach/imap.ts`
- Create: `lib/outreach/replies.ts`
- Create: `app/api/cron/outreach-replies/route.ts`
- Modify: `vercel.json`
- Create: `tests/fixtures/outreach-replies/*.eml`
- Create: `tests/revenue-replies.test.ts`

**Interfaces:**
- Produces: `parseReply`, `matchReplyToMessage`, `ingestMailboxReplies`.
- Consumes: signed reply tokens and Task 2 mailbox/message/reply models.

- [ ] **Step 1: Install IMAP and MIME dependencies**

Run: `npm install imapflow mailparser && npm install -D @types/mailparser`

Expected: dependency manifests update successfully.

- [ ] **Step 2: Add MIME fixtures and failing parser tests**

Fixtures cover plain text, HTML-only, `In-Reply-To`, `References`, subject token, quoted reply, attachment, malformed sender, and a body exceeding the storage limit. Assert HTML becomes sanitized text, attachments are ignored, quoting is trimmed, and bodies are truncated deterministically.

- [ ] **Step 3: Verify RED**

Run: `npm run test:revenue -- --test-name-pattern="reply"`

Expected: FAIL.

- [ ] **Step 4: Implement matching and deduplication**

Match token, then RFC headers, then signed subject token. Deduplicate with mailbox UID validity plus UID. Update message to `REPLIED`, create `OUTREACH_REPLIED`, and leave unrelated mail untouched.

- [ ] **Step 5: Implement IMAP adapter and protected cron**

Default to `imap.ionos.com:993` with TLS. Fetch only messages after the durable cursor in bounded batches. Advance the cursor only through successfully examined UIDs. Never delete or move mailbox messages.

- [ ] **Step 6: Verify GREEN**

Run: `npm run test:revenue`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json lib/outreach/reply-parser.ts lib/outreach/imap.ts lib/outreach/replies.ts app/api/cron/outreach-replies/route.ts vercel.json tests/fixtures/outreach-replies tests/revenue-replies.test.ts
git commit -m "feat: ingest IONOS outreach replies"
```

### Task 10: Stripe Reconciliation and Conversion Attribution

**Files:**
- Create: `lib/revenue/reconcile.ts`
- Create: `app/api/cron/stripe-reconcile/route.ts`
- Modify: `vercel.json`
- Create: `tests/revenue-reconcile.test.ts`

**Interfaces:**
- Produces: `reconcileStripeSubscriptions`, `attributeOutreachConversion`.
- Consumes: Stripe client, checkout attempts, outreach messages, subscription mapper.

- [ ] **Step 1: Write failing reconciliation tests**

Cover missing webhooks, an active Stripe subscription with a stale free DB plan, canceled subscriptions, unknown customers, duplicate reconciliation, and attribution to the most recent eligible outreach click within 30 days.

- [ ] **Step 2: Verify RED**

Run: `npm run test:revenue -- --test-name-pattern="reconcile"`

Expected: FAIL.

- [ ] **Step 3: Implement read-only Stripe scan plus local repair**

Page through subscriptions, map by metadata then stored IDs, update local access only when needed, and emit idempotent repair events. Never create, cancel, or modify Stripe subscriptions from reconciliation.

- [ ] **Step 4: Implement campaign attribution**

On completion, prefer explicit Checkout metadata. Otherwise attribute the latest clicked outreach message within 30 days. Store the subscription and conversion timestamp on the message.

- [ ] **Step 5: Add daily protected cron and verify GREEN**

Run: `npm run test:revenue`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/revenue/reconcile.ts app/api/cron/stripe-reconcile/route.ts vercel.json tests/revenue-reconcile.test.ts
git commit -m "feat: reconcile subscriptions and campaign revenue"
```

### Task 11: Admin Revenue, Campaign, and Reply APIs

**Files:**
- Create: `lib/admin-auth.ts`
- Create: `lib/revenue/reporting.ts`
- Create: `app/api/admin/revenue/route.ts`
- Create: `app/api/admin/campaigns/route.ts`
- Create: `app/api/admin/replies/route.ts`
- Create: `app/api/admin/replies/[id]/route.ts`
- Create: `tests/revenue-reporting.test.ts`

**Interfaces:**
- Produces: `getRevenueReport(range)`, `getCampaignReport(range)`, `getReplyInbox(filters)` and admin JSON routes.
- Consumes: all durable records from Tasks 2–10.

- [ ] **Step 1: Extract and test shared admin authorization**

Require both the configured admin email and existing `admin_auth` cookie. API routes return 401/403 JSON instead of redirects.

- [ ] **Step 2: Write failing aggregate tests**

Seed real and test users, completed/expired attempts, campaigns, replies, cancellations, and Stalker subscriptions. Assert test users are excluded, denominators are explicit, MRR uses active monthly-equivalent prices, and zero-denominator rates return 0 rather than `NaN`.

- [ ] **Step 3: Verify RED**

Run: `npm run test:revenue -- --test-name-pattern="report"`

Expected: FAIL.

- [ ] **Step 4: Implement reporting queries and routes**

Support `7d`, `30d`, and `all` ranges. Return summary cards, funnel rows, cohorts, campaign outcomes, Stalker funnel, environment safety state, and paginated replies.

- [ ] **Step 5: Implement reply state mutation**

Allow only classification and admin-state enum transitions. Do not accept or render arbitrary HTML. Record `respondedAt` and `resolvedAt` consistently.

- [ ] **Step 6: Verify GREEN**

Run: `npm run test:revenue`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/admin-auth.ts lib/revenue/reporting.ts app/api/admin/revenue app/api/admin/campaigns app/api/admin/replies tests/revenue-reporting.test.ts
git commit -m "feat: expose admin revenue and outreach reporting"
```

### Task 12: Admin Revenue Dashboard and Reply Inbox

**Files:**
- Modify: `app/admin/page.tsx`
- Modify: `app/admin/AdminTable.tsx`
- Create: `app/admin/AdminDashboard.tsx`
- Create: `app/admin/RevenuePanel.tsx`
- Create: `app/admin/CampaignPanel.tsx`
- Create: `app/admin/ReplyInbox.tsx`
- Modify: `tests/e2e/dashboard.spec.ts`

**Interfaces:**
- Produces: tabbed Users, Revenue, Campaigns, Replies interface.
- Consumes: Task 11 APIs.

- [ ] **Step 1: Add failing Playwright admin fixtures/tests**

Mock admin APIs and assert:

- Revenue cards exclude test accounts and label the selected date range.
- Funnel rows show numerator, denominator, and rate.
- Campaign rows show dry-run/enabled state.
- Reply text renders literally rather than as HTML.
- Reply classification/state updates call the expected PATCH route.

- [ ] **Step 2: Verify RED**

Run: `npx playwright test tests/e2e/dashboard.spec.ts --grep="admin revenue"`

Expected: FAIL because tabs/panels do not exist.

- [ ] **Step 3: Implement tabbed admin shell**

Keep user management intact. Add range selector, loading, empty, error, and retry states. Make safety mode visible above campaign data.

- [ ] **Step 4: Implement Revenue and Campaign panels**

Use compact tables and summary cards. Do not introduce a chart dependency; use accessible labeled bars or tables for cohorts/funnels.

- [ ] **Step 5: Implement Reply Inbox**

Provide filters, plain-text preview, classification, needs-response/responded/resolved controls, and a `mailto:` action populated with the recipient and reply subject.

- [ ] **Step 6: Verify GREEN**

Run: `npx playwright test tests/e2e/dashboard.spec.ts --grep="admin revenue"`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/admin tests/e2e/dashboard.spec.ts
git commit -m "feat: add admin revenue and outreach dashboard"
```

### Task 13: Production Configuration and Operator Runbook

**Files:**
- Create: `.env.example`
- Create: `docs/revenue-operations.md`
- Modify: `README.md`
- Create: `tests/revenue-config-docs.test.ts`

**Interfaces:**
- Produces: operator setup, dry-run review, enablement, rollback, and incident procedures.
- Consumes: environment contract from Tasks 1, 8, and 9.

- [ ] **Step 1: Write failing environment-documentation contract test**

Assert every environment variable read by `lib/revenue` and `lib/outreach` appears in `.env.example` and the runbook, without secret values.

- [ ] **Step 2: Verify RED**

Run: `npm run test:revenue -- --test-name-pattern="configuration documentation"`

Expected: FAIL because the files/keys are missing.

- [ ] **Step 3: Document exact IONOS and rollout setup**

Include SMTP 465 SSL/TLS, optional 587 STARTTLS, IMAP 993 SSL/TLS, full mailbox username, Vercel env setup, sender-domain restriction, allowlist smoke test, dry-run inspection, enablement, unsubscribe verification, reply verification, disabling, and credential rotation.

- [ ] **Step 4: Document campaign operation**

Include how to inspect eligibility previews, enable one campaign, read funnel denominators, classify replies, exclude test accounts, and respond through `mailto:`.

- [ ] **Step 5: Verify GREEN**

Run: `npm run test:revenue`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .env.example docs/revenue-operations.md README.md tests/revenue-config-docs.test.ts
git commit -m "docs: add revenue outreach operations runbook"
```

### Task 14: Full Verification and Safe Release Gate

**Files:**
- Modify as required only for failures directly caused by Tasks 1–13.

**Interfaces:**
- Produces: a buildable, tested release with outreach disabled by default.
- Consumes: every preceding task.

- [ ] **Step 1: Confirm no real-send path is enabled**

Run a configuration test with all outreach environment variables absent and assert disabled/dry-run mode. Search production code for any default enabling behavior.

- [ ] **Step 2: Run unit and integration tests**

Run: `npm run test:revenue && npm run test:parser`

Expected: PASS with zero live network calls.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: exit 0 with no new warnings from changed files.

- [ ] **Step 4: Run end-to-end tests**

Run: `npm run test:e2e`

Expected: PASS.

- [ ] **Step 5: Run the production build**

Run: `npm run build`

Expected: Prisma generation and Next.js production build both succeed.

- [ ] **Step 6: Inspect migration and working-tree scope**

Run: `git diff --check && git status --short && git diff --stat HEAD~13..HEAD`

Expected: only intended revenue-conversion files are changed; no temporary credentials or generated secrets exist.

- [ ] **Step 7: Produce deployment handoff**

Report migration command, required environment keys, Vercel Cron changes, dry-run smoke-test procedure, explicit operator step needed to enable outreach, test/build output, and known risks. Do not deploy or enable sending without a separate explicit request.
