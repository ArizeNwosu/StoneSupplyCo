import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';

interface FooterProps {
  topAccounts?: { handle: string }[];
  className?: string;
}

const NAV = [
  {
    heading: 'Product',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'All Tools', href: '/instagram-tracking-tools' },
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    heading: 'Free Tools',
    links: [
      { label: 'Follower Count Checker', href: '/instagram-follower-count' },
      { label: 'Growth Tracker', href: '/instagram-growth-tracker' },
      { label: 'Unfollow Tracker', href: '/instagram-unfollow-tracker' },
      { label: 'Video Downloader', href: '/instagram-video-downloader' },
      { label: 'Reels Downloader', href: '/instagram-reels-downloader' },
      { label: 'Story Downloader', href: '/instagram-story-downloader' },
      { label: 'Fake Follower Checker', href: '/instagram-fake-follower-checker' },
    ],
  },
  {
    heading: 'Trackers',
    links: [
      { label: 'Instagram Tracking Tools', href: '/instagram-tracking-tools' },
      { label: 'Unfollow Tracker', href: '/unfollow-tracker' },
      { label: 'Follower Count Tracker', href: '/instagram-follower-count-tracker' },
      { label: 'Follower Tracker Online Free', href: '/instagram-follower-tracker-online-free' },
      { label: 'Best Follower Tracker App', href: '/best-instagram-follower-tracker-app' },
      { label: 'Followers & Unfollowers', href: '/instagram-followers-and-unfollowers-tracker' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Data Deletion', href: '/data-deletion' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Sign In', href: '/auth/signin' },
      { label: 'Sign Up', href: '/auth/signup' },
    ],
  },
];

export function Footer({ topAccounts = [], className = 'mt-24' }: FooterProps) {
  return (
    <footer className={`border-t border-cyan-950/10 bg-slate-950 text-white ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-14">

        {/* Top: Logo + tagline + safety promise */}
        <div className="mb-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-white px-3 py-2">
              <Logo height={24} wordmarkClassName="block" />
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-300">
              The most accurate Instagram follower tracker. Track any public account —
              free, no Instagram password required.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-bold text-white">Safety promise</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              We never ask for your Instagram password. Public tracking uses public
              counts only. Export-based unfollower detection uses files you download
              from Instagram — we never touch your login.
            </p>
          </div>
        </div>

        {/* Nav columns */}
        <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {NAV.map((col) => (
            <div key={col.heading}>
              <p className="mb-4 text-xs font-black uppercase tracking-widest text-cyan-300">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Popular accounts */}
        {topAccounts.length > 0 && (
          <div className="mb-10">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-cyan-300">
              Popular accounts to track
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              {topAccounts.slice(0, 100).map((a) => (
                <Link
                  key={a.handle}
                  href={`/${a.handle}`}
                  className="text-xs text-slate-500 transition hover:text-white"
                >
                  @{a.handle}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Instagram Followers Tracker. Not affiliated with Instagram or Meta.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link>
            <Link href="/data-deletion" className="transition hover:text-white">Data Deletion</Link>
            <Link href="/terms" className="transition hover:text-white">Terms of Service</Link>
            <Link href="/faq" className="transition hover:text-white">FAQ</Link>
            <Link href="/contact" className="transition hover:text-white">Contact Us</Link>
            <Link href="/pricing" className="transition hover:text-white">Pricing</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
