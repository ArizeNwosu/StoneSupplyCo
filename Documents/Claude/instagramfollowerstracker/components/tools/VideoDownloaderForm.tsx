'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Result {
  videoUrl: string;
  thumbnail: string | null;
  caption: string | null;
  postUrl: string;
}

export function VideoDownloaderForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/tools/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Try again.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste Instagram video URL — e.g. https://www.instagram.com/p/ABC123/"
          className="flex-1 rounded-xl border border-cyan-950/15 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="rounded-xl bg-cyan-950 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-cyan-800 disabled:opacity-50"
        >
          {loading ? 'Fetching…' : 'Download Video'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 rounded-xl border border-cyan-950/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {result.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.thumbnail}
                alt="Video thumbnail"
                className="h-32 w-32 flex-shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="flex flex-1 flex-col gap-2">
              {result.caption && (
                <p className="line-clamp-3 text-sm font-medium text-slate-600">{result.caption}</p>
              )}
              <a
                href={result.videoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-cyan-950 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-cyan-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download MP4
              </a>
              <a
                href={result.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-slate-400 hover:text-slate-600"
              >
                View original post →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CTA — always visible */}
      <div className="mt-8 rounded-xl border border-cyan-500/20 bg-cyan-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">Track this account's follower growth</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              See daily follower counts, growth charts, and unfollow detection — free.
            </p>
          </div>
          <Link
            href="/auth/signup"
            className="flex-shrink-0 rounded-full bg-cyan-950 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-cyan-800"
          >
            Start Tracking Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
