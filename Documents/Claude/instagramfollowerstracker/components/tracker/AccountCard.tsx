'use client';

import Image from 'next/image';
import { formatCount, formatChange } from '@/lib/format';

interface AccountCardProps {
  id: string;
  handle: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  latestCount: number | null;
  change24h: number | null;
  authenticityScore: number | null;
  selected: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}

function scoreTitle(score: number): string {
  if (score >= 80) return `Authentic · ${score}/100`;
  if (score >= 50) return `Suspicious · ${score}/100`;
  return `Likely fake · ${score}/100`;
}

export function AccountCard({
  id,
  handle,
  displayName,
  avatarUrl,
  latestCount,
  change24h,
  authenticityScore,
  selected,
  onClick,
  onDelete,
}: AccountCardProps) {
  const changePositive = change24h !== null && change24h > 0;
  const changeNegative = change24h !== null && change24h < 0;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
        selected
          ? 'border-teal-300 bg-teal-50'
          : 'border-transparent hover:border-cyan-950/10 hover:bg-slate-50'
      }`}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`@${handle} Instagram profile picture`}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
          {handle[0]?.toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-black text-slate-950">@{handle}</p>
          {authenticityScore !== null && (
            <span
              title={scoreTitle(authenticityScore)}
              className={`shrink-0 w-2 h-2 rounded-full ${scoreColor(authenticityScore)}`}
            />
          )}
        </div>
        {displayName && (
          <p className="truncate text-xs font-semibold text-slate-500">{displayName}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-slate-950">
          {latestCount !== null ? formatCount(latestCount) : '—'}
        </p>
        {change24h !== null && (
          <p
            className={`text-xs ${
              changePositive
                ? 'text-emerald-600'
                : changeNegative
                ? 'text-red-500'
                : 'text-slate-400'
            }`}
          >
            {formatChange(change24h)}
          </p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
        className="ml-1 shrink-0 text-xs font-black text-slate-300 transition hover:text-red-500"
        aria-label={`Remove @${handle}`}
      >
        ✕
      </button>
    </div>
  );
}
