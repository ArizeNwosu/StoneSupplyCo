import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service — Instagram Followers Tracker',
  description: 'Terms of service for instagramfollowerstracker.com — acceptable use, plan limits, and disclaimers.',
  alternates: { canonical: 'https://www.instagramfollowerstracker.com/terms' },
};

const sections = [
  {
    title: 'Acceptance',
    body: `By creating an account or using instagramfollowerstracker.com you agree to these terms. If you do not agree, do not use the service.`,
  },
  {
    title: 'What the service provides',
    body: `instagramfollowerstracker.com tracks publicly available follower counts for public Instagram accounts and provides export-based unfollower detection for your own account. The service does not require your Instagram password and does not access private Instagram data. Follower counts are sourced from public Instagram pages and may differ slightly from counts shown inside the Instagram app due to caching and timing.`,
  },
  {
    title: 'Acceptable use',
    body: `You may use this service for personal, research, or business purposes. You may not: use the service to harass, stalk, or monitor individuals without their consent; attempt to scrape or automate requests to our API beyond normal usage; use the service to violate Instagram's or Meta's terms of service; resell or redistribute raw data obtained through the service without a written agreement; or use the service in any way that violates applicable law.`,
  },
  {
    title: 'Plan limits',
    body: `Free accounts may track one public Instagram account. Pro and Agency accounts may track more accounts as described on the pricing page. Plan limits are enforced automatically. Upgrading or downgrading takes effect immediately. We reserve the right to change plan limits with 30 days' notice to existing subscribers.`,
  },
  {
    title: 'Billing and refunds',
    body: `Paid plans are billed monthly or annually in advance. Subscriptions renew automatically until cancelled. You may cancel at any time from your account settings and you will retain access until the end of the paid period. We do not issue refunds for partial periods except where required by law. All payments are processed by Stripe.`,
  },
  {
    title: 'Data accuracy',
    body: `Follower counts are fetched from public Instagram pages. Instagram may change its data structure, rate-limit our requests, or return cached values. We make no guarantee that follower counts are real-time accurate or complete. We are not affiliated with Instagram or Meta.`,
  },
  {
    title: 'Disclaimer of warranties',
    body: `The service is provided "as is" without warranties of any kind. We do not warrant that the service will be uninterrupted, error-free, or that data will always be current. To the maximum extent permitted by law, we disclaim all implied warranties including merchantability and fitness for a particular purpose.`,
  },
  {
    title: 'Limitation of liability',
    body: `To the maximum extent permitted by law, our total liability to you for any claim arising from your use of the service shall not exceed the amount you paid us in the 12 months before the claim arose. We are not liable for indirect, incidental, or consequential damages.`,
  },
  {
    title: 'Termination',
    body: `We may suspend or terminate your account if you violate these terms, engage in fraudulent activity, or if we discontinue the service. You may delete your account at any time from account settings.`,
  },
  {
    title: 'Changes to terms',
    body: `We may update these terms from time to time. Material changes will be communicated by email or by a notice on the site. Continued use after changes take effect constitutes acceptance.`,
  },
  {
    title: 'Governing law',
    body: `These terms are governed by the laws of the jurisdiction in which the operator is based. Disputes shall be resolved through binding arbitration or, where arbitration is not permitted, in the courts of that jurisdiction.`,
  },
  {
    title: 'Contact',
    body: `Questions about these terms? Email us at legal@instagramfollowerstracker.com.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Legal</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">Terms of Service</h1>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Last updated: June 2026. These terms govern your use of instagramfollowerstracker.com.
          </p>

          <div className="mt-10 space-y-8">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="text-base font-black text-slate-900">{s.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{s.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-12 flex gap-4 border-t border-slate-100 pt-8 text-sm font-medium">
            <Link href="/privacy" className="text-cyan-700 hover:underline">Privacy Policy</Link>
            <Link href="/faq" className="text-cyan-700 hover:underline">FAQ</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
