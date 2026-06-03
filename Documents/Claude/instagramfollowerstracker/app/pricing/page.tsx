import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PLAN_PRICES } from '@/lib/limits';
import { CheckoutButton } from '@/components/pricing/CheckoutButton';

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
    href: '/dashboard',
    highlight: false,
  },
  {
    name: 'Pro' as const,
    planKey: 'PRO' as const,
    price: PLAN_PRICES.PRO.monthly,
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
    cta: 'Start Pro Free Trial',
    href: '/dashboard',
    highlight: true,
  },
  {
    name: 'Agency' as const,
    planKey: 'AGENCY' as const,
    price: PLAN_PRICES.AGENCY.monthly,
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
    cta: 'Start Agency Trial',
    href: '/dashboard',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500">
            Start free. Upgrade when you need more accounts or unfollow detection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.highlight
                  ? 'border-purple-500 shadow-xl shadow-purple-100 bg-white'
                  : 'border-gray-100 shadow-sm bg-white'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                    Most popular
                  </span>
                </div>
              )}

              <h2 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h2>
              <p className="text-sm text-gray-500 mb-5">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">{plan.priceLabel}</span>
                <span className="text-gray-500 ml-1 text-sm">/{plan.period}</span>
                {'annualNote' in plan && (
                  <p className="text-xs text-gray-400 mt-1">{plan.annualNote}</p>
                )}
              </div>

              {plan.planKey === null ? (
                <Link
                  href={plan.href}
                  className={`block w-full text-center rounded-xl font-semibold py-3 text-sm transition mb-8 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <CheckoutButton
                  plan={plan.planKey}
                  interval="monthly"
                  className={`block w-full text-center rounded-xl font-semibold py-3 text-sm transition mb-8 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </CheckoutButton>
              )}

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Pricing FAQ</h2>
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
              <div key={q} className="border-b border-gray-100 pb-5">
                <h3 className="font-semibold text-gray-900 mb-1.5">{q}</h3>
                <p className="text-sm text-gray-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer className="mt-12" />
    </>
  );
}
