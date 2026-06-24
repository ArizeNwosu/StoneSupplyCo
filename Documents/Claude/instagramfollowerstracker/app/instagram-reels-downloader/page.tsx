import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VideoDownloaderForm } from '@/components/tools/VideoDownloaderForm';

export const metadata: Metadata = {
  title: 'Instagram Reels Downloader — Free, No Login Required',
  description:
    'Download any public Instagram Reel as an MP4 for free. Paste the Reel URL and save the video directly to your device — no account, no app, no login required.',
  alternates: {
    canonical: 'https://instagramfollowerstracker.com/instagram-reels-downloader',
  },
  openGraph: {
    title: 'Instagram Reels Downloader — Free, No Login Required',
    description:
      'Download Instagram Reels instantly. Paste the Reel URL, get the MP4 — free, no login required.',
    url: 'https://instagramfollowerstracker.com/instagram-reels-downloader',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instagram Reels Downloader — Free, No Login Required',
    description: 'Download Instagram Reels instantly. Free, no login.',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I download an Instagram Reel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Open the Reel on Instagram, tap the three-dot menu, and choose Copy Link. Then paste that link into the downloader above and click Download Reel. The MP4 will save directly to your device.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is this Instagram Reels downloader free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — completely free. No signup, no account, no app installation, no watermark.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does a Reel URL look like?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Instagram Reel URLs follow the format: https://www.instagram.com/reel/ABC123/ — the word "reel" appears in the path. Copy this from your browser address bar or via the share button on the Reel.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I download Reels from private accounts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. This tool only works for Reels on public Instagram accounts. Private account Reels cannot be accessed without following the account first.',
      },
    },
    {
      '@type': 'Question',
      name: 'What quality will the downloaded Reel be?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The downloader fetches the highest quality MP4 that Instagram makes publicly available — typically the same resolution that plays in the Instagram app, usually 1080×1920 for vertical Reels.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it work for Instagram videos (non-Reels)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The same tool handles standard Instagram video posts (instagram.com/p/...) and IGTV as well as Reels. Use our Instagram Video Downloader page if you prefer.',
      },
    },
  ],
};

export default function InstagramReelsDownloaderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main className="min-h-screen bg-sky-50">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">

          {/* Hero */}
          <div className="mb-8 text-center sm:mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              Free Tool
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Instagram Reels Downloader
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium text-slate-500">
              Download any public Instagram Reel as an MP4 — free, no login, no watermark.
              Works for all Reels formats.
            </p>
          </div>

          {/* Downloader */}
          <div className="rounded-2xl border border-cyan-950/10 bg-white p-4 shadow-sm sm:p-6">
            <VideoDownloaderForm />
          </div>

          {/* How it works */}
          <section className="mt-14">
            <h2 className="mb-6 text-xl font-black text-slate-950">How to download Instagram Reels</h2>
            <ol className="space-y-4">
              {[
                ['Open the Reel on Instagram', 'Find the Reel you want to save on Instagram.com or in the app.'],
                ['Copy the Reel URL', 'Tap the three-dot menu on the Reel → Copy Link. Or copy the URL directly from your browser address bar (it will contain /reel/).'],
                ['Paste and download', 'Paste the link in the box above and click Download Reel. The MP4 will save to your device.'],
              ].map(([title, desc], i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-cyan-950 text-xs font-black text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-900">{title}</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* URL formats */}
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-black text-slate-950">Supported Reel formats</h2>
            <div className="overflow-x-auto rounded-xl border border-cyan-950/10 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyan-950/10 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">URL format</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Example</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Works?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-950/10">
                  {[
                    ['Instagram Reel', 'instagram.com/reel/ABC123/', 'Yes'],
                    ['Standard video post', 'instagram.com/p/ABC123/', 'Yes'],
                    ['IGTV', 'instagram.com/tv/ABC123/', 'Yes'],
                    ['Private Reel', 'Any URL', 'No — must be public'],
                    ['Story', 'N/A — no shareable URL', 'No'],
                  ].map(([type, example, works]) => (
                    <tr key={type}>
                      <td className="px-4 py-3 font-medium text-slate-800">{type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{example}</td>
                      <td className={`px-4 py-3 text-xs font-black ${works === 'Yes' ? 'text-emerald-600' : 'text-red-500'}`}>{works}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-400">
              Only works for <strong>public accounts</strong>. Private Reels cannot be downloaded.
            </p>
          </section>

          {/* Tracker CTA */}
          <section className="mt-10 rounded-2xl border border-cyan-950/10 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Track any Instagram account&apos;s follower growth
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
              Want to know how fast a creator is growing? Our free follower tracker records
              daily snapshots, draws growth charts, and flags when accounts lose followers fast.
            </p>
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-950 px-6 py-2.5 text-sm font-black text-white transition-colors hover:bg-cyan-800"
              >
                Start Tracking Free
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center text-sm font-bold text-cyan-700 hover:underline"
              >
                See how it works →
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-14">
            <h2 className="mb-6 text-xl font-black text-slate-950">Frequently asked questions</h2>
            <div className="space-y-5">
              {faqSchema.mainEntity.map((faq) => (
                <div key={faq.name} className="rounded-xl border border-cyan-950/10 bg-white p-5">
                  <h3 className="text-sm font-black text-slate-900">{faq.name}</h3>
                  <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                    {faq.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Related tools */}
          <section className="mt-12">
            <h2 className="mb-4 text-base font-black text-slate-950">More free Instagram tools</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['/instagram-video-downloader', 'Instagram Video Downloader', 'Download any public Instagram video, Reel, or IGTV as an MP4.'],
                  ['/instagram-story-downloader', 'Instagram Story Downloader', 'Save public Instagram stories before they disappear.'],
                  ['/instagram-follower-count', 'Instagram Follower Count Checker', 'Check the live follower count for any public account.'],
                  ['/instagram-fake-follower-checker', 'Fake Follower Checker', 'Score any account for fake followers and bot activity.'],
                ] as [string, string, string][]
              ).map(([href, title, desc]) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col rounded-xl border border-cyan-950/10 bg-white p-4 transition-all hover:border-cyan-500/30 hover:shadow-md"
                >
                  <p className="text-sm font-black text-slate-900 group-hover:text-cyan-700 transition-colors">{title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{desc}</p>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
