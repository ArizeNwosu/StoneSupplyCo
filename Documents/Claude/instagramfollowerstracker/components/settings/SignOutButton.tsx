'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="inline-flex min-h-10 items-center rounded-full border border-rose-200 px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
    >
      Sign out
    </button>
  );
}
