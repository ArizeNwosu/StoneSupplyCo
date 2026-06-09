import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';

// Meta calls this endpoint when a user revokes EYI access.
// Payload is signed with APP_SECRET — verify before acting.
export async function POST(request: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expBuffer.length || !timingSafeEqual(sigBuffer, expBuffer)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: { user_id?: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const metaUserId = body.user_id;
  if (metaUserId) {
    await prisma.user.updateMany({
      where: { metaUserId },
      data: { eyiConnected: false, metaUserId: null },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
