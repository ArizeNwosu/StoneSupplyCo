import Link from 'next/link';

interface FooterProps {
  topAccounts?: { handle: string }[];
}

export function Footer({ topAccounts = [] }: FooterProps) {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 mt-24">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-sm font-medium text-gray-700 mb-1">
          Instagram Followers Tracker
        </p>
        <p className="text-sm text-gray-500 mb-8">
          The most accurate Instagram follower tracker. Track any public account.
        </p>

        {topAccounts.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Popular accounts to track
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              {topAccounts.slice(0, 100).map((a) => (
                <Link
                  key={a.handle}
                  href={`/${a.handle}`}
                  className="text-xs text-gray-500 hover:text-purple-600 transition"
                >
                  @{a.handle}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-6 text-xs text-gray-400">
          <Link href="/pricing" className="hover:text-gray-600 transition">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-gray-600 transition">
            Dashboard
          </Link>
          <Link href="/auth/signin" className="hover:text-gray-600 transition">
            Sign In
          </Link>
        </div>
      </div>
    </footer>
  );
}
