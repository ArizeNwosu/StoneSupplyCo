import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron-auth';
import { reconcileStripeSubscriptions } from '@/lib/revenue/reconcile';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) { const denied = authorizeCron(request); if (denied) return denied; const started = Date.now(); const result = await reconcileStripeSubscriptions(); return NextResponse.json({ ok: true, ...result, durationMs: Date.now() - started }); }
