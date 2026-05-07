import { Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useFetch, SectionShell, DRUG_COLORS } from './shared';

interface TrendTopic { tag: string; total: number; series: { week: string; count: number }[]; isAccelerating: boolean; avgGrowthPct: number; currentWeekCount: number; projectedPeakWeeks: number | null; }
interface TrendData   { topics: TrendTopic[]; drugTrends: { drug: string; series: { week: string; count: number }[] }[]; weeks: string[]; }

function formatWeek(iso: string) { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()}`; }

export function TrendForecast({ days }: { days: number }) {
  const weeks = days === 0 ? 52 : Math.max(4, Math.ceil(days / 7));
  const { data, loading, error } = useFetch<TrendData>(`/api/intel/trends?weeks=${weeks}`, [weeks]);
  const accelerating = (data?.topics || []).filter(t => t.isAccelerating);
  return (
    <SectionShell title="Trend Forecasting" subtitle="Week-over-week topic growth with acceleration detection. ⚡ = 3+ consecutive weeks of growth." loading={loading} error={error}>
      {accelerating.length > 0 && (
        <div className="analytical-border border-primary/30 bg-primary/5 p-5 rounded mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-label-caps text-primary">ACCELERATING TOPICS</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {accelerating.map(t => (
              <div key={t.tag} className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded">
                <span className="text-body-sm text-on-surface font-medium">{t.tag}</span>
                <span className="text-[10px] text-success font-bold">+{t.avgGrowthPct}%/wk</span>
                {t.projectedPeakWeeks && t.projectedPeakWeeks < 10 && <span className="text-[10px] text-on-surface-variant">peak ~{t.projectedPeakWeeks}w</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="analytical-border bg-surface-container-low p-6 rounded mb-6">
        <h3 className="text-label-caps text-on-surface-variant mb-4">DRUG DISCUSSION VOLUME BY WEEK</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <XAxis dataKey="week" tickFormatter={formatWeek} stroke="var(--color-on-surface-variant)" fontSize={9} tickLine={false} />
              <YAxis stroke="var(--color-on-surface-variant)" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline)', borderRadius: '0.5rem', fontSize: '11px' }} labelFormatter={(l: string) => `Week of ${l}`} />
              {(data?.drugTrends || []).map(dt => (
                <Line key={dt.drug} data={dt.series} dataKey="count" name={dt.drug} stroke={DRUG_COLORS[dt.drug] || '#888'} strokeWidth={2} dot={false} type="monotone" />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="analytical-border bg-surface-container-low rounded overflow-hidden">
        <div className="px-6 py-3 bg-surface-container-high border-b border-outline-variant">
          <h3 className="text-label-caps text-on-surface-variant">TOP TOPIC TRENDS</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {(data?.topics || []).slice(0, 12).map(t => (
            <div key={t.tag} className="px-6 py-3 flex items-center gap-4">
              <div className="flex items-center gap-2 w-40 shrink-0">
                {t.isAccelerating && <Zap className="w-3.5 h-3.5 text-primary shrink-0" />}
                <span className="text-body-sm text-on-surface font-medium truncate">{t.tag}</span>
              </div>
              <div className="flex-1 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={t.series.slice(-8)}>
                    <Line dataKey="count" stroke={t.isAccelerating ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'} strokeWidth={1.5} dot={false} type="monotone" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-3 shrink-0 text-[10px]">
                <span className={`font-bold ${t.avgGrowthPct > 0 ? 'text-success' : 'text-error'}`}>{t.avgGrowthPct > 0 ? '+' : ''}{t.avgGrowthPct}%/wk</span>
                <span className="text-on-surface-variant">{t.total} total</span>
              </div>
            </div>
          ))}
          {(data?.topics || []).length === 0 && (
            <div className="px-6 py-8 text-center text-body-sm text-on-surface-variant">Not enough data for trend analysis. Try a longer window (90D or ALL).</div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
