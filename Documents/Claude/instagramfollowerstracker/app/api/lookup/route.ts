import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseHandle, isValidHandle } from '@/lib/handles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('handle') ?? '';
  const handle = parseHandle(raw);

  if (!handle || !isValidHandle(handle)) {
    return NextResponse.json({ error: 'Invalid handle' }, { status: 400 });
  }

  if (req.nextUrl.searchParams.get('debug') === 'scraper') {
    const { debugInstagramProfileFetch } = await import('@/lib/scraper');
    const result = await debugInstagramProfileFetch(handle);
    return NextResponse.json({
      handle,
      displayName: result.profile.displayName,
      followerCount: result.profile.followerCount,
      fromCache: false,
      scraper: {
        attempts: result.attempts,
        env: result.env,
      },
    });
  }

  // Check seeded public accounts first — fastest path
  const publicAccount = await prisma.publicAccount.findUnique({
    where: { handle },
    select: { followerCount: true, displayName: true },
  });

  if (publicAccount?.followerCount) {
    return NextResponse.json({
      handle,
      displayName: publicAccount.displayName,
      followerCount: publicAccount.followerCount,
      fromCache: true,
    });
  }

  // Fall back to any user's tracked snapshots for this handle (public accounts only)
  const tracked = await prisma.trackedAccount.findFirst({
    where: { handle, isPublic: true },
    include: {
      snapshots: { orderBy: { takenAt: 'desc' }, take: 1, select: { followerCount: true } },
    },
  });

  const followerCount = tracked?.snapshots[0]?.followerCount ?? null;

  return NextResponse.json({
    handle,
    displayName: tracked?.displayName ?? null,
    followerCount,
    fromCache: followerCount !== null,
  });
}
