import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { ArrowRight } from 'lucide-react';
import { useFetch, SectionShell, DRUG_COLORS } from './shared';

export function DrugCompare({ days }: { days: number }) {
  const { data, loading, error } = useFetch<{ drugs: any[]; switches: any[] }>(
    `/api/intel/compare?days=${days}`, [days]
  );
  const chartData = (data?.drugs || []).map(d => ({
    name: d.drug, Positive: d.positive, 'Risk-Alert': d.risk_alert, 'Neutral-Low': d.neutral, Analytical: d.analytical,
  }));
  return (
    <SectionShell title="Drug vs Drug Competitive Benchmark" subtitle="Sentiment breakdown, volume, and brand-switch flow across all 5 drugs." loading={loading} error={error}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {(data?.drugs || []).map(d => {
          const sentimentScore = d.total > 0 ? Math.round((d.positive / d.total) * 100) : 0;
          const riskPct        = d.total > 0 ? Math.round((d.risk_alert / d.total) * 100) : 0;
          return (
            <div key={d.drug} className="analytical-border bg-surface-container-low p-4 rounded flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <span className="text-body-base font-semibold text-on-surface">{d.drug}</span>
                <span className="text-data-mono text-outline text-[10px]">{d.total.toLocaleString()}</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${sentimentScore}%`, background: DRUG_COLORS[d.drug] || 'var(--color-primary)' }} />
              </div>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: DRUG_COLORS[d.drug] }}>{sentimentScore}% positive</span>
                <span className="text-error">{riskPct}% risk</span>
              </div>
              <div className="text-[10px] text-on-surface-variant border-t border-outline-variant/30 pt-2">
                {d.posts.toLocaleString()} posts · {d.comments.toLocaleString()} comments
              </div>
            </div>
          );
        })}
      </div>
      <div className="analytical-border bg-surface-container-low p-6 rounded mb-8">
        <h3 className="text-label-caps text-on-surface-variant mb-4">SENTIMENT DISTRIBUTION BY DRUG</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-on-surface-variant)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-on-surface-variant)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline)', borderRadius: '0.5rem' }} itemStyle={{ color: 'var(--color-on-surface)' }} labelStyle={{ color: 'var(--color-on-surface-variant)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Positive"    stackId="s" fill="var(--color-primary)"           radius={[0,0,0,0]} />
              <Bar dataKey="Neutral-Low" stackId="s" fill="var(--color-on-surface-variant)" opacity={0.4} />
              <Bar dataKey="Analytical"  stackId="s" fill="var(--color-tertiary)"           opacity={0.6} />
              <Bar dataKey="Risk-Alert"  stackId="s" fill="var(--color-error)"              radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {(data?.switches || []).length > 0 && (
        <div className="analytical-border bg-surface-container-low p-6 rounded">
          <h3 className="text-label-caps text-on-surface-variant mb-4">BRAND SWITCH FLOW (co-mentions with switch intent)</h3>
          <div className="space-y-2">
            {data!.switches.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-outline-variant/30 last:border-0">
                <span className="text-body-sm font-medium text-on-surface w-28">{s.from}</span>
                <ArrowRight className="w-4 h-4 text-outline shrink-0" />
                <span className="text-body-sm font-medium text-primary flex-1">{s.to}</span>
                <span className="text-data-mono text-on-surface-variant">{s.count} mentions</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionShell>
  );
}
