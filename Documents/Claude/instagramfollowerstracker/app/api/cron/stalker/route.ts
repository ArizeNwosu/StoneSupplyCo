// app/api/cron/stalker/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron-auth';
import { runStalkerScrape } from '@/worker/stalker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const unauthorized = authorizeCron(req);
  if (unauthorized) return unauthorized;

  const result = await runStalkerScrape({
    maxAccounts: 40,
    maxRuntimeMs: 270_000,
  });

  return NextResponse.json({ ok: true, result });
}
