interface AuthenticityBadgeProps {
  score: number;
  label: 'authentic' | 'suspicious' | 'likely_fake';
  signals: string[];
  fakePctRange?: { min: number; max: number };
}

export function AuthenticityBadge({ score, label, signals, fakePctRange }: AuthenticityBadgeProps) {
  const config = {
    authentic: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      dot: 'bg-green-500',
      display: 'Authentic',
    },
    suspicious: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-400',
      display: 'Suspicious',
    },
    likely_fake: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      display: 'Likely fake',
    },
  }[label];

  return (
    <div className="group relative inline-block">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium cursor-help ${config.bg} ${config.text} ${config.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.display} · {score}/100
        {fakePctRange && (
          <span className="opacity-70">
            · Est. {fakePctRange.min === 0 ? `<${fakePctRange.max}` : `${fakePctRange.min}–${fakePctRange.max}`}% fake
          </span>
        )}
      </div>
      {/* Tooltip on hover */}
      <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50 w-64">
        <div className="rounded-lg bg-slate-950 p-3 text-xs text-white shadow-xl">
          <p className="font-semibold mb-1.5">Authenticity signals</p>
          <ul className="space-y-1">
            {signals.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-slate-300">
                <span className="mt-0.5 shrink-0">·</span>
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-slate-500">
            Based on daily growth pattern analysis
          </p>
        </div>
      </div>
    </div>
  );
}
