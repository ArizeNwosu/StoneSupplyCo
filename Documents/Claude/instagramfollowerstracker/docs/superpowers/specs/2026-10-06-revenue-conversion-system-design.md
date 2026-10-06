# Revenue Conversion System Design

**Date:** 2026-10-06

**Status:** Approved in conversation; pending written-spec review

**Product:** Instagram Followers Tracker

## Objective

Convert the existing activated free-user base into recurring revenue without buying more traffic. The system must identify the product behavior that creates purchase intent, preserve that intent through authentication and Stripe Checkout, run compliant lifecycle outreach from the service's IONOS mailbox, ingest replies, and show conversion and response metrics in the admin dashboard.

The first 30-day target is 15 real subscriptions, excluding owner/test accounts: 10 core Pro subscriptions and 5 Stalker Mode subscriptions.

## Product Decisions

- Keep the name **Stalker Mode**.
- Keep the free account useful. Monetize identity-level insights, exports, additional accounts, timely alerts, and agency workflows.
- Lead Pro upgrade prompts with the result being unlocked rather than a generic feature list.
- Keep the existing plan prices as the default. A configurable founding-user promotion may override the displayed and charged price only when a corresponding Stripe Price ID is configured.
- Present Daily Stalker Mode as the primary recommendation while retaining the existing six-hour and hourly choices behind a secondary “More frequencies” control.
- Do not introduce a generic free trial in this release.
- Do not automatically reply to customer email. Replies enter an admin inbox for human handling.
- No live outreach is sent until an operator explicitly enables it in production.

## Success Metrics

The admin dashboard will report both counts and conversion rates for non-test users:

- Activated users: users with at least one tracked account and at least one snapshot.
- Paywall view to checkout click.
- Checkout click to Checkout Session creation.
- Checkout Session creation to completion.
- Checkout expiration and abandonment by plan, interval, trigger, and campaign.
- Active subscriptions, new monthly recurring revenue, cancellation count, and net subscriber growth.
- Stalker Mode paywall, Checkout, completion, and cancellation funnel.
- Outreach queued, sent, failed, replied, unsubscribed, and converted.
- Revenue and subscriptions attributed to campaign and message.

Test-account exclusion uses a comma-separated `REVENUE_TEST_EMAILS` environment variable. Exclusion affects reporting and campaign eligibility, but does not change Stripe or application access.

## Architecture

The system has six bounded modules:

1. **Revenue events** record immutable behavioral and billing events.
2. **Checkout attribution** preserves intent and associates Stripe objects with triggers and campaigns.
3. **Lifecycle campaign rules** decide which users are eligible for which messages.
4. **Outreach delivery** queues and sends email through IONOS SMTP.
5. **Reply ingestion** polls the IONOS mailbox over IMAP and associates replies with sent messages.
6. **Admin reporting** aggregates funnels, subscriptions, campaigns, and replies.

Each module communicates through database records. Stripe webhooks and scheduled jobs must be idempotent.

## Data Model

### RevenueEvent

An append-only event ledger:

- `id`
- `userId` nullable for anonymous pricing views
- `type`
- `source` nullable, such as `pricing`, `account_limit`, `unfollowers`, `export`, `stalker`, or `email`
- `plan` nullable
- `interval` nullable
- `campaignId` nullable
- `outreachMessageId` nullable
- `stripeCustomerId` nullable
- `stripeCheckoutSessionId` nullable
- `stripeSubscriptionId` nullable
- `properties` JSON for bounded metadata
- `occurredAt`

Supported initial event types:

- `SIGNUP_COMPLETED`
- `ACTIVATION_COMPLETED`
- `PAYWALL_VIEWED`
- `PRICING_VIEWED`
- `CHECKOUT_CLICKED`
- `CHECKOUT_CREATED`
- `CHECKOUT_COMPLETED`
- `CHECKOUT_EXPIRED`
- `SUBSCRIPTION_ACTIVATED`
- `SUBSCRIPTION_CANCELED`
- `OUTREACH_QUEUED`
- `OUTREACH_SENT`
- `OUTREACH_FAILED`
- `OUTREACH_REPLIED`
- `OUTREACH_UNSUBSCRIBED`

Event ingestion accepts an optional idempotency key. Stripe event IDs, Checkout Session IDs, and browser event IDs prevent duplicates.

