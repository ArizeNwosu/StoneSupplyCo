import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PublicChart } from '@/components/tracker/PublicChart';
import { formatChange, formatCount } from '@/lib/format';
import { parseHandle, isValidHandle } from '@/lib/handles';
import { prisma } from '@/lib/prisma';
import {
  getPublicHistorySnapshots,
  type PublicHistorySnapshot,
} from '@/lib/public-history';
import { getPublicSeoIndexStatus } from '@/lib/public-seo-quality';
import { publicAccountUrl, SITE_URL } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

const LEARN_MORE_LINKS = [
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
  if (!isValidHandle(handle)) {
    return { title: 'Instagram follower count', robots: { index: false, follow: true } };
  }

  const account = await prisma.publicAccount
    .findUnique({
      where: { handle },
      include: {
        _count: { select: { snapshots: true } },
        snapshots: {
          orderBy: { takenAt: 'desc' },
          take: 1,
          select: { takenAt: true },
        },
      },
    })
    .catch(() => null);

  if (!account) {
    return { title: 'Account not found', robots: { index: false, follow: true } };
  }

  const lastUpdatedAt = account.snapshots[0]?.takenAt ?? account.lastChecked;
  const status = getPublicSeoIndexStatus({
    handle,
    followerCount: account.followerCount,
    displayName: account.displayName,
    avatarUrl: account.avatarUrl,
    bio: account.bio,
    snapshotCount: account._count.snapshots,
    lastUpdatedAt,
  });
  const displayName = account.displayName ?? `@${handle}`;
  const count = account.followerCount ? formatCount(account.followerCount) : 'public';
  const canonical = publicAccountUrl(handle);

  return {
    title: `${displayName} Instagram Follower Count & Growth History`,
    description: `Track @${handle}'s Instagram follower count over time. See ${count} followers, daily changes, growth trends, and historical public snapshots.`,
    alternates: { canonical },
    robots: status.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: `${displayName} Instagram follower count — ${count}`,
      description: `Public follower-count history, daily changes, and growth trends for @${handle}.`,
      url: canonical,
      type: 'profile',
    },
  };
}

