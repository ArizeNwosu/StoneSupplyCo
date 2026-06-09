import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const ADMIN_EMAIL = 'arizemail@gmail.com';

export async function POST(request: Request) {
  // Must be signed in as admin
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !body.password || body.password !== adminPassword) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_auth', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/admin',
  });
  return response;
}
