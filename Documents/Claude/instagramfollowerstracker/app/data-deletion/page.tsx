import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Data Deletion Instructions - Instagram Followers Tracker',
  description:
    'How to request deletion of your Instagram Followers Tracker account data, uploaded Instagram exports, tracked accounts, and related records.',
  alternates: { canonical: 'https://instagramfollowerstracker.com/data-deletion' },
};

const deletionSteps = [
  {
    title: 'Option 1: Delete data from your account',
    body: 'Sign in to your account, open your dashboard settings, and remove any tracked accounts, uploaded Instagram export files, or connected integrations you no longer want stored.',
  },
  {
    title: 'Option 2: Email a deletion request',
    body: 'Email privacy@instagramfollowerstracker.com from the email address connected to your account. Use the subject line "Data deletion request" and tell us whether you want full account deletion or only specific uploaded exports, tracked accounts, or integrations removed.',
  },
  {
    title: 'What to include',
    body: 'Include your account email, the Instagram handle or report you want deleted if the request is partial, and whether you want us to delete Google Drive connection data, uploaded Instagram export data, follower/following lists, or all account records.',
  },
];

const deletedData = [
  'Account profile details, including email address and sign-in records tied to your account.',
  'Tracked Instagram accounts saved in your private dashboard.',
  'Private follower-count snapshots tied only to your user account.',
  'Uploaded Instagram data exports and parsed follower or following lists.',
  'Google Drive OAuth tokens and sync metadata if you connected Google Drive.',
  'Private report links, saved comparisons, and dashboard-only exports you created.',
];

const retainedData = [
  'Public follower-count history for public Instagram accounts may remain if it is no longer tied to your personal account and is used as public aggregate tracking data.',
  'Payment, tax, fraud-prevention, chargeback, and legal records may be retained as required by Stripe, our processors, or applicable law.',
  'Encrypted backups are deleted on our normal backup rotation, generally within 30 days after the primary deletion is completed.',
];

export default function DataDeletionPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Legal</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Data Deletion Instructions
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Last updated: June 2026. These instructions apply to data stored by
            instagramfollowerstracker.com.
          </p>

          <section className="mt-10">
            <h2 className="text-base font-black text-slate-900">How to request deletion</h2>
            <div className="mt-4 space-y-6">
              {deletionSteps.map((step) => (
                <div key={step.title}>
                  <h3 className="text-sm font-black text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{step.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-base font-black text-slate-900">Data we can delete</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
              {deletedData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-base font-black text-slate-900">
              Data that may be retained
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
              {retainedData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-base font-black text-slate-900">Response timeline</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              We aim to acknowledge deletion requests within 5 business days and
              complete verified deletion requests within 30 days, unless we need to
              retain limited records for security, fraud prevention, billing, or legal
              compliance.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-base font-black text-slate-900">
              Instagram and Meta data
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Instagram Followers Tracker is not affiliated with Instagram or Meta.
              This page only covers data stored by our service. To delete your
              Instagram account data from Meta, use the privacy and account settings
              provided inside Instagram or Meta Accounts Center.
            </p>
          </section>

          <div className="mt-12 flex flex-wrap gap-4 border-t border-slate-100 pt-8 text-sm font-medium">
            <Link href="/dashboard/settings" className="text-cyan-700 hover:underline">
              Dashboard Settings
            </Link>
            <Link href="/privacy" className="text-cyan-700 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-cyan-700 hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
