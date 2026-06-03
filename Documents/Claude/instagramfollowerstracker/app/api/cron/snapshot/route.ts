import { NextRequest, NextResponse } from 'next/server';
import { runDailySnapshot } from '@/worker/snapshot';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fire-and-forget — respond immediately so Vercel doesn't hit 60s timeout
  runDailySnapshot().catch((err) =>
    console.error('[cron] snapshot job failed:', err)
  );

  return NextResponse.json({ ok: true, started: new Date().toISOString() });
}
