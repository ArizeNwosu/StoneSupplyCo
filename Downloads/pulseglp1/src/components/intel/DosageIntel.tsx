import { useFetch, SectionShell, DRUG_COLORS } from './shared';

interface DosageRow { drug: string; dose: string; total: number; positivePct: number; riskPct: number; }

export function DosageIntel({ days }: { days: number }) {
  const { data, loading, error } = useFetch<DosageRow[]>(`/api/intel/dosage?days=${days}`, [days]);
  const byDrug: Record<string, DosageRow[]> = {};
  (data || []).forEach(r => { if (!byDrug[r.drug]) byDrug[r.drug] = []; byDrug[r.drug].push(r); });
  return (
    <SectionShell title="Dosage-Level Intelligence" subtitle="Sentiment breakdown per dose — extracted from mg values mentioned in posts and comments." loading={loading} error={error}>
      {Object.keys(byDrug).length === 0 && (
        <div className="text-center py-8 text-on-surface-variant text-body-sm analytical-border rounded bg-surface-container-low">
          No dosage mentions found in this window. Try a longer window or wait for more posts.
        </div>
      )}
      <div className="space-y-8">
        {Object.entries(byDrug).map(([drug, doses]) => {
          const color = DRUG_COLORS[drug] || 'var(--color-primary)';
          return (
            <div key={drug} className="analytical-border bg-surface-container-low rounded overflow-hidden">
              <div className="px-6 py-3 border-b border-outline-variant flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <h3 className="text-label-caps text-on-surface">{drug}</h3>
              </div>
              <div className="divide-y divide-outline-variant">
                {doses.map(d => (
                  <div key={d.dose} className="px-6 py-3 flex items-center gap-4">
                    <span className="text-data-mono text-on-surface w-16 shrink-0">{d.dose}</span>
                    <div className="flex-1 h-3 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div style={{ width: `${d.positivePct}%`, backgroundColor: 'var(--color-primary)' }} />
                        <div style={{ width: `${Math.max(0, 100 - d.positivePct - d.riskPct)}%`, backgroundColor: 'var(--color-on-surface-variant)', opacity: 0.25 }} />
                        <div style={{ width: `${d.riskPct}%`, backgroundColor: 'var(--color-error)' }} />
                      </div>
                    </div>
                    <div className="flex gap-3 text-[10px] shrink-0">
                      <span style={{ color: 'var(--color-primary)' }}>{d.positivePct}%+</span>
                      <span className="text-error">{d.riskPct}%⚠</span>
                      <span className="text-on-surface-variant">{d.total} posts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
