'use client';

import { useEffect, useRef, useState } from 'react';
import type { FollowerHistoryResponse } from '@/app/api/exports/history/route';

interface Props {
  handle: string | null;
}

export function FollowerHistoryChart({ handle }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<import('chart.js').Chart | null>(null);
  const [data, setData] = useState<FollowerHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = handle
      ? `/api/exports/history?handle=${encodeURIComponent(handle)}`
      : '/api/exports/history';
    void fetch(url)
      .then((r) => r.json())
      .then((d) => setData(d as FollowerHistoryResponse))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [handle]);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const { joinTrend, uploadSnapshots } = data;
    const hasUploadTrend = uploadSnapshots.filter((s) => s.followerCount !== null).length > 1;
    if (!data.hasJoinData && !hasUploadTrend) return;

    void (async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      // Destroy previous instance
      chartRef.current?.destroy();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const formatMonth = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
      };

      // Use label-indexed data (labels array drives x-axis, data[i] maps to labels[i])
      // Merge and sort all month labels first
      const allMonths = new Set<string>();
      if (data.hasJoinData) joinTrend.forEach((p) => allMonths.add(formatMonth(p.date)));
      if (hasUploadTrend) uploadSnapshots.filter((s) => s.followerCount !== null).forEach((s) => allMonths.add(formatMonth(s.date)));
      const labels = [...allMonths].sort((a, b) => new Date('1 ' + a).getTime() - new Date('1 ' + b).getTime());

      const labelIndex = new Map(labels.map((l, i) => [l, i]));

      const datasets: import('chart.js').ChartDataset<'line', (number | null)[]>[] = [];

      if (data.hasJoinData) {
        const joinData: (number | null)[] = Array(labels.length).fill(null);
        joinTrend.forEach((p) => {
          const idx = labelIndex.get(formatMonth(p.date));
          if (idx !== undefined) joinData[idx] = p.cumulative;
        });
        datasets.push({
          label: 'Follower growth (by join date)',
          data: joinData,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2,
          spanGaps: true,
        });
      }

      if (hasUploadTrend) {
        const uploadData: (number | null)[] = Array(labels.length).fill(null);
        uploadSnapshots.filter((s) => s.followerCount !== null).forEach((s) => {
          const idx = labelIndex.get(formatMonth(s.date));
          if (idx !== undefined) uploadData[idx] = s.followerCount as number;
        });
        datasets.push({
          label: 'Upload snapshots',
          data: uploadData,
          borderColor: '#0f172a',
          backgroundColor: '#0f172a',
          showLine: false,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2,
        });
      }

      chartRef.current = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: {
              display: datasets.length > 1,
              labels: { font: { size: 10, weight: 'bold' }, color: '#64748b', boxWidth: 12 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toLocaleString()}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 }, color: '#94a3b8', maxRotation: 45 },
            },
            y: {
              grid: { color: 'rgba(0,0,0,0.04)' },
              ticks: {
                font: { size: 10 },
                color: '#94a3b8',
                callback: (v) => typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v,
              },
            },
          },
        },
      });
    })();

    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [data]);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;
  }

  if (!data) return null;

  const { joinTrend, uploadSnapshots } = data;
  const hasUploadTrend = uploadSnapshots.filter((s) => s.followerCount !== null).length > 1;

  if (!data.hasJoinData && !hasUploadTrend) {
    // Single upload, no date data yet — show a prompt
    return (
      <div className="rounded-xl border border-cyan-950/10 bg-slate-50 p-4 text-center">
        <p className="text-xs font-bold text-slate-500">Follower growth history</p>
        <p className="mt-1 text-xs text-slate-400">
          {data.hasJoinData
            ? 'Upload again in a few weeks to see your trend.'
            : 'Re-upload your export to unlock the full growth timeline — follower join dates go back years.'}
        </p>
      </div>
    );
  }

  const oldestJoin = joinTrend[0]?.date;
  const newestJoin = joinTrend[joinTrend.length - 1]?.date;
  const months = joinTrend.length;

  return (
    <div className="rounded-xl border border-cyan-950/10 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Follower growth history</p>
        {data.hasJoinData && oldestJoin && newestJoin && (
          <span className="text-xs text-slate-400">
            {new Date(oldestJoin).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}
            {' → '}
            {new Date(newestJoin).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}
            {' · '}{months}mo
          </span>
        )}
      </div>
      {data.hasJoinData && !joinTrend.some((p) => p.cumulative > 0) ? null : (
        <div className="h-40">
          <canvas ref={canvasRef} />
        </div>
      )}
      {!data.hasJoinData && (
        <p className="mt-2 text-center text-xs text-slate-400">
          Re-upload your export to reconstruct the full timeline from follower join dates.
        </p>
      )}
    </div>
  );
}
