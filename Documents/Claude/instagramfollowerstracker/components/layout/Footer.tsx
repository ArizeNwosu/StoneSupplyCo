import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { SEO_PAGES } from '@/lib/seo-pages';

interface FooterProps {
  topAccounts?: { handle: string }[];
  className?: string;
}

export function Footer({ topAccounts = [], className = 'mt-24' }: FooterProps) {
  return (
    <footer className={`border-t border-cyan-950/10 bg-slate-950 text-white ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-white px-3 py-2">
              <Logo height={24} wordmarkClassName="block" />
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              Passwordless Instagram follower tracking for public accounts,
              daily growth charts, and export-based unfollower detection.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-bold text-white">Safety promise</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              We never ask for your Instagram password. Public tracking uses
              public counts, and person-level diffs use files you export.
            </p>
          </div>
        </div>

        {topAccounts.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase text-cyan-200">
              Popular accounts to track
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              {topAccounts.slice(0, 100).map((a) => (
                <Link
                  key={a.handle}
                  href={`/${a.handle}`}
                  className="text-xs text-slate-400 transition hover:text-white"
                >
                  @{a.handle}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase text-cyan-200">
            Instagram tracking tools
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {SEO_PAGES.map((page) => (
              <Link
                key={page.slug}
                href={`/${page.slug}`}
                className="text-xs text-slate-400 transition hover:text-white"
              >
                {page.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 border-t border-white/10 pt-6 text-xs text-slate-400">
          <Link href="/pricing" className="transition hover:text-white">
            Pricing
          </Link>
          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
          </Link>
          <Link href="/auth/signin" className="transition hover:text-white">
            Sign In
          </Link>
          <span>Not affiliated with Instagram or Meta.</span>
        </div>
      </div>
    </footer>
  );
}
