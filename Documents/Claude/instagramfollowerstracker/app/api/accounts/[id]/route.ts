import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const account = await prisma.trackedAccount.findUnique({ where: { id } });

  if (!account) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (account.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.trackedAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