### CheckoutAttempt

Represents purchase intent independently of Stripe Customer creation:

- User, plan, interval, source, and optional campaign/message attribution
- Status: `CLICKED`, `CREATED`, `COMPLETED`, `EXPIRED`, `FAILED`
- Stripe Checkout Session, Customer, and Subscription IDs
- Failure category and sanitized failure message
- Created, updated, completed, and expired timestamps

The application creates the local attempt first, validates the configured Stripe Price, then creates or reuses a Stripe Customer and creates the Checkout Session. A failed price lookup therefore never creates a misleading Stripe Customer.

### OutreachCampaign

Defines an operator-visible campaign:

- Stable key and display name
- Trigger type and delay
- Enabled flag
- Subject and template key
- Optional offer code/price reference
- Daily send cap
- Created and updated timestamps

Initial campaigns:

1. `welcome_activation_help`
2. `activated_free_value`
3. `unfollower_result_upgrade`
4. `abandoned_core_checkout`
5. `abandoned_stalker_checkout`
6. `founding_user_offer`
7. `subscription_onboarding`
8. `cancellation_feedback`

### OutreachMessage

One immutable campaign delivery attempt per user and campaign occurrence:

- User and campaign
- Status: `QUEUED`, `SENDING`, `SENT`, `FAILED`, `REPLIED`, `SUPPRESSED`, `CANCELED`
- Unique reply token
- Provider message ID and RFC `Message-ID`
- Attempt count and last error category
- Scheduled, sent, replied, and resolved timestamps
- Reply classification: `PRICE`, `TRUST`, `VALUE`, `TECHNICAL`, `CHANGED_MIND`, `INTERESTED`, `OTHER`
- Admin state: `NEEDS_RESPONSE`, `RESPONDED`, `RESOLVED`
- Conversion timestamp and attributed subscription ID

A database uniqueness constraint prevents duplicate sends for the same campaign occurrence.

### OutreachReply

- Outreach message relation
- IMAP UID and mailbox UID validity
- Sender address
- Received timestamp
- Sanitized plain-text body
- Raw subject
- In-reply-to and references headers
- Created timestamp

The application stores only the content required to answer and classify the reply. Attachments and remote images are not downloaded.

### OutreachSuppression

- Normalized email
- Reason: `UNSUBSCRIBED`, `BOUNCED`, `COMPLAINT`, `ADMIN`
- Source message and timestamp

## Funnel Tracking

### Browser events

A small authenticated `/api/revenue/events` route accepts an allowlisted event type and bounded properties. Client components use a helper that creates a browser idempotency ID. Failure to record analytics never blocks the user action.

Server-side events remain authoritative for signup, activation, Checkout creation, Stripe completion/expiration, and subscription state.

### Contextual sources

Every checkout request includes a source:

- `pricing`
- `settings`
- `account_limit`
- `unfollowers`
- `export`
- `seven_day_summary`
- `stalker`
- `email`

The source is copied into `CheckoutAttempt`, Checkout Session metadata, Subscription metadata, and revenue events.

## Checkout Intent Preservation

When an unauthenticated user selects a paid plan, the browser stores a short-lived, validated intent containing plan, interval, source, and optional campaign attribution. It then navigates to signup/sign-in with a safe same-origin `returnTo` value.

After successful signup or sign-in:

1. The client validates and consumes the pending intent.
2. It calls the checkout route.
3. It redirects to Stripe Checkout.
4. If creation fails, the intent remains available for a retry and the user sees a specific error.

Open redirects are prevented by accepting only relative paths generated by application code.

## Stripe Lifecycle

The webhook continues to verify the raw request body. It will additionally handle:

- `checkout.session.completed`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

The webhook records the Stripe event ID before processing and treats repeated delivery as success. Subscription access is derived from Stripe status:

- Grant paid access for `active` and `trialing`.
- Retain access for `past_due` during Stripe's recovery window while displaying a billing warning.
- Remove access for `unpaid`, `canceled`, and `incomplete_expired`.

Checkout and subscription metadata provide the primary user mapping. Stored Customer and Subscription IDs are fallbacks.

## Conversion Surfaces

### Unfollower results

