import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VideoDownloaderForm } from '@/components/tools/VideoDownloaderForm';

export const metadata: Metadata = {
  title: 'Instagram Video Downloader — Free, No Login Required',
  description:
    'Download any public Instagram video, Reel, or IGTV for free. Paste the post URL and save the MP4 directly — no account, no app, no login required.',
  alternates: {
    canonical: 'https://instagramfollowerstracker.com/instagram-video-downloader',
  },
  openGraph: {
    title: 'Instagram Video Downloader — Free, No Login Required',
    description:
      'Download Instagram videos and Reels instantly. Paste the post URL, get the MP4 — free, no login required.',
    url: 'https://instagramfollowerstracker.com/instagram-video-downloader',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instagram Video Downloader — Free, No Login Required',
    description: 'Download Instagram videos and Reels instantly. Free, no login.',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I download an Instagram video?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Copy the URL of any public Instagram post, Reel, or IGTV. Paste it into the box above and click "Download Video". The MP4 file will be available to save directly to your device.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is this Instagram video downloader free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — completely free. No signup, no account, no app installation required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it work for Reels?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Paste any Instagram Reel URL (instagram.com/reel/...) and the downloader will extract the MP4 the same way it does for regular video posts.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I download private Instagram videos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. This tool only works for videos on public Instagram accounts. Private account videos cannot be accessed without following the account.',
      },
    },
    {
      '@type': 'Question',
      name: 'What video quality will I get?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The downloader fetches the highest quality MP4 that Instagram makes available for the post — typically the same resolution that plays in the Instagram app.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is downloading Instagram videos legal?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Downloading Instagram videos for personal, offline viewing is a legal grey area in most jurisdictions. You should not re-upload, redistribute, or claim ownership of content you did not create. Always respect the original creator's rights.",
      },
    },
  ],
};

export default function InstagramVideoDownloaderPage() {
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
              Instagram Video Downloader
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium text-slate-500">
              Download any public Instagram video, Reel, or IGTV as an MP4 — free,
              no login required.
            </p>
          </div>

          {/* Downloader */}
          <div className="rounded-2xl border border-cyan-950/10 bg-white p-4 shadow-sm sm:p-6">
            <VideoDownloaderForm />
          </div>

          {/* How it works */}
          <section className="mt-14">
            <h2 className="mb-6 text-xl font-black text-slate-950">How to download Instagram videos</h2>
            <ol className="space-y-4">
              {[
                ['Open the Instagram post', 'Find the video you want to download on Instagram.com or in the app.'],
                ['Copy the post URL', 'Tap the three-dot menu on the post → Copy Link. Or copy the URL from your browser address bar.'],
                ['Paste and download', 'Paste the link in the box above and click Download Video. Save the MP4 to your device.'],
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

          {/* Supported formats */}
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-black text-slate-950">Supported post types</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Instagram Videos', 'Standard video posts from any public profile'],
                ['Instagram Reels', 'Short-form vertical Reels from any public account'],
                ['IGTV', 'Longer-form IGTV videos from public accounts'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-xl border border-cyan-950/10 bg-white p-4">
                  <p className="text-sm font-black text-slate-900">{title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-medium text-slate-400">
              Only works for <strong>public accounts</strong>. Private account content cannot be downloaded.
            </p>
          </section>

          {/* Tracker CTA */}
          <section className="mt-10 rounded-2xl border border-cyan-950/10 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Also: Track any Instagram account&apos;s follower growth
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
              Want to know how fast a creator is growing? Our free follower tracker records
              daily snapshots, draws growth charts, and flags when accounts buy fake followers.
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
                  ['/instagram-follower-count', 'Instagram Follower Count Checker', 'Check the live follower count for any public account.'],
                  ['/instagram-growth-tracker', 'Instagram Growth Tracker', 'Track how any public account grows over time.'],
                  ['/instagram-unfollow-tracker', 'Instagram Unfollow Tracker', 'Find out who unfollowed you using your data export.'],
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