export default async function InstagramFollowerCountPage({ params }: PageProps) {
  const { username } = await params;
  const handle = parseHandle(username);
  if (!isValidHandle(handle)) notFound();

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
  const stats = calculateGrowthStats(snapshots, account.followerCount);
  const lastUpdatedAt = snapshots.at(-1)?.takenAt ?? account.lastChecked;
  const status = getPublicSeoIndexStatus({
    handle,
    followerCount: account.followerCount,
    displayName: account.displayName,
    avatarUrl: account.avatarUrl,
    bio: account.bio,
    snapshotCount: account._count.snapshots,
    lastUpdatedAt,
  });

  const relatedCandidates = await prisma.publicAccount
    .findMany({
      where: { handle: { not: handle }, followerCount: { not: null } },
      orderBy: { followerCount: 'desc' },
      take: 30,
      include: { _count: { select: { snapshots: true } } },
    })
    .catch(() => []);
  const relatedAccounts = relatedCandidates
    .filter((candidate) =>
      getPublicSeoIndexStatus({
        handle: candidate.handle,
        followerCount: candidate.followerCount,
        displayName: candidate.displayName,
        avatarUrl: candidate.avatarUrl,
        bio: candidate.bio,
        snapshotCount: candidate._count.snapshots,
        lastUpdatedAt: candidate.lastChecked,
      }).indexable
    )
    .slice(0, 6);

  const canonical = publicAccountUrl(handle);
  const displayName = account.displayName ?? `@${handle}`;
  const firstSnapshot = snapshots[0];
  const latestSnapshot = snapshots.at(-1);
  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${displayName} Instagram follower count`,
    url: canonical,
    dateModified: lastUpdatedAt?.toISOString(),
    mainEntity: {
      '@type': 'Person',
      name: displayName,
      identifier: handle,
      description: account.bio ?? undefined,
      image: account.avatarUrl ?? undefined,
      sameAs: `https://www.instagram.com/${handle}/`,
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Instagram follower counts',
        item: `${SITE_URL}/instagram-follower-count`,
      },
      { '@type': 'ListItem', position: 3, name: `@${handle}`, item: canonical },
    ],
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main>
        <section className="relative overflow-hidden border-b border-cyan-950/10 bg-sky-50">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(rgba(8,47,73,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(8,47,73,0.08)_1px,transparent_1px)] bg-[size:42px_42px]"
          />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
            <nav aria-label="Breadcrumb" className="mb-8 text-sm font-semibold text-slate-500">
              <Link href="/" className="transition hover:text-teal-800">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/instagram-follower-count" className="transition hover:text-teal-800">
                Follower counts
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-950">@{handle}</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <div className="mb-5 flex items-center gap-4">
                  {account.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={account.avatarUrl}
                      alt={`${displayName} Instagram profile`}
                      className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 text-3xl font-black text-white">
                      {handle[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700">
                      Public follower history
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-600">@{handle}</p>
                  </div>
                </div>
                <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
                  {displayName} Instagram follower count
                </h1>
                {account.bio && (
                  <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
                    {account.bio}
                  </p>
                )}
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  {lastUpdatedAt
                    ? `Last updated ${formatDate(lastUpdatedAt)}`
                    : 'Follower history is being collected.'}
                </p>
              </div>

              <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-2xl shadow-cyan-950/10">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Metric label="Followers" value={stats.current !== null ? formatCount(stats.current) : '—'} tone="text-teal-700" />
                  <Metric label="7-day change" value={formatNullableChange(stats.change7d)} tone={changeTone(stats.change7d)} />
                  <Metric label="30-day change" value={formatNullableChange(stats.change30d)} tone={changeTone(stats.change30d)} />
                  <Metric label="30-day growth" value={formatPercent(stats.growth30dPct)} tone={changeTone(stats.growth30dPct)} />
                  <Metric label="Average / day" value={formatNullableChange(stats.avgDailyGain)} tone={changeTone(stats.avgDailyGain)} />
                  <Metric label="Snapshots" value={String(account._count.snapshots)} tone="text-slate-950" />
                </div>
                {!status.indexable && (
                  <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
                    This page is collecting enough recent history to become a useful public result.
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
                <p className="text-sm font-black uppercase text-rose-600">Growth chart</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  @{handle} follower count history
                </h2>
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {snapshots.length} daily point{snapshots.length === 1 ? '' : 's'} shown
              </p>
            </div>

            <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-xl shadow-cyan-950/10">
              {snapshots.length > 0 ? (
                <PublicChart snapshots={snapshots} handle={handle} />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 px-4 text-center">
                  <p className="text-sm font-semibold text-slate-500">
                    The first public snapshot has not been collected yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-sky-50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-3xl font-black text-slate-950">Growth highlights</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Highlight
                label="Largest daily gain"
                value={stats.biggestGain ? formatChange(stats.biggestGain.change) : 'Not enough history'}
                detail={stats.biggestGain ? formatDate(stats.biggestGain.date) : undefined}
              />
              <Highlight
                label="Largest daily loss"
                value={stats.biggestLoss ? formatChange(stats.biggestLoss.change) : 'No loss recorded'}
                detail={stats.biggestLoss ? formatDate(stats.biggestLoss.date) : undefined}
              />
              <Highlight
                label="Tracking period"
                value={stats.trackingDays !== null ? `${stats.trackingDays} days` : 'Building history'}
                detail={firstSnapshot && latestSnapshot && firstSnapshot !== latestSnapshot
                  ? `${formatDate(firstSnapshot.takenAt)} to ${formatDate(latestSnapshot.takenAt)}`
                  : undefined}
              />
            </div>
          </div>
        </section>

        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[1fr_0.9fr]">
            <article className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">
                Understanding @{handle}&apos;s follower growth
              </h2>
              <div className="mt-4 space-y-4 text-sm font-semibold leading-7 text-slate-600">
                <p>
                  This page records public follower-count snapshots for @{handle}. Comparing
                  snapshots reveals sustained growth, audience losses, and unusual spikes that a
                  single live count cannot show.
                </p>
                <p>
                  Counts may differ slightly from Instagram during collection windows. The page
                  does not expose who follows or unfollows the account, and it does not identify
                  which user requested tracking.
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

        {relatedAccounts.length > 0 && (
          <section className="bg-sky-50 py-12 sm:py-16">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-3xl font-black text-slate-950">Other tracked accounts</h2>
                <Link href="/instagram-follower-count" className="text-sm font-black text-teal-700 hover:text-teal-900">
                  Browse all →
                </Link>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {relatedAccounts.map((candidate) => (
                  <Link
                    key={candidate.handle}
                    href={`/instagram-follower-count/${candidate.handle}`}
                    className="rounded-lg border border-cyan-950/10 bg-white p-4 transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl hover:shadow-cyan-950/10"
                  >
                    <p className="text-sm font-black text-slate-950">
                      {candidate.displayName ?? `@${candidate.handle}`}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-semibold text-slate-500">@{candidate.handle}</p>
                      <p className="shrink-0 text-xs font-black text-teal-700">
                        {candidate.followerCount !== null ? formatCount(candidate.followerCount) : '—'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

function calculateGrowthStats(
  snapshots: PublicHistorySnapshot[],
  fallbackCurrent: number | null
) {
  const latest = snapshots.at(-1);
  const first = snapshots[0];
  const current = latest?.followerCount ?? fallbackCurrent;
  const change7d = changeWithinDays(snapshots, 7);
  const change30d = changeWithinDays(snapshots, 30);
  const baseline30d = baselineWithinDays(snapshots, 30);
  const growth30dPct =
    change30d !== null && baseline30d
      ? (change30d / baseline30d) * 100
      : null;
  const trackingDays =
    first && latest && first !== latest
      ? Math.max(
          1,
          Math.round(
            (latest.takenAt.getTime() - first.takenAt.getTime()) / 86_400_000
          )
        )
      : null;
  const totalChange =
    first && latest && first !== latest
      ? latest.followerCount - first.followerCount
      : null;
  const avgDailyGain =
    totalChange !== null && trackingDays ? Math.round(totalChange / trackingDays) : null;

  let biggestGain: { change: number; date: Date } | null = null;
  let biggestLoss: { change: number; date: Date } | null = null;
  for (let index = 1; index < snapshots.length; index += 1) {
    const currentSnapshot = snapshots[index];
    const previousSnapshot = snapshots[index - 1];
    if (!currentSnapshot || !previousSnapshot) continue;
    const delta = currentSnapshot.followerCount - previousSnapshot.followerCount;
    if (delta > 0 && (!biggestGain || delta > biggestGain.change)) {
      biggestGain = { change: delta, date: currentSnapshot.takenAt };
    }
    if (delta < 0 && (!biggestLoss || delta < biggestLoss.change)) {
      biggestLoss = { change: delta, date: currentSnapshot.takenAt };
    }
  }

  return {
    current,
    change7d,
    change30d,
    growth30dPct,
    avgDailyGain,
    biggestGain,
    biggestLoss,
    trackingDays,
  };
}

function baselineWithinDays(snapshots: PublicHistorySnapshot[], days: number) {
  const latest = snapshots.at(-1);
  if (!latest || snapshots.length < 2) return null;
  const cutoff = latest.takenAt.getTime() - days * 86_400_000;
  const baseline = snapshots.find((snapshot) => snapshot.takenAt.getTime() >= cutoff);
  return baseline && baseline !== latest ? baseline.followerCount : null;
}

function changeWithinDays(snapshots: PublicHistorySnapshot[], days: number) {
  const latest = snapshots.at(-1);
  const baseline = baselineWithinDays(snapshots, days);
  return latest && baseline !== null ? latest.followerCount - baseline : null;
}

function formatNullableChange(value: number | null) {
  return value === null ? '—' : formatChange(value);
}

function formatPercent(value: number | null) {
  if (value === null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(value < 10 && value > -10 ? 1 : 0)}%`;
}

function changeTone(value: number | null) {
  if (value === null || value === 0) return 'text-slate-950';
  return value > 0 ? 'text-emerald-700' : 'text-rose-600';
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-cyan-950/10 bg-slate-50 p-4">
      <p className={`text-2xl font-black tabular-nums ${tone}`}>{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function Highlight({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      {detail && <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>}
    </div>
  );
}
