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
    <div className="w-full max-w-2xl">
      {/* Input row */}
      <div className="flex flex-col gap-3 rounded-[28px] border border-cyan-950/10 bg-white p-2 shadow-2xl shadow-cyan-950/10 sm:flex-row">
        <div className="relative flex-1">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 select-none text-sm font-bold text-slate-400">
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
            aria-label="Instagram username"
            className="min-h-14 w-full rounded-[22px] border border-transparent bg-slate-50 pl-9 pr-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
          />
        </div>
        <button
          type="button"
          onClick={lookup}
          disabled={state === 'loading'}
          className="min-h-14 shrink-0 rounded-[22px] bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:opacity-60"
        >
          {state === 'loading' ? 'Checking...' : 'Check followers'}
        </button>
      </div>

      {/* Result panel */}
      {state === 'found' && result && (
        <div className="mt-4 flex flex-col gap-4 rounded-[28px] border border-cyan-950/10 bg-white p-5 shadow-xl shadow-cyan-950/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-2xl font-extrabold text-teal-700">
              {result.followerCount!.toLocaleString()}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              followers · @{result.handle}
              {result.displayName && (
                <span className="text-slate-400"> · {result.displayName}</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={startTracking}
            className="min-h-11 shrink-0 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600"
          >
            Track @{result.handle}
          </button>
        </div>
      )}

      {state === 'not-found' && result && (
        <div className="mt-4 flex flex-col gap-4 rounded-[28px] border border-cyan-950/10 bg-white p-5 shadow-xl shadow-cyan-950/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-medium">@{result.handle}</span> is ready to track. Use browser capture after signup to start the first snapshot.
          </p>
          <button
            type="button"
            onClick={startTracking}
            className="min-h-11 shrink-0 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600"
          >
            Create tracker
          </button>
        </div>
      )}

      {state === 'error' && (
        <p className="mt-3 text-center text-sm text-red-600">Something went wrong. Please try again.</p>
      )}

      <p className="mt-3 text-center text-xs font-semibold text-slate-500 sm:text-left">
        Free forever / no credit card / no Instagram password
      </p>
    </div>
  );
}
