import { useState } from 'react';
import { useFetch, SectionShell, timeAgo } from './shared';
import { WarningIcon } from '../WarningIcon';

const AE_COLORS: Record<string, string> = {
  gi: 'var(--color-error)', body: 'var(--color-tertiary)', fatigue: 'var(--color-on-surface-variant)', cardiac: '#ef4444', psych: 'var(--color-primary)',
};

export function AdverseEvents({ days }: { days: number }) {
  const { data, loading, error } = useFetch<any[]>(`/api/intel/adverse-events?days=${days}`, [days]);
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <SectionShell title="Adverse Event Signal Monitor" subtitle="Keyword-matched safety signals aggregated by category and drug. Click a card to see top verbatims." loading={loading} error={error}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data || []).map(cat => {
          const isOpen = openId === cat.id;
          return (
            <div key={cat.id} className={`analytical-border rounded overflow-hidden cursor-pointer transition-colors ${isOpen ? 'bg-surface-container' : 'bg-surface-container-low hover:bg-surface-container'}`} onClick={() => setOpenId(isOpen ? null : cat.id)}>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-label-caps text-on-surface-variant">{cat.label.toUpperCase()}</span>
                  {cat.total > 0 && <span style={{ color: AE_COLORS[cat.id] }}><WarningIcon className="w-4 h-4" /></span>}
                </div>
                <div className="text-data-mono text-headline-md mb-1" style={{ color: cat.total > 0 ? AE_COLORS[cat.id] : 'var(--color-on-surface-variant)' }}>{cat.total.toLocaleString()}</div>
                <div className="text-[10px] text-on-surface-variant mb-3">mentions in window</div>
                {cat.byDrug?.length > 0 && (
                  <div className="space-y-1.5">
                    {cat.byDrug.slice(0, 3).map((d: any) => (
                      <div key={d.drug} className="flex items-center gap-2">
                        <span className="text-[10px] text-on-surface-variant w-20 truncate">{d.drug}</span>
                        <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.round((d.count / (cat.byDrug[0]?.count || 1)) * 100)}%`, background: AE_COLORS[cat.id] }} />
                        </div>
                        <span className="text-[10px] text-data-mono text-on-surface-variant w-6 text-right">{d.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isOpen && cat.verbatims?.length > 0 && (
                <div className="border-t border-outline-variant px-5 pb-5 pt-4 space-y-3">
                  <span className="text-label-caps text-on-surface-variant">TOP VERBATIMS</span>
                  {cat.verbatims.map((v: any) => (
                    <div key={v.id} className="bg-surface-container-highest rounded p-3">
                      <div className="flex gap-2 mb-2">
                        <span className="text-[10px] text-primary">{v.drug}</span>
                        <span className="text-[10px] text-outline ml-auto">{timeAgo(v.post_ts || v.timestamp)}</span>
                      </div>
                      <p className="text-body-sm text-on-surface leading-relaxed">"{v.text.substring(0, 200)}{v.text.length > 200 ? '…' : ''}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
