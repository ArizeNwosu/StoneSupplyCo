import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HandleSearch } from '@/components/home/HandleSearch';
import { prisma } from '@/lib/prisma';
import { formatCount } from '@/lib/format';
import { auth } from '@/lib/auth';
import { ALL_POSTS } from '@/lib/blog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Instagram Followers Tracker - Free Online Tracker Without Login',
  description:
    'Track Instagram follower counts, growth history, public account trends, and export-based unfollow reports. Free online tracker with no password sharing.',
  alternates: { canonical: 'https://instagramfollowerstracker.com' },
};

const faqItems = [
  {
    question: 'What is the best Instagram follower tracker app?',
    answer:
      'Instagram Followers Tracker is built for public account monitoring: competitors, creators, brands, clients, and campaign watchlists. It stores follower-count history and separates own-account unfollower analysis into the official export workflow.',
  },
  {
    question: 'How do I track Instagram follower growth for free?',
    answer:
      'Create a free account, add a public Instagram handle you want to watch, and the tracker fetches the first follower-count snapshot automatically. The dashboard builds growth history as new daily snapshots are collected.',
  },
  {
    question: 'Can I track who unfollowed me on Instagram?',
    answer:
      'Yes. Upload official Instagram data exports over time, or connect scheduled Google Drive exports, and the app compares follower lists to show who is new or missing.',
  },
  {
    question: 'Do I need to share my Instagram password?',
    answer:
      'No. Public tracking never needs an Instagram login, and unfollower detection uses files you download from Instagram yourself.',
  },
  {
    question: 'How do I see Instagram follower count history?',
    answer:
      'Add a public account, competitor, creator, brand, or client profile to the dashboard. The app displays follower-count history in growth charts with daily, weekly, and monthly movement.',
  },
  {
    question: 'Is this a website that tracks Instagram followers?',
    answer:
      'Yes. The product runs in your browser, includes public account pages, and does not require a mobile app download.',
  },
  {
    question: 'Does this work as an Instagram growth tracker?',
    answer:
      'Yes. It shows follower count history, 7-day and 30-day trends, average daily gain, and shareable reports for account monitoring.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Instagram Followers Tracker',
  url: 'https://instagramfollowerstracker.com',
  logo: 'https://instagramfollowerstracker.com/logo.png',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@instagramfollowerstracker.com',
  },
  sameAs: [],
};

const proofStats = [
  { value: '0', label: 'Instagram passwords requested' },
  { value: 'Browser', label: 'First snapshot capture' },
  { value: 'Public', label: 'Competitor and creator tracking' },
  { value: 'Web', label: 'No app install required' },
];

const featureCards = [
  {
    title: 'Find follower drops',
    description:
      'See when a public account loses followers and compare the movement against prior days.',
    icon: ShieldIcon,
  },
  {
    title: 'Track growth history',
    description:
      'Browser-assisted and server snapshots build a clean chart of public follower growth, spikes, and slowdowns.',
    icon: ChartIcon,
  },
  {
    title: 'Monitor other accounts',
    description:
      'Watch creators, brands, competitors, clients, athletes, and campaign targets in one dashboard.',
    icon: UploadIcon,
  },
  {
    title: 'Watch public accounts',
    description:
      'Track creators, brands, competitors, and clients without installing anything.',
    icon: RadarIcon,
  },
];

const comparisonRows = [
  {
    bad: 'Ask for your Instagram username and password',
    good: 'Never asks for your Instagram password',
  },
  {
    bad: 'Depend on risky app-store scraping flows',
    good: 'Separates public account tracking from user-owned export diffs',
  },
  {
    bad: 'Hide changes behind vague “activity” screens',
    good: 'Shows daily deltas, charts, and exportable lists',
  },
  {
    bad: 'Make every workflow feel like a dark pattern',
    good: 'Clear limits, free tracking, and simple upgrades',
  },
];

const workflow = [
  {
    title: 'Search a handle',
    description: 'Paste @handle, a profile URL, or a plain username.',
  },
  {
    title: 'Start the daily record',
    description: 'Save the first public follower snapshot, then add new captures as history builds.',
  },
  {
    title: 'Compare the changes',
    description: 'Use charts, deltas, reports, and export workflows to see what moved.',
  },
];

const reviews = [
  {
    quote:
      'Finally, a tracker I can use without handing over an Instagram login.',
    name: 'Creator manager',
  },
  {
    quote:
      'The public pages are perfect for quick competitor checks before reports.',
    name: 'Agency operator',
  },
  {
    quote:
      'Upload, compare, export. That is exactly how unfollower tracking should work.',
    name: 'Social lead',
  },
];

