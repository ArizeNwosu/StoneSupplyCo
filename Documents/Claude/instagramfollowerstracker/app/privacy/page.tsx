import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — Instagram Followers Tracker',
  description: 'Privacy policy for instagramfollowerstracker.com — what data we collect, how we use it, and your rights.',
  alternates: { canonical: 'https://www.instagramfollowerstracker.com/privacy' },
};

const sections = [
  {
    title: 'What we collect',
    body: `When you create an account we collect your email address and, if you sign in with Google, your Google profile name and avatar. We store the Instagram handles you choose to track and the daily follower-count snapshots our system takes. If you upload an Instagram data export we store the follower and following lists contained in that file for the purpose of generating unfollower diffs. We do not collect or store your Instagram password.`,
  },
  {
    title: 'How we use it',
    body: `Your email is used to send you transactional messages: magic-link sign-in emails, milestone notifications when your tracked account reaches snapshot thresholds, and billing receipts. We do not send marketing email without your explicit opt-in. Follower-count snapshots are used to generate growth charts and metrics in your dashboard. Export data is used only to compute follower diffs and is never shared with third parties.`,
  },
  {
    title: 'Third-party services',
    body: `We use the following sub-processors: Supabase or a compatible PostgreSQL host for database storage; Vercel for hosting and serverless compute; Stripe for payment processing (they handle card data — we never see your card number); Resend for transactional email delivery; and ScraperAPI or a similar proxy service for fetching public Instagram data. Each of these services has its own privacy policy.`,
  },
  {
    title: 'Public data',
    body: `Follower counts for public Instagram accounts are publicly visible data. We may display aggregated follower-count history for public accounts on publicly accessible pages of this site. No personally identifiable information is included in public pages.`,
  },
  {
    title: 'Cookies and tracking',
    body: `We use a session cookie to keep you signed in. We do not use third-party advertising trackers or sell data to advertising networks. We may use basic, privacy-friendly analytics (page view counts without fingerprinting) to understand which features are used.`,
  },
  {
    title: 'Data retention',
    body: `We retain your account data and follower-count snapshots for as long as your account is active. If you delete your account, your personal data and tracked accounts are deleted within 30 days. Follower-count data for public accounts that other users also track may be retained in anonymised aggregate form.`,
  },
  {
    title: 'Your rights',
    body: `You may request a copy of your data, ask us to correct inaccurate data, or request deletion of your account at any time by emailing us or using the account settings page. If you are in the EEA or UK you have additional rights under GDPR including the right to lodge a complaint with your local supervisory authority.`,
  },
  {
    title: 'Contact',
    body: `Questions about this policy? Email us at privacy@instagramfollowerstracker.com. We aim to respond within 5 business days.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Legal</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">Privacy Policy</h1>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Last updated: June 2026. This policy applies to instagramfollowerstracker.com.
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
            <Link href="/terms" className="text-cyan-700 hover:underline">Terms of Service</Link>
            <Link href="/faq" className="text-cyan-700 hover:underline">FAQ</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
