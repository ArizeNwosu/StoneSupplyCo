import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const adminEmail = () => (process.env.ADMIN_EMAIL ?? 'arizemail@gmail.com').toLowerCase();

export async function authorizeAdminApi() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.email.toLowerCase() !== adminEmail()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!(await cookies()).get('admin_auth')?.value) return NextResponse.json({ error: 'Admin verification required' }, { status: 401 });
  return null;
}