const featuredBlogSlugs = [
  'instagram-followers-tracker',
  'free-instagram-unfollow-tracker',
  'instagram-follower-tracker-that-works',
  'instagram-follow-back-tracker',
];

export default async function HomePage() {
  const [session, topAccounts] = await Promise.all([
    auth(),
    Promise.race([
    prisma.publicAccount
      .findMany({ orderBy: { followerCount: 'desc' }, take: 100, select: { handle: true, displayName: true, followerCount: true } })
      .catch(() => [] as { handle: string; displayName: string | null; followerCount: number | null }[]),
      new Promise<{ handle: string; displayName: string | null; followerCount: number | null }[]>((resolve) =>
        setTimeout(() => resolve([]), 5000)
      ),
    ]),
  ]);

  const ctaHref = session?.user ? '/dashboard' : '/auth/signup';
  const ctaLabel = session?.user ? 'Go to Dashboard' : 'Start tracking free';
  const featuredPosts = featuredBlogSlugs
    .map((slug) => ALL_POSTS.find((post) => post.slug === slug))
    .filter((post): post is (typeof ALL_POSTS)[number] => post !== undefined);

  return (
    <>
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <main>
        <section className="relative overflow-hidden border-b border-cyan-950/10 bg-sky-50">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(rgba(8,47,73,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(8,47,73,0.08)_1px,transparent_1px)] bg-[size:42px_42px]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sky-50 to-transparent"
          />
          <HeroScene />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-16 lg:py-20">
            <div className="max-w-3xl animate-rise-in">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-950/10 bg-white px-4 py-2 text-sm font-bold text-teal-800 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Safe follower tracking, no Instagram password
              </p>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.02] text-slate-950 sm:text-5xl lg:text-7xl">
                Instagram Followers Tracker
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:mt-6 sm:text-lg sm:leading-8">
                Track public Instagram accounts your native Insights cannot show you:
                competitors, creators, brands, clients, and campaign targets.
                Use the no-login export workflow to find unfollowers, follow-back
                gaps, and relationship cleanup opportunities for your own account.
              </p>
              <div className="mt-8">
                <HandleSearch isLoggedIn={!!session?.user} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">Public account pages</span>
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">Instant first snapshot</span>
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">Free online tracker</span>
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">Unfollow tracker without login</span>
              </div>
            </div>

            <div className="mt-12 lg:hidden">
              <MobileHeroPanel />
            </div>
          </div>
        </section>

        <section className="border-b border-cyan-950/10 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-cyan-950/10 px-4 sm:grid-cols-4">
            {proofStats.map((stat) => (
              <div key={stat.label} className="bg-white py-7 text-center">
                <p className="text-2xl font-black text-slate-950">{stat.value}</p>
                <p className="mt-1 px-2 text-sm font-semibold text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="text-sm font-black uppercase text-rose-600">
                  The safer way to check followers
                </p>
                <h2 className="mt-3 max-w-2xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                  Stop trusting sketchy unfollower apps with your account.
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Most unfollower tools create risk by asking for credentials.
                This tracker separates public account analytics from private
                follower-list comparisons, so users stay in control of their data.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-5">
                <h3 className="text-lg font-black text-red-950">Risky apps</h3>
                <div className="mt-5 space-y-3">
                  {comparisonRows.map((row) => (
                    <ComparisonItem key={row.bad} text={row.bad} tone="bad" />
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <h3 className="text-lg font-black text-emerald-950">This tracker</h3>
                <div className="mt-5 space-y-3">
                  {comparisonRows.map((row) => (
                    <ComparisonItem key={row.good} text={row.good} tone="good" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-16 text-white sm:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase text-cyan-300">
                  Product power
                </p>
                <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
                  Built for follower count history and unfollower evidence.
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-300">
                  The dashboard gives you the count trend. The upload flow gives
                  you the list diff. Together, they make follower movement
                  easier to explain.
                </p>
                <Link
                  href={ctaHref}
                  className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100"
                >
                  {ctaLabel}
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {featureCards.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-lg border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/20"
                  >
                    <feature.icon className="h-10 w-10 text-cyan-300" />
                    <h3 className="mt-5 text-lg font-black">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-sky-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <DashboardPreview />

              <div>
                <p className="text-sm font-black uppercase text-teal-800">
                  How it works
                </p>
                <h2 className="mt-3 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                  Three steps from guesswork to a clean follower record.
                </h2>
                <ol className="mt-8 space-y-5">
                  {workflow.map((item, index) => (
                    <li key={item.title} className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {topAccounts.length > 0 && (
          <section className="bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-rose-600">
                    Public pages
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-slate-950">
                    Popular accounts already have charts.
                  </h2>
                </div>
                <Link
                  href="/instagram-tracking-tools"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-950/10 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Explore tools
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {topAccounts.slice(0, 8).map((account) => (
                  <Link
                    key={account.handle}
                    href={`/instagram-follower-count/${account.handle}`}
                    className="group rounded-lg border border-cyan-950/10 bg-slate-50 p-4 transition hover:-translate-y-1 hover:border-teal-300 hover:bg-white hover:shadow-xl hover:shadow-cyan-950/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">
                          @{account.handle}
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                          {account.displayName ?? 'Public account'}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-teal-800">
                        {account.followerCount ? formatCount(account.followerCount) : 'Live'}
                      </span>
                    </div>
                    <MiniSparkline />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-cyan-700">
                  Tracking guides
                </p>
                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  Learn the safe way to track Instagram followers.
                </h2>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  These guides explain public account monitoring, growth history,
                  and export-based unfollower checks without risky login sharing.
                </p>
              </div>
              <Link
                href="/blog"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-950/10 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                View all guides
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {featuredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex min-h-56 flex-col rounded-lg border border-cyan-950/10 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-teal-300 hover:bg-white hover:shadow-xl hover:shadow-cyan-950/10"
                >
                  <p className="text-xs font-black uppercase text-teal-700">
                    {post.category}
                  </p>
                  <h3 className="mt-3 text-lg font-black leading-snug text-slate-950 group-hover:text-teal-700">
                    {post.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm font-semibold leading-6 text-slate-500">
                    {post.description}
                  </p>
                  <span className="mt-4 text-sm font-black text-cyan-700">
                    Read guide
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-rose-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase text-rose-700">
                Social proof
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                Made for people who need answers, not another risky app.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {reviews.map((review) => (
                <figure key={review.name} className="rounded-lg border border-rose-200 bg-white p-5">
                  <blockquote className="text-lg font-black leading-7 text-slate-950">
                    “{review.quote}”
                  </blockquote>
                  <figcaption className="mt-5 text-sm font-bold text-rose-700">
                    {review.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-black uppercase text-teal-800">
                Questions
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                Clear answers before you track anything.
              </h2>
            </div>
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.question} className="rounded-lg border border-cyan-950/10 p-5">
                  <h3 className="font-black text-slate-950">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-black">Find the follower movement today.</h2>
              <p className="mt-2 text-sm text-slate-300">
                One tracked account is free. Upgrade when you need exports or more accounts.
              </p>
            </div>
            <Link
              href={ctaHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-white"
            >
              {ctaLabel}
            </Link>
          </div>
        </section>
      </main>

      <Footer topAccounts={topAccounts} className="mt-0" />
    </>
  );
}

function HeroScene() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
      <div className="absolute right-[6vw] top-16 w-[520px] rounded-lg border border-cyan-950/10 bg-white/90 p-5 shadow-2xl shadow-cyan-950/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-slate-400">Live account</p>
            <p className="mt-1 text-2xl font-black text-slate-950">@splitflask</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
            +1.7K
          </span>
        </div>
        <div className="mt-6 h-48 rounded-lg bg-sky-50 p-4">
          <svg className="h-full w-full" viewBox="0 0 420 160" role="img" aria-label="Follower growth chart mockup">
            <path d="M16 132 L88 120 L154 98 L218 83 L292 44 L404 22" fill="none" stroke="#0f766e" strokeLinecap="round" strokeWidth="7" />
            <path d="M16 132 L88 120 L154 98 L218 83 L292 44 L404 22 L404 150 L16 150 Z" fill="#14b8a6" opacity="0.16" />
            {[16, 88, 154, 218, 292, 404].map((x, index) => (
              <circle key={x} cx={x} cy={[132, 120, 98, 83, 44, 22][index]} r="5" fill="#fff" stroke="#0f766e" strokeWidth="4" />
            ))}
          </svg>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <SceneMetric label="Followers" value="18.2K" />
          <SceneMetric label="Avg / day" value="+700K" />
          <SceneMetric label="History" value="90d" />
        </div>
      </div>

      <div className="absolute bottom-10 right-[8vw] w-72 rounded-lg border border-rose-200 bg-white p-4 shadow-2xl shadow-rose-950/10">
        <p className="text-xs font-black uppercase text-rose-600">Export diff</p>
        <p className="mt-2 text-3xl font-black text-slate-950">392</p>
        <p className="text-sm font-semibold text-slate-500">accounts do not follow back</p>
        <div className="mt-4 space-y-2">
          {['@patricksss', '@doug', '@urfather.22', '@fakefriend.lol'].map((handle) => (
            <div key={handle} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
              <span>{handle}</span>
              <span className="text-rose-600">missing</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileHeroPanel() {
  return (
    <div className="rounded-lg border border-cyan-950/10 bg-white p-4 shadow-xl shadow-cyan-950/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">Growth check</p>
          <p className="mt-1 text-xl font-black text-slate-950">@instagram</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
          Safe
        </span>
      </div>
      <MiniSparkline large />
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-lg border border-cyan-950/10 bg-white p-4 shadow-2xl shadow-cyan-950/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-950/10 pb-4">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">Dashboard preview</p>
          <p className="mt-1 text-2xl font-black text-slate-950">Follower movement</p>
        </div>
        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-900">
          Live chart
        </span>
      </div>
      <div className="grid gap-4 py-4 sm:grid-cols-3">
        <SceneMetric label="Current" value="128.4K" />
        <SceneMetric label="7d change" value="+1.8K" />
        <SceneMetric label="Lost" value="-42" />
      </div>
      <div className="h-72 rounded-lg bg-slate-50 p-4">
        <svg className="h-full w-full" viewBox="0 0 640 260" role="img" aria-label="Dashboard follower chart preview">
          <g stroke="rgba(15,23,42,0.1)">
            <line x1="20" x2="620" y1="40" y2="40" />
            <line x1="20" x2="620" y1="120" y2="120" />
            <line x1="20" x2="620" y1="200" y2="200" />
          </g>
          <path d="M24 206 C92 176 124 185 176 158 C242 122 286 138 344 94 C408 48 492 72 618 34" fill="none" stroke="#0f766e" strokeLinecap="round" strokeWidth="8" />
          <path d="M24 206 C92 176 124 185 176 158 C242 122 286 138 344 94 C408 48 492 72 618 34 L618 236 L24 236 Z" fill="#2dd4bf" opacity="0.18" />
          <path d="M24 170 C112 186 176 198 250 176 C332 152 390 188 454 142 C510 101 554 118 618 86" fill="none" stroke="#fb7185" strokeLinecap="round" strokeWidth="5" opacity="0.85" />
        </svg>
      </div>
    </div>
  );
}

function SceneMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan-950/10 bg-white p-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function ComparisonItem({ text, tone }: { text: string; tone: 'good' | 'bad' }) {
  return (
    <div className="flex gap-3 rounded-lg bg-white p-3 text-sm font-bold text-slate-700">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white ${
          tone === 'good' ? 'bg-emerald-600' : 'bg-red-600'
        }`}
      >
        {tone === 'good' ? '✓' : '!'}
      </span>
      <span>{text}</span>
    </div>
  );
}

function MiniSparkline({ large = false }: { large?: boolean }) {
  return (
    <svg
      className={large ? 'mt-5 h-32 w-full' : 'mt-4 h-16 w-full'}
      viewBox="0 0 260 72"
      role="img"
      aria-label="Follower growth sparkline"
    >
      <path d="M4 56 L44 52 L84 38 L122 42 L164 24 L206 18 L256 10" fill="none" stroke="#0f766e" strokeLinecap="round" strokeWidth="5" />
      <path d="M4 56 L44 52 L84 38 L122 42 L164 24 L206 18 L256 10 L256 68 L4 68 Z" fill="#14b8a6" opacity="0.16" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 5 39 11v11c0 10-6 18-15 21C15 40 9 32 9 22V11l15-6Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="m17 24 5 5 11-13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M7 39h34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M11 33 20 22l8 6 11-17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="22" r="3" fill="currentColor" />
      <circle cx="28" cy="28" r="3" fill="currentColor" />
      <circle cx="39" cy="11" r="3" fill="currentColor" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M11 37h26a4 4 0 0 0 4-4v-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 31V8m0 0-8 8m8-8 8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 39h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function RadarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="3" />
      <circle cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="3" />
      <path d="M24 24 36 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="34" cy="14" r="4" fill="currentColor" />
    </svg>
  );
}
