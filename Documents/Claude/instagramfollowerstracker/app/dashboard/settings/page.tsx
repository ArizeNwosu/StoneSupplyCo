import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS, PLAN_PRICES } from '@/lib/limits';
import { Badge } from '@/components/ui/Badge';
import { ReportLinksList } from '@/components/tracker/ReportLinksList';
import { ApiKeyManager } from '@/components/tracker/ApiKeyManager';
import { ManageSubscriptionButton } from '@/components/settings/ManageSubscriptionButton';
import { CheckoutButton } from '@/components/pricing/CheckoutButton';

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
  const showDiagnostics = canViewDiagnostics(user.email);

  return (
    <main className="flex-1 overflow-y-auto bg-sky-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-950">Settings</h1>

        {/* Plan info */}
        <div className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-950">Your Plan</h2>
            <Badge plan={user.plan} />
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Accounts:{' '}
              <span className="font-semibold text-slate-950">
                {user._count.trackedAccounts} / {limits.maxAccounts ?? 'Unlimited'}
              </span>
            </p>
            <p>
              History:{' '}
              <span className="font-semibold text-slate-950">
                {limits.historyDays === null ? 'All time' : `${limits.historyDays} days`}
              </span>
            </p>
            <p>
              Alerts:{' '}
              <span className="font-semibold text-slate-950">
                {limits.alerts ? 'Enabled' : 'Not included'}
              </span>
            </p>
          </div>
          {user.plan === 'FREE' && (
            <Link
              href="/pricing"
              className="mt-4 inline-flex items-center text-sm font-semibold text-cyan-700 transition hover:text-cyan-900"
            >
              Upgrade to Pro — ${PLAN_PRICES.PRO.monthly}/mo →
            </Link>
          )}
          {user.plan !== 'FREE' && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ManageSubscriptionButton />
              {user.plan === 'PRO' && (
                <CheckoutButton
                  plan="AGENCY"
                  interval="monthly"
                  className="inline-flex min-h-10 items-center rounded-full bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Upgrade to Agency
                </CheckoutButton>
              )}
            </div>
          )}
        </div>

        {/* Report Links — Agency only */}
        {user.plan === 'AGENCY' && (
          <div className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950 mb-1">
              Report Links
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Shareable links give clients read-only access to follower growth
              reports. Links stay active until revoked.
            </p>
            <ReportLinksList />
          </div>
        )}

        {/* API Access — Agency only */}
        {user.plan === 'AGENCY' && (
          <div className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950 mb-1">
              API Access
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Programmatic access to your tracked accounts and snapshot data.
              Keys are hashed — copy the full key when generated.
            </p>
            <ApiKeyManager />
          </div>
        )}

        {/* Account info */}
        <div className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-950 mb-3">Account</h2>
          <p className="text-sm text-slate-600">{user.email}</p>
        </div>

        {showDiagnostics && (
          <div className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950 mb-1">
              Diagnostics
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Check Apify, cron, and latest snapshot status for the automated
              collector.
            </p>
            <Link
              href="/dashboard/diagnostics"
              className="inline-flex min-h-10 items-center rounded-full border border-cyan-950/10 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Open diagnostics
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function canViewDiagnostics(email?: string | null) {
  if (process.env.NODE_ENV !== 'production') return true;
  if (!email) return false;

  const allowedEmails = (process.env.DIAGNOSTICS_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.toLowerCase());
}
