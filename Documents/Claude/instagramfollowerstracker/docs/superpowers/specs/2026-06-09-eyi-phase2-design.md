# Phase 2: Meta EYI API Integration

**Date:** 2026-06-09  
**Status:** Approved — ready for implementation  
**Goal:** Build the EYI OAuth + webhook infrastructure and submit the FollowersTracker app to Meta for review, without touching the existing manual upload user flow.

---

## Context

Meta's Export Your Information (EYI) API lets users authorize a third-party app once via OAuth, after which Meta automatically pushes their Instagram followers/following data to a webhook on a recurring basis. This eliminates the manual upload friction entirely.

The schema is already fully prepared:
- `User.metaUserId String?`
- `User.eyiConnected Boolean @default(false)`
- `User.eyiConnectedAt DateTime?`
- `DataExport.source ExportSource` with `EYI_AUTO` variant
- `ExportSource` enum: `MANUAL_UPLOAD | EYI_AUTO | GOOGLE_DRIVE`

Meta's app review takes 4–6 weeks. The goal of this sprint is to build the infrastructure, deploy it, and submit — so approval arrives by the time we're ready to wire it into the user UI.

---

## What is NOT changing

- `UnfollowDetector` component — untouched
- `/api/exports` routes — untouched
- Dashboard UI — untouched
- Manual upload flow — continues to work identically

---

## New files

```
app/api/eyi/connect/route.ts     — initiates Meta OAuth
app/api/eyi/callback/route.ts    — handles OAuth callback, stores metaUserId
app/api/eyi/webhook/route.ts     — GET challenge verification + POST data delivery
lib/eyi-parser.ts                — adapts Meta webhook payload → ExportData
app/admin/eyi/page.tsx           — admin-only test + submission checklist panel
```

---

## Data flow

```
1. Admin navigates to /api/eyi/connect
2. → Redirected to Meta OAuth (scope: instagram_data_portability)
3. → Meta redirects to /api/eyi/callback?code=...&state=...
4. → CSRF state verified, code exchanged for token, metaUserId stored
5. → Redirected to /admin/eyi

Later, after Meta approval:
6. Meta pushes daily → POST /api/eyi/webhook
7. → x-hub-signature-256 verified (HMAC-SHA256 with META_APP_SECRET)
8. → payload parsed by eyi-parser → ExportData
9. → stored as DataExport (source: EYI_AUTO) + diff computed
10. → same downstream logic as manual upload (ghost following, fan detection, etc.)
```

---

## Route specifications

### GET /api/eyi/connect
- Requires authenticated session; redirects to `/dashboard` if not signed in
- Generates cryptographically random CSRF state token
- Stores state in httpOnly cookie `eyi_state` (10 min TTL, SameSite=Lax)
- Redirects to:
  ```
  https://www.facebook.com/dialog/oauth
    ?client_id={META_APP_ID}
    &redirect_uri={NEXT_PUBLIC_APP_URL}/api/eyi/callback
    &scope=instagram_data_portability
    &response_type=code
    &state={csrf_token}
  ```

### GET /api/eyi/callback
- Reads `code` and `state` from query params
- Verifies `state` matches `eyi_state` cookie; clears cookie on success or failure
- Exchanges `code` for user access token via `https://graph.facebook.com/oauth/access_token`
- Calls `https://graph.facebook.com/me?access_token=...` to get Meta user ID
- Updates User row: `metaUserId`, `eyiConnected: true`, `eyiConnectedAt: now()`
- Redirects to `/admin/eyi` (admin testing phase); will redirect to `/dashboard` post-approval

### GET /api/eyi/webhook (challenge verification)
- Checks `hub.mode === 'subscribe'`
- Checks `hub.verify_token === META_EYI_WEBHOOK_SECRET`
- Returns `hub.challenge` as plain text with status 200
- Returns 403 on any mismatch

