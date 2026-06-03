import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-bold text-gray-900 text-sm">
          📊 Instagram Followers Tracker
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            Pricing
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium px-4 py-2 text-sm hover:opacity-90 transition shadow-sm"
          >
            Start Tracking Free
          </Link>
        </div>
      </div>
    </nav>
  );
}
