import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { formatCount } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { getPublicSeoIndexStatus } from '@/lib/public-seo-quality';
import { SITE_URL } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Instagram Follower Counts & Public Growth History',
  description:
    'Browse public Instagram follower counts, historical growth charts, daily changes, and tracked account trends.',
  alternates: { canonical: `${SITE_URL}/instagram-follower-count` },
  robots: { index: true, follow: true },
};

export default async function InstagramFollowerCountDirectory() {
  const candidates = await prisma.publicAccount
    .findMany({
      where: { followerCount: { not: null } },
      orderBy: [{ followerCount: 'desc' }, { handle: 'asc' }],
      take: 500,
      include: { _count: { select: { snapshots: true } } },
    })
    .catch(() => []);

  const accounts = candidates.filter((account) =>
    getPublicSeoIndexStatus({
      handle: account.handle,
      followerCount: account.followerCount,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      bio: account.bio,
      snapshotCount: account._count.snapshots,
      lastUpdatedAt: account.lastChecked,
    }).sitemapEligible
  );

  return (
    <>
      <Navbar />
      <main>
        <section className="border-b border-cyan-950/10 bg-sky-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-teal-700">
              Public account directory
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
              Instagram follower counts and growth history
            </h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              Browse accounts with recent public data and enough daily snapshots to show a
              meaningful follower trend. Each account has one permanent history page.
            </p>
          </div>
        </section>

        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-rose-600">Tracked accounts</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Recent public histories</h2>
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {accounts.length} account{accounts.length === 1 ? '' : 's'}
              </p>
            </div>

            {accounts.length > 0 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                  <Link
                    key={account.handle}
                    href={`/instagram-follower-count/${account.handle}`}
                    className="group rounded-lg border border-cyan-950/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl hover:shadow-cyan-950/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black text-slate-950">
                          {account.displayName ?? `@${account.handle}`}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                          @{account.handle}
                        </p>
                      </div>
                      <p className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-teal-800">
                        {account.followerCount !== null ? formatCount(account.followerCount) : '—'}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-cyan-950/10 pt-4 text-xs font-bold">
                      <span className="text-slate-500">
                        {account._count.snapshots} daily snapshots
                      </span>
                      <span className="text-teal-700 group-hover:text-teal-900">View history →</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border border-cyan-950/10 bg-slate-50 p-8 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Public histories will appear after they have enough recent daily data.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-sky-50 py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl font-black text-slate-950">How accounts qualify</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
              The directory only links to public profiles with a valid follower count, recognizable
              profile information, at least seven daily snapshots, and data refreshed within the
              last two weeks. Thin or stale pages remain outside the sitemap.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