### POST /api/eyi/webhook (data delivery)
- Reads raw body before JSON parsing (required for HMAC integrity check)
- Verifies `x-hub-signature-256` header: `sha256=HMAC-SHA256(META_APP_SECRET, rawBody)`
- Returns 401 on signature mismatch — no exceptions, no logging of payload
- Parses `entry[].id` to get Meta user ID
- Looks up User by `metaUserId`; returns 200 silently if not found (avoid Meta retries)
- Calls `parseEyiPayload()` → `ExportData`
- Stores `DataExport` with `source: EYI_AUTO` via existing export storage logic
- Runs `diffExports()` against previous export for same handle
- Returns 200 immediately; heavy work runs fire-and-forget

### lib/eyi-parser.ts
- Single export: `parseEyiPayload(payload: unknown): ExportData`
- Converts Meta's webhook JSON structure to `{ followers: ExportPerson[], following: ExportPerson[] }`
- Isolated adapter — if Meta's payload format differs from documentation, only this file changes
- Falls back to empty arrays on parse failure rather than throwing (prevents webhook retries for bad data)

---

## Admin test page (/admin/eyi)

Same two-layer auth as `/admin` (session email + admin password cookie). Four panels:

**1. Config status**
Shows green ✓ / red ✗ for each required env var without exposing values:
- `META_APP_ID`
- `META_APP_SECRET`
- `META_EYI_WEBHOOK_SECRET`

Red banner if any are missing.

**2. Meta submission checklist**
Copy-paste values for the Meta developer console:
- Webhook URL: `https://instagramfollowerstracker.com/api/eyi/webhook`
- Callback URL: `https://instagramfollowerstracker.com/api/eyi/callback`
- Verify token: value of `META_EYI_WEBHOOK_SECRET`
- Scope: `instagram_data_portability`
- Privacy policy: `https://instagramfollowerstracker.com/privacy`
- Terms: `https://instagramfollowerstracker.com/terms`

**3. OAuth test**
"Test OAuth flow →" button → navigates to `/api/eyi/connect`.
After completing OAuth, shows the admin user's `metaUserId` and `eyiConnectedAt` timestamp.

**4. Recent EYI deliveries**
Table of last 10 `DataExport` rows where `source = EYI_AUTO`.
Columns: handle, followerCount, followingCount, uploadedAt.
Empty state: "No deliveries yet — Meta will begin pushing after app approval."

---

## Env vars

```bash
META_APP_ID=""               # From FollowersTracker app dashboard on developers.facebook.com
META_APP_SECRET=""           # From FollowersTracker app dashboard
META_EYI_WEBHOOK_SECRET=""   # Any random string — openssl rand -hex 32
```

Add to `.env.local` and Vercel environment variables (production + preview).

---

## Meta submission steps (post-deploy)

1. Set the three env vars in Vercel and redeploy
2. Go to FollowersTracker app on developers.facebook.com → Add Product → Webhooks
3. Enter webhook URL and verify token → click "Verify and save" (hits GET handler)
4. Subscribe to `instagram_data_portability` topic
5. Go to App Review → Request permissions → `instagram_data_portability`
6. Use case: *"Help users track their own Instagram follower and unfollow history over time using their own data."*
7. Submit for review

Step 3 (webhook verification) works immediately on deploy — Meta hits the GET endpoint before review even begins.

---

## Security notes

- CSRF state token prevents OAuth callback hijacking
- Raw body must be read before `request.json()` — once parsed, HMAC cannot be verified
- Signature verification uses constant-time comparison to prevent timing attacks
- Webhook returns 200 even for unknown `metaUserId` — prevents Meta from retrying and exposing user existence
- `admin_auth` cookie gates the admin test page; metaUserId not exposed to non-admin sessions

---

## Risk: EYI payload format

Meta's EYI webhook payload structure is not fully public documentation. The `eyi-parser.ts` adapter is designed as an isolated layer so that if the actual format differs on first delivery, only one file needs updating. Recommend logging the raw payload (sanitized) on first few deliveries to confirm structure matches expectations.
