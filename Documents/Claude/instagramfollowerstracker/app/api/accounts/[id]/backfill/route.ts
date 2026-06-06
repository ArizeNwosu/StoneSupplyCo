import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { backfillTrackedAccount } from '@/lib/wayback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const account = await prisma.trackedAccount.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, handle: true },
  });

  if (!account) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const result = await backfillTrackedAccount(account.id, account.handle);
  return NextResponse.json({ ok: true, ...result });
}
