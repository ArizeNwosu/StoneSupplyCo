'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton({ sidebar = false }: { sidebar?: boolean }) {
  const handleSignOut = () => signOut({ callbackUrl: '/' });

  if (sidebar) {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex min-h-10 items-center rounded-full border border-rose-200 px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
    >
      Sign out
    </button>
  );
}
