import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateApiKey } from '@/lib/api-auth';

/** GET — return current key prefix (masked), or null if none */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, apiKeyPrefix: true },
  });

  if (!user || user.plan !== 'AGENCY') {
    return NextResponse.json({ error: 'Agency plan required' }, { status: 402 });
  }

  return NextResponse.json({ prefix: user.apiKeyPrefix ?? null });
}

/** POST — generate a new API key (invalidates old one). Returns raw key once. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!user || user.plan !== 'AGENCY') {
    return NextResponse.json({ error: 'Agency plan required' }, { status: 402 });
  }

  const { raw, hash, prefix } = generateApiKey();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { apiKeyHash: hash, apiKeyPrefix: prefix },
  });

  // Return raw key once — client must copy it now, it is not stored
  return NextResponse.json({ key: raw, prefix });
}

/** DELETE — revoke API key */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { apiKeyHash: null, apiKeyPrefix: null },
  });

  return NextResponse.json({ ok: true });
}
