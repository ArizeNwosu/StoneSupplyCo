import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groups = await prisma.dataExport.groupBy({
    by: ['handle'],
    where: { userId: session.user.id, handle: { not: null } },
    _max: { uploadedAt: true, followerCount: true },
    orderBy: { _max: { uploadedAt: 'desc' } },
  });

  const accounts = groups.map((g) => ({
    handle: g.handle as string,
    lastUploadAt: g._max.uploadedAt?.toISOString() ?? new Date().toISOString(),
    followerCount: g._max.followerCount ?? null,
  }));

  return NextResponse.json(accounts);
}
