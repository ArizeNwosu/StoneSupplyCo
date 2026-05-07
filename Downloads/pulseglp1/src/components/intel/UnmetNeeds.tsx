import { useFetch, SectionShell, DRUG_COLORS } from './shared';

interface UnmetNeed { theme: string; description: string; frequency: 'High' | 'Medium' | 'Low'; drug: string; quote: string; }
interface UnmetNeedsData { needs: UnmetNeed[]; sampleSize: number; generatedAt: number; }

const FREQ_COLORS: Record<string, string> = {
  High: 'var(--color-error)',
  Medium: 'var(--color-tertiary)',
  Low: 'var(--color-on-surface-variant)',
};

const FREQ_BG: Record<string, string> = {
  High: 'bg-error/10',
  Medium: 'bg-tertiary/10',
  Low: 'bg-surface-container',
};

export function UnmetNeeds({ days }: { days: number }) {
  const { data, loading, error } = useFetch<UnmetNeedsData>(`/api/intel/unmet-needs?days=${days}`, [days]);

  const highNeeds = (data?.needs || []).filter(n => n.frequency === 'High');
  const restNeeds = (data?.needs || []).filter(n => n.frequency !== 'High');

  return (
    <SectionShell
      title="Unmet Needs Extractor"
      subtitle={`AI-extracted wish statements — "I wish", "why can't they", "if only". Powered by Gemini analysis of patient corpus.`}
      loading={loading}
      error={error}
    >
      {data && (
        <div className="flex items-center gap-3 mb-6 text-[11px] text-on-surface-variant">
          <span>Analyzed <span className="text-on-surface font-medium">{data.sampleSize.toLocaleString()}</span> posts</span>
          {data.generatedAt && <span>· Generated {new Date(data.generatedAt).toLocaleString()}</span>}
        </div>
      )}

      {highNeeds.length > 0 && (
        <div className="mb-6">
          <div className="text-label-caps text-error mb-3">HIGH FREQUENCY UNMET NEEDS</div>
          <div className="space-y-3">
            {highNeeds.map((need, i) => (
              <div key={i} className="analytical-border border-error/20 bg-error/5 rounded p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-body-sm font-semibold text-on-surface">{need.theme}</span>
                    {need.drug && need.drug !== 'General' && (
                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: (DRUG_COLORS[need.drug] || '#888') + '22', color: DRUG_COLORS[need.drug] || '#888' }}>{need.drug}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold shrink-0" style={{ color: FREQ_COLORS['High'] }}>HIGH</span>
                </div>
                <p className="text-body-sm text-on-surface-variant mb-3">{need.description}</p>
                {need.quote && (
                  <blockquote className="border-l-2 border-error/30 pl-3 text-[11px] text-on-surface-variant italic">"{need.quote}"</blockquote>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {restNeeds.length > 0 && (
        <div className="analytical-border bg-surface-container-low rounded overflow-hidden">
          <div className="px-6 py-3 bg-surface-container-high border-b border-outline-variant">
            <h3 className="text-label-caps text-on-surface-variant">ALL UNMET NEEDS</h3>
          </div>
          <div className="divide-y divide-outline-variant">
            {restNeeds.map((need, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-medium text-on-surface">{need.theme}</span>
                    {need.drug && need.drug !== 'General' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: (DRUG_COLORS[need.drug] || '#888') + '22', color: DRUG_COLORS[need.drug] || '#888' }}>{need.drug}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${FREQ_BG[need.frequency]}`} style={{ color: FREQ_COLORS[need.frequency] }}>{need.frequency.toUpperCase()}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mb-2">{need.description}</p>
                {need.quote && (
                  <blockquote className="border-l-2 border-outline-variant pl-3 text-[11px] text-on-surface-variant italic">"{need.quote}"</blockquote>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(data?.needs || []).length === 0 && !loading && !error && (
        <div className="text-center py-12 text-body-sm text-on-surface-variant">No unmet needs extracted yet. Try a longer time window.</div>
      )}
    </SectionShell>
  );
}
