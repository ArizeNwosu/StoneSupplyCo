// SERVER-SIDE ONLY. Never import in any client component or browser-facing code.

export interface InstagramProfileData {
  handle: string;
  followerCount: number | null;
  followingCount: number | null;
  postCount: number | null;
  displayName: string | null;
  bio: string | null;
  externalUrl: string | null;     // ← new
  highlightCount: number | null;  // ← new
  isVerified: boolean;            // ← new
  category: string | null;        // ← new (e.g. "Musician/Band")
  pronouns: string[];             // ← new (e.g. ["she/her"])
  instagramUserId: string | null; // ← new (numeric pk — stable across username changes)
  avatarUrl: string | null;
  isPrivate: boolean;
  fetchedAt: Date;
}

interface ScraperAttempt {
  source: 'web_profile_info' | 'html' | 'apify';
  mode: string;
  ok: boolean;
  status: number | null;
  contentType: string | null;
  followerCount: number | null;
  error: string | null;
}

export interface InstagramProfileDebugResult {
  profile: InstagramProfileData;
  attempts: ScraperAttempt[];
  env: {
    hasSessionId: boolean;
    hasProxyUrl: boolean;
    hasApifyToken: boolean;
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildHeaders({ includeSession = true } = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'x-ig-app-id': '936619743392459',
    Origin: 'https://www.instagram.com',
    Referer: 'https://www.instagram.com/',
  };
  // Session cookie bypasses IP-based blocking on server/cloud IPs.
  // Set INSTAGRAM_SESSION_ID in env to a valid sessionid cookie value.
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  if (includeSession && sessionId) {
    headers['Cookie'] = `sessionid=${sessionId}`;
  }
  return headers;
}

// Route the request through PROXY_URL if set (ScraperAPI / URL-wrapper style).
// render=true tells ScraperAPI to execute JavaScript before returning HTML,
// which is needed for Instagram pages that load follower counts client-side.
async function igFetch(
  url: string,
  {
    timeoutMs = 20_000,
    render = false,
    includeSession = true,
    keepHeaders = true,
    premium = false,
  } = {}
): Promise<Response> {
  const proxy = process.env.PROXY_URL;
  const headers = buildHeaders({ includeSession });
  const signal = AbortSignal.timeout(timeoutMs);

  if (!proxy) {
    return fetch(url, { headers, signal });
  }

  let proxiedUrl = `${proxy}&url=${encodeURIComponent(url)}&country_code=us&device_type=mobile`;
  if (keepHeaders) proxiedUrl += '&keep_headers=true';
  if (render) proxiedUrl += '&render=true';
  if (premium || process.env.SCRAPERAPI_PREMIUM === 'true') {
    proxiedUrl += '&premium=true';
  }
  if (process.env.SCRAPERAPI_ULTRA_PREMIUM === 'true') {
    proxiedUrl += '&ultra_premium=true';
  }

  return fetch(proxiedUrl, { headers: keepHeaders ? headers : undefined, signal });
}

interface IgUser {
  edge_followed_by?: { count: number };
  follower_count?: number;
  edge_follow?: { count: number };
  following_count?: number;
  edge_owner_to_timeline_media?: { count: number };
  media_count?: number;
  full_name?: string;
  biography?: string;
  external_url?: string;           // ← new
  highlight_reel_count?: number;   // ← new
  is_verified?: boolean;           // ← new
  category?: string;               // ← new
  pronouns?: string[];             // ← new (Instagram returns this as an array)
  pk?: string | number;            // ← new (numeric Instagram user ID)
  profile_pic_url_hd?: string;
  profile_pic_url?: string;
  is_private?: boolean;
}

type ApifyProfile = Record<string, unknown>;

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
    isVerified: user.is_verified ?? false,
    category: user.category ?? null,
    pronouns: user.pronouns ?? [],
    instagramUserId: user.pk != null ? String(user.pk) : null,
    avatarUrl: user.profile_pic_url_hd ?? user.profile_pic_url ?? null,
    isPrivate: user.is_private ?? false,
    fetchedAt: new Date(),
  };
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.replace(/[^\d]/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function stringFromUnknown(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function booleanFromUnknown(value: unknown): boolean {
  return typeof value === 'boolean' ? value : false;
}

function firstNumber(item: ApifyProfile, keys: string[]): number | null {
  for (const key of keys) {
    const value = numberFromUnknown(item[key]);
    if (value !== null) return value;
  }
  return null;
}

function firstString(item: ApifyProfile, keys: string[]): string | null {
  for (const key of keys) {
    const value = stringFromUnknown(item[key]);
    if (value !== null) return value;
  }
  return null;
}

function profileFromApify(handle: string, item: ApifyProfile): InstagramProfileData {
  return {
    handle: firstString(item, ['username', 'handle']) ?? handle,
    followerCount: firstNumber(item, [
      'followersCount',
      'followers',
      'followerCount',
      'followers_count',
      'followedByCount',
    ]),
    followingCount: firstNumber(item, [
      'followsCount',
      'following',
      'followingCount',
      'following_count',
    ]),
    postCount: firstNumber(item, [
      'postsCount',
      'postCount',
      'post_count',
      'mediaCount',
      'media_count',
    ]),
    displayName: firstString(item, ['fullName', 'full_name', 'name']),
    bio: firstString(item, ['biography', 'bio']),
    externalUrl: firstString(item, ['externalUrl', 'external_url', 'websiteUrl', 'website']),
    highlightCount: firstNumber(item, ['highlightReelCount', 'highlight_reel_count']),
    isVerified: Boolean(item['isVerified'] ?? item['is_verified'] ?? false),
    category: firstString(item, ['category', 'businessCategory', 'business_category']),
    pronouns: Array.isArray(item['pronouns'])
      ? (item['pronouns'] as unknown[]).flatMap((p) =>
          typeof p === 'string' && p.length > 0 ? [p] : []
        )
      : [],
    instagramUserId: firstString(item, ['pk', 'userId', 'user_id']),
    avatarUrl: firstString(item, [
      'profilePicUrlHD',
      'profilePicUrl',
      'profile_pic_url_hd',
      'profile_pic_url',
    ]),
    isPrivate:
      booleanFromUnknown(item.isPrivate) || booleanFromUnknown(item.is_private),
    fetchedAt: new Date(),
  };
}

function emptyProfile(handle: string): InstagramProfileData {
  return {
    handle,
    followerCount: null,
    followingCount: null,
    postCount: null,
    displayName: null,
    bio: null,
    externalUrl: null,
    highlightCount: null,
    isVerified: false,
    category: null,
    pronouns: [],
    instagramUserId: null,
    avatarUrl: null,
    isPrivate: false,
    fetchedAt: new Date(),
  };
}

function profileFromHtml(handle: string, html: string): InstagramProfileData {
  const empty = emptyProfile(handle);
  const followerMatch =
    html.match(/"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)/) ??
    html.match(/"follower_count"\s*:\s*(\d+)/);
  const followingMatch =
    html.match(/"edge_follow"\s*:\s*\{\s*"count"\s*:\s*(\d+)/) ??
    html.match(/"following_count"\s*:\s*(\d+)/);
  const postMatch =
    html.match(
      /"edge_owner_to_timeline_media"\s*:\s*\{\s*"count"\s*:\s*(\d+)/
    ) ?? html.match(/"media_count"\s*:\s*(\d+)/);
  const nameMatch = html.match(/"full_name"\s*:\s*"([^"]+)"/);
  const privateMatch = html.match(/"is_private"\s*:\s*(true|false)/);

  return {
    ...empty,
    followerCount: followerMatch?.[1] ? parseInt(followerMatch[1], 10) : null,
    followingCount: followingMatch?.[1] ? parseInt(followingMatch[1], 10) : null,
    postCount: postMatch?.[1] ? parseInt(postMatch[1], 10) : null,
    displayName: nameMatch?.[1] ?? null,
    isPrivate: privateMatch?.[1] === 'true',
  };
}

function apifyEnv() {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID ?? 'apify/instagram-profile-scraper';
  return {
    token,
    actorId: actorId.replace('/', '~'),
  };
}

async function fetchApifyProfile(handle: string): Promise<{
  profile: InstagramProfileData;
  status: number | null;
  contentType: string | null;
  error: string | null;
}> {
  const { token, actorId } = apifyEnv();
  if (!token) {
    return {
      profile: emptyProfile(handle),
      status: null,
      contentType: null,
      error: 'APIFY_TOKEN is not configured',
    };
  }

  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [handle] }),
      signal: AbortSignal.timeout(45_000),
    }
  );
  const contentType = res.headers.get('content-type');

  if (!res.ok) {
    return {
      profile: emptyProfile(handle),
      status: res.status,
      contentType,
      error: `HTTP ${res.status}`,
    };
  }

  const items = (await res.json()) as ApifyProfile[];
  const item = Array.isArray(items) ? items[0] : null;
  const profile = item ? profileFromApify(handle, item) : emptyProfile(handle);

  return {
    profile,
    status: res.status,
    contentType,
    error: profile.followerCount === null ? 'No follower count in Apify result' : null,
  };
}

