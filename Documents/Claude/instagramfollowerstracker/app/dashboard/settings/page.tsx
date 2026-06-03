import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS, PLAN_PRICES } from '@/lib/limits';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false },
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { trackedAccounts: true } } },
  });

  if (!user) return null;

  const limits = PLAN_LIMITS[user.plan];

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        {/* Plan info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Your Plan</h2>
            <Badge plan={user.plan} />
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              Accounts:{' '}
              <span className="font-medium text-gray-900">
                {user._count.trackedAccounts} / {limits.maxAccounts}
              </span>
            </p>
            <p>
              History:{' '}
              <span className="font-medium text-gray-900">
                {limits.historyDays >= 9999
                  ? 'All time'
                  : `${limits.historyDays} days`}
              </span>
            </p>
            <p>
              Alerts:{' '}
              <span className="font-medium text-gray-900">
                {limits.alerts ? 'Enabled' : 'Not included'}
              </span>
            </p>
          </div>
          {user.plan === 'FREE' && (
            <a
              href="/pricing"
              className="mt-4 inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              Upgrade to Pro — ${PLAN_PRICES.PRO.monthly}/mo →
            </a>
          )}
        </div>

        {/* Account info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Account</h2>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </div>
    </main>
  );
}
