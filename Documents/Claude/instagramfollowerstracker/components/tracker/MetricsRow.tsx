import { formatCount, formatChange } from '@/lib/format';

interface MetricsRowProps {
  current: number | null;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  avgDailyGain: number | null;
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-cyan-950/10 bg-white p-4 shadow-sm">
      <span
        className={`text-2xl font-black ${
          highlight ? 'text-teal-700' : 'text-slate-950'
        }`}
      >
        {value}
      </span>
      <span className="mt-1 text-xs font-bold text-slate-500">{label}</span>
    </div>
  );
}

export function MetricsRow({
  current,
  change24h,
  change7d,
  change30d,
  avgDailyGain,
}: MetricsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Metric
        label="Followers"
        value={current !== null ? formatCount(current) : '—'}
        highlight
      />
      <Metric
        label="24h change"
        value={change24h !== null ? formatChange(change24h) : '—'}
      />
      <Metric
        label="7d change"
        value={change7d !== null ? formatChange(change7d) : '—'}
      />
      <Metric
        label="30d change"
        value={change30d !== null ? formatChange(change30d) : '—'}
      />
      <Metric
        label="Avg/day"
        value={avgDailyGain !== null ? formatChange(avgDailyGain) : '—'}
      />
    </div>
  );
}
