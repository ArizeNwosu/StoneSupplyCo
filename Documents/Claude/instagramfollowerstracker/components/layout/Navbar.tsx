import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { auth } from '@/lib/auth';

interface NavbarProps {
  mode?: 'public' | 'app';
}

export async function Navbar({ mode = 'public' }: NavbarProps) {
  const session = await auth();
  const isApp = mode === 'app';
  const isSignedIn = !!session?.user;

  return (
    <nav className="sticky top-0 z-40 border-b border-cyan-950/10 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="shrink-0">
          <Logo height={40} />
        </Link>
        <div className="hidden items-center gap-1 rounded-full border border-cyan-950/10 bg-slate-50 px-1.5 py-1.5 sm:flex">
          <Link
            href="/instagram-tracking-tools"
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
          >
            Tools
          </Link>
          <Link
            href="/pricing"
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
          >
            Pricing
          </Link>
          <Link
            href="/unfollow-tracker"
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
          >
            Unfollowers
          </Link>
          <Link
            href="/blog"
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
          >
            Blog
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={isApp || isSignedIn ? '/dashboard/settings' : '/auth/signin'}
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 md:inline-flex"
          >
            {isApp || isSignedIn ? 'Settings' : 'Log in'}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            {isApp || isSignedIn ? 'Dashboard' : 'Start free'}
          </Link>
        </div>
      </div>
    </nav>
  );
}
