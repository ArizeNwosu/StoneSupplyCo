import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'FAQ — Instagram Followers Tracker',
  description: 'Answers to the most common questions about tracking Instagram followers, unfollower detection, privacy, and pricing.',
  alternates: { canonical: 'https://www.instagramfollowerstracker.com/faq' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Instagram Followers Tracker?',
      acceptedAnswer: { '@type': 'Answer', text: 'Instagram Followers Tracker is a free web tool that records daily follower counts for any public Instagram account and displays growth charts, trend metrics, and follower-change history. No Instagram login or password is required.' },
    },
    {
      '@type': 'Question',
      name: 'Does it work without my Instagram password?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. All public account tracking uses publicly visible follower counts — no Instagram login required. For unfollower detection on your own account, you upload an official Instagram data export file, not your password.' },
    },
    {
      '@type': 'Question',
      name: 'How many accounts can I track for free?',
      acceptedAnswer: { '@type': 'Answer', text: 'The free plan lets you track one public Instagram account with full follower-count history. Upgrade to Pro for more accounts.' },
    },
    {
      '@type': 'Question',
      name: 'How often are follower counts updated?',
      acceptedAnswer: { '@type': 'Answer', text: 'Follower counts are updated once per day for tracked accounts. The exact time varies, but you can expect a fresh snapshot within each 24-hour window.' },
    },
    {
      '@type': 'Question',
      name: 'When does the growth chart unlock?',
      acceptedAnswer: { '@type': 'Answer', text: 'Charts unlock after 7 daily snapshots have been collected. Before that, the dashboard shows your current follower count and progress toward chart unlock.' },
    },
    {
      '@type': 'Question',
      name: 'Can I track a private Instagram account?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. Public follower-count tracking only works for public Instagram accounts. Private accounts do not expose their follower count publicly.' },
    },
    {
      '@type': 'Question',
      name: 'How does unfollower detection work?',
      acceptedAnswer: { '@type': 'Answer', text: 'You export your Instagram data from Instagram\'s Accounts Center, then upload the small followers_and_following files. The tool compares two uploads to show exactly who followed or unfollowed you between the two exports. No Instagram password is involved.' },
    },
    {
      '@type': 'Question',
      name: 'Can I see who unfollowed someone else?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. Person-level unfollower names require the official Instagram export, which only you can request for your own account. For public accounts you do not own, you can see follower count changes but not individual unfollower names.' },
    },
    {
      '@type': 'Question',
      name: 'Is the follower count data accurate?',
      acceptedAnswer: { '@type': 'Answer', text: 'Counts are fetched directly from public Instagram pages and are accurate at the time of the daily snapshot. Instagram occasionally serves cached or rounded counts, so figures may occasionally differ slightly from the Instagram app.' },
    },
    {
      '@type': 'Question',
      name: 'Does tracking an account notify the account owner?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. Tracking a public account\'s follower count is the same as looking up their profile — the account owner is not notified.' },
    },
    {
      '@type': 'Question',
      name: 'Can I download the free Instagram tools without an account?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. The video downloader, Reels downloader, and story downloader tools work without creating an account. Follower count tracking and unfollow detection require a free account.' },
    },
    {
      '@type': 'Question',
      name: 'What is included in the Pro plan?',
      acceptedAnswer: { '@type': 'Answer', text: 'Pro includes tracking for multiple accounts, person-level unfollower names, CSV exports, and longer trend windows. See the pricing page for current limits.' },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel my subscription?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Cancel any time from account settings. You keep access until the end of your current billing period. No partial refunds are issued except where required by law.' },
    },
    {
      '@type': 'Question',
      name: 'Is this affiliated with Instagram or Meta?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. Instagram Followers Tracker is an independent third-party service and is not affiliated with, endorsed by, or connected to Instagram or Meta in any way.' },
    },
  ],
};

const categories = [
  {
    label: 'Getting started',
    indices: [0, 1, 2, 3, 4],
  },
  {
    label: 'Tracking public accounts',
    indices: [5, 8, 9],
  },
  {
    label: 'Unfollower detection',
    indices: [6, 7],
  },
  {
    label: 'Free tools',
    indices: [10],
  },
  {
    label: 'Plans & billing',
    indices: [11, 12],
  },
  {
    label: 'About',
    indices: [13],
  },
];

export default function FaqPage() {
  const faqs = faqSchema.mainEntity;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Support</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">Frequently Asked Questions</h1>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Everything you need to know about tracking Instagram followers and unfollowers.
          </p>

          <div className="mt-10 space-y-12">
            {categories.map((cat) => (
              <section key={cat.label}>
                <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-cyan-700">
                  {cat.label}
                </h2>
                <div className="space-y-3">
                  {cat.indices.map((i) => {
                    const faq = faqs[i];
                    if (!faq) return null;
                    return (
                      <div key={faq.name} className="rounded-xl border border-slate-100 p-5">
                        <h3 className="text-sm font-black text-slate-900">{faq.name}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {faq.acceptedAnswer.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-slate-950 p-6 text-center">
            <p className="text-base font-black text-white">Still have questions?</p>
            <p className="mt-1 text-sm text-slate-400">Start tracking for free — no credit card required.</p>
            <Link
              href="/auth/signup"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-6 py-2.5 text-sm font-black text-slate-950 transition hover:bg-white"
            >
              Start Free →
            </Link>
          </div>

          <div className="mt-8 flex gap-4 border-t border-slate-100 pt-8 text-sm font-medium">
            <Link href="/privacy" className="text-cyan-700 hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="text-cyan-700 hover:underline">Terms of Service</Link>
            <Link href="/pricing" className="text-cyan-700 hover:underline">Pricing</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
