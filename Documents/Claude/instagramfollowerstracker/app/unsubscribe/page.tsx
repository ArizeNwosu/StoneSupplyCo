'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function UnsubscribeForm() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState<'ready' | 'saving' | 'done' | 'error'>('ready');
  const unsubscribe = async () => {
    setState('saving');
    const response = await fetch('/api/outreach/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    setState(response.ok ? 'done' : 'error');
  };
  return <main className="mx-auto flex min-h-screen max-w-lg items-center px-6"><div className="w-full rounded-xl border bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-black">Email preferences</h1>{state === 'done' ? <p className="mt-4">You have been unsubscribed from promotional email. Account and billing messages are unchanged.</p> : <><p className="mt-3 text-slate-600">Stop promotional email from Instagram Followers Tracker.</p><button disabled={!token || state === 'saving'} onClick={unsubscribe} className="mt-6 rounded-full bg-slate-950 px-6 py-3 font-bold text-white disabled:opacity-50">{state === 'saving' ? 'Saving…' : 'Unsubscribe'}</button>{state === 'error' && <p className="mt-3 text-red-600">This link is invalid or expired.</p>}</>}</div></main>;
}

export default function UnsubscribePage() {
  return <Suspense fallback={<main className="min-h-screen" />}><UnsubscribeForm /></Suspense>;
}
