import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const CreateSchema = z.object({
  trackedAccountId: z.string().min(1),
  label: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const links = await prisma.reportLink.findMany({
    where: { userId: session.user.id },
    include: { trackedAccount: { select: { handle: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (user.plan !== 'AGENCY') {
    return NextResponse.json(
      { error: 'Report links require Agency plan', upgrade: '/pricing' },
      { status: 402 }
    );
  }

  const body = await req.json().catch(() => null) as unknown;
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { trackedAccountId, label, expiresAt } = parsed.data;

  const account = await prisma.trackedAccount.findUnique({
    where: { id: trackedAccountId },
  });
  if (!account || account.userId !== session.user.id) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const link = await prisma.reportLink.create({
    data: {
      userId: session.user.id,
      trackedAccountId,
      label: label ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3099';
  const url = `${appUrl}/r/${link.token}`;

  return NextResponse.json({ id: link.id, token: link.token, url });
}
