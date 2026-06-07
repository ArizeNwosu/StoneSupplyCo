import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCount, formatChange } from '@/lib/format';
import { parseHandle, isValidHandle } from '@/lib/handles';
import { getPublicHistorySnapshots } from '@/lib/public-history';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PublicChart } from '@/components/tracker/PublicChart';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const normalizedHandle = parseHandle(handle);

  if (!isValidHandle(normalizedHandle)) {
    return { title: 'Account not found' };
  }

  const account = await prisma.publicAccount.findUnique({
    where: { handle: normalizedHandle },
    select: { displayName: true, followerCount: true },
  });

  if (!account) {
    return { title: 'Account not found' };
  }

  const count = account.followerCount ? formatCount(account.followerCount) : 'Unknown';
  const name = account.displayName ?? `@${normalizedHandle}`;

  return {
    title: `@${normalizedHandle} Instagram Followers — Live Count & Growth History`,
    description: `Track @${normalizedHandle}'s Instagram follower count over time. Currently ${count} followers. See full growth history, daily changes, and trends.`,
    alternates: {
      canonical: `https://instagramfollowerstracker.com/${normalizedHandle}`,
    },
    openGraph: {
      title: `@${normalizedHandle} Instagram Followers — ${count}`,
      description: `${name} has ${count} Instagram followers. Track their growth history and daily changes.`,
      type: 'profile',
      url: `https://instagramfollowerstracker.com/${normalizedHandle}`,
    },
  };
}

export default async function HandlePage({ params }: PageProps) {
  const { handle } = await params;
  const normalizedHandle = parseHandle(handle);

  if (!isValidHandle(normalizedHandle)) notFound();

  const account = await prisma.publicAccount.findUnique({
    where: { handle: normalizedHandle },
    include: {
      snapshots: {
        orderBy: { takenAt: 'desc' },
        take: 90,
        select: {
          takenAt: true,
          followerCount: true,
          followingCount: true,
          postCount: true,
        },
      },
    },
  });

  if (!account) notFound();

  const snapshots = await getPublicHistorySnapshots({
    handle: normalizedHandle,
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
  const currentCount = snapshots.at(-1)?.followerCount ?? account.followerCount;
  const oldest = snapshots[0]?.followerCount ?? null;
  const change30d = currentCount !== null && oldest !== null ? currentCount - oldest : null;
  const avgDailyGain =
    change30d !== null && snapshots.length > 1
      ? Math.round(change30d / (snapshots.length - 1))
      : null;

  // Similar accounts — others with high follower counts excluding this one
  const similar = await prisma.publicAccount
    .findMany({
      where: { handle: { not: normalizedHandle }, followerCount: { not: null } },
      orderBy: { followerCount: 'desc' },
      take: 6,
      select: { handle: true, displayName: true, followerCount: true },
    })
    .catch(() => []);

  const topAccounts = await prisma.publicAccount
    .findMany({ orderBy: { followerCount: 'desc' }, take: 100, select: { handle: true } })
    .catch(() => []);

  // ProfilePage + BreadcrumbList JSON-LD
  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `@${normalizedHandle} Instagram Profile`,
    url: `https://instagramfollowerstracker.com/${normalizedHandle}`,
    mainEntity: {
      '@type': 'Person',
      name: account.displayName ?? `@${normalizedHandle}`,
      identifier: normalizedHandle,
      description: account.bio ?? undefined,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://instagramfollowerstracker.com' },
      { '@type': 'ListItem', position: 2, name: `@${normalizedHandle}`, item: `https://instagramfollowerstracker.com/${normalizedHandle}` },
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
            <nav className="mb-8 text-sm font-semibold text-slate-500">
              <Link href="/" className="transition hover:text-teal-800">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-950">@{normalizedHandle}</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <div className="mb-6 flex items-center gap-5">
                  {account.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={account.avatarUrl}
                      alt={`@${normalizedHandle} Instagram avatar`}
                      className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-xl shadow-cyan-950/10"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-950 text-4xl font-black text-white shadow-xl shadow-cyan-950/10">
                      {normalizedHandle[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="mb-2 inline-flex rounded-full border border-cyan-950/10 bg-white px-3 py-1 text-xs font-black uppercase text-teal-800">
                      Public follower report
                    </p>
                    <h1 className="truncate text-4xl font-black text-slate-950 sm:text-5xl">
                      @{normalizedHandle}
                    </h1>
                    {account.displayName && (
                      <p className="mt-2 text-lg font-semibold text-slate-600">
                        {account.displayName}
                      </p>
                    )}
                  </div>
                </div>
                {account.bio && (
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    {account.bio}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-2xl shadow-cyan-950/10">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Followers', value: currentCount !== null ? formatCount(currentCount) : '—', tone: 'text-teal-700' },
                    { label: '30d change', value: change30d !== null ? formatChange(change30d) : '—', tone: 'text-slate-950' },
                    { label: 'Avg / day', value: avgDailyGain !== null ? formatChange(avgDailyGain) : '—', tone: 'text-slate-950' },
                    { label: 'Following', value: account.followingCount !== null ? formatCount(account.followingCount) : '—', tone: 'text-slate-950' },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-cyan-950/10 bg-slate-50 p-4">
                      <p className={`text-2xl font-black ${metric.tone}`}>{metric.value}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-rose-600">
                  Growth history
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  @{normalizedHandle} Instagram follower count history
                </h2>
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {snapshots.length} saved snapshot{snapshots.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-xl shadow-cyan-950/10">
              {snapshots.length > 0 ? (
                <PublicChart snapshots={snapshots} handle={normalizedHandle} />
              ) : (
                <div className="flex h-56 items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-500">
                  No historical data yet. Check back after the next snapshot.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-cyan-300">
                Track accounts like this
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight">
                Build this same history for any public Instagram account.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                One public account is free. Upgrade when you need more
                competitor, creator, brand, or client accounts.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-white"
              >
                Start tracking free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
          </div>
        </section>

        {similar.length > 0 && (
          <section className="bg-sky-50 py-12 sm:py-16">
            <div className="mx-auto max-w-7xl px-4">
              <h2 className="text-3xl font-black text-slate-950">
                Similar accounts to track
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((a) => (
                  <Link
                    key={a.handle}
                    href={`/${a.handle}`}
                    className="group rounded-lg border border-cyan-950/10 bg-white p-4 transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl hover:shadow-cyan-950/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                          {a.handle[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">@{a.handle}</p>
                          <p className="truncate text-xs font-semibold text-slate-500">
                            {a.displayName ?? 'Public account'}
                          </p>
                        </div>
                      </div>
                      {a.followerCount && (
                        <span className="shrink-0 rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-teal-800">
                          {formatCount(a.followerCount)}
                        </span>
                      )}
                    </div>
                    <SimilarSparkline />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer topAccounts={topAccounts} />
    </>
  );
}

function SimilarSparkline() {
  return (
    <svg
      className="mt-4 h-14 w-full"
      viewBox="0 0 260 64"
      role="img"
      aria-label="Follower history preview"
    >
      <path
        d="M4 48 L48 44 L86 34 L128 36 L166 24 L210 18 L256 10"
        fill="none"
        stroke="#0f766e"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <path
        d="M4 48 L48 44 L86 34 L128 36 L166 24 L210 18 L256 10 L256 60 L4 60 Z"
        fill="#14b8a6"
        opacity="0.16"
      />
    </svg>
  );
}
