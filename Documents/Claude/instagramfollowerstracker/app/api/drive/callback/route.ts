import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { exchangeGoogleCode } from '@/lib/google-drive';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://instagramfollowerstracker.com';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/dashboard?drive=error', BASE_URL));
  }

  const session = await auth();
  if (!session?.user?.id || session.user.id !== state) {
    return NextResponse.redirect(new URL('/dashboard?drive=error', BASE_URL));
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const expiry = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        googleDriveConnected: true,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: expiry,
      },
    });

    return NextResponse.redirect(new URL('/dashboard?drive=connected', BASE_URL));
  } catch (err) {
    console.error('Drive OAuth callback error:', err);
    return NextResponse.redirect(new URL('/dashboard?drive=error', BASE_URL));
  }
}
