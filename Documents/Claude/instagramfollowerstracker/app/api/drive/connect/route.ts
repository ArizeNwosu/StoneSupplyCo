import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGoogleAuthUrl } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin', process.env.NEXTAUTH_URL ?? 'https://www.instagramfollowerstracker.com'));
  }

  const url = getGoogleAuthUrl(session.user.id);
  return NextResponse.redirect(url);
}
