## Instagram Followers Tracker

Next.js App Router app for tracking public Instagram follower counts and
owned-account unfollower diffs.

### Local Development

```bash
npm run dev
```

Open `http://localhost:3000`.

### Automated Follower Collection

Production collection is designed to be username-only for users. Add a public
Instagram handle, then the app takes an immediate snapshot and Vercel cron keeps
collecting daily snapshots.

Set these Vercel environment variables for the recommended Apify collector:

```bash
APIFY_TOKEN=apify_api_...
APIFY_ACTOR_ID=apify/instagram-profile-scraper
SCRAPER_PROVIDER=apify
```

`APIFY_ACTOR_ID` defaults to `apify/instagram-profile-scraper` if omitted.
Set `SCRAPER_PROVIDER=direct` only when you want to bypass Apify and use the
direct/proxy Instagram fetch flow first.

The daily cron route is `/api/cron/snapshot` and is configured in `vercel.json`.

### Verification

```bash
npm run lint
npm run build
```
