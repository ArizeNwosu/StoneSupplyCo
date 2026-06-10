// app/api/stalker/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const trackedAccountId = searchParams.get('trackedAccountId');
  const unreadOnly = searchParams.get('unread') === '1';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

  const events = await prisma.stalkerEvent.findMany({
    where: {
      userId: session.user.id,
      ...(trackedAccountId ? { stalkerSub: { trackedAccountId } } : {}),
      ...(unreadOnly ? { read: false } : {}),
    },
    include: { stalkerSub: { include: { trackedAccount: { select: { handle: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const unreadCount = await prisma.stalkerEvent.count({
    where: { userId: session.user.id, read: false },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      signal: e.signal,
      handle: e.stalkerSub.trackedAccount.handle,
      oldValue: e.oldValue,
      newValue: e.newValue,
      read: e.read,
      createdAt: e.createdAt,
    })),
    unreadCount,
  });
}