Free users see aggregate counts after processing: unfollowers, new followers, non-followers, and stopped-following counts. Identity rows and exports remain locked with a result-specific Pro CTA.

### Account limit

The second-account attempt shows the account the user tried to add, the value of comparing both accounts, and direct monthly/annual checkout choices.

### Seven-day summary

After sufficient history exists, a dismissible summary highlights material gains/losses and promotes the paid action relevant to that result. A dismissal suppresses the same prompt for seven days. At most one upgrade modal appears per session.

### Stalker Mode

The product name remains Stalker Mode. The purchase card:

- Leads with the outcome and a realistic example alert.
- Recommends Daily at $4.99/month.
- Places six-hour and hourly frequencies under a secondary expansion control.
- States when monitoring begins, that only public profile data is checked, and that no Instagram login is required.
- Tracks view, frequency selection, checkout click, creation, expiration, and completion.

## Lifecycle Outreach

### Eligibility

The campaign evaluator runs on a schedule and enqueues messages only when all conditions pass:

- Outreach is enabled.
- User is not a test account or suppressed.
- User has not already received the same campaign occurrence.
- User still matches the behavioral trigger.
- The campaign-specific cooldown has elapsed.
- The global per-user frequency cap has not been exceeded.

Default frequency cap: no more than two promotional lifecycle emails per user in seven days. Transactional subscription onboarding and requested authentication emails do not count against this cap.

### Message content

Templates are version-controlled React-free server templates that render both plain text and minimal HTML. Every promotional message includes:

- The service identity and reason for the message
- A single outcome-specific CTA
- A working unsubscribe URL
- The physical/company contact information configured in environment variables
- A reply invitation where feedback is requested

### Sending

IONOS settings are configurable, with official defaults:

- SMTP host: `smtp.ionos.com`
- SMTP port: `465`
- SMTP encryption: SSL/TLS
- IMAP host: `imap.ionos.com`
- IMAP port: `993`
- IMAP encryption: SSL/TLS
- Username: full mailbox address

IONOS also supports SMTP port 587 with STARTTLS. TLS certificate verification remains enabled.

The sender worker claims a bounded batch using database state, marks each row `SENDING`, sends it, and records the provider message ID. Stale `SENDING` rows return to `QUEUED` after a timeout. Transient failures retry with backoff; authentication and policy failures stop retries and surface prominently in admin.

### Dry-run controls

- `OUTREACH_ENABLED=false` prevents queue creation and sends.
- `OUTREACH_DRY_RUN=true` evaluates campaigns and records preview rows without opening SMTP connections.
- `OUTREACH_ALLOWLIST` restricts recipients during staging.
- Admin pages show the active mode.

## Reply Ingestion

A protected cron route connects to IMAP and examines messages newer than the stored mailbox cursor. Matching priority:

1. Unique token in the reply-to address, when a same-domain alias/catch-all is configured.
2. RFC `In-Reply-To` and `References` headers.
3. A signed token embedded in the original subject as a fallback.

Each IMAP message is deduplicated by mailbox UID validity and UID. Quoted history is trimmed from the stored plain-text preview where possible. The original mailbox message is left intact. The poller never marks unrelated mail deleted.

If plus-addressing or catch-all aliases are unavailable, replies use the service mailbox and header matching.

## Unsubscribe

An opaque, signed token identifies the user and campaign without exposing an email address. `GET /unsubscribe` shows a confirmation page; `POST /api/outreach/unsubscribe` performs the suppression. One-click email-client unsubscribe headers may call a dedicated POST route.

Suppression is checked at queue time and again immediately before sending. An unsubscribe never deletes product data or terminates a paid subscription.

## Scheduled Jobs

Vercel Cron invokes protected Node.js routes using the existing cron-secret pattern:

- Campaign evaluation: daily
- Outreach sending: every 15 minutes
- IMAP reply ingestion: every 10 minutes
- Stripe reconciliation: daily

Each job is safe to run concurrently and returns counts, durations, and sanitized error categories. Batch sizes and execution time limits are configurable.

## Admin Dashboard

The existing admin page gains navigation between Users, Revenue, Campaigns, and Replies.

### Revenue

- Real active subscribers and MRR
- New, canceled, and net subscriptions by period
- Funnel table by source, plan, and interval
- Checkout failure and expiration categories
- Stalker Mode funnel
- Signup and activation cohorts

