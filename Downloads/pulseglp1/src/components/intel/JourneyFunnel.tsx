import { useFetch, SectionShell, timeAgo } from './shared';
import { WarningIcon } from '../WarningIcon';

const STAGE_ORDER = ['Starting', 'Titration', 'Maintenance', 'Off-Ramp'];

export function JourneyFunnel({ days }: { days: number }) {
  const { data, loading, error } = useFetch<{ stages: any[]; byDrug: any[]; offRamp: any[] }>(`/api/intel/funnel?days=${days}`, [days]);
  const total = (data?.stages || []).reduce((s, r) => s + r.count, 0);
  const drugMap: Record<string, Record<string, number>> = {};
  (data?.byDrug || []).forEach((r: any) => { if (!drugMap[r.drug]) drugMap[r.drug] = {}; drugMap[r.drug][r.stage] = r.count; });
  const drugs = Object.keys(drugMap);
  return (
    <SectionShell title="Patient Journey Funnel" subtitle="Distribution across treatment stages — where patients are, and why they exit." loading={loading} error={error}>
      <div className="analytical-border bg-surface-container-low p-6 rounded mb-6">
        <div className="space-y-3">
          {(data?.stages || []).map((s, i) => {
            const pct = total > 0 ? (s.count / total) * 100 : 0;
            const colors = ['var(--color-primary)', 'var(--color-tertiary)', 'var(--color-success)', 'var(--color-error)'];
            return (
              <div key={s.stage} className="flex items-center gap-4">
                <span className="text-body-sm text-on-surface w-24 shrink-0">{s.stage}</span>
                <div className="flex-1 h-8 bg-surface-container-highest rounded overflow-hidden">
                  <div className="h-full flex items-center px-3 rounded transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: colors[i] }}>
                    <span className="text-[10px] font-bold text-white whitespace-nowrap">{s.count.toLocaleString()}</span>
                  </div>
                </div>
                <span className="text-data-mono text-on-surface-variant w-10 text-right text-[11px]">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>
      {drugs.length > 0 && (
        <div className="analytical-border bg-surface-container-low rounded overflow-hidden mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="px-4 py-3 text-label-caps text-on-surface-variant">DRUG</th>
                {STAGE_ORDER.map(s => <th key={s} className="px-4 py-3 text-label-caps text-on-surface-variant text-right">{s.toUpperCase()}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {drugs.map(drug => (
                <tr key={drug} className="hover:bg-surface-container transition-colors">
                  <td className="px-4 py-3 text-body-sm font-medium text-on-surface">{drug}</td>
                  {STAGE_ORDER.map(stage => <td key={stage} className="px-4 py-3 text-data-mono text-right text-on-surface">{(drugMap[drug][stage] || 0).toLocaleString()}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(data?.offRamp || []).length > 0 && (
        <div className="analytical-border bg-surface-container-low p-6 rounded">
          <h3 className="text-label-caps text-on-surface-variant mb-4">WHY PATIENTS EXIT — OFF-RAMP VERBATIMS</h3>
          <div className="space-y-3">
            {data!.offRamp.map(v => (
              <div key={v.id} className="bg-surface-container-highest rounded p-4">
                <div className="flex gap-2 items-center mb-2 flex-wrap">
                  <span className="text-label-caps px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded">{v.drug}</span>
                  {v.sentiment === 'Risk-Alert' && <WarningIcon className="w-3.5 h-3.5 text-error" />}
                  <span className="text-data-mono text-outline ml-auto">{timeAgo(v.timestamp)}</span>
                </div>
                <p className="text-body-sm text-on-surface leading-relaxed">"{v.text.substring(0, 300)}{v.text.length > 300 ? '…' : ''}"</p>
                {v.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {v.tags.map((t: string) => <span key={t} className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionShell>
  );
}
