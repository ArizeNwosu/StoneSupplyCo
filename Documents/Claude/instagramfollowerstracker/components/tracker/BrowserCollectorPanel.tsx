'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface CollectorConfig {
  bookmarklet: string;
}

interface BrowserCollectorPanelProps {
  accountId: string;
  handle: string;
}

export function BrowserCollectorPanel({
  accountId,
  handle,
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

  return (
    <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-950">
            Browser capture
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Capture @{handle} from your own Instagram page when server scraping is blocked.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {config ? (
            <a
              ref={bookmarkletRef}
              className="inline-flex items-center justify-center rounded-full border border-cyan-950/10 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-white"
            >
              Capture @{handle}
            </a>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void loadCollector()}
              loading={loading}
            >
              Create collector
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleCopy()}
            loading={loading}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
      {config ? (
        <p className="mt-3 text-xs font-semibold text-slate-400">
          Drag “Capture @{handle}” to your bookmarks bar, then open the Instagram profile and run it.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-xs font-bold text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
