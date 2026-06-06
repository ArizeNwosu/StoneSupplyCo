'use client';

import { useEffect, useRef } from 'react';
import type { Chart as ChartType } from 'chart.js';
import { formatDate, formatCount } from '@/lib/format';

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

  useEffect(() => {
    if (!canvasRef.current || snapshots.length === 0) return;

    // Dynamic import — Chart.js never blocks SSR
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: snapshots.map((s) => formatDate(s.takenAt)),
          datasets: [
            {
              label: `@${handle} followers`,
              data: snapshots.map((s) => s.followerCount),
              borderColor: '#0f766e',
              backgroundColor: 'rgba(20,184,166,0.14)',
              fill: true,
              tension: 0.4,
              pointRadius: snapshots.length > 60 ? 0 : 3,
              pointHoverRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  ` ${formatCount(ctx.parsed.y ?? 0)} followers`,
              },
            },
          },
          scales: {
            y: {
              ticks: {
                callback: (v) => formatCount(Number(v)),
              },
              grid: { color: 'rgba(15,23,42,0.06)' },
            },
            x: {
              grid: { display: false },
              ticks: { maxTicksLimit: 8 },
            },
          },
        },
      });
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [snapshots, handle]);

  if (snapshots.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-400">
        No snapshot data yet — check back after the first daily sync.
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
