'use client';

import { formatChange, formatCount } from '@/lib/format';

interface Account {
  id: string;
  handle: string;
  latestCount: number | null;
  change24h: number | null;
  snapshotCount: number;
}

interface AccountComparisonPanelProps {
  accounts: Account[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function AccountComparisonPanel({
  accounts,
  selectedId,
  onSelect,
}: AccountComparisonPanelProps) {
  const ranked = [...accounts]
    .filter((account) => account.latestCount !== null)
    .sort((a, b) => normalizedGrowth(b) - normalizedGrowth(a))
    .slice(0, 5);

  if (accounts.length < 2) return null;

  return (
    <section className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700">
            Comparison mode
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-950">
            Normalized growth leaderboard
          </h3>
        </div>
        <p className="text-xs font-semibold text-slate-500">
          Comparing up to 5 tracked accounts
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {ranked.map((account, index) => {
          const pct = normalizedGrowth(account);
          const width = Math.min(100, Math.max(6, Math.abs(pct) * 8));
          const positive = pct >= 0;
          return (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelect(account.id)}
              className={`w-full rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                account.id === selectedId
                  ? 'border-teal-300 bg-teal-50'
                  : 'border-cyan-950/10 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    #{index + 1} @{account.handle}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {account.latestCount !== null ? formatCount(account.latestCount) : 'Pending'} followers · {account.snapshotCount} snapshots
                  </p>
                </div>
                <div className={`shrink-0 text-right text-sm font-black tabular-nums ${positive ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {account.change24h !== null ? formatChange(account.change24h) : '—'}
                  <p className="text-[11px] font-bold text-slate-400">
                    {pct === 0 ? '0.00%' : `${positive ? '+' : ''}${pct.toFixed(2)}%`}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full ${positive ? 'bg-teal-600' : 'bg-rose-500'}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function normalizedGrowth(account: Account) {
  if (!account.latestCount || account.change24h === null) return 0;
  const previous = account.latestCount - account.change24h;
  if (previous <= 0) return 0;
  return (account.change24h / previous) * 100;
}
