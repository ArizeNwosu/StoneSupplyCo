import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { googleDriveConnected: true, googleDriveLastSync: true },
  });

  return NextResponse.json({
    connected: user?.googleDriveConnected ?? false,
    lastSync: user?.googleDriveLastSync ?? null,
  });
}
