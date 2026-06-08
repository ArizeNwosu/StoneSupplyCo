'use client';

import { useEffect, useState } from 'react';
import { formatCount } from '@/lib/format';

interface SnapshotProgressProps {
  handle: string;
  snapshotCount: number;
  latestCount: number | null;
  lastChecked: string | Date | null;
  isBackfilling?: boolean;
}

function hoursUntilNextSnapshot(lastChecked: string | Date | null): number {
  if (!lastChecked) return 24;
  const last = new Date(lastChecked);
  const nextAt = new Date(last.getTime() + 24 * 60 * 60 * 1000);
  return Math.max(0, Math.round((nextAt.getTime() - Date.now()) / (1000 * 60 * 60)));
}

export function SnapshotProgress({
  handle,
  snapshotCount,
  latestCount,
  lastChecked,
  isBackfilling = false,
}: SnapshotProgressProps) {
  const count = snapshotCount ?? 0;
  const isCapturing = count === 0;
  const hoursLeft = hoursUntilNextSnapshot(lastChecked);

  const [dots, setDots] = useState('');
  useEffect(() => {
    if (!isCapturing) return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 600);
    return () => clearInterval(t);
  }, [isCapturing]);

  return (
    <div className="max-w-2xl mx-auto">
      {latestCount !== null ? (
        <div className="text-center mb-8">
          <p className="text-6xl font-black text-teal-700">
            {formatCount(latestCount)}
          </p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live · @{handle}
          </p>
        </div>
      ) : isCapturing ? (
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            Fetching follower count for @{handle}{dots}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-cyan-950/10 bg-white p-8 shadow-xl shadow-cyan-950/10">
        {isCapturing ? (
          <>
            <h3 className="text-sm font-black text-slate-950 mb-1">
              Taking first snapshot{dots}
            </h3>
            <p className="text-sm text-slate-500">
              This usually takes under a minute. The page will update automatically.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-sm font-black text-slate-950 mb-1">
              {count} snapshot{count !== 1 ? 's' : ''} collected
            </h3>
            <p className="text-sm text-slate-500">
              Next snapshot in ~{hoursLeft}h.
            </p>
            {isBackfilling && (
              <div className="mt-3 flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
                </span>
                <p className="text-sm font-semibold text-teal-700">
                  Loading historical data from archive.org — this can take a few minutes…
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
