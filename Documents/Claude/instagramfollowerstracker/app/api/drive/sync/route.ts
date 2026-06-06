import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { syncUserDrive } from '@/lib/drive-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await syncUserDrive(session.user.id);
  return NextResponse.json(result);
}
