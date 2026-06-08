import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PublicChart } from '@/components/tracker/PublicChart';
import { formatChange, formatCount } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { getPublicHistorySnapshots } from '@/lib/public-history';
import { getPublicSeoIndexStatus } from '@/lib/public-seo-quality';
import { SEO_ACCOUNT_PAGES, getSeoAccountPage } from '@/lib/seo-account-pages';
import { ensureSeoPublicAccount } from '@/lib/seo-public-accounts';

export const dynamic = 'force-dynamic';

const GUIDE_LINKS: Array<{ label: string; href: string }> = [
  { label: 'Instagram followers tracker', href: '/blog/instagram-followers-tracker' },
  { label: 'Track follower growth over time', href: '/blog/track-instagram-follower-growth' },
  { label: 'Instagram follower count history', href: '/blog/instagram-follower-count-history' },
  { label: 'Best Instagram follower tracker apps', href: '/blog/best-instagram-follower-tracker-apps' },
];

interface PageProps {
  params: Promise<{ handle: string; username: string }>;
}

export function generateStaticParams() {
  return SEO_ACCOUNT_PAGES.map((page) => ({
    handle: page.slug,
    username: page.username,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle, username } = await params;
  const page = getSeoAccountPage(handle, username);
  if (!page) return { title: 'Instagram account tracker' };

  const account = await prisma.publicAccount
    .findUnique({
      where: { handle: page.username },
      include: { _count: { select: { snapshots: true } } },
    })
    .catch(() => null);
  const status = getPublicSeoIndexStatus({
    handle: page.username,
    followerCount: account?.followerCount ?? null,
    displayName: account?.displayName ?? page.displayName,
    avatarUrl: account?.avatarUrl ?? null,
    bio: account?.bio ?? null,
    snapshotCount: account?._count.snapshots ?? 0,
  });
  const current = account?.followerCount ? formatCount(account.followerCount) : 'public';
  const url = `https://instagramfollowerstracker.com/${page.slug}/${page.username}`;

  return {
    title: `${page.keyword} - @${page.username} Follower Count & Growth History`,
    description: `${page.description} See the ${current} follower count, daily chart, and public Instagram growth history for @${page.username}.`,
    keywords: [
      page.keyword,
      `${page.displayName} Instagram followers`,
      `${page.displayName} follower count`,
      `${page.username} Instagram`,
      'instagram follower tracker',
      'instagram follower count history',
    ],
    alternates: { canonical: url },
    robots: status.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: `${page.displayName} Instagram Follower Count - @${page.username}`,
      description: page.description,
      type: 'website',
      url,
    },
  };
}

export default async function SeoAccountPage({ params }: PageProps) {
  const { handle, username } = await params;
  const page = getSeoAccountPage(handle, username);
  if (!page) notFound();

  await ensureSeoPublicAccount(page);

  const account = await prisma.publicAccount.findUnique({
    where: { handle: page.username },
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
    },
  });

  if (!account) notFound();

  const snapshots = await getPublicHistorySnapshots({
    handle: page.username,
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
  const change = currentCount !== null && oldest !== null ? currentCount - oldest : null;
  const avgDailyGain =
    change !== null && snapshots.length > 1
      ? Math.round(change / Math.max(1, snapshots.length - 1))
      : null;
  const lastSnapshot = snapshots.at(-1)?.takenAt ?? account.lastChecked;

  const siblingPages = SEO_ACCOUNT_PAGES
    .filter((item) => item.username === page.username && item.slug !== page.slug)
    .slice(0, 3);
  const relatedAccounts = SEO_ACCOUNT_PAGES
    .filter((item) => item.username !== page.username)
    .slice(0, 6);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${page.displayName} Instagram follower count`,
    url: `https://instagramfollowerstracker.com/${page.slug}/${page.username}`,
    about: {
      '@type': 'Person',
      name: page.displayName,
      identifier: page.username,
      sameAs: `https://www.instagram.com/${page.username}/`,
    },
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
              <Link href="/blog" className="transition hover:text-teal-800">Instagram tracking guides</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-950">{page.keyword}</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <p className="mb-4 inline-flex rounded-full border border-cyan-950/10 bg-white px-3 py-1 text-xs font-black uppercase text-teal-800">
                  Public Instagram follower tracker
                </p>
                <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
                  {page.displayName} Instagram follower count
                </h1>
                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
                  This public page tracks @{page.username} for the keyword &ldquo;{page.keyword}&rdquo; with
                  saved follower-count snapshots, growth history, and daily automated updates.
                </p>
              </div>

              <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-2xl shadow-cyan-950/10">
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="Followers" value={currentCount !== null ? formatCount(currentCount) : 'Queued'} tone="text-teal-700" />
                  <Metric label="Saved snapshots" value={String(snapshots.length)} tone="text-slate-950" />
                  <Metric label="Total change" value={change !== null ? formatChange(change) : 'Building'} tone={change !== null && change < 0 ? 'text-rose-600' : 'text-emerald-700'} />
                  <Metric label="Avg / snapshot" value={avgDailyGain !== null ? formatChange(avgDailyGain) : 'Building'} tone="text-slate-950" />
                </div>
                <p className="mt-4 text-xs font-semibold text-slate-500">
                  {lastSnapshot
                    ? `Last saved snapshot: ${new Date(lastSnapshot).toLocaleDateString()}`
                    : 'This account is queued for the next daily snapshot run.'}
                </p>
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
                  @{page.username} follower count history
                </h2>
              </div>
              <Link
                href={`/${page.username}`}
                className="text-sm font-black text-teal-700 transition hover:text-teal-900"
              >
                View canonical public profile →
              </Link>
            </div>

            <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-xl shadow-cyan-950/10">
              {snapshots.length > 0 ? (
                <PublicChart snapshots={snapshots} handle={page.username} />
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-slate-50 px-4 text-center">
                  <p className="text-sm font-black text-slate-950">
                    First snapshot queued
                  </p>
                  <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                    @{page.username} is seeded in the public tracking database. The chart will
                    populate after the next automated snapshot or historical backfill.
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
                Why track {page.displayName} on Instagram?
              </h2>
              <div className="mt-4 space-y-4 text-sm font-semibold leading-7 text-slate-600">
                <p>
                  High-profile Instagram accounts are useful benchmarks because their follower
                  counts react to releases, appearances, controversies, campaigns, and platform-wide
                  purges. A daily follower graph makes those changes visible over time.
                </p>
                <p>
                  If you add @{page.username} to your private dashboard, the app reuses the same
                  public database history where available, then continues saving your own daily
                  snapshots going forward.
                </p>
              </div>
            </article>

            <aside className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                Related tracking guides
              </h2>
              <div className="mt-4 space-y-3">
                {GUIDE_LINKS.map(({ label, href }) => (
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

        {(siblingPages.length > 0 || relatedAccounts.length > 0) && (
          <section className="bg-white py-12 sm:py-16">
            <div className="mx-auto max-w-7xl px-4">
              {siblingPages.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-slate-950">
                    More searches for {page.displayName}
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {siblingPages.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/${item.slug}/${item.username}`}
                        className="rounded-full border border-cyan-950/10 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-teal-300 hover:bg-white hover:text-teal-800"
                      >
                        {item.keyword}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <h2 className="text-2xl font-black text-slate-950">
                Other public Instagram accounts to track
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {relatedAccounts.map((item) => (
                  <Link
                    key={`${item.slug}-${item.username}`}
                    href={`/${item.slug}/${item.username}`}
                    className="rounded-lg border border-cyan-950/10 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl hover:shadow-cyan-950/10"
                  >
                    <p className="text-sm font-black text-slate-950">{item.displayName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">@{item.username}</p>
                    <p className="mt-3 text-xs font-bold text-teal-700">{item.keyword}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-cyan-300">
                Track any public account
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight">
                Add @{page.username} or another public Instagram handle.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                Your private dashboard can track creators, competitors, brands, celebrities,
                and client accounts with the same daily snapshot history.
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
      </main>

      <Footer topAccounts={SEO_PUBLIC_ACCOUNTS_AS_TOP_ACCOUNTS} />
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

const SEO_PUBLIC_ACCOUNTS_AS_TOP_ACCOUNTS = Array.from(
  new Map(SEO_ACCOUNT_PAGES.map((page) => [page.username, { handle: page.username }])).values()
);
