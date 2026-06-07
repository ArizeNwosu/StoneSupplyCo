import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { parseHandle, isValidHandle } from '@/lib/handles';
import { verifyCollectorToken } from '@/lib/collector-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CaptureSchema = z.object({
  token: z.string().min(20),
  handle: z.string().min(1).max(60),
  followerCount: z.number().int().positive().max(10_000_000_000),
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as unknown;
  const parsed = CaptureSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: 'Invalid capture payload' }, 400);
  }

  const token = verifyCollectorToken(parsed.data.token);
  if (!token) {
    return json({ error: 'Invalid collector token' }, 401);
  }

  const handle = parseHandle(parsed.data.handle);
  if (!isValidHandle(handle)) {
    return json({ error: 'Invalid Instagram handle' }, 400);
  }

  if (handle !== token.handle) {
    return json(
      { error: `This collector is locked to @${token.handle}` },
      409
    );
  }

  const account = await prisma.trackedAccount.findFirst({
    where: {
      id: token.accountId,
      userId: token.userId,
      handle: token.handle,
    },
    select: { id: true, handle: true },
  });

  if (!account) {
    return json({ error: 'Tracked account not found' }, 404);
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
      followerCount: parsed.data.followerCount,
      takenAt,
    },
    update: {
      followerCount: parsed.data.followerCount,
    },
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

  return json({
    ok: true,
    handle: account.handle,
    followerCount: parsed.data.followerCount,
    snapshotCount,
  });
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: CORS_HEADERS,
  });
}
