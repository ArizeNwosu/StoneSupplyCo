// components/ProofCardChart.tsx
import type { WeightEntry } from '@/types'

interface Props {
  entries: WeightEntry[]
  unit: string
  width: number    // e.g. 960 (viewBox width minus margins)
  height: number   // e.g. 280
}

export function ProofCardChart({ entries, unit, width, height }: Props) {
  if (entries.length < 2) return null

  const weights = entries.map(e => e.weight)
  const minW = Math.min(...weights) - 5
  const maxW = Math.max(...weights) + 5
  const range = maxW - minW

  const PAD_LEFT = 70
  const PAD_BOTTOM = 30
  const chartW = width - PAD_LEFT
  const chartH = height - PAD_BOTTOM

  function toX(i: number) {
    return PAD_LEFT + (i / (entries.length - 1)) * chartW
  }

  function toY(w: number) {
    return ((maxW - w) / range) * chartH
  }

  // Build smooth SVG path
  const points = entries.map((e, i) => ({ x: toX(i), y: toY(e.weight) }))

  function buildPath(pts: { x: number; y: number }[]) {
    return pts.reduce((path, pt, i) => {
      if (i === 0) return `M${pt.x},${pt.y}`
      const prev = pts[i - 1]
      const cpX = (prev.x + pt.x) / 2
      return `${path} C${cpX},${prev.y} ${cpX},${pt.y} ${pt.x},${pt.y}`
    }, '')
  }

  const linePath = buildPath(points)
  const areaPath = `${linePath} L${points[points.length - 1].x},${chartH} L${PAD_LEFT},${chartH} Z`

  // Y-axis tick values
  const yTicks = Array.from({ length: 5 }, (_, i) =>
    Math.round(maxW - (i / 4) * range)
  )

  // X-axis: evenly spaced day labels
  const totalDays = calcDays(entries[0].date, entries[entries.length - 1].date)
  const xTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0].map(t => ({
    label: `DAY ${Math.round(t * totalDays) || 1}`,
    x: PAD_LEFT + t * chartW,
  }))

  // Annotations (entries with a note)
  const annotated = entries
    .map((e, i) => ({ ...e, x: toX(i), y: toY(e.weight) }))
    .filter(e => e.note)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8e6d4" stopOpacity={0.7} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Y-axis label */}
      <text
        transform={`rotate(-90)`}
        x={-(chartH / 2)}
        y={14}
        textAnchor="middle"
        fontSize={15}
        fontWeight={800}
        letterSpacing={2}
        fill="#a0b0a8"
      >
        {unit.toUpperCase()}
      </text>

      {/* Grid lines + Y labels */}
      {yTicks.map((tick, i) => {
        const y = (i / (yTicks.length - 1)) * chartH
        return (
          <g key={String(tick)}>
            <line x1={PAD_LEFT} y1={y} x2={width} y2={y} stroke="#eef1ee" strokeWidth={1.5} />
            <text x={PAD_LEFT - 8} y={y + 5} textAnchor="end" fontSize={15} fill="#a0b0a8">
              {tick}
            </text>
          </g>
        )
      })}

      {/* Axes */}
      <line x1={PAD_LEFT} y1={0} x2={PAD_LEFT} y2={chartH} stroke="#d0d8d4" strokeWidth={1.5} />
      <line x1={PAD_LEFT} y1={chartH} x2={width} y2={chartH} stroke="#d0d8d4" strokeWidth={1.5} />

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#23624d" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Annotations */}
      {annotated.map((e, i) => (
        <g key={i}>
          <circle cx={e.x} cy={e.y} r={9} fill="white" stroke="#23624d" strokeWidth={4} />
          <line x1={e.x} y1={e.y - 10} x2={e.x} y2={e.y - 40} stroke="#23624d" strokeDasharray="5 4" strokeWidth={1.5} />
          <rect
            x={e.x - 60}
            y={e.y - 78}
            width={120}
            height={36}
            rx={10}
            fill="#e6f1ea"
            stroke="#c0dac8"
            strokeWidth={1}
          />
          <text x={e.x} y={e.y - 58} textAnchor="middle" fontSize={15} fontWeight={700} fill="#23624d">
            {e.note}
          </text>
        </g>
      ))}

      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={11}
        fill="white"
        stroke="#23624d"
        strokeWidth={5}
      />

      {/* X labels */}
      {xTicks.map(tick => (
        <text key={tick.label} x={tick.x} y={height - 2} textAnchor="middle" fontSize={15} fill="#a0b0a8">
          {tick.label}
        </text>
      ))}
    </svg>
  )
}

function calcDays(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  return Math.round((end - start) / (1000 * 60 * 60 * 24))
}
