'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Result {
  videoUrl: string;
  thumbnail: string | null;
  caption: string | null;
  postUrl: string;
  shortcode: string;
}

function proxyUrl(cdnUrl: string) {
  return `/api/tools/video-download?url=${encodeURIComponent(cdnUrl)}`;
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function DownloadModal({ result, onClose }: { result: Result; onClose: () => void }) {
  const [dlState, setDlState] = useState<'idle' | 'loading' | 'error'>('idle');

  async function handleDownload() {
    setDlState('loading');
    try {
      // Try direct CDN fetch first — Instagram CDN sends CORS headers to browsers
      // and this avoids server-proxy binary streaming issues entirely
      let blob: Blob | null = null;

      try {
        const direct = await fetch(result.videoUrl);
        if (direct.ok) blob = await direct.blob();
      } catch {
        // CORS blocked or network error — fall through to server proxy
      }

      // Server proxy fallback
      if (!blob) {
        const proxied = await fetch(proxyUrl(result.videoUrl));
        if (!proxied.ok) throw new Error(`HTTP ${proxied.status}`);
        const ct = proxied.headers.get('content-type') ?? '';
        if (!ct.startsWith('video/') && !ct.startsWith('application/octet')) {
          throw new Error('Not a video response');
        }
        blob = await proxied.blob();
      }

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `instagram-${result.shortcode}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5_000);
      setDlState('idle');
    } catch {
      setDlState('error');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 px-3 py-3 sm:items-center sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative max-h-[calc(100dvh-24px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <p className="text-sm font-black text-slate-900">Video ready to download</p>
          <button
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video preview */}
        <div className="px-4 pt-4 sm:px-5">
          <video
            src={result.videoUrl}
            controls
            playsInline
            className="aspect-video max-h-[42dvh] w-full rounded-xl bg-slate-950 object-contain sm:max-h-80"
          />
        </div>

        {/* Caption */}
        {result.caption && (
          <p className="mx-4 mt-3 line-clamp-3 text-xs font-medium leading-relaxed text-slate-500 sm:mx-5 sm:line-clamp-2">
            {result.caption}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 px-4 py-4 sm:px-5">
          <button
            onClick={handleDownload}
            disabled={dlState === 'loading'}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-cyan-800 disabled:opacity-60"
          >
            {dlState === 'loading' ? (
              <>
                <Spinner />
                Preparing download…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download MP4
              </>
            )}
          </button>

          {/* Fallback shown only after proxy error */}
          {dlState === 'error' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">
              Proxy download failed.{' '}
              <a
                href={result.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-black underline"
                onClick={() => setDlState('idle')}
              >
                Open video directly →
              </a>
              {' '}then right-click the video and choose Save As.
            </div>
          )}

          <a
            href={result.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            View original post on Instagram →
          </a>
        </div>

        {/* CTA */}
        <div className="mx-4 mb-4 rounded-xl border border-cyan-500/20 bg-cyan-50 px-4 py-3 sm:mx-5 sm:mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black text-slate-900">Track this account&apos;s followers</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">Daily growth charts, free.</p>
            </div>
            <Link
              href="/auth/signup"
              onClick={onClose}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-cyan-950 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-cyan-800"
            >
              Start Free →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoDownloaderForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setModalOpen(false);

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
        setModalOpen(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Modal */}
      {modalOpen && result && (
        <DownloadModal result={result} onClose={() => setModalOpen(false)} />
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste Instagram video URL — e.g. https://www.instagram.com/p/ABC123/"
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-cyan-950/15 bg-white px-4 py-3 text-base font-medium text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 md:text-sm"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-950 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-cyan-800 disabled:opacity-50"
        >
          {loading && <Spinner />}
          {loading ? 'Fetching…' : 'Download Video'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Re-open result button (after modal is closed) */}
      {result && !modalOpen && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-cyan-950/10 bg-white px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-950">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="min-w-0 flex-1 text-sm font-medium text-slate-700">Video found. Ready to download.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-950 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-cyan-800"
          >
            Download →
          </button>
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 rounded-xl border border-cyan-500/20 bg-cyan-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">Track this account&apos;s follower growth</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              See daily follower counts, growth charts, and unfollow detection — free.
            </p>
          </div>
          <Link
            href="/auth/signup"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-cyan-950 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-cyan-800"
          >
            Start Tracking Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
