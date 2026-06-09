import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Developer Documentation — Instagram Followers Tracker',
  description: 'API and data portability documentation for instagramfollowerstracker.com.',
  alternates: { canonical: 'https://instagramfollowerstracker.com/developers' },
};

const sections = [
  {
    title: 'Overview',
    body: `instagramfollowerstracker.com is a data portability application that helps users track their own Instagram follower and following relationships over time. Users can import their own Instagram data — exported directly from Instagram — to detect unfollowers, monitor follower growth, and analyse their audience health. The application is built on Next.js and PostgreSQL and is hosted on Vercel.`,
  },
  {
    title: 'Data portability',
    body: `This application participates in Meta's Export Your Information (EYI) program under the instagram_data_portability permission. When a user authorises our application via Meta's OAuth flow, Meta may automatically deliver the user's Instagram data — specifically their followers and following lists — to our webhook endpoint on a recurring basis. This eliminates the need for users to manually export and upload their data.`,
  },
  {
    title: 'Webhook endpoint',
    body: `Our data portability receiver endpoint is:\n\nhttps://instagramfollowerstracker.com/api/eyi/webhook\n\nThis endpoint accepts HTTP POST requests containing Instagram data exports in JSON format. All incoming requests are verified using HMAC-SHA256 signature validation against the x-hub-signature-256 header before any data is processed. Requests that fail signature verification are rejected with HTTP 401.`,
  },
  {
    title: 'Data received',
    body: `Via the EYI integration, we receive the user's current followers list and following list. No message data, media, stories, or other personal content is requested or processed. We request only the minimum data necessary to provide the follower tracking service.`,
  },
  {
    title: 'OAuth flow',
    body: `Users initiate the connection via Meta's standard OAuth 2.0 dialog requesting the instagram_data_portability scope. The authorisation callback endpoint is:\n\nhttps://instagramfollowerstracker.com/api/eyi/callback\n\nUpon successful authorisation, we store the user's Meta user ID to associate future webhook deliveries with their account. We do not store the OAuth access token beyond the duration needed to retrieve the Meta user ID.`,
  },
  {
    title: 'Data handling and storage',
    body: `Received follower and following data is stored in a PostgreSQL database hosted on Supabase. Data is associated exclusively with the authorising user's account and is never shared with other users or third parties. Each delivery is diffed against the user's previous snapshot to identify changes — new followers, lost followers, and accounts that no longer follow back. Users may delete their account and all associated data at any time.`,
  },
  {
    title: 'Security',
    body: `All data is transmitted over HTTPS. Webhook payloads are verified using HMAC-SHA256 before processing. User accounts are protected by authenticated sessions. Our infrastructure runs on Vercel (compute) and Supabase (database), both of which maintain SOC 2 compliance.`,
  },
  {
    title: 'Contact',
    body: `For questions about this application's data practices or API integration, contact us at arizemail@gmail.com.`,
  },
];

export default function DevelopersPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-10">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-600">
            Developer Documentation
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            API &amp; Data Portability
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Technical documentation for instagramfollowerstracker.com&apos;s data portability integration and API endpoints.
          </p>
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-base font-black text-slate-950">
                {section.title}
              </h2>
              {section.body.split('\n\n').map((para, i) =>
                para.startsWith('https://') ? (
                  <pre
                    key={i}
                    className="my-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700"
                  >
                    {para}
                  </pre>
                ) : (
                  <p key={i} className="mb-3 text-sm leading-7 text-slate-600">
                    {para}
                  </p>
                )
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Related
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-6">
            <Link
              href="/privacy"
              className="text-sm font-bold text-cyan-700 hover:text-cyan-900"
            >
              Privacy Policy →
            </Link>
            <Link
              href="/terms"
              className="text-sm font-bold text-cyan-700 hover:text-cyan-900"
            >
              Terms of Service →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
