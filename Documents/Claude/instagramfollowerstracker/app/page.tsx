import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Instagram Followers Tracker — Track Any Account Free',
  description:
    'The best free Instagram followers tracker. Track follower counts, growth history, and unfollowers for any public Instagram account. No login required for public stats.',
  alternates: { canonical: 'https://instagramfollowerstracker.com' },
};

const faqItems = [
  {
    question: 'What is the best Instagram follower tracker app?',
    answer:
      'Instagram Followers Tracker is the best free option — it tracks any public account, shows full growth history, and requires no login to view public stats. Unlike app-based trackers, it works directly in your browser.',
  },
  {
    question: 'How do I track Instagram follower growth for free?',
    answer:
      'Sign up for a free account, add any public Instagram handle, and our system automatically snapshots follower counts daily so you can see growth trends over time. Free accounts get 3 tracked accounts and 30 days of history.',
  },
  {
    question: 'Can I track who unfollowed me on Instagram?',
    answer:
      'Yes. Our unfollow tracker shows you day-by-day follower changes so you can see exactly when drops occurred and track when specific follower-loss events happened.',
  },
  {
    question: 'What is the best free follower tracker for Instagram?',
    answer:
      'This tool. Free users get 3 tracked accounts with 30 days of follower count history. No credit card required, no app download needed.',
  },
  {
    question: 'How do I see my Instagram follower count history?',
    answer:
      'Add your account to the instagram follower tracker. We snapshot follower counts daily and display them as an interactive growth chart. Pro plans unlock up to 1 year of full follower count history.',
  },
  {
    question: 'Is there a website that tracks Instagram followers?',
    answer:
      'Yes — instagramfollowerstracker.com. Public pages for top accounts are available without signing in. Sign up to track any account you choose with daily updates.',
  },
  {
    question: 'How do I track followers and unfollowers on Instagram?',
    answer:
      'Our tool tracks followers and unfollowers on Instagram by comparing daily snapshots. Add your account, and we show you every follower gain and loss on a timeline, so you can spot trends and identify when drops happen.',
  },
  {
    question: 'Does this work as an Instagram growth tracker?',
    answer:
      'Yes. The Instagram growth tracker feature shows daily, weekly, and 30-day follower trends, average daily gain rate, and peak follower counts — everything you need to understand and report on account growth.',
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

const features = [
  {
    icon: '📉',
    title: 'Unfollow Tracker',
    description:
      'See exactly when followers drop. Track unfollowers day by day and identify when and why your count changes.',
  },
  {
    icon: '📈',
    title: 'Instagram Growth Tracker',
    description:
      'Visualize follower growth over days, weeks, and months with an interactive chart. Spot trends before your competition does.',
  },
  {
    icon: '🔢',
    title: 'Follower Count History',
    description:
      'Every daily snapshot stored permanently. Full follower count tracker history going back up to a year on Pro.',
  },
  {
    icon: '🔔',
    title: 'New Followers Tracker',
    description:
      'Get email alerts when accounts hit milestones or experience unusual spikes. React to viral moments instantly.',
  },
];

export default async function HomePage() {
  const topAccounts = await prisma.publicAccount
    .findMany({
      orderBy: { followerCount: 'desc' },
      take: 100,
      select: { handle: true },
    })
    .catch(() => [] as { handle: string }[]);

  return (
    <>
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
          Instagram Followers Tracker
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          The fastest ig follower tracker on the web. Track any public account —
          your own, a competitor&apos;s, or your favorite creator. See full
          instagram follow tracker history, spot unfollowers, and understand
          what drives growth.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-8 py-4 text-lg hover:opacity-90 transition shadow-lg shadow-purple-200"
        >
          Start Tracking Free
        </Link>
        <p className="mt-3 text-sm text-gray-400">
          Free forever · No credit card · 3 accounts included
        </p>
      </section>

      {/* Features */}
      <section
        className="mx-auto max-w-5xl px-4 pb-20"
        aria-label="Features"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
            >
              <div className="text-3xl mb-3" aria-hidden="true">
                {f.icon}
              </div>
              <h2 className="font-semibold text-gray-900 mb-2">{f.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Track Instagram follower growth in 3 steps
          </h2>
          <p className="text-gray-500 mb-12 max-w-xl mx-auto">
            No API keys. No app installation. Just add any public handle and
            we start tracking.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Add any account',
                desc: 'Paste an Instagram handle or profile URL. We accept @handle, instagram.com/handle, or just the username.',
              },
              {
                step: '2',
                title: 'We snapshot daily',
                desc: 'Every day at 6am UTC, our system fetches the latest follower count and stores it permanently.',
              },
              {
                step: '3',
                title: 'See growth over time',
                desc: 'View interactive charts, daily deltas, and trend data. Export your data anytime.',
              },
            ].map((item) => (
              <div key={item.step} className="text-left">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm flex items-center justify-center mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {faqItems.map((item) => (
            <div key={item.question} className="border-b border-gray-100 pb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {item.question}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer topAccounts={topAccounts} />
    </>
  );
}
