import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron-auth';
import { runBackfill } from '@/worker/backfill';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const unauthorized = authorizeCron(req);
  if (unauthorized) return unauthorized;

  const result = await runBackfill({
    handleFilter: parseHandle(req.nextUrl.searchParams.get('handle')),
    limit: parsePositiveInt(
      req.nextUrl.searchParams.get('limit'),
      parsePositiveInt(process.env.BACKFILL_LIMIT, 5)
    ),
    maxSnapshotsPerAccount: parsePositiveInt(
      req.nextUrl.searchParams.get('maxSnapshotsPerAccount'),
      parsePositiveInt(process.env.BACKFILL_MAX_SNAPSHOTS_PER_ACCOUNT, 100)
    ),
    skipIfSnapshotsAbove: parseNonNegativeInt(
      req.nextUrl.searchParams.get('skipIfSnapshotsAbove'),
      parseNonNegativeInt(process.env.BACKFILL_SKIP_IF_SNAPSHOTS_ABOVE, 10)
    ),
    maxRuntimeMs: parsePositiveInt(
      req.nextUrl.searchParams.get('maxRuntimeMs'),
      parsePositiveInt(process.env.BACKFILL_MAX_RUNTIME_MS, 240_000)
    ),
  });

  return NextResponse.json({ ok: true, result });
}

function parseHandle(raw: string | null): string | undefined {
  const handle = raw?.trim().replace(/^@/, '').toLowerCase();
  return handle && /^[a-z0-9._]{1,30}$/.test(handle) ? handle : undefined;
}

function parsePositiveInt(raw: string | null | undefined, fallback: number): number {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseNonNegativeInt(raw: string | null | undefined, fallback: number): number {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
