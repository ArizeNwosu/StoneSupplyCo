'use client';

import { useEffect, useState } from 'react';
import { StalkerEventFeed } from './StalkerEventFeed';
import { StalkerUpgradeCard } from './StalkerUpgradeCard';

type StalkerFrequency = 'DAILY' | 'SIX_HOUR' | 'HOURLY';

interface StalkerSub {
  id: string;
  trackedAccountId: string;
  handle: string;
  frequency: StalkerFrequency;
  frequencyLabel: string;
  source: 'STRIPE' | 'PRO_INCLUDED';
}

export function StalkerModePanel({
  trackedAccountId,
  handle,
}: {
  trackedAccountId: string;
  handle: string;
}) {
  const [sub, setSub] = useState<StalkerSub | null | undefined>(undefined); // undefined = loading
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch('/api/stalker')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: StalkerSub[]) => {
        const match = data.find((s) => s.trackedAccountId === trackedAccountId);
        setSub(match ?? null);
      })
      .catch(() => setSub(null));
  }, [trackedAccountId]);

  const cancel = async () => {
    if (!sub) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/stalker/${sub.id}`, { method: 'DELETE' });
      if (res.ok) setSub(null);
    } finally {
      setCancelling(false);
    }
  };

  if (sub === undefined) {
    return (
      <div className="rounded-xl border border-cyan-950/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">👁</span>
          <p className="text-sm font-black text-slate-950">Stalker Mode</p>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
        </div>
      </div>
    );
  }

  if (!sub) {
    return <StalkerUpgradeCard trackedAccountId={trackedAccountId} handle={handle} />;
  }

  return (
    <div className="rounded-xl border border-cyan-950/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">👁</span>
          <div>
            <p className="text-sm font-black text-slate-950">
              Stalker Mode
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                Active
              </span>
            </p>
            <p className="text-xs text-slate-500">
              {sub.frequencyLabel}
              {sub.source === 'PRO_INCLUDED' && ' · Included in Pro'}
            </p>
          </div>
        </div>
        {sub.source === 'STRIPE' && (
          <button
            onClick={cancel}
            disabled={cancelling}
            className="text-xs font-semibold text-slate-400 hover:text-red-500 transition disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>

      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Recent activity</p>
      <StalkerEventFeed trackedAccountId={trackedAccountId} />
    </div>
  );
}
