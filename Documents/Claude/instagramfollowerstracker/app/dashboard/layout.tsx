import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar mode="app" />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
