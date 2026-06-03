// SERVER-SIDE ONLY. Never import in any client component or browser-facing code.
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

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
          const json = (await response.json()) as {
            data?: {
              user?: {
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
              };
            };
          };
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
          // Silently ignore JSON parse errors from non-profile responses
        }
      }
    });

    await page.goto(`https://www.instagram.com/${handle}/`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });

    // Fallback: parse follower count from meta description if JSON intercept missed
    if (followerCount === null) {
      const metaDesc = await page.getAttribute(
        'meta[name="description"]',
        'content'
      );
      if (metaDesc) {
        const match = metaDesc.match(/([\d,.]+[KMB]?)\s+Followers/i);
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
