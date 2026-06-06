'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ShareReportButtonProps {
  accountId: string;
}

type State = 'idle' | 'loading' | 'copied' | 'upgrade' | 'error';

export function ShareReportButton({ accountId }: ShareReportButtonProps) {
  const [state, setState] = useState<State>('idle');

  const handleShare = async () => {
    setState('loading');

    const res = await fetch('/api/report-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackedAccountId: accountId }),
    });

    if (res.status === 402) {
      setState('upgrade');
      return;
    }

    if (!res.ok) {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
      return;
    }

    const data = (await res.json()) as { token: string; url: string };
    try {
      await navigator.clipboard.writeText(data.url);
    } catch {
      // clipboard blocked (e.g. non-HTTPS) — still show success state
    }
    setState('copied');
    setTimeout(() => setState('idle'), 3000);
  };

  if (state === 'upgrade') {
    return (
      <span className="text-xs text-amber-600">
        <Link href="/pricing" className="underline hover:text-amber-700">
          Upgrade to Agency
        </Link>{' '}
        to share reports
      </span>
    );
  }

  if (state === 'error') {
    return <span className="text-xs text-red-500">Failed to create link</span>;
  }

  if (state === 'copied') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-green-600">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        Link copied!
      </span>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={state === 'loading'}
      className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-slate-500 transition-colors hover:bg-white hover:text-slate-950 disabled:opacity-40"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      {state === 'loading' ? 'Generating…' : 'Share Report'}
    </button>
  );
}
