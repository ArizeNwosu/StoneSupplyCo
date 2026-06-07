import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCollectorToken } from '@/lib/collector-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const account = await prisma.trackedAccount.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, handle: true, userId: true },
  });

  if (!account) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const token = createCollectorToken({
    userId: account.userId,
    accountId: account.id,
    handle: account.handle,
  });
  const endpoint = new URL('/api/collector/browser', req.nextUrl.origin).toString();
  const bookmarklet = buildBookmarklet({
    endpoint,
    token,
    handle: account.handle,
  });

  return NextResponse.json({
    handle: account.handle,
    endpoint,
    token,
    bookmarklet,
  });
}

function buildBookmarklet({
  endpoint,
  token,
  handle,
}: {
  endpoint: string;
  token: string;
  handle: string;
}) {
  const script = `
(() => {
  const endpoint = ${JSON.stringify(endpoint)};
  const token = ${JSON.stringify(token)};
  const targetHandle = ${JSON.stringify(handle)};
  const pathHandle = location.pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (!/instagram\\.com$/i.test(location.hostname) && !/\\.instagram\\.com$/i.test(location.hostname)) {
    alert('Open this bookmarklet on an Instagram profile page.');
    return;
  }
  if (pathHandle && pathHandle !== targetHandle) {
    if (!confirm('This collector is for @' + targetHandle + '. Capture @' + pathHandle + ' anyway?')) return;
  }
  const sources = [
    document.querySelector('meta[property="og:description"]')?.content,
    document.querySelector('meta[name="description"]')?.content,
    document.body?.innerText
  ].filter(Boolean);
  const parse = (text) => {
    const match = String(text).match(/([\\d,.]+)\\s*([KMB])?\\s*(?:followers|Followers)/);
    if (!match) return null;
    const n = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(n)) return null;
    const unit = (match[2] || '').toUpperCase();
    const multiplier = unit === 'K' ? 1e3 : unit === 'M' ? 1e6 : unit === 'B' ? 1e9 : 1;
    return Math.round(n * multiplier);
  };
  const followerCount = sources.map(parse).find((value) => value !== null);
  if (!followerCount) {
    alert('Could not find a follower count on this page. Open the profile header and try again.');
    return;
  }
  fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      token,
      handle: pathHandle || targetHandle,
      followerCount
    })
  })
    .then((res) => res.json().then((body) => ({ res, body })))
    .then(({ res, body }) => {
      if (!res.ok) throw new Error(body.error || 'Capture failed');
      alert('Captured @' + body.handle + ': ' + body.followerCount.toLocaleString() + ' followers');
    })
    .catch((err) => alert(err.message || 'Capture failed'));
})();`;

  return `javascript:${encodeURIComponent(script)}`;
}
