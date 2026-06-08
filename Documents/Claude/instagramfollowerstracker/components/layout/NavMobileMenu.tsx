'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavMobileMenuProps {
  isSignedIn: boolean;
  isApp: boolean;
}

export function NavMobileMenu({ isSignedIn, isApp }: NavMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const links = [
    { href: '/instagram-tracking-tools', label: 'Tools' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/unfollow-tracker', label: 'Unfollowers' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-950/10 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        {open ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 z-40 bg-black/20"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div className="absolute inset-x-0 top-full z-50 border-b border-cyan-950/10 bg-white shadow-xl">
            <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center rounded-xl px-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  {link.label}
                </Link>
              ))}

              <div className="my-2 border-t border-cyan-950/10" />

              {isApp || isSignedIn ? (
                <Link
                  href="/dashboard/settings"
                  className="flex min-h-11 items-center rounded-xl px-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  Settings
                </Link>
              ) : (
                <Link
                  href="/auth/signin"
                  className="flex min-h-11 items-center rounded-xl px-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  Log in
                </Link>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
