'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface CollectorConfig {
  bookmarklet: string;
}

interface BrowserCollectorPanelProps {
  accountId: string;
  handle: string;
  onRefresh: () => void;
}

export function BrowserCollectorPanel({
  accountId,
  handle,
  onRefresh,
}: BrowserCollectorPanelProps) {
  const [config, setConfig] = useState<CollectorConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bookmarkletRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (config?.bookmarklet && bookmarkletRef.current) {
      bookmarkletRef.current.setAttribute('href', config.bookmarklet);
    }
  }, [config]);

  const loadCollector = useCallback(async () => {
    if (config || loading) return config;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/accounts/${accountId}/collector`);
      const data = (await res.json().catch(() => ({}))) as
        | CollectorConfig
        | { error?: string };
      if (!res.ok || !('bookmarklet' in data)) {
        throw new Error('error' in data ? data.error : 'Could not create collector');
      }
      setConfig(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create collector');
      return null;
    } finally {
      setLoading(false);
    }
  }, [accountId, config, loading]);

  const handleCopy = async () => {
    const data = await loadCollector();
    if (!data) return;
    await navigator.clipboard.writeText(data.bookmarklet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const instagramUrl = `https://www.instagram.com/${handle}/`;

  return (
    <details className="rounded-lg border border-cyan-950/10 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-black text-slate-700">
        Fallback: browser capture
      </summary>
      <div className="mt-4">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            Use only if automatic capture misses
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-950">
            Capture @{handle} from Instagram
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Use your browser to collect the count from the profile page if the
            automated collector cannot reach Instagram.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-cyan-950/10 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-white"
          >
            Open Instagram
          </a>
          <Button type="button" onClick={onRefresh} variant="secondary">
            Refresh
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <StepCard
          step="1"
          title="Add the capture button"
          body="Create it once, then keep it in your bookmarks bar."
        >
          {config ? (
            <a
              ref={bookmarkletRef}
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm"
            >
              Capture @{handle}
            </a>
          ) : (
            <Button
              type="button"
              className="mt-3"
              onClick={() => void loadCollector()}
              loading={loading}
            >
              Set up capture
            </Button>
          )}
        </StepCard>
        <StepCard
          step="2"
          title="Open the profile"
          body={`Go to @${handle} on Instagram in the same browser.`}
        >
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-cyan-950/10 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            Open @{handle}
          </a>
        </StepCard>
        <StepCard
          step="3"
          title="Click Capture"
          body="The snapshot is saved to this dashboard. Return here and refresh."
        >
          <Button type="button" variant="secondary" className="mt-3" onClick={onRefresh}>
            I captured it
          </Button>
        </StepCard>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => void handleCopy()}
          loading={loading}
        >
          {copied ? 'Bookmarklet copied' : 'Copy bookmarklet'}
        </Button>
        <span className="text-xs font-semibold text-slate-400">
          Dragging is fastest. Copy is a fallback for browsers that hide the bookmarks bar.
        </span>
      </div>
      {error ? (
        <p className="mt-3 text-xs font-bold text-red-600">{error}</p>
      ) : null}
      </div>
    </details>
  );
}

function StepCard({
  step,
  title,
  body,
  children,
}: {
  step: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-cyan-950/10 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-black text-white">
          {step}
        </span>
        <div>
          <h4 className="text-sm font-black text-slate-950">{title}</h4>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            {body}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
