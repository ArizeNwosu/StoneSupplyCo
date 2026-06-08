import { NextResponse } from 'next/server';
import { z } from 'zod';

const Body = z.object({ url: z.string().min(1) });

function parseShortcode(raw: string): string | null {
  const cleaned = raw.trim();
  // bare shortcode
  if (/^[A-Za-z0-9_-]{5,15}$/.test(cleaned)) return cleaned;
  // full URL: /p/CODE/ or /reel/CODE/ or /tv/CODE/
  const match = cleaned.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

function extractVideoUrl(html: string): string | null {
  const patterns = [
    /"video_url"\s*:\s*"(https:\\?\/\\?\/[^"]+scontent[^"]+\.mp4[^"]*)"/,
    /"playback_url"\s*:\s*"(https:\\?\/\\?\/[^"]+\.mp4[^"]*)"/,
    /<meta\s+property="og:video:secure_url"\s+content="([^"]+)"/,
    /<meta\s+property="og:video"\s+content="([^"]+)"/,
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m?.[1]) {
      // unescape JSON unicode escapes
      return m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    }
  }
  return null;
}

function extractThumbnail(html: string): string | null {
  const m =
    html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/) ??
    html.match(/"display_url"\s*:\s*"(https[^"]+)"/);
  return m?.[1]?.replace(/\\u0026/g, '&').replace(/\\\//g, '/') ?? null;
}

function extractCaption(html: string): string | null {
  const m =
    html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/) ??
    html.match(/"edge_media_to_caption".*?"text"\s*:\s*"([^"]{0,300})/);
  if (!m?.[1]) return null;
  return m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

async function scrapePost(shortcode: string): Promise<{ videoUrl: string | null; thumbnail: string | null; caption: string | null }> {
  const url = `https://www.instagram.com/p/${shortcode}/`;
  const proxy = process.env.PROXY_URL;

  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://www.instagram.com/',
  };

  let fetchUrl = url;
  if (proxy) {
    fetchUrl = `${proxy}&url=${encodeURIComponent(url)}&render=true&premium=true`;
  }

  try {
    const res = await fetch(fetchUrl, {
      headers: proxy ? headers : headers,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return { videoUrl: null, thumbnail: null, caption: null };
    const html = await res.text();
    return {
      videoUrl: extractVideoUrl(html),
      thumbnail: extractThumbnail(html),
      caption: extractCaption(html),
    };
  } catch {
    return { videoUrl: null, thumbnail: null, caption: null };
  }
}

async function apifyPost(shortcode: string): Promise<{ videoUrl: string | null; thumbnail: string | null; caption: string | null }> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return { videoUrl: null, thumbnail: null, caption: null };

  // Use the generic instagram-scraper which supports post direct URLs
  const actorId = 'apify~instagram-scraper';
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directUrls: [postUrl],
          resultsType: 'posts',
          resultsLimit: 1,
        }),
        signal: AbortSignal.timeout(45_000),
      }
    );
    if (!res.ok) return { videoUrl: null, thumbnail: null, caption: null };
    const items = (await res.json()) as Record<string, unknown>[];
    const item = Array.isArray(items) ? items[0] : null;
    if (!item) return { videoUrl: null, thumbnail: null, caption: null };

    const videoUrl =
      (item.videoUrl as string | undefined) ??
      (item.video_url as string | undefined) ??
      null;
    const thumbnail =
      (item.displayUrl as string | undefined) ??
      (item.thumbnailUrl as string | undefined) ??
      (item.display_url as string | undefined) ??
      null;
    const caption =
      (item.caption as string | undefined) ??
      ((item.edge_media_to_caption as Record<string, unknown>)?.edges as unknown[])?.map?.((e) =>
        ((e as Record<string, unknown>).node as Record<string, unknown>)?.text
      )?.[0] as string | undefined ??
      null;

    return { videoUrl: videoUrl ?? null, thumbnail: thumbnail ?? null, caption: typeof caption === 'string' ? caption.slice(0, 300) : null };
  } catch {
    return { videoUrl: null, thumbnail: null, caption: null };
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request. Provide an Instagram post URL.' }, { status: 400 });
  }

  const shortcode = parseShortcode(parsed.data.url);
  if (!shortcode) {
    return NextResponse.json(
      { error: 'Could not parse an Instagram post URL. Paste a link like https://www.instagram.com/p/ABC123/' },
      { status: 400 }
    );
  }

  // Try HTML scrape first, fall back to Apify
  let result = await scrapePost(shortcode);
  if (!result.videoUrl && process.env.APIFY_TOKEN) {
    result = await apifyPost(shortcode);
  }

  if (!result.videoUrl) {
    return NextResponse.json(
      {
        error: 'Could not extract a download link from this post. The post may be private, deleted, or not a video.',
        shortcode,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    shortcode,
    videoUrl: result.videoUrl,
    thumbnail: result.thumbnail,
    caption: result.caption,
    postUrl: `https://www.instagram.com/p/${shortcode}/`,
  });
}
