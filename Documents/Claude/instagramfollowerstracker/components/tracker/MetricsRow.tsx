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
    <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <span
        className={`text-2xl font-bold ${
          highlight ? 'text-purple-600' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
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
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
