'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { formatChange, formatCount } from '@/lib/format';

interface SnapshotPoint {
  takenAt: string;
  followerCount: number;
}

interface AccountIntelligenceHeaderProps {
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  current: number | null;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  snapshotCount: number;
  lastChecked: string | null;
  snapshots: SnapshotPoint[];
  actions: ReactNode;
}

export function AccountIntelligenceHeader({
  handle,
  displayName,
  avatarUrl,
  current,
  change24h,
  change7d,
  change30d,
  snapshotCount,
  lastChecked,
  snapshots,
  actions,
}: AccountIntelligenceHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const status = getStatus(snapshotCount, lastChecked);
  const nextSnapshot = getNextSnapshotLabel(lastChecked);
  const movement = useMemo(
    () => getMovementLabel(change24h, change7d, change30d),
    [change24h, change7d, change30d]
  );
  const firstSnapshot = snapshots[0];

  return (
    <section className="animate-rise-in overflow-hidden rounded-lg border border-cyan-950/10 bg-white shadow-xl shadow-cyan-950/10">
      <div className="border-b border-cyan-950/10 bg-gradient-to-r from-white via-teal-50 to-sky-50 p-4 sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            {avatarUrl && !imgError ? (
              <Image
                src={avatarUrl}
                alt={`@${handle} Instagram profile picture`}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover ring-4 ring-white"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xl font-black text-white ring-4 ring-white">
                {handle[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-black text-slate-950 sm:text-2xl md:text-3xl">@{handle}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${status.className}`}>
                  {status.label}
                </span>
              </div>
              {displayName && (
                <p className="mt-1 truncate text-sm font-semibold text-slate-500">{displayName}</p>
              )}
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                {movement}
              </p>
            </div>
          </div>
          <div className="shrink-0">{actions}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-cyan-950/10 md:grid-cols-4 md:divide-y-0">
        <HeaderStat label="Followers" value={current !== null ? formatCount(current) : 'Pending'} detail="Latest captured count" />
        <HeaderStat label="Snapshots" value={String(snapshotCount)} detail={firstSnapshot ? `Since ${new Date(firstSnapshot.takenAt).toLocaleDateString()}` : 'Waiting for first capture'} />
        <HeaderStat label="Last captured" value={lastChecked ? new Date(lastChecked).toLocaleDateString() : 'Pending'} detail={lastChecked ? new Date(lastChecked).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Capture queued'} />
        <HeaderStat label="Next snapshot" value={nextSnapshot.value} detail={nextSnapshot.detail} />
      </div>
    </section>
  );
}

function HeaderStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black tabular-nums text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function getStatus(snapshotCount: number, lastChecked: string | null) {
  if (snapshotCount === 0) {
    return { label: 'Capture pending', className: 'bg-amber-100 text-amber-800' };
  }
  if (!lastChecked) {
    return { label: 'Building history', className: 'bg-sky-100 text-sky-800' };
  }
  const hours = (Date.now() - new Date(lastChecked).getTime()) / (1000 * 60 * 60);
  if (hours <= 30) {
    return { label: 'Live', className: 'bg-emerald-100 text-emerald-800' };
  }
  return { label: 'Needs refresh', className: 'bg-rose-100 text-rose-700' };
}

function getNextSnapshotLabel(lastChecked: string | null) {
  if (!lastChecked) return { value: 'Queued', detail: 'Starts after first capture' };
  const next = new Date(new Date(lastChecked).getTime() + 24 * 60 * 60 * 1000);
  const hours = Math.max(0, Math.round((next.getTime() - Date.now()) / (1000 * 60 * 60)));
  return {
    value: hours === 0 ? 'Soon' : `~${hours}h`,
    detail: next.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric' }),
  };
}

function getMovementLabel(change24h: number | null, change7d: number | null, change30d: number | null) {
  const available = [
    change24h !== null ? `24h ${formatChange(change24h)}` : null,
    change7d !== null ? `7d ${formatChange(change7d)}` : null,
    change30d !== null ? `30d ${formatChange(change30d)}` : null,
  ].filter(Boolean);

  if (available.length === 0) {
    return 'The first snapshot is saved. Additional daily captures will reveal momentum, spikes, and slowdowns.';
  }

  return `Current movement: ${available.join(' · ')}.`;
}
