import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PLAN_LIMITS } from '@/lib/limits';
import { parseHandle, isValidHandle } from '@/lib/handles';

const AddAccountSchema = z.object({
  handle: z.string().min(1).max(60),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await prisma.trackedAccount.findMany({
    where: { userId: session.user.id },
    include: {
      snapshots: {
        orderBy: { takenAt: 'desc' },
        take: 2,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const result = accounts.map((account) => {
    const [latest, previous] = account.snapshots;
    const latestCount = latest?.followerCount ?? null;
    const change24h =
      latest && previous
        ? latest.followerCount - previous.followerCount
        : null;
    return {
      id: account.id,
      handle: account.handle,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      latestCount,
      change24h,
      lastChecked: account.lastChecked,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as unknown;
  const parsed = AddAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid handle' }, { status: 400 });
  }

  const handle = parseHandle(parsed.data.handle);
  if (!isValidHandle(handle)) {
    return NextResponse.json(
      { error: 'Invalid Instagram handle' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { trackedAccounts: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const limit = PLAN_LIMITS[user.plan].maxAccounts;
  if (user._count.trackedAccounts >= limit) {
    return NextResponse.json(
      { error: 'Plan limit reached', limit, upgrade: '/pricing' },
      { status: 402 }
    );
  }

  const existing = await prisma.trackedAccount.findUnique({
    where: { userId_handle: { userId: user.id, handle } },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Already tracking this account' },
      { status: 400 }
    );
  }

  const account = await prisma.trackedAccount.create({
    data: { userId: user.id, handle },
  });

  return NextResponse.json(account, { status: 200 });
}
