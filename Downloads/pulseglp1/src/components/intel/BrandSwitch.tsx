import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useFetch, SectionShell, DRUG_COLORS } from './shared';

interface SwitchFlow { from: string; to: string; count: number; verbatims: string[]; }
interface NetRanking { drug: string; netFlow: number; }
interface SwitchData  { flows: SwitchFlow[]; netRanking: NetRanking[]; }

export function BrandSwitch({ days }: { days: number }) {
  const { data, loading, error } = useFetch<SwitchData>(`/api/intel/switches?days=${days}`, [days]);
  const [openFlow, setOpenFlow] = useState<string | null>(null);
  const winner = data?.netRanking?.[0];
  const loser  = data?.netRanking?.slice(-1)[0];
  return (
    <SectionShell title="Brand Switch Intelligence" subtitle="Detected switching intent: who patients are leaving, who they're moving to, and why." loading={loading} error={error}>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {winner && winner.netFlow > 0 && (
          <div className="analytical-border bg-surface-container-low p-5 rounded">
            <div className="text-label-caps text-success mb-2">NET WINNER</div>
            <div className="text-headline-md font-bold text-on-surface">{winner.drug}</div>
            <div className="text-data-mono text-success mt-1">+{winner.netFlow} net mentions</div>
          </div>
        )}
        {loser && loser.netFlow < 0 && (
          <div className="analytical-border bg-surface-container-low p-5 rounded">
            <div className="text-label-caps text-error mb-2">NET LOSER</div>
            <div className="text-headline-md font-bold text-on-surface">{loser.drug}</div>
            <div className="text-data-mono text-error mt-1">{loser.netFlow} net mentions</div>
          </div>
        )}
      </div>
      <div className="analytical-border bg-surface-container-low p-6 rounded mb-8">
        <h3 className="text-label-caps text-on-surface-variant mb-4">NET PATIENT FLOW (inflow − outflow)</h3>
        <div className="space-y-2">
          {(data?.netRanking || []).map(r => {
            const max = Math.max(...(data?.netRanking || []).map(x => Math.abs(x.netFlow)), 1);
            const pct = (Math.abs(r.netFlow) / max) * 100;
            const positive = r.netFlow >= 0;
            return (
              <div key={r.drug} className="flex items-center gap-3">
                <span className="text-body-sm text-on-surface w-24 shrink-0">{r.drug}</span>
                <div className="flex-1 h-6 flex items-center">
                  <div className="h-full rounded" style={{ width: `${Math.max(pct, 2)}%`, minWidth: '4px', backgroundColor: positive ? (DRUG_COLORS[r.drug] || 'var(--color-primary)') : 'var(--color-error)' }} />
                </div>
                <span className={`text-data-mono w-12 text-right text-[11px] ${positive ? 'text-success' : 'text-error'}`}>
                  {positive ? '+' : ''}{r.netFlow}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="analytical-border bg-surface-container-low rounded overflow-hidden">
        <div className="px-6 py-3 bg-surface-container-high border-b border-outline-variant">
          <h3 className="text-label-caps text-on-surface-variant">DETECTED SWITCH FLOWS</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {(data?.flows || []).slice(0, 12).map(f => {
            const key = `${f.from}-${f.to}`;
            const isOpen = openFlow === key;
            return (
              <div key={key} className="cursor-pointer hover:bg-surface-container transition-colors" onClick={() => setOpenFlow(isOpen ? null : key)}>
                <div className="flex items-center gap-3 px-6 py-3">
                  <span className="text-body-sm font-medium text-on-surface w-24">{f.from}</span>
                  <ArrowRight className="w-4 h-4 text-outline shrink-0" />
                  <span className="text-body-sm font-medium flex-1" style={{ color: DRUG_COLORS[f.to] || 'var(--color-primary)' }}>{f.to}</span>
                  <span className="text-data-mono text-on-surface-variant">{f.count} mentions</span>
                </div>
                {isOpen && f.verbatims.length > 0 && (
                  <div className="px-6 pb-4 space-y-2 bg-surface-container">
                    <span className="text-label-caps text-on-surface-variant">VERBATIMS</span>
                    {f.verbatims.map((v, vi) => <p key={vi} className="text-body-sm text-on-surface-variant italic">"{v}"</p>)}
                  </div>
                )}
              </div>
            );
          })}
          {(data?.flows || []).length === 0 && (
            <div className="px-6 py-8 text-center text-body-sm text-on-surface-variant">No switch co-mentions detected in this window. Try a longer window.</div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
