import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { detectCrossAccountPatterns } from '@/lib/pattern-detection';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!user || user.plan !== 'AGENCY') {
    return NextResponse.json({ error: 'Agency plan required' }, { status: 402 });
  }

  const accounts = await prisma.trackedAccount.findMany({
    where: { userId: session.user.id },
    select: {
      handle: true,
      snapshots: {
        orderBy: { takenAt: 'asc' },
        select: { takenAt: true, followerCount: true },
      },
    },
  });

  const patterns = detectCrossAccountPatterns(accounts);
  return NextResponse.json({ patterns, accountCount: accounts.length });
}
