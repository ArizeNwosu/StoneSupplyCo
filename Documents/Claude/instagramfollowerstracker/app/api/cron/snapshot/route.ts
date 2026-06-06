import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron-auth';
import { runDailySnapshot, type SnapshotScope } from '@/worker/snapshot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const unauthorized = authorizeCron(req);
  if (unauthorized) return unauthorized;

  const scope = parseScope(req.nextUrl.searchParams.get('scope'));
  const force = req.nextUrl.searchParams.get('force') === '1';
  const result = await runDailySnapshot({
    scope,
    force,
    trackedLimit: parsePositiveInt(
      req.nextUrl.searchParams.get('trackedLimit'),
      parsePositiveInt(process.env.SNAPSHOT_TRACKED_LIMIT, 25)
    ),
    publicLimit: parsePositiveInt(
      req.nextUrl.searchParams.get('publicLimit'),
      parsePositiveInt(process.env.SNAPSHOT_PUBLIC_LIMIT, 10)
    ),
    maxRuntimeMs: parsePositiveInt(
      req.nextUrl.searchParams.get('maxRuntimeMs'),
      parsePositiveInt(process.env.SNAPSHOT_MAX_RUNTIME_MS, 240_000)
    ),
  });

  return NextResponse.json({ ok: true, result });
}

function parseScope(raw: string | null): SnapshotScope {
  if (raw === 'tracked' || raw === 'public') return raw;
  return 'all';
}

function parsePositiveInt(raw: string | null | undefined, fallback: number): number {
  const value = parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
