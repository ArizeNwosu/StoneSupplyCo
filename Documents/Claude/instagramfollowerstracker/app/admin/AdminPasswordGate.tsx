'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';

export function AdminPasswordGate() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        setError('Incorrect password.');
        setPassword('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full bg-white px-4 py-2">
            <Logo height={28} wordmarkClassName="block" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8">
          <p className="mb-1 text-xs font-black uppercase tracking-widest text-cyan-400">
            Admin Access
          </p>
          <h1 className="text-xl font-black text-white">Enter admin password</h1>
          <p className="mt-1 text-sm text-slate-400">
            Your identity is verified. Enter the admin password to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />

            {error && (
              <p className="text-sm font-bold text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="flex w-full min-h-11 items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-white transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Enter Dashboard'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          Session expires after 8 hours.
        </p>
      </div>
    </div>
  );
}