// Fetch multiple profiles in a single Apify run — use this in the cron worker
// instead of calling fetchInstagramProfile once per account (which would take
// 30-60 s per account and blow past the Vercel function time limit).
export async function fetchInstagramProfilesBatch(
  handles: string[]
): Promise<Map<string, InstagramProfileData>> {
  const result = new Map<string, InstagramProfileData>();
  if (handles.length === 0) return result;

  const { token, actorId } = apifyEnv();
  if (!token) {
    console.error('[scraper] APIFY_TOKEN not set — batch fetch skipped');
    return result;
  }

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: handles }),
        // Give Apify 4 min for a batch — well within the 5-min cron window
        signal: AbortSignal.timeout(240_000),
      }
    );

    if (!res.ok) {
      console.error(`[scraper] Apify batch HTTP ${res.status}`);
      return result;
    }

    const items = (await res.json()) as ApifyProfile[];
    for (const item of Array.isArray(items) ? items : []) {
      const profile = profileFromApify(String(item.username ?? ''), item);
      if (profile.handle) result.set(profile.handle.toLowerCase(), profile);
    }
  } catch (err) {
    console.error('[scraper] Apify batch failed:', err);
  }

  return result;
}

function debugEnv() {
  return {
    hasSessionId: Boolean(process.env.INSTAGRAM_SESSION_ID),
    hasProxyUrl: Boolean(process.env.PROXY_URL),
    hasApifyToken: Boolean(process.env.APIFY_TOKEN),
  };
}

