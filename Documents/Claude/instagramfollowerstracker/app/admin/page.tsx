import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminPasswordGate } from './AdminPasswordGate';
import { AdminTable } from './AdminTable';
import type { AdminUser } from './AdminTable';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'arizemail@gmail.com';

export default async function AdminPage() {
  // Layer 1: must be signed in as the admin email
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) {
    redirect('/dashboard');
  }

  // Layer 2: must have entered the admin password (cookie set by /api/admin/verify)
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin_auth');
  if (!adminAuth?.value) {
    return <AdminPasswordGate />;
  }

  // Both layers passed — fetch all users
  const rawUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      createdAt: true,
      stripeSubId: true,
      trackedAccounts: {
        select: {
          handle: true,
          snapshotCount: true,
          lastChecked: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Serialise dates for client component
  const users: AdminUser[] = rawUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    trackedAccounts: u.trackedAccounts.map((a) => ({
      ...a,
      lastChecked: a.lastChecked?.toISOString() ?? null,
    })),
  }));

  return <AdminTable users={users} />;
}
