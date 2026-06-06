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

  const link = await prisma.reportLink.findUnique({ where: { id } });
  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (link.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.reportLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