export async function fetchInstagramProfile(
  handle: string
): Promise<InstagramProfileData> {
  const empty = emptyProfile(handle);

  // ── Primary: Apify (no session cookie, maintenance-free) ──────────────────
  if (process.env.APIFY_TOKEN) {
    try {
      const apify = await fetchApifyProfile(handle);
      if (apify.profile.followerCount !== null) return apify.profile;
      console.error(`[scraper] Apify returned no data for @${handle}: ${apify.error}`);
    } catch (err) {
      console.error(`[scraper] Apify failed for @${handle}:`, err);
    }
  }

  // ── Fallback: direct fetch via proxy (no session required) ────────────────
  const profileUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`;
  const pageUrl = `https://www.instagram.com/${handle}/`;

  try {
    const res = await igFetch(profileUrl, { includeSession: false, keepHeaders: true, premium: true });
    if (res.ok) {
      const data = (await res.json()) as { data?: { user?: IgUser } };
      const user = data?.data?.user;
      if (user && (user.edge_followed_by?.count ?? user.follower_count) != null) {
        return profileFromUser(handle, user);
      }
    }
  } catch {
    // fall through to HTML
  }

  try {
    const res = await igFetch(pageUrl, { render: true, includeSession: false, keepHeaders: false, premium: true });
    if (res.ok) {
      const profile = profileFromHtml(handle, await res.text());
      if (profile.followerCount !== null) return profile;
    }
  } catch (err) {
    console.error(`[scraper] All methods failed for @${handle}:`, err);
  }

  return empty;
}

