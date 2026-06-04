'use client';

import { useEffect, useState } from 'react';
import { formatCount } from '@/lib/format';
import { CHART_UNLOCK_THRESHOLD } from '@/lib/limits';

interface SnapshotProgressProps {
  handle: string;
  snapshotCount: number;
  latestCount: number | null;
  lastChecked: string | Date | null;
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
}: SnapshotProgressProps) {
  const count = snapshotCount ?? 0;
  const isCapturing = count === 0;

  // Animate the bar filling in after mount
  const targetPct = isCapturing
    ? 5 // show a sliver so it doesn't look broken
    : Math.min(100, Math.round((count / CHART_UNLOCK_THRESHOLD) * 100));
  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarPct(targetPct), 120);
    return () => clearTimeout(t);
  }, [targetPct]);

  const remaining = CHART_UNLOCK_THRESHOLD - count;
  const hoursLeft = hoursUntilNextSnapshot(lastChecked);

  // Which dot is next (to pulse)
  const nextMilestone = [1, 3, 7].find((n) => count < n) ?? null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Follower count — always show once available */}
      {latestCount !== null ? (
        <div className="text-center mb-8">
          <p className="text-6xl font-extrabold text-purple-600 tracking-tight">
            {formatCount(latestCount)}
          </p>
          <p className="text-gray-500 mt-2 text-sm flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live · @{handle}
          </p>
        </div>
      ) : isCapturing ? (
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            Fetching follower count for @{handle}…
          </div>
        </div>
      ) : null}

      {/* Progress card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            Building your chart
            {isCapturing && (
              <span className="text-xs font-normal text-purple-500 animate-pulse">
                capturing now…
              </span>
            )}
          </h3>
          <span className="text-sm font-medium text-purple-600">
            {count} / {CHART_UNLOCK_THRESHOLD} snapshots
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-3 mb-5 overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ width: `${barPct}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Milestone dots */}
        <div className="flex justify-between mb-6 px-1">
          {[1, 3, 7].map((n) => {
            const done = count >= n;
            const isNext = n === nextMilestone;
            return (
              <div key={n} className="flex flex-col items-center gap-1">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                    done
                      ? 'bg-purple-500'
                      : isNext
                      ? 'bg-purple-200 ring-2 ring-purple-300 ring-offset-1 animate-pulse'
                      : 'bg-gray-200'
                  }`}
                />
                <span
                  className={`text-xs ${
                    done ? 'text-purple-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  Day {n}
                </span>
              </div>
            );
          })}
        </div>

        {/* Status steps */}
        <div className="space-y-3">
          <StatusRow
            done={count >= 1}
            active={isCapturing}
            text={
              isCapturing
                ? 'Taking your first snapshot right now…'
                : 'First snapshot taken — tracking started'
            }
          />
          <StatusRow
            done={count >= CHART_UNLOCK_THRESHOLD}
            text={
              remaining > 0
                ? `${remaining} more snapshot${remaining !== 1 ? 's' : ''} until your chart unlocks`
                : 'Chart unlocked!'
            }
          />
          {!isCapturing && (
            <StatusRow
              done={false}
              text={
                <>
                  Next snapshot in{' '}
                  <span className="font-medium text-gray-800">
                    ~{hoursLeft}h
                  </span>
                </>
              }
            />
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 text-xs text-gray-400">
          We snapshot follower counts every 24 hours. We&apos;ll email you when
          your chart is ready.
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  done,
  active,
  text,
}: {
  done: boolean;
  active?: boolean;
  text: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span
        className={`mt-0.5 shrink-0 leading-none ${
          done
            ? 'text-green-500'
            : active
            ? 'text-purple-400 animate-pulse'
            : 'text-gray-300'
        }`}
      >
        {done ? '✓' : active ? '◉' : '○'}
      </span>
      <span
        className={
          done ? 'text-gray-400' : active ? 'text-gray-800 font-medium' : 'text-gray-500'
        }
      >
        {text}
      </span>
    </div>
  );
}
