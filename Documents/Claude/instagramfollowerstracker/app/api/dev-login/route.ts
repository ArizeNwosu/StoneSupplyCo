import { NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// Dev-only bypass — returns 404 in production
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') ?? 'test@ifttracker.local';

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return new NextResponse(`No user with email ${email}`, { status: 404 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return new NextResponse('NEXTAUTH_SECRET not set', { status: 500 });
  }

  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    },
    secret,
    salt: 'authjs.session-token',
  });

  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';
  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  // NextAuth v5 uses 'authjs.session-token' on HTTP, '__Secure-authjs.session-token' on HTTPS
  response.cookies.set('authjs.session-token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
