import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron-auth';
import { sendOutreachBatch } from '@/lib/outreach/sender';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) { const denied = authorizeCron(request); if (denied) return denied; const started = Date.now(); const result = await sendOutreachBatch(); return NextResponse.json({ ok: true, ...result, durationMs: Date.now() - started }); }
