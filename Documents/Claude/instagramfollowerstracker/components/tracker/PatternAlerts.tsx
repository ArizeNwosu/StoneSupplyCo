'use client';

import { useState, useEffect } from 'react';

interface PatternEvent {
  date: string;
  type: 'mass_drop' | 'mass_gain';
  affectedAccounts: { handle: string; change: number; changePct: number }[];
  summary: string;
}

interface PatternsResponse {
  patterns: PatternEvent[];
  accountCount: number;
}

export function PatternAlerts() {
  const [data, setData] = useState<PatternsResponse | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/patterns')
      .then((r) => {
        if (!r.ok) return null; // non-Agency users get 402 — silently skip
        return r.json() as Promise<PatternsResponse>;
      })
      .then((d) => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) return null;

  if (data.accountCount < 3) {
    return (
      <div className="rounded-lg border border-cyan-950/10 bg-white p-4 text-sm font-semibold text-slate-400">
        Track 3+ accounts to unlock cross-account pattern detection.
      </div>
    );
  }

  if (data.patterns.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-amber-100 bg-white">
      <div className="flex items-center gap-2 border-b border-amber-50 px-5 py-3">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <h3 className="text-sm font-black text-slate-950">Pattern alerts</h3>
        <span className="ml-auto text-xs font-semibold text-slate-400">
          {data.patterns.length} event{data.patterns.length !== 1 ? 's' : ''}
        </span>
      </div>
      <ul className="divide-y divide-slate-50">
        {data.patterns.map((event) => {
          const key = `${event.date}-${event.type}`;
          return (
            <li key={key} className="px-5 py-3">
              <button
                className="w-full text-left"
                onClick={() => setOpen(open === key ? null : key)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      event.type === 'mass_drop'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {event.type === 'mass_drop' ? 'Mass drop' : 'Mass spike'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{event.date}</span>
                  <span className="ml-auto text-xs text-slate-300">
                    {open === key ? '▲' : '▼'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{event.summary}</p>
              </button>
              {open === key && (
                <ul className="mt-2 space-y-1 pl-2">
                  {event.affectedAccounts.map((a) => (
                    <li
                      key={a.handle}
                      className="flex items-center justify-between text-xs text-slate-500"
                    >
                      <span>@{a.handle}</span>
                      <span className={a.change >= 0 ? 'text-green-600' : 'text-red-500'}>
                        {a.change >= 0 ? '+' : ''}
                        {a.change.toLocaleString()} (
                        {(a.changePct * 100).toFixed(1)}%)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
