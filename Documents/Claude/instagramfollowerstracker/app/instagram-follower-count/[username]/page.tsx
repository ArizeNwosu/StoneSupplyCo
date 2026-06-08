import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PublicChart } from '@/components/tracker/PublicChart';
import { formatChange, formatCount } from '@/lib/format';
import { parseHandle, isValidHandle } from '@/lib/handles';
import { prisma } from '@/lib/prisma';
import { getPublicHistorySnapshots } from '@/lib/public-history';
import { getPublicSeoIndexStatus } from '@/lib/public-seo-quality';
import { ensurePublicAccountForHandle } from '@/lib/seo-public-accounts';

export const dynamic = 'force-dynamic';

const LEARN_MORE_LINKS: Array<{ label: string; href: string }> = [
  { label: 'Instagram follower count history', href: '/blog/instagram-follower-count-history' },
  { label: 'Track Instagram follower growth', href: '/blog/track-instagram-follower-growth' },
  { label: 'Instagram followers tracker', href: '/blog/instagram-followers-tracker' },
];

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const handle = parseHandle(username);
  if (!isValidHandle(handle)) return { title: 'Instagram follower count' };

  const account = await prisma.publicAccount
    .findUnique({
      where: { handle },
      include: { _count: { select: { snapshots: true } } },
    })
    .catch(() => null);

  const status = getPublicSeoIndexStatus({
    handle,
    followerCount: account?.followerCount ?? null,
    displayName: account?.displayName ?? null,
    avatarUrl: account?.avatarUrl ?? null,
    bio: account?.bio ?? null,
    snapshotCount: account?._count.snapshots ?? 0,
  });

  const displayName = account?.displayName ?? `@${handle}`;
  const count = account?.followerCount ? formatCount(account.followerCount) : 'public';
  const canonical = `https://instagramfollowerstracker.com/instagram-follower-count/${handle}`;

  return {
    title: `${displayName} Instagram Follower Count - @${handle}`,
    description: `Track @${handle}'s Instagram follower count over time. See ${count} follower data, saved snapshots, public growth history, and daily changes.`,
    alternates: { canonical },
    robots: status.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: `${displayName} Instagram follower count`,
      description: `Public follower-count history and growth chart for @${handle}.`,
      url: canonical,
      type: 'website',
    },
  };
}

export default async function InstagramFollowerCountPage({ params }: PageProps) {
  const { username } = await params;
  const handle = parseHandle(username);
  if (!isValidHandle(handle)) notFound();

  await ensurePublicAccountForHandle({ handle });

  const account = await prisma.publicAccount.findUnique({
    where: { handle },
    include: {
      snapshots: {
        orderBy: { takenAt: 'desc' },
        take: 120,
        select: {
          takenAt: true,
          followerCount: true,
          followingCount: true,
          postCount: true,
        },
      },
      _count: { select: { snapshots: true } },
    },
  });

  if (!account) notFound();

  const snapshots = await getPublicHistorySnapshots({
    handle,
    publicSnapshots: account.snapshots,
    fallbackSnapshot:
      account.followerCount !== null
        ? {
            takenAt: account.lastChecked ?? account.createdAt,
            followerCount: account.followerCount,
            followingCount: account.followingCount,
            postCount: account.postCount,
          }
        : null,
  });

  const status = getPublicSeoIndexStatus({
    handle,
    followerCount: account.followerCount,
    displayName: account.displayName,
    avatarUrl: account.avatarUrl,
    bio: account.bio,
    snapshotCount: account._count.snapshots,
  });
  const current = snapshots.at(-1)?.followerCount ?? account.followerCount;
  const oldest = snapshots[0]?.followerCount ?? null;
  const change = current !== null && oldest !== null ? current - oldest : null;
  const avgDailyGain =
    change !== null && snapshots.length > 1
      ? Math.round(change / Math.max(1, snapshots.length - 1))
      : null;

  const displayName = account.displayName ?? `@${handle}`;

  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-cyan-950/10 bg-sky-50">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(rgba(8,47,73,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(8,47,73,0.08)_1px,transparent_1px)] bg-[size:42px_42px]"
          />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
            <nav className="mb-8 text-sm font-semibold text-slate-500">
              <Link href="/" className="transition hover:text-teal-800">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-950">@{handle}</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="mb-4 inline-flex rounded-full border border-cyan-950/10 bg-white px-3 py-1 text-xs font-black uppercase text-teal-800">
                  Auto-generated public follower report
                </p>
                <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
                  {displayName} Instagram follower count
                </h1>
                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
                  This page tracks @{handle} with public follower-count snapshots. It becomes
                  eligible for Google indexing only after enough useful history is collected.
                </p>
              </div>

              <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-2xl shadow-cyan-950/10">
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="Followers" value={current !== null ? formatCount(current) : 'Queued'} tone="text-teal-700" />
                  <Metric label="Snapshots" value={String(account._count.snapshots)} tone="text-slate-950" />
                  <Metric label="Change" value={change !== null ? formatChange(change) : 'Building'} tone={change !== null && change < 0 ? 'text-rose-600' : 'text-emerald-700'} />
                  <Metric label="Avg / snapshot" value={avgDailyGain !== null ? formatChange(avgDailyGain) : 'Building'} tone="text-slate-950" />
                </div>
                {!status.indexable && (
                  <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
                    Visible but not indexable yet. Needs 3+ snapshots, a follower count,
                    and profile signal before Google indexing.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-rose-600">
                  Growth chart
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  @{handle} follower count history
                </h2>
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {snapshots.length} chart point{snapshots.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-xl shadow-cyan-950/10">
              {snapshots.length > 0 ? (
                <PublicChart snapshots={snapshots} handle={handle} />
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-slate-50 px-4 text-center">
                  <p className="text-sm font-black text-slate-950">
                    First public snapshot queued
                  </p>
                  <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                    The page exists, but it will stay out of the sitemap and noindex
                    until the account has useful follower history.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-sky-50 py-12 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[1fr_0.9fr]">
            <article className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">
                Why this public page exists
              </h2>
              <div className="mt-4 space-y-4 text-sm font-semibold leading-7 text-slate-600">
                <p>
                  Public Instagram follower counts are useful when they are saved over time.
                  A single number is a lookup; a series of snapshots shows momentum, drops,
                  spikes, and trend direction.
                </p>
                <p>
                  We never show which user added this account. The page only uses public
                  profile-level follower data and the daily snapshots saved by the platform.
                </p>
              </div>
            </article>

            <aside className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                Learn more
              </h2>
              <div className="mt-4 space-y-3">
                {LEARN_MORE_LINKS.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="block rounded-lg border border-cyan-950/10 bg-slate-50 p-3 text-sm font-black text-slate-800 transition hover:border-teal-300 hover:bg-white hover:text-teal-800"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-cyan-950/10 bg-slate-50 p-4">
      <p className={`text-2xl font-black tabular-nums ${tone}`}>{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}
