// SERVER-SIDE ONLY. Never import in any client component or browser-facing code.

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

interface ScraperAttempt {
  source: 'web_profile_info' | 'html';
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
  profile_pic_url_hd?: string;
  profile_pic_url?: string;
  is_private?: boolean;
}

function profileFromUser(handle: string, user: IgUser): InstagramProfileData {
  return {
    handle,
    followerCount: user.edge_followed_by?.count ?? user.follower_count ?? null,
    followingCount: user.edge_follow?.count ?? user.following_count ?? null,
    postCount:
      user.edge_owner_to_timeline_media?.count ?? user.media_count ?? null,
    displayName: user.full_name ?? null,
    bio: user.biography ?? null,
    avatarUrl: user.profile_pic_url_hd ?? user.profile_pic_url ?? null,
    isPrivate: user.is_private ?? false,
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

export async function fetchInstagramProfile(
  handle: string
): Promise<InstagramProfileData> {
  const empty = emptyProfile(handle);
  const profileUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`;
  const pageUrl = `https://www.instagram.com/${handle}/`;
  const hasSession = Boolean(process.env.INSTAGRAM_SESSION_ID);

  // ── Primary: internal API endpoint ────────────────────────────────────────
  const apiModes = [
    { includeSession: true, keepHeaders: true, premium: false },
    ...(hasSession
      ? [{ includeSession: false, keepHeaders: true, premium: false }]
      : []),
    { includeSession: false, keepHeaders: true, premium: true },
  ];

  for (const mode of apiModes) {
    try {
      const res = await igFetch(profileUrl, mode);

      if (res.ok) {
        const data = (await res.json()) as { data?: { user?: IgUser } };
        const user = data?.data?.user;
        if (user && (user.edge_followed_by?.count ?? user.follower_count) != null) {
          return profileFromUser(handle, user);
        }
      }
    } catch {
      // try the next mode, then fall through to HTML fallback
    }
  }

  // ── Fallback: parse follower count from page HTML ─────────────────────────
  const htmlModes = [
    { render: true, includeSession: true, keepHeaders: true, premium: false },
    { render: true, includeSession: false, keepHeaders: false, premium: false },
    { render: true, includeSession: false, keepHeaders: false, premium: true },
  ];

  for (const mode of htmlModes) {
    try {
      const res = await igFetch(pageUrl, mode);

      if (res.ok) {
        const profile = profileFromHtml(handle, await res.text());
        if (profile.followerCount !== null) return profile;
      }
    } catch (err) {
      console.error(`[scraper] Failed to fetch @${handle}:`, err);
    }
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
            env: {
              hasSessionId: Boolean(process.env.INSTAGRAM_SESSION_ID),
              hasProxyUrl: Boolean(process.env.PROXY_URL),
            },
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
          env: {
            hasSessionId: Boolean(process.env.INSTAGRAM_SESSION_ID),
            hasProxyUrl: Boolean(process.env.PROXY_URL),
          },
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

  return {
    profile: emptyProfile(handle),
    attempts,
    env: {
      hasSessionId: Boolean(process.env.INSTAGRAM_SESSION_ID),
      hasProxyUrl: Boolean(process.env.PROXY_URL),
    },
  };
}
