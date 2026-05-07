import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export const TIMEFRAMES = [
  { label: '7D',  days: 7  },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'ALL', days: 0  },
];

export const DRUG_COLORS: Record<string, string> = {
  Ozempic:     'var(--color-primary)',
  Wegovy:      'var(--color-tertiary)',
  Mounjaro:    'var(--color-success)',
  Zepbound:    '#a855f7',
  Semaglutide: 'var(--color-secondary)',
};

export function timeAgo(ms: number) {
  const d = Date.now() - ms;
  const h = Math.floor(d / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function useFetch<T>(url: string, deps: any[] = []) {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  useEffect(() => {
    setLoading(true); setError(null);
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loading, error };
}

export function SectionShell({ title, subtitle, children, loading, error }: {
  title: string; subtitle: string; children: React.ReactNode; loading: boolean; error: string | null;
}) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-headline-md text-on-surface">{title}</h2>
        <p className="text-body-sm text-on-surface-variant mt-1">{subtitle}</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16 analytical-border rounded bg-surface-container-low">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 py-8 px-6 analytical-border rounded bg-surface-container-low text-error">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-body-sm">Failed to load: {error}</span>
        </div>
      ) : children}
    </section>
  );
}
