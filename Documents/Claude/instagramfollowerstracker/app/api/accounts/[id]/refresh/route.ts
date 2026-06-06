import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

  const { fetchInstagramProfile } = await import('@/lib/scraper');
  const profile = await fetchInstagramProfile(account.handle);

  if (profile.followerCount === null) {
    return NextResponse.json({ ok: false, error: 'Could not fetch profile' }, { status: 200 });
  }

  await prisma.snapshot.upsert({
    where: {
      trackedAccountId_takenAt: {
        trackedAccountId: account.id,
        takenAt: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z'),
      },
    },
    create: {
      trackedAccountId: account.id,
      followerCount: profile.followerCount,
      followingCount: profile.followingCount ?? undefined,
      postCount: profile.postCount ?? undefined,
      takenAt: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z'),
    },
    update: {
      followerCount: profile.followerCount,
    },
  });

  const total = await prisma.snapshot.count({ where: { trackedAccountId: account.id } });
  await prisma.trackedAccount.update({
    where: { id: account.id },
    data: {
      snapshotCount: total,
      lastChecked: new Date(),
      displayName: profile.displayName ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, followerCount: profile.followerCount, snapshotCount: total });
}
