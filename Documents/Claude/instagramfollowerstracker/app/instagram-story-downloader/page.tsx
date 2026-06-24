import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VideoDownloaderForm } from '@/components/tools/VideoDownloaderForm';

export const metadata: Metadata = {
  title: 'Instagram Story Downloader & Anonymous Story Viewer — Free',
  description:
    'Download Instagram stories and view public stories anonymously. Paste a story URL to save it as MP4 — free, no login, no account required.',
  alternates: {
    canonical: 'https://instagramfollowerstracker.com/instagram-story-downloader',
  },
  openGraph: {
    title: 'Instagram Story Downloader & Anonymous Story Viewer — Free',
    description:
      'Save Instagram stories and view them anonymously. Free, no login required.',
    url: 'https://instagramfollowerstracker.com/instagram-story-downloader',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instagram Story Downloader & Anonymous Story Viewer — Free',
    description: 'Save Instagram stories anonymously. Free, no login.',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I download an Instagram story?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Open the story on Instagram, tap the three-dot menu or share icon, and copy the story link. Paste that URL into the downloader above and click Download. The story saves as an MP4 or image to your device. Note: the story must still be active (within 24 hours of posting) for the link to work.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I view Instagram stories anonymously?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. When you download a story through this tool rather than watching it directly in the Instagram app, you are not counted as a story viewer. The story owner will not see your username in their viewer list.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do Instagram stories expire?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Instagram stories disappear 24 hours after posting. Story links stop working once the story expires, so you need to save the story URL and download it while it is still live.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I download stories from private accounts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. This tool only works for stories posted by public Instagram accounts. Private account stories are not accessible without following the account.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get the URL of an Instagram story?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On desktop, the story URL appears in your browser address bar while you are viewing it (format: instagram.com/stories/username/storyId/). On mobile, tap the three-dot menu on the story and choose Copy Link.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this work for Instagram story highlights?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Highlights are archived stories that stay on a profile permanently. They can be downloaded the same way — open the highlight, copy the URL, and paste it into the downloader.',
      },
    },
  ],
};

export default function InstagramStoryDownloaderPage() {
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
              Instagram Story Downloader
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium text-slate-500">
              Save public Instagram stories before they disappear — and view them
              anonymously without being counted as a viewer.
            </p>
          </div>

          {/* Anonymous viewer callout */}
          <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-50 px-4 py-3">
            <p className="text-sm font-black text-slate-900">Anonymous story viewing</p>
            <p className="mt-0.5 text-sm font-medium text-slate-600">
              When you download a story through this tool, you are not shown in the
              story&apos;s viewer list. The account owner won&apos;t see your name.
            </p>
          </div>

          {/* Downloader */}
          <div className="rounded-2xl border border-cyan-950/10 bg-white p-4 shadow-sm sm:p-6">
            <VideoDownloaderForm />
          </div>

          {/* How it works */}
          <section className="mt-14">
            <h2 className="mb-6 text-xl font-black text-slate-950">How to download Instagram stories</h2>
            <ol className="space-y-4">
              {[
                ['Open the story on Instagram', 'Find the public story you want to save while it is still active (within 24 hours of posting).'],
                ['Copy the story URL', 'On desktop: copy the URL from your browser address bar. On mobile: tap the three-dot menu on the story → Copy Link.'],
                ['Paste and save', 'Paste the story link in the box above and click Download. The file saves directly to your device.'],
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

          {/* Warning: 24h expiry */}
          <section className="mt-8">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-sm font-black text-amber-900">Stories expire after 24 hours</p>
              <p className="mt-1 text-sm font-medium text-amber-800">
                You must download a story while it is still live. Once Instagram removes it,
                the story link stops working and can no longer be retrieved. Story highlights
                (saved stories on a profile) do not expire.
              </p>
            </div>
          </section>

          {/* What you can save */}
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-black text-slate-950">What you can save</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Photo Stories', 'Save static image stories from any public account'],
                ['Video Stories', 'Download video stories as MP4 files to your device'],
                ['Story Highlights', 'Permanently saved highlights work the same way'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-xl border border-cyan-950/10 bg-white p-4">
                  <p className="text-sm font-black text-slate-900">{title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-medium text-slate-400">
              Only works for <strong>public accounts</strong>. Private account stories are not accessible.
            </p>
          </section>

          {/* Tracker CTA */}
          <section className="mt-10 rounded-2xl border border-cyan-950/10 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Track any Instagram account&apos;s follower growth
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
              Want to monitor how fast an account is growing? Our free follower tracker
              records daily snapshots and draws growth charts for any public account.
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
                  ['/instagram-reels-downloader', 'Instagram Reels Downloader', 'Download any public Reel as an MP4 — free, no login.'],
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
