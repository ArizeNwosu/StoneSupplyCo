import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Group by handle — include null-handle exports so uploads without a detected
  // account name still show up (they're stored as handle=null when the user
  // uploads individual HTML files rather than a ZIP).
  const groups = await prisma.dataExport.groupBy({
    by: ['handle'],
    where: { userId: session.user.id },
    _max: { uploadedAt: true, followerCount: true },
    orderBy: { _max: { uploadedAt: 'desc' } },
  });

  const accounts = groups.map((g) => ({
    handle: g.handle ?? null,
    lastUploadAt: g._max.uploadedAt?.toISOString() ?? new Date().toISOString(),
    followerCount: g._max.followerCount ?? null,
  }));

  return NextResponse.json(accounts);
}
