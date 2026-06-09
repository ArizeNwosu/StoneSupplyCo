import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Security — Instagram Followers Tracker',
  description: 'Report security vulnerabilities to instagramfollowerstracker.com.',
  alternates: { canonical: 'https://instagramfollowerstracker.com/security' },
};

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-10">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-600">
            Security
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Reporting a vulnerability
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            We take security seriously. If you believe you have found a security vulnerability in instagramfollowerstracker.com, please disclose it responsibly.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-base font-black text-slate-950">How to report</h2>
            <p className="text-sm leading-7 text-slate-600">
              Email us at{' '}
              <a href="mailto:arizemail@gmail.com" className="font-bold text-cyan-700 hover:text-cyan-900">
                arizemail@gmail.com
              </a>{' '}
              with the subject line <strong>Security Disclosure</strong>. Please include a description of the issue, steps to reproduce it, and the potential impact. We will acknowledge your report within 72 hours.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-black text-slate-950">Scope</h2>
            <p className="text-sm leading-7 text-slate-600">
              Reports are welcome for vulnerabilities affecting instagramfollowerstracker.com and its associated API endpoints, including authentication, data access controls, and webhook security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-black text-slate-950">Our commitment</h2>
            <p className="text-sm leading-7 text-slate-600">
              We will investigate all credible reports promptly, keep you informed of our progress, and not pursue legal action against researchers who disclose vulnerabilities in good faith. We ask that you do not access, modify, or delete user data during your research.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
