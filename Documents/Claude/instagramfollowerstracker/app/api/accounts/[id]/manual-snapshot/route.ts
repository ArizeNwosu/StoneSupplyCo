import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseFollowerCount } from '@/lib/counts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ManualSnapshotSchema = z.object({
  followerCount: z.string().min(1).max(30),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as unknown;
  const parsed = ManualSnapshotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid follower count' }, { status: 400 });
  }

  const followerCount = parseFollowerCount(parsed.data.followerCount);
  if (followerCount === null) {
    return NextResponse.json({ error: 'Invalid follower count' }, { status: 400 });
  }

  const { id } = await params;
  const account = await prisma.trackedAccount.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, handle: true },
  });

  if (!account) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const takenAt = new Date(
    new Date().toISOString().slice(0, 10) + 'T00:00:00Z'
  );

  await prisma.snapshot.upsert({
    where: {
      trackedAccountId_takenAt: {
        trackedAccountId: account.id,
        takenAt,
      },
    },
    create: {
      trackedAccountId: account.id,
      followerCount,
      takenAt,
    },
    update: { followerCount },
  });

  const snapshotCount = await prisma.snapshot.count({
    where: { trackedAccountId: account.id },
  });

  await prisma.trackedAccount.update({
    where: { id: account.id },
    data: {
      snapshotCount,
      lastChecked: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    handle: account.handle,
    followerCount,
    snapshotCount,
  });
}
