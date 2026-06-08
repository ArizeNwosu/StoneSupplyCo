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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-black text-slate-900">Video Ready to Download</p>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video preview */}
        <div className="px-5 pt-4">
          <video
            src={result.videoUrl}
            controls
            playsInline
            className="w-full rounded-xl bg-slate-950"
            style={{ maxHeight: '320px' }}
          />
        </div>

        {/* Caption */}
        {result.caption && (
          <p className="mx-5 mt-3 line-clamp-2 text-xs font-medium text-slate-500 leading-relaxed">
            {result.caption}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 px-5 py-4">
          <a
            href={proxyUrl(result.videoUrl)}
            download={`instagram-${result.shortcode}.mp4`}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-cyan-800"
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
            className="text-center text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            View original post on Instagram →
          </a>
        </div>

        {/* CTA */}
        <div className="mx-5 mb-5 rounded-xl border border-cyan-500/20 bg-cyan-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-slate-900">Track this account&apos;s followers</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">Daily growth charts, free.</p>
            </div>
            <Link
              href="/auth/signup"
              onClick={onClose}
              className="flex-shrink-0 rounded-full bg-cyan-950 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-cyan-800"
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
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-950 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-cyan-800 disabled:opacity-50"
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
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-cyan-950/10 bg-white px-4 py-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-950">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="flex-1 text-sm font-medium text-slate-700">Video found. Ready to download.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-cyan-950 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-cyan-800"
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
            className="flex-shrink-0 rounded-full bg-cyan-950 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-cyan-800"
          >
            Start Tracking Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
