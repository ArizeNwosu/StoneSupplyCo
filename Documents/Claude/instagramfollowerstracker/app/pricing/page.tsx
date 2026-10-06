import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PLAN_PRICES } from '@/lib/limits';
import { CheckoutButton } from '@/components/pricing/CheckoutButton';
import { PendingCheckout } from '@/components/pricing/PendingCheckout';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Instagram Followers Tracker pricing. Free plan includes 1 account. Pro plan adds 10 accounts, unfollow detection, and email alerts.',
  alternates: { canonical: 'https://instagramfollowerstracker.com/pricing' },
};

const plans = [
  {
    name: 'Free' as const,
    planKey: null as null,
    price: 0,
    priceLabel: '$0',
    period: 'forever',
    description: 'For individuals getting started',
    features: [
      '1 tracked account',
      'Full history (no limit)',
      'Daily follower snapshots',
      'Growth charts',
      'Public account pages',
    ],
    cta: 'Start Tracking Free',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Pro' as const,
    planKey: 'PRO' as const,
    price: PLAN_PRICES.PRO.monthly,
    annualTotal: PLAN_PRICES.PRO.annual * 12,
    priceLabel: `$${PLAN_PRICES.PRO.monthly}`,
    period: 'per month',
    annualNote: `or $${PLAN_PRICES.PRO.annual}/mo billed annually`,
    description: 'For creators and social media managers',
    features: [
      '10 tracked accounts',
      'Full history (no limit)',
      'Daily follower snapshots',
      'Email alerts (gain & loss)',
      'Growth charts + metrics',
      'Unfollow detection (via data export)',
      'Public account pages',
    ],
    cta: 'Upgrade to Pro',
    href: '/dashboard',
    highlight: true,
  },
  {
    name: 'Agency' as const,
    planKey: 'AGENCY' as const,
    price: PLAN_PRICES.AGENCY.monthly,
    annualTotal: PLAN_PRICES.AGENCY.annual * 12,
    priceLabel: `$${PLAN_PRICES.AGENCY.monthly}`,
    period: 'per month',
    annualNote: `or $${PLAN_PRICES.AGENCY.annual}/mo billed annually`,
    description: 'For agencies managing many clients',
    features: [
      '100 tracked accounts',
      'Full history (no limit)',
      'Daily follower snapshots',
      'Email alerts + daily digest',
      'Unfollow detection (via data export)',
      'Shareable client report links',
      'Fake follower score',
      'Cross-account pattern detection',
      'Embeddable follower widget',
      'API access',
      'Priority support',
    ],
    cta: 'Upgrade to Agency',
    href: '/dashboard',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <PendingCheckout />
        <section className="relative overflow-hidden border-b border-cyan-950/10 bg-sky-50">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(rgba(8,47,73,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(8,47,73,0.08)_1px,transparent_1px)] bg-[size:42px_42px]"
          />
          <div className="relative mx-auto max-w-5xl px-4 py-16 text-center">
            <p className="mx-auto mb-4 inline-flex rounded-full border border-cyan-950/10 bg-white px-4 py-2 text-sm font-black uppercase text-teal-800">
              Pricing
            </p>
            <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-5xl md:text-6xl">
              Start safe. Scale when tracking gets serious.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Free public follower tracking, Pro unfollower export diffs, and
              Agency reporting for teams managing multiple accounts.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-lg border p-6 ${
                plan.highlight
                  ? 'border-teal-400 bg-white shadow-2xl shadow-cyan-950/10'
                  : 'border-cyan-950/10 bg-white shadow-sm'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-6">
                  <span className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-black text-white">
                    Most popular
                  </span>
                </div>
              )}

              <h2 className="mb-1 text-xl font-black text-slate-950">{plan.name}</h2>
              <p className="mb-5 text-sm leading-6 text-slate-500">{plan.description}</p>

              <div className="mb-6">
                <span className="text-5xl font-black text-slate-950">{plan.priceLabel}</span>
                <span className="ml-1 text-sm font-semibold text-slate-500">/{plan.period}</span>
                {'annualNote' in plan && (
                  <p className="mt-1 text-xs font-semibold text-slate-400">{plan.annualNote}</p>
                )}
              </div>

              {plan.planKey === null ? (
                <Link
                  href={plan.href}
                  className={`mb-8 block w-full rounded-full py-3 text-center text-sm font-black transition ${
                    plan.highlight
                      ? 'bg-slate-950 text-white hover:-translate-y-0.5 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-950 hover:bg-slate-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <div className="mb-8 space-y-2">
                  <CheckoutButton
                    plan={plan.planKey}
                    interval="monthly"
                    className={`block w-full rounded-full py-3 text-center text-sm font-black transition ${
                      plan.highlight
                        ? 'bg-slate-950 text-white hover:-translate-y-0.5 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200'
                    }`}
                  >
                    {plan.cta}
                  </CheckoutButton>
                  <CheckoutButton
                    plan={plan.planKey}
                    interval="annual"
                    className="block w-full rounded-full border border-cyan-950/10 bg-white py-3 text-center text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                  >
                    Pay annually — ${plan.annualTotal} / year
                  </CheckoutButton>
                </div>
              )}

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
                    <svg className="h-4 w-4 shrink-0 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="mb-8 text-center text-3xl font-black text-slate-950">Pricing FAQ</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Do I need a credit card to start?',
                a: 'No. The free plan is free forever with no credit card required.',
              },
              {
                q: 'Can I track private Instagram accounts?',
                a: "No. We can only track public accounts. Private accounts block our scraper.",
              },
              {
                q: 'How often are follower counts updated?',
                a: 'Counts are updated once daily at 6 AM UTC for all plans.',
              },
              {
                q: 'What happens if I hit my account limit?',
                a: "You'll get a clear error message with a link to upgrade. Existing tracked accounts won't be affected.",
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel anytime from your settings page. Your data is preserved for 30 days after cancellation.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-lg border border-cyan-950/10 bg-white p-5">
                <h3 className="mb-1.5 font-black text-slate-950">{q}</h3>
                <p className="text-sm leading-6 text-slate-600">{a}</p>
              </div>
            ))}
          </div>
        </div>
        </section>
      </main>
      <Footer className="mt-0" />
    </>
  );
}
