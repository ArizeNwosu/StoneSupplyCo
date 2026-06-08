import { formatCount, formatChange } from '@/lib/format';

interface MetricsRowProps {
  current: number | null;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  avgDailyGain: number | null;
  peakCount?: number | null;
  daysTracked?: number | null;
  volatilityScore?: number | null;
}

function Metric({
  label,
  value,
  detail,
  highlight,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail?: string;
  highlight?: boolean;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
}) {
  const toneClasses = {
    neutral: 'text-slate-950',
    positive: 'text-emerald-700',
    negative: 'text-rose-600',
    warning: 'text-amber-700',
  };

  return (
    <div className="animate-dashboard-pop rounded-lg border border-cyan-950/10 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span
        className={`block text-2xl font-black tabular-nums ${
          highlight ? 'text-teal-700' : toneClasses[tone]
        }`}
      >
        {value}
      </span>
      <span className="mt-1 block text-xs font-bold text-slate-500">{label}</span>
      {detail && (
        <span className="mt-2 block text-[11px] font-semibold leading-4 text-slate-400">
          {detail}
        </span>
      )}
    </div>
  );
}

function changeTone(value: number | null): 'neutral' | 'positive' | 'negative' {
  if (value === null || value === 0) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}

export function MetricsRow({
  current,
  change24h,
  change7d,
  change30d,
  avgDailyGain,
  peakCount,
  daysTracked,
  volatilityScore,
}: MetricsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Metric
        label="Followers"
        value={current !== null ? formatCount(current) : '—'}
        detail={peakCount ? `Peak ${formatCount(peakCount)}` : 'Latest snapshot'}
        highlight
      />
      <Metric
        label="24h change"
        value={change24h !== null ? formatChange(change24h) : '—'}
        detail="Latest movement"
        tone={changeTone(change24h)}
      />
      <Metric
        label="7d change"
        value={change7d !== null ? formatChange(change7d) : '—'}
        detail="Weekly momentum"
        tone={changeTone(change7d)}
      />
      <Metric
        label="30d change"
        value={change30d !== null ? formatChange(change30d) : '—'}
        detail="Monthly trend"
        tone={changeTone(change30d)}
      />
      <Metric
        label="Avg/day"
        value={avgDailyGain !== null ? formatChange(avgDailyGain) : '—'}
        detail="Growth baseline"
        tone={changeTone(avgDailyGain)}
      />
      <Metric
        label="Volatility"
        value={volatilityScore !== null && volatilityScore !== undefined ? `${volatilityScore}%` : '—'}
        detail="Daily swing intensity"
        tone={volatilityScore && volatilityScore > 70 ? 'warning' : 'neutral'}
      />
      <Metric
        label="Days tracked"
        value={daysTracked !== null && daysTracked !== undefined ? String(daysTracked) : '—'}
        detail="History depth"
      />
      <Metric
        label="Data status"
        value={daysTracked && daysTracked >= 5 ? 'Ready' : 'Building'}
        detail={daysTracked && daysTracked >= 5 ? 'Pattern analysis active' : 'More snapshots improve signals'}
      />
    </div>
  );
}
