import { useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { useFetch, SectionShell, DRUG_COLORS, timeAgo } from './shared';
import { WarningIcon } from '../WarningIcon';

interface HCPData { hcpPosts: any[]; totalHcp: number; totalPatient: number; hcpPct: number; hcpSentiments: Record<string, number>; byDrug: { drug: string; count: number }[]; }

export function HCPSignals({ days }: { days: number }) {
  const { data, loading, error } = useFetch<HCPData>(`/api/intel/hcp?days=${days}`, [days]);
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <SectionShell title="HCP Signal Separation" subtitle="Posts likely authored by healthcare professionals — detected via clinical language patterns. HCP sentiment is 10x more valuable." loading={loading} error={error}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="analytical-border bg-surface-container-low p-4 rounded">
          <div className="text-label-caps text-on-surface-variant mb-1">HCP POSTS</div>
          <div className="text-headline-md text-on-surface text-data-mono">{(data?.totalHcp || 0).toLocaleString()}</div>
        </div>
        <div className="analytical-border bg-surface-container-low p-4 rounded">
          <div className="text-label-caps text-on-surface-variant mb-1">HCP RATE</div>
          <div className="text-headline-md text-primary text-data-mono">{data?.hcpPct || 0}%</div>
        </div>
        <div className="analytical-border bg-surface-container-low p-4 rounded">
          <div className="text-label-caps text-on-surface-variant mb-1">HCP POSITIVE</div>
          <div className="text-headline-md text-success text-data-mono">{data?.totalHcp ? Math.round(((data.hcpSentiments?.['Positive'] || 0) / data.totalHcp) * 100) : 0}%</div>
        </div>
        <div className="analytical-border bg-surface-container-low p-4 rounded">
          <div className="text-label-caps text-on-surface-variant mb-1">HCP RISK ALERTS</div>
          <div className="text-headline-md text-error text-data-mono">{data?.hcpSentiments?.['Risk-Alert'] || 0}</div>
        </div>
      </div>
      {(data?.byDrug || []).length > 0 && (
        <div className="analytical-border bg-surface-container-low p-5 rounded mb-6">
          <h3 className="text-label-caps text-on-surface-variant mb-4">HCP DISCUSSION BY DRUG</h3>
          <div className="space-y-2">
            {data!.byDrug.map(d => {
              const max = data!.byDrug[0]?.count || 1;
              return (
                <div key={d.drug} className="flex items-center gap-3">
                  <span className="text-body-sm text-on-surface w-24 shrink-0">{d.drug}</span>
                  <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((d.count / max) * 100)}%`, background: DRUG_COLORS[d.drug] || 'var(--color-primary)' }} />
                  </div>
                  <span className="text-data-mono text-on-surface-variant text-[11px] w-8 text-right">{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="analytical-border bg-surface-container-low rounded overflow-hidden">
        <div className="px-6 py-3 bg-surface-container-high border-b border-outline-variant">
          <h3 className="text-label-caps text-on-surface-variant">LIKELY HCP POSTS</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {(data?.hcpPosts || []).slice(0, 10).map((p: any) => {
            const isOpen = openId === p.id;
            return (
              <div key={p.id} className="cursor-pointer hover:bg-surface-container transition-colors" onClick={() => setOpenId(isOpen ? null : p.id)}>
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[10px] text-primary font-medium">{p.drug || 'General'}</span>
                    {p.sentiment === 'Risk-Alert' && <WarningIcon className="w-3.5 h-3.5 text-error" />}
                    <span className="text-[10px] text-outline ml-auto">{timeAgo(p.post_ts)}</span>
                  </div>
                  <p className="text-body-sm text-on-surface leading-relaxed">{p.text.substring(0, 180)}{p.text.length > 180 ? '…' : ''}</p>
                  {isOpen && (
                    <div className="mt-3">
                      <p className="text-body-sm text-on-surface leading-relaxed mb-3">"{p.text.substring(0, 500)}{p.text.length > 500 ? '…' : ''}"</p>
                      <div className="flex gap-1 flex-wrap mb-2">
                        {(p.hcpSignals || []).map((s: string) => <span key={s} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">{s}</span>)}
                      </div>
                      {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline" onClick={e => e.stopPropagation()}>VIEW ON REDDIT</a>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {(data?.hcpPosts || []).length === 0 && (
            <div className="px-6 py-8 text-center text-body-sm text-on-surface-variant">No HCP posts detected in this window.</div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
