'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const isDev = process.env.NODE_ENV !== 'production';

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Incorrect email or password.');
      setLoading(false);
      return;
    }

    window.location.href = '/dashboard';
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setMagicLinkLoading(true);
    setError(null);
    await signIn('resend', { email, redirect: false });
    setMagicLinkSent(true);
    setMagicLinkLoading(false);
  };

  if (magicLinkSent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <Logo height={28} />
          <p className="font-semibold text-gray-900 mt-6 mb-2">Check your email</p>
          <p className="text-sm text-gray-500">
            We sent a sign-in link to <strong>{email}</strong>. Click it to sign in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col items-center mb-8">
            <Logo height={28} />
            <p className="text-sm text-gray-500 mt-3">Sign in to your account</p>
          </div>

          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium py-2.5 text-sm hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLinkLoading}
            className="mt-4 w-full rounded-lg border border-gray-200 text-gray-600 font-medium py-2.5 text-sm hover:bg-gray-50 transition disabled:opacity-60"
          >
            {magicLinkLoading ? 'Sending…' : 'Email me a sign-in link'}
          </button>

          <p className="mt-5 text-center text-xs text-gray-400">
            No account?{' '}
            <Link href="/auth/signup" className="text-purple-600 hover:underline">
              Sign up free
            </Link>
          </p>
        </div>

        {isDev && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <p className="text-xs font-semibold text-amber-700 mb-3 uppercase tracking-wide">
              Dev login (local only)
            </p>
            <a
              href="/api/dev-login?email=test%40ifttracker.local&redirectTo=/dashboard"
              className="block w-full text-center rounded-lg bg-amber-500 text-white font-medium py-2 text-sm hover:bg-amber-600 transition"
            >
              Sign in as test user
            </a>
            <p className="mt-2 text-center text-xs text-amber-600">test@ifttracker.local · PRO plan</p>
          </div>
        )}
      </div>
    </main>
  );
}
