import { formatCount, formatDate } from '@/lib/format';

interface Snapshot {
  takenAt: string | Date;
  followerCount: number;
}

interface PublicChartProps {
  snapshots: Snapshot[];
  handle: string;
}

type Point = {
  x: number;
  y: number;
  snapshot: Snapshot;
};

const VIEWBOX_WIDTH = 720;
const VIEWBOX_HEIGHT = 260;
const PADDING = {
  top: 18,
  right: 22,
  bottom: 42,
  left: 74,
};

function toPath(points: Point[]): string {
  if (points.length === 1) {
    const point = points[0]!;
    return `M ${point.x - 14} ${point.y} L ${point.x + 14} ${point.y}`;
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

function toAreaPath(points: Point[], baseline: number): string {
  if (points.length === 1) {
    const point = points[0]!;
    return `M ${point.x - 14} ${point.y} L ${point.x + 14} ${point.y} L ${point.x + 14} ${baseline} L ${point.x - 14} ${baseline} Z`;
  }

  const line = toPath(points);
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

export function PublicChart({ snapshots, handle }: PublicChartProps) {
  if (snapshots.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-400">
        No snapshot data yet - check back after the first daily sync.
      </div>
    );
  }

  const counts = snapshots.map((snapshot) => snapshot.followerCount);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const range = max - min || Math.max(Math.round(max * 0.01), 1);
  const plotWidth = VIEWBOX_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom;
  const baseline = PADDING.top + plotHeight;
  const gradientId = `public-chart-fill-${handle.replace(/[^a-z0-9]/g, '-')}`;

  const points = snapshots.map((snapshot, index) => {
    const x =
      snapshots.length === 1
        ? PADDING.left + plotWidth / 2
        : PADDING.left + (plotWidth * index) / (snapshots.length - 1);
    const normalized = (snapshot.followerCount - min) / range;
    const y = baseline - normalized * plotHeight;
    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      snapshot,
    };
  });

  const firstSnapshot = snapshots[0]!;
  const lastSnapshot = snapshots[snapshots.length - 1]!;
  const firstPoint = points[0]!;
  const lastPoint = points[points.length - 1]!;

  return (
    <div className="relative h-64 w-full">
      <svg
        aria-label={`@${handle} Instagram follower count history chart`}
        className="h-full w-full overflow-visible"
        role="img"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((tick) => {
          const y = PADDING.top + tick * plotHeight;
          const value = max - tick * range;
          return (
            <g key={tick}>
              <line
                stroke="rgba(15,23,42,0.09)"
                strokeWidth="1"
                x1={PADDING.left}
                x2={VIEWBOX_WIDTH - PADDING.right}
                y1={y}
                y2={y}
              />
              <text
                fill="#94a3b8"
                fontSize="11"
                textAnchor="end"
                x={PADDING.left - 12}
                y={y + 4}
              >
                {formatCount(Math.round(value))}
              </text>
            </g>
          );
        })}

        <path d={toAreaPath(points, baseline)} fill={`url(#${gradientId})`} />
        <path
          d={toPath(points)}
          fill="none"
          stroke="#0f766e"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />

        {points.map((point, index) => (
          <circle
            key={`${formatDate(point.snapshot.takenAt)}-${index}`}
            cx={point.x}
            cy={point.y}
            fill="#ffffff"
            r={index === points.length - 1 ? 4.5 : 3}
            stroke="#0f766e"
            strokeWidth="2"
          >
            <title>
              {formatDate(point.snapshot.takenAt)}: {formatCount(point.snapshot.followerCount)} followers
            </title>
          </circle>
        ))}

        <text fill="#64748b" fontSize="11" textAnchor="start" x={firstPoint.x} y={VIEWBOX_HEIGHT - 14}>
          {formatDate(firstSnapshot.takenAt)}
        </text>
        <text fill="#64748b" fontSize="11" textAnchor="end" x={lastPoint.x} y={VIEWBOX_HEIGHT - 14}>
          {formatDate(lastSnapshot.takenAt)}
        </text>
      </svg>
    </div>
  );
}
