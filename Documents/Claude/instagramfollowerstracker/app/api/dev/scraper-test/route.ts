import { NextRequest, NextResponse } from 'next/server';
import { debugInstagramProfileFetch } from '@/lib/scraper';
import { parseHandle, isValidHandle } from '@/lib/handles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const configuredSecret =
    process.env.SCRAPER_TEST_SECRET ?? process.env.CRON_SECRET;

  if (!configuredSecret) {
    return process.env.NODE_ENV !== 'production';
  }

  const bearer = req.headers.get('authorization');
  const querySecret = req.nextUrl.searchParams.get('secret');

  return (
    bearer === `Bearer ${configuredSecret}` ||
    querySecret === configuredSecret
  );
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const handle = parseHandle(
    req.nextUrl.searchParams.get('handle') ?? 'instagram'
  );

  if (!isValidHandle(handle)) {
    return NextResponse.json(
      { error: 'Invalid Instagram handle' },
      { status: 400 }
    );
  }

  const result = await debugInstagramProfileFetch(handle);
  return NextResponse.json(result);
}
