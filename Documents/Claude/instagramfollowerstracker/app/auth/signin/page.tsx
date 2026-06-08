'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { PasswordInput } from '@/components/auth/PasswordInput';

export default function SignInPage() {
  const router = useRouter();
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

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Incorrect email or password.');
        return;
      }

      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setMagicLinkLoading(true);
    setError(null);
    try {
      const result = await signIn('resend', { email, redirect: false });
      if (result?.error) {
        setError('Could not send sign-in link. Please try again.');
        return;
      }
      setMagicLinkSent(true);
    } catch {
      setError('Could not send sign-in link. Please try again.');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
        <div className="w-full max-w-sm rounded-lg border border-cyan-950/10 bg-white p-8 text-center shadow-sm">
          <Logo height={28} />
          <p className="mb-2 mt-6 font-semibold text-slate-950">Check your email</p>
          <p className="text-sm text-slate-600">
            We sent a sign-in link to <strong>{email}</strong>. Click it to sign in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="rounded-lg border border-cyan-950/10 bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col items-center">
            <Logo height={28} />
            <p className="mt-3 text-sm text-slate-600">Sign in to your account</p>
          </div>

          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-700">
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
                className="w-full rounded-lg border border-cyan-950/10 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs font-semibold text-cyan-700 hover:text-cyan-900">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                placeholder="Your password"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-slate-950 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-cyan-950/10" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-cyan-950/10" />
          </div>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLinkLoading}
            className="mt-4 w-full rounded-full border border-cyan-950/10 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50 disabled:opacity-60"
          >
            {magicLinkLoading ? 'Sending…' : 'Email me a sign-in link'}
          </button>

          <p className="mt-5 text-center text-xs text-slate-500">
            No account?{' '}
            <Link href="/auth/signup" className="font-semibold text-cyan-700 hover:text-cyan-900">
              Sign up free
            </Link>
          </p>
        </div>

        {isDev && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold text-amber-700 mb-3 uppercase tracking-wide">
              Dev login (local only)
            </p>
            <Link
              href="/api/dev-login?email=test%40ifttracker.local&redirectTo=/dashboard"
              className="block w-full rounded-full bg-amber-500 py-2 text-center text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Sign in as test user
            </Link>
            <p className="mt-2 text-center text-xs text-amber-600">test@ifttracker.local · PRO plan</p>
          </div>
        )}
      </div>
    </main>
  );
}
