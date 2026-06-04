'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parseHandle, isValidHandle } from '@/lib/handles';

interface LookupResult {
  handle: string;
  displayName: string | null;
  followerCount: number | null;
  fromCache: boolean;
}

type State = 'idle' | 'loading' | 'found' | 'not-found' | 'error';

export function HandleSearch() {
  const [input, setInput] = useState('');
  const [state, setState] = useState<State>('idle');
  const [result, setResult] = useState<LookupResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const lookup = async () => {
    const handle = parseHandle(input.trim());
    if (!handle || !isValidHandle(handle)) {
      inputRef.current?.focus();
      return;
    }

    setState('loading');
    setResult(null);

    try {
      const res = await fetch(`/api/lookup?handle=${encodeURIComponent(handle)}`);
      const data = (await res.json()) as LookupResult & { error?: string };
      if (!res.ok) {
        setState('error');
        return;
      }
      setResult(data);
      setState(data.followerCount !== null ? 'found' : 'not-found');
    } catch {
      setState('error');
    }
  };

  const startTracking = () => {
    const handle = result?.handle ?? parseHandle(input.trim());
    if (handle) {
      sessionStorage.setItem('pending_handle', handle);
    }
    router.push('/auth/signup');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') lookup();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
            @
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (state !== 'idle') { setState('idle'); setResult(null); }
            }}
            onKeyDown={handleKeyDown}
            placeholder="username"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-gray-200 bg-white pl-7 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
          />
        </div>
        <button
          type="button"
          onClick={lookup}
          disabled={state === 'loading'}
          className="shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-6 py-3.5 text-sm hover:opacity-90 transition disabled:opacity-60 shadow-lg shadow-purple-200"
        >
          {state === 'loading' ? 'Looking up…' : 'Look up'}
        </button>
      </div>

      {/* Result panel */}
      {state === 'found' && result && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-extrabold text-purple-600 tracking-tight">
              {result.followerCount!.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              followers · @{result.handle}
              {result.displayName && (
                <span className="text-gray-400"> · {result.displayName}</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={startTracking}
            className="shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition"
          >
            Track @{result.handle} →
          </button>
        </div>
      )}

      {state === 'not-found' && result && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">@{result.handle}</span> — we&apos;ll fetch the live count when you sign up.
          </p>
          <button
            type="button"
            onClick={startTracking}
            className="shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition"
          >
            Start Tracking →
          </button>
        </div>
      )}

      {state === 'error' && (
        <p className="mt-3 text-sm text-red-500 text-center">Something went wrong. Please try again.</p>
      )}

      <p className="mt-3 text-xs text-gray-400 text-center">
        Free forever · No credit card · 1 account included
      </p>
    </div>
  );
}