export async function debugInstagramProfileFetch(
  handle: string
): Promise<InstagramProfileDebugResult> {
  const attempts: ScraperAttempt[] = [];
  const profileUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`;
  const pageUrl = `https://www.instagram.com/${handle}/`;
  const hasSession = Boolean(process.env.INSTAGRAM_SESSION_ID);

  const apiModes = [
    {
      label: 'headers+session',
      options: { includeSession: true, keepHeaders: true, premium: false },
    },
    ...(hasSession
      ? [
          {
            label: 'headers-no-session',
            options: { includeSession: false, keepHeaders: true, premium: false },
          },
        ]
      : []),
    {
      label: 'headers-no-session-premium',
      options: { includeSession: false, keepHeaders: true, premium: true },
    },
  ];

  for (const mode of apiModes) {
    try {
      const res = await igFetch(profileUrl, mode.options);
      const contentType = res.headers.get('content-type');

      if (res.ok) {
        const data = (await res.json()) as { data?: { user?: IgUser } };
        const user = data?.data?.user;
        const profile = user ? profileFromUser(handle, user) : emptyProfile(handle);
        attempts.push({
          source: 'web_profile_info',
          mode: mode.label,
          ok: profile.followerCount !== null,
          status: res.status,
          contentType,
          followerCount: profile.followerCount,
          error: profile.followerCount === null ? 'No follower count in JSON' : null,
        });
        if (profile.followerCount !== null) {
          return {
            profile,
            attempts,
            env: debugEnv(),
          };
        }
      } else {
        attempts.push({
          source: 'web_profile_info',
          mode: mode.label,
          ok: false,
          status: res.status,
          contentType,
          followerCount: null,
          error: `HTTP ${res.status}`,
        });
      }
    } catch (err) {
      attempts.push({
        source: 'web_profile_info',
        mode: mode.label,
        ok: false,
        status: null,
        contentType: null,
        followerCount: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const htmlModes = [
    {
      label: 'headers+session+render',
      options: { render: true, includeSession: true, keepHeaders: true, premium: false },
    },
    {
      label: 'proxy-managed-headers+render',
      options: { render: true, includeSession: false, keepHeaders: false, premium: false },
    },
    {
      label: 'proxy-managed-headers+render+premium',
      options: { render: true, includeSession: false, keepHeaders: false, premium: true },
    },
  ];

  for (const mode of htmlModes) {
    try {
      const res = await igFetch(pageUrl, mode.options);
      const contentType = res.headers.get('content-type');

      if (!res.ok) {
        attempts.push({
          source: 'html',
          mode: mode.label,
          ok: false,
          status: res.status,
          contentType,
          followerCount: null,
          error: `HTTP ${res.status}`,
        });
        continue;
      }

      const profile = profileFromHtml(handle, await res.text());
      attempts.push({
        source: 'html',
        mode: mode.label,
        ok: profile.followerCount !== null,
        status: res.status,
        contentType,
        followerCount: profile.followerCount,
        error: profile.followerCount === null ? 'No follower count in HTML' : null,
      });

      if (profile.followerCount !== null) {
        return {
          profile,
          attempts,
          env: debugEnv(),
        };
      }
    } catch (err) {
      attempts.push({
        source: 'html',
        mode: mode.label,
        ok: false,
        status: null,
        contentType: null,
        followerCount: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (process.env.APIFY_TOKEN) {
    try {
      const apify = await fetchApifyProfile(handle);
      attempts.push({
        source: 'apify',
        mode: apifyEnv().actorId,
        ok: apify.profile.followerCount !== null,
        status: apify.status,
        contentType: apify.contentType,
        followerCount: apify.profile.followerCount,
        error: apify.error,
      });

      if (apify.profile.followerCount !== null) {
        return {
          profile: apify.profile,
          attempts,
          env: debugEnv(),
        };
      }
    } catch (err) {
      attempts.push({
        source: 'apify',
        mode: apifyEnv().actorId,
        ok: false,
        status: null,
        contentType: null,
        followerCount: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    profile: emptyProfile(handle),
    attempts,
    env: debugEnv(),
  };
}

/**
 * Returns the top-50 most recently followed account handles for a public account.
 * Instagram shows the following list in reverse-chronological order.
 * Returns an empty array if the list is hidden or the request fails.
 */
export async function fetchFollowingList(handle: string): Promise<string[]> {
  try {
    const profileUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`;
    const profileRes = await igFetch(profileUrl, { timeoutMs: 15_000, includeSession: false, keepHeaders: true });
    if (!profileRes.ok) return [];

    const profileJson = await profileRes.json() as { data?: { user?: { id?: string } } };
    const userId = profileJson?.data?.user?.id;
    if (!userId) return [];

    await sleep(2000 + Math.random() * 3000);

    const followingUrl = `https://i.instagram.com/api/v1/friendships/${userId}/following/?count=50`;
    const followingRes = await igFetch(followingUrl, { timeoutMs: 15_000, includeSession: false, keepHeaders: true });
    if (!followingRes.ok) return [];

    const followingJson = await followingRes.json() as { users?: Array<{ username?: string }> };
    const users = followingJson?.users ?? [];
    return users.map((u) => u.username ?? '').filter(Boolean).slice(0, 50);
  } catch (err) {
    console.error(`[scraper:following] failed for @${handle}:`, err);
    return [];
  }
}
