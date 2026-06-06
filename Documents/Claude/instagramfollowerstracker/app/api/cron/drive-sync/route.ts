import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron-auth';
import { syncAllDriveUsers } from '@/lib/drive-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const unauthorized = authorizeCron(req);
  if (unauthorized) return unauthorized;

  const results = await syncAllDriveUsers();

  const synced = results.filter((r) => r.status === 'synced').length;
  const errors = results.filter((r) => r.status === 'error').length;
  const noNew = results.filter((r) => r.status === 'no_new_files').length;

  return NextResponse.json({ ok: true, synced, noNew, errors, results });
}
