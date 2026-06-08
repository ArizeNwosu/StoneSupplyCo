'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Chart as ChartType } from 'chart.js';
import { formatDate, formatCount, formatChange } from '@/lib/format';

interface Snapshot {
  takenAt: string | Date;
  followerCount: number;
}

interface FollowerChartProps {
  snapshots: Snapshot[];
  handle: string;
}

export function FollowerChart({ snapshots, handle }: FollowerChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartType | null>(null);
  const [range, setRange] = useState<'7D' | '30D' | '90D' | 'ALL'>('ALL');
  const firstSnapshot = snapshots[0];

  const filteredSnapshots = useMemo(() => {
    if (range === 'ALL' || snapshots.length <= 1) return snapshots;
    const days = range === '7D' ? 7 : range === '30D' ? 30 : 90;
    const latestTime = new Date(snapshots.at(-1)!.takenAt).getTime();
    const cutoff = latestTime - days * 24 * 60 * 60 * 1000;
    const filtered = snapshots.filter((s) => new Date(s.takenAt).getTime() >= cutoff);
    return filtered.length > 0 ? filtered : snapshots.slice(-Math.min(snapshots.length, days));
  }, [range, snapshots]);

  const insight = useMemo(() => buildChartInsight(filteredSnapshots), [filteredSnapshots]);

  useEffect(() => {
    if (!canvasRef.current || filteredSnapshots.length < 3) return;

    // Dynamic import — Chart.js never blocks SSR
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const gradient = ctx.createLinearGradient(0, 0, 0, 270);
      gradient.addColorStop(0, 'rgba(13,148,136,0.24)');
      gradient.addColorStop(1, 'rgba(13,148,136,0.02)');

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: filteredSnapshots.map((s) => formatDate(s.takenAt)),
          datasets: [
            {
              label: `@${handle} followers`,
              data: filteredSnapshots.map((s) => s.followerCount),
              borderColor: '#0f766e',
              backgroundColor: gradient,
              fill: true,
              tension: 0.36,
              borderWidth: 3,
              pointRadius: filteredSnapshots.length > 60 ? 0 : 3,
              pointBackgroundColor: (context) => {
                const index = context.dataIndex;
                if (index === insight.peakIndex) return '#0f172a';
                if (index === insight.biggestGainIndex) return '#059669';
                if (index === insight.biggestLossIndex) return '#e11d48';
                return '#0f766e';
              },
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              displayColors: false,
              callbacks: {
                title: (items) => items[0]?.label ?? '',
                label: (ctx) => {
                  const current = ctx.parsed.y ?? 0;
                  const previous =
                    ctx.dataIndex > 0
                      ? filteredSnapshots[ctx.dataIndex - 1]?.followerCount
                      : null;
                  const delta = previous !== null && previous !== undefined ? current - previous : null;
                  return delta === null
                    ? `${formatCount(current)} followers`
                    : `${formatCount(current)} followers (${formatChange(delta)})`;
                },
              },
            },
          },
          scales: {
            y: {
              ticks: {
                callback: (v) => formatCount(Number(v)),
                color: '#64748b',
                font: { weight: 700 },
              },
              border: { display: false },
              grid: { color: 'rgba(15,23,42,0.06)' },
            },
            x: {
              border: { display: false },
              grid: { display: false },
              ticks: { maxTicksLimit: 8, color: '#64748b', font: { weight: 700 } },
            },
          },
          animation: {
            duration: 700,
            easing: 'easeOutQuart',
          },
        },
      });
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [filteredSnapshots, handle, insight.biggestGainIndex, insight.biggestLossIndex, insight.peakIndex]);

  if (snapshots.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-400">
        No snapshot data yet — check back after the first daily sync.
      </div>
    );
  }

  if (snapshots.length === 1 && firstSnapshot) {
    return (
      <div className="flex h-72 flex-col justify-between overflow-hidden rounded-lg bg-slate-50 p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Day 1 baseline captured
          </p>
          <p className="mt-3 text-5xl font-black tabular-nums text-slate-950">
            {formatCount(firstSnapshot.followerCount)}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            @{handle} on {formatDate(firstSnapshot.takenAt)}
          </p>
        </div>
        <div className="relative h-24">
          <div className="absolute inset-x-0 bottom-8 border-t border-dashed border-cyan-950/15" />
          <div className="absolute bottom-5 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full border-4 border-white bg-teal-600 shadow-lg shadow-teal-900/20" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
            First point
          </div>
        </div>
      </div>
    );
  }

  if (snapshots.length === 2) {
    return <TwoPointChart snapshots={snapshots} handle={handle} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full border border-cyan-950/10 bg-slate-50 p-1">
          {(['7D', '30D', '90D', 'ALL'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                range === item
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white hover:text-slate-950'
              }`}
            >
              {item === 'ALL' ? 'All' : item}
            </button>
          ))}
        </div>
        <p className="text-xs font-bold text-slate-400">
          {filteredSnapshots.length} point{filteredSnapshots.length !== 1 ? 's' : ''} shown
        </p>
      </div>
      <div className="relative h-72 w-full">
        <canvas ref={canvasRef} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <ChartCallout label="Peak" value={insight.peakLabel} tone="neutral" />
        <ChartCallout label="Biggest gain" value={insight.gainLabel} tone="positive" />
        <ChartCallout label="Biggest loss" value={insight.lossLabel} tone="negative" />
      </div>
      {hasWaybackData(snapshots) && range === 'ALL' && (
        <p className="text-[11px] leading-5 text-slate-400">
          <span className="font-black">About historical data:</span> Points before 2021 come from
          Wayback Machine archives. Instagram embedded follower counts in page HTML from roughly
          2016–2020; newer archives use client-side rendering and don&apos;t include counts, which
          is why there may be a gap between the archived data and your live snapshots.
        </p>
      )}
    </div>
  );
}

function TwoPointChart({ snapshots, handle }: { snapshots: Snapshot[]; handle: string }) {
  const [first, second] = snapshots;
  if (!first || !second) return null;
  const change = second.followerCount - first.followerCount;
  const gained = change >= 0;
  const startY = gained ? 142 : 74;
  const endY = gained ? 74 : 142;

  return (
    <div className="rounded-lg bg-slate-50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Two-point trend
          </p>
          <p className={`mt-3 text-4xl font-black tabular-nums ${gained ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatChange(change)}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            @{handle} from {formatDate(first.takenAt)} to {formatDate(second.takenAt)}
          </p>
        </div>
        <div className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm">
          Baseline building
        </div>
      </div>
      <svg className="mt-6 h-48 w-full" viewBox="0 0 640 190" role="img" aria-label={`Follower change for @${handle}`}>
        <line x1="36" x2="604" y1="156" y2="156" stroke="#cbd5e1" strokeDasharray="8 8" />
        <path
          d={`M64 ${startY} C220 ${startY}, 390 ${endY}, 576 ${endY}`}
          fill="none"
          stroke={gained ? '#0f766e' : '#e11d48'}
          strokeLinecap="round"
          strokeWidth="8"
          className="animate-draw-line"
        />
        <circle cx="64" cy={startY} r="12" fill="#ffffff" stroke="#0f766e" strokeWidth="6" />
        <circle cx="576" cy={endY} r="14" fill={gained ? '#0f766e' : '#e11d48'} stroke="#ffffff" strokeWidth="6" />
        <text x="64" y="178" textAnchor="middle" fill="#64748b" fontSize="18" fontWeight="800">
          {formatCount(first.followerCount)}
        </text>
        <text x="576" y="178" textAnchor="middle" fill="#64748b" fontSize="18" fontWeight="800">
          {formatCount(second.followerCount)}
        </text>
      </svg>
    </div>
  );
}

function ChartCallout({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'positive' | 'negative';
}) {
  const color = {
    neutral: 'text-slate-950',
    positive: 'text-emerald-700',
    negative: 'text-rose-600',
  }[tone];

  return (
    <div className="rounded-lg border border-cyan-950/10 bg-slate-50 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-black ${color}`}>{value}</p>
    </div>
  );
}

function hasWaybackData(snapshots: Snapshot[]): boolean {
  return snapshots.some((s) => new Date(s.takenAt).getFullYear() < 2021);
}

function buildChartInsight(points: Snapshot[]) {
  let peakIndex = 0;
  let biggestGainIndex = -1;
  let biggestLossIndex = -1;
  let biggestGain = 0;
  let biggestLoss = 0;

  points.forEach((point, index) => {
    if (point.followerCount > (points[peakIndex]?.followerCount ?? 0)) peakIndex = index;
    if (index === 0) return;
    const previous = points[index - 1];
    if (!previous) return;
    const change = point.followerCount - previous.followerCount;
    if (change > biggestGain) {
      biggestGain = change;
      biggestGainIndex = index;
    }
    if (change < biggestLoss) {
      biggestLoss = change;
      biggestLossIndex = index;
    }
  });

  const peak = points[peakIndex];
  return {
    peakIndex,
    biggestGainIndex,
    biggestLossIndex,
    peakLabel: peak ? `${formatCount(peak.followerCount)} on ${formatDate(peak.takenAt)}` : 'No peak yet',
    gainLabel: biggestGain > 0 ? `${formatChange(biggestGain)} on ${formatDate(points[biggestGainIndex]!.takenAt)}` : 'No gain event yet',
    lossLabel: biggestLoss < 0 ? `${formatChange(biggestLoss)} on ${formatDate(points[biggestLossIndex]!.takenAt)}` : 'No loss event yet',
  };
}