### Campaigns

- Enabled state, trigger, delay, send cap, and template version
- Eligible, queued, sent, failed, replied, unsubscribed, converted
- Reply and conversion rates
- Attributed subscription count and MRR
- Dry-run previews before enabling a campaign

### Replies

- Sender, campaign, received time, preview, classification, and status
- Filters for needs response, responded, resolved, and campaign
- Admin actions to classify and change state
- A `mailto:` response action; the application does not send operator replies automatically

## Security and Privacy

- SMTP and IMAP credentials remain server-only environment variables.
- Cron routes use constant-time secret comparison through the existing cron-auth helper.
- Admin APIs retain the existing signed-in admin and admin-cookie gates.
- Email bodies are escaped before HTML rendering.
- Reply bodies are rendered as plain text, never injected as HTML.
- Event properties are allowlisted and size-limited.
- URLs in campaign messages are same-origin and signed where needed.
- Logs contain internal IDs and error categories, not email bodies or credentials.
- Data retention for reply bodies defaults to 180 days and is configurable.

## Environment Variables

- `IONOS_SMTP_HOST` default `smtp.ionos.com`
- `IONOS_SMTP_PORT` default `465`
- `IONOS_IMAP_HOST` default `imap.ionos.com`
- `IONOS_IMAP_PORT` default `993`
- `IONOS_EMAIL_USER`
- `IONOS_EMAIL_PASSWORD`
- `OUTREACH_FROM_NAME`
- `OUTREACH_REPLY_TO`
- `OUTREACH_COMPANY_ADDRESS`
- `OUTREACH_ENABLED`
- `OUTREACH_DRY_RUN`
- `OUTREACH_ALLOWLIST`
- `REVENUE_TEST_EMAILS`
- Optional founding-user Stripe Price IDs for supported plans and intervals

## Testing

Development follows test-driven implementation.

### Unit tests

- Event validation and idempotency
- Campaign eligibility and frequency caps
- Test-account and suppression exclusion
- Template escaping and unsubscribe links
- Checkout-intent validation
- Stripe status-to-access mapping
- Reply token signing and matching
- Email reply parsing and quoted-text trimming
- Revenue aggregation

### Integration tests

- Checkout attempt creation and Stripe metadata
- Webhook replay idempotency
- Campaign evaluation to queued message
- Dry-run sender without an SMTP connection
- SMTP adapter with a local fake server
- IMAP ingestion with recorded MIME fixtures
- Unsubscribe suppression before send
- Reply association and admin state changes

### End-to-end tests

- Logged-out pricing choice survives signup and reaches the intended Checkout request.
- Free user sees an aggregate result, hits the contextual paywall, and starts attributed Checkout.
- Stalker Mode Daily checkout carries correct attribution.
- Admin revenue and campaign dashboards render seeded metrics.

No test may send mail to a real address or call live Stripe mutation APIs.

## Rollout

1. Deploy schema, event collection, and dashboards with outreach disabled.
2. Observe funnel data for at least 48 hours and verify test-account exclusion.
3. Enable campaign evaluation in dry-run mode and inspect the proposed recipients/content.
4. Add the operator mailbox credentials and send only to the allowlist.
5. Verify SMTP delivery, unsubscribe, IMAP reply matching, and admin reply display.
6. Enable abandoned-checkout outreach with a small daily cap.
7. Enable behavior-triggered campaigns one at a time.
8. Review conversion and complaint/unsubscribe metrics weekly.

## Acceptance Criteria

- Every paid CTA supplies an attribution source and produces a measurable funnel.
- Selected paid intent survives signup/sign-in.
- Invalid Stripe price configuration cannot create a new Stripe Customer.
- Stripe webhook replay does not duplicate events or subscription changes.
- Stalker Mode remains the public product name and Daily is its primary offer.
- Campaign evaluation is deterministic, deduplicated, and suppresses unsubscribed/test users.
- Dry-run mode cannot establish an SMTP connection.
- No production mail is sent merely by deploying the feature.
- Replies are matched, displayed, and classifiable in admin without deleting mailbox messages.
- Admin shows funnel, campaign, reply, subscription, and attributed-revenue metrics.
- Unit, integration, end-to-end tests, lint, and production build pass.
