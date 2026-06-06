import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      googleDriveConnected: false,
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      googleDriveLastSync: null,
    },
  });

  return NextResponse.json({ ok: true });
}
