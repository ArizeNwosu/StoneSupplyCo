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
  if (score >= 80) return 'bg-green-400';
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
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
        selected
          ? 'bg-purple-50 border border-purple-200'
          : 'hover:bg-gray-50 border border-transparent'
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
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {handle[0]?.toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-900 truncate">@{handle}</p>
          {authenticityScore !== null && (
            <span
              title={scoreTitle(authenticityScore)}
              className={`shrink-0 w-2 h-2 rounded-full ${scoreColor(authenticityScore)}`}
            />
          )}
        </div>
        {displayName && (
          <p className="text-xs text-gray-500 truncate">{displayName}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gray-900">
          {latestCount !== null ? formatCount(latestCount) : '—'}
        </p>
        {change24h !== null && (
          <p
            className={`text-xs ${
              changePositive
                ? 'text-green-500'
                : changeNegative
                ? 'text-red-400'
                : 'text-gray-400'
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
        className="ml-1 text-gray-300 hover:text-red-400 transition text-xs shrink-0"
        aria-label={`Remove @${handle}`}
      >
        ✕
      </button>
    </div>
  );
}
