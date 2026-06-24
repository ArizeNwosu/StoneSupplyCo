import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { formatCount } from '@/lib/format';
import { FollowerChart } from '@/components/tracker/FollowerChart';
import Link from 'next/link';

export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> }
): Promise<Metadata> {
  const { token } = await params;
  const link = await prisma.reportLink.findUnique({
    where: { token },
    include: { trackedAccount: { select: { handle: true } } },
  });
  if (!link || (link.expiresAt && link.expiresAt < new Date())) {
    return { title: 'Report Not Found', robots: { index: false, follow: false } };
  }
  return {
    title: `@${link.trackedAccount.handle} — Follower Growth Report`,
    description: `Follower growth report for @${link.trackedAccount.handle} on Instagram.`,
    robots: { index: false, follow: true },
  };
}

export default async function ReportPage(
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const link = await prisma.reportLink.findUnique({
    where: { token },
    include: {
      trackedAccount: {
        select: {
          handle: true,
          displayName: true,
          snapshots: {
            orderBy: { takenAt: 'asc' },
            select: { takenAt: true, followerCount: true },
          },
        },
      },
    },
  });

  if (!link || (link.expiresAt && link.expiresAt < new Date())) {
    notFound();
  }

  // Increment view count — fire and forget, never blocks render
  prisma.reportLink
    .update({ where: { id: link.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const { trackedAccount: account } = link;
  const snapshots = account.snapshots;
  const current = snapshots.at(-1)?.followerCount ?? null;
  const oldest = snapshots[0]?.followerCount ?? null;
  const change = current !== null && oldest !== null ? current - oldest : null;
  const changePct =
    change !== null && oldest ? Math.round((change / oldest) * 100) : null;
  const avgDailyGain =
    change !== null && snapshots.length > 1
      ? Math.round(change / (snapshots.length - 1))
      : null;

  const chartSnapshots = snapshots.map((s) => ({
    takenAt: s.takenAt.toISOString(),
    followerCount: s.followerCount,
  }));

  return (
    <div className="min-h-screen bg-sky-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            Shared follower report
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            @{account.handle}
          </h1>
          {account.displayName && (
            <p className="mt-1 text-sm text-slate-600">{account.displayName}</p>
          )}
          <p className="mt-1 text-sm text-slate-500">Follower Growth Report</p>
        </div>

        {/* Current count */}
        {current !== null && (
          <div className="mb-6 rounded-lg border border-cyan-950/10 bg-white p-8 text-center shadow-sm">
            <p className="text-6xl font-black tracking-tight text-cyan-700">
              {formatCount(current)}
            </p>
            <p className="mt-2 text-sm text-slate-600">followers right now</p>
          </div>
        )}

        {/* Metrics */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-cyan-950/10 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-slate-950">
              {change !== null
                ? (change >= 0 ? '+' : '') + formatCount(change)
                : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Total change</p>
          </div>
          <div className="rounded-lg border border-cyan-950/10 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-slate-950">
              {changePct !== null
                ? `${changePct >= 0 ? '+' : ''}${changePct}%`
                : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Growth rate</p>
          </div>
          <div className="rounded-lg border border-cyan-950/10 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-slate-950">
              {avgDailyGain !== null
                ? (avgDailyGain >= 0 ? '+' : '') + formatCount(avgDailyGain)
                : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Avg per day</p>
          </div>
        </div>

        {/* Chart */}
        {snapshots.length >= 2 ? (
          <div className="mb-8 rounded-lg border border-cyan-950/10 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">
              Follower Count History
            </h2>
            <FollowerChart
              snapshots={chartSnapshots}
              handle={account.handle}
            />
          </div>
        ) : (
          <div className="mb-8 rounded-lg border border-cyan-950/10 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Chart will appear after more data is collected.
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          View the permanent public page for{' '}
          <Link
            href={`/instagram-follower-count/${account.handle}`}
            className="font-semibold text-cyan-700 hover:text-cyan-900"
          >
            @{account.handle}
          </Link>
          {' · '}
          Powered by{' '}
          <a
            href="https://instagramfollowerstracker.com"
            className="font-semibold text-cyan-700 hover:text-cyan-900"
          >
            instagramfollowerstracker.com
          </a>
        </p>
      </div>
    </div>
  );
}
