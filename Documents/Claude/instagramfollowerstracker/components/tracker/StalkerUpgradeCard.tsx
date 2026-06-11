'use client';

import { useState } from 'react';

type StalkerFrequency = 'DAILY' | 'SIX_HOUR' | 'HOURLY';

const TIERS: Array<{ frequency: StalkerFrequency; label: string; sublabel: string; price: string }> = [
  { frequency: 'DAILY',    label: 'Daily',         sublabel: 'Every 24 hours · Best value', price: '$4.99/mo' },
  { frequency: 'SIX_HOUR', label: 'Every 6 hours', sublabel: '4× daily checks',             price: '$6.99/mo' },
  { frequency: 'HOURLY',   label: 'Every hour',    sublabel: '24× daily checks',             price: '$9.99/mo' },
];

export function StalkerUpgradeCard({
  trackedAccountId,
  handle,
}: {
  trackedAccountId: string;
  handle: string;
}) {
  const [selected, setSelected] = useState<StalkerFrequency>('DAILY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stalker/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackedAccountId, frequency: selected }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-cyan-950/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">👁</span>
        <div>
          <p className="text-sm font-black text-slate-950">Stalker Mode</p>
          <p className="text-xs text-slate-500">
            Get alerted when @{handle} posts, deletes posts, follows someone, changes their bio, profile photo, display name, username, link, category, pronouns, gains or loses their verified badge, or goes private.
          </p>
        </div>
      </div>

      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Check frequency</p>
      <div className="space-y-2 mb-4">
        {TIERS.map((tier) => (
          <button
            key={tier.frequency}
            onClick={() => setSelected(tier.frequency)}
            className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
              selected === tier.frequency
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-slate-100 hover:border-slate-200'
            }`}
          >
            <div>
              <p className={`text-sm font-bold ${selected === tier.frequency ? 'text-cyan-900' : 'text-slate-700'}`}>
                {tier.label}
              </p>
              <p className="text-xs text-slate-400">{tier.sublabel}</p>
            </div>
            <p className={`text-sm font-black ${selected === tier.frequency ? 'text-cyan-700' : 'text-slate-400'}`}>
              {tier.price}
            </p>
          </button>
        ))}
      </div>

      {selected === 'DAILY' && (
        <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">
          💡 Daily is enough for 99% of cases — most bio and follow changes stay up for hours or days.
        </p>
      )}

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
      )}

      <button
        onClick={subscribe}
        disabled={loading}
        className="w-full rounded-full bg-slate-950 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? 'Redirecting…' : 'Activate Stalker Mode'}
      </button>
      <p className="mt-2 text-center text-xs text-slate-400">Cancel anytime · No Instagram login required</p>
    </div>
  );
}
