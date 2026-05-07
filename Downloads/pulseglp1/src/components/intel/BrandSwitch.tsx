import { useState } from 'react';
import { ArrowRight, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFetch, SectionShell, DRUG_COLORS } from './shared';

interface SwitchFlow { from: string; to: string; count: number; verbatims: string[]; }
interface NetRanking { drug: string; netFlow: number; }
interface SwitchData  { flows: SwitchFlow[]; netRanking: NetRanking[]; }

// Categorise a verbatim into a switch reason
const REASON_RULES: { label: string; color: string; keywords: string[] }[] = [
  { label: 'Side Effects',   color: 'var(--color-error)',             keywords: ['nausea', 'vomit', 'sick', 'side effect', 'pancreat', 'gallbl', 'hair loss', 'muscle', 'fatigue', 'tired'] },
  { label: 'Better Results', color: 'var(--color-success)',           keywords: ['work better', 'lost more', 'more weight', 'better results', 'more effective', 'stronger'] },
  { label: 'Cost / Access',  color: 'var(--color-tertiary)',          keywords: ['cost', 'expensive', 'afford', 'insurance', 'covered', 'copay', 'prior auth', 'denied', 'out of pocket'] },
  { label: 'Supply / Stock', color: '#a855f7',                       keywords: ['shortage', 'out of stock', 'unavailable', 'backorder', 'cant find', "can't get"] },
  { label: 'Doctor Advised', color: 'var(--color-primary)',           keywords: ['doctor', 'physician', 'prescrib', 'recommended', 'suggested', 'told me to'] },
];

function inferReason(verbatims: string[]): { label: string; color: string } | null {
  const combined = verbatims.join(' ').toLowerCase();
  for (const rule of REASON_RULES) {
    if (rule.keywords.some(k => combined.includes(k))) return rule;
  }
  return null;
}

export function BrandSwitch({ days }: { days: number }) {
  const { data, loading, error } = useFetch<SwitchData>(`/api/intel/switches?days=${days}`, [days]);
  const [openFlow, setOpenFlow] = useState<string | null>(null);

  const winner = data?.netRanking?.find(r => r.netFlow > 0);
  const loser  = [...(data?.netRanking || [])].reverse().find(r => r.netFlow < 0);
  const totalMentions = (data?.flows || []).reduce((s, f) => s + f.count, 0);
  const maxCount = Math.max(...(data?.flows || []).map(f => f.count), 1);
  const maxNet = Math.max(...(data?.netRanking || []).map(r => Math.abs(r.netFlow)), 1);

  // Aggregate reason breakdown across all flows
  const reasonCounts: Record<string, number> = {};
  for (const f of data?.flows || []) {
    const reason = inferReason(f.verbatims);
    if (reason) reasonCounts[reason.label] = (reasonCounts[reason.label] || 0) + f.count;
  }
  const reasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);

  return (
    <SectionShell
      title="Brand Switch Intelligence"
      subtitle="Detected switching intent: who patients are leaving, who they're moving to, and why."
      loading={loading}
      error={error}
    >
      {/* Summary header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="analytical-border bg-surface-container-low p-4 rounded">
          <div className="text-label-caps text-on-surface-variant mb-1">SWITCH MENTIONS</div>
          <div className="text-headline-md text-on-surface text-data-mono">{totalMentions.toLocaleString()}</div>
        </div>

        {winner ? (
          <div className="analytical-border border-success/30 bg-success/5 p-4 rounded">
            <div className="flex items-center gap-1.5 text-label-caps text-success mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              NET GAINER
            </div>
            <div className="text-headline-md font-bold text-on-surface">{winner.drug}</div>
            <div className="text-data-mono text-success text-[11px] mt-0.5">+{winner.netFlow} net inflow</div>
          </div>
        ) : <div />}

        {loser ? (
          <div className="analytical-border border-error/30 bg-error/5 p-4 rounded">
            <div className="flex items-center gap-1.5 text-label-caps text-error mb-1">
              <TrendingDown className="w-3.5 h-3.5" />
              NET LOSER
            </div>
            <div className="text-headline-md font-bold text-on-surface">{loser.drug}</div>
            <div className="text-data-mono text-error text-[11px] mt-0.5">{loser.netFlow} net outflow</div>
          </div>
        ) : <div />}

        <div className="analytical-border bg-surface-container-low p-4 rounded">
          <div className="text-label-caps text-on-surface-variant mb-1">UNIQUE ROUTES</div>
          <div className="text-headline-md text-on-surface text-data-mono">{(data?.flows || []).length}</div>
        </div>
      </div>

      {/* Net flow bar chart */}
      <div className="analytical-border bg-surface-container-low p-6 rounded mb-6">
        <h3 className="text-label-caps text-on-surface-variant mb-4">NET PATIENT FLOW (inflow − outflow)</h3>
        <div className="space-y-2.5">
          {(data?.netRanking || []).map(r => {
            const pct = (Math.abs(r.netFlow) / maxNet) * 100;
            const positive = r.netFlow >= 0;
            const color = positive ? (DRUG_COLORS[r.drug] || 'var(--color-primary)') : 'var(--color-error)';
            return (
              <div key={r.drug} className="flex items-center gap-3">
                <span className="text-body-sm text-on-surface w-24 shrink-0">{r.drug}</span>
                <div className="flex-1 flex items-center h-6">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{ width: `${Math.max(pct, 1.5)}%`, minWidth: '4px', backgroundColor: color }}
                  />
                </div>
                <span className={`text-data-mono w-14 text-right text-[11px] ${positive ? 'text-success' : 'text-error'}`}>
                  {positive ? '+' : ''}{r.netFlow}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Switch flow pie chart */}
      {(data?.flows || []).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Inflow pie — who is gaining patients */}
          <div className="analytical-border bg-surface-container-low p-5 rounded">
            <h3 className="text-label-caps text-on-surface-variant mb-3">INFLOW DISTRIBUTION</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(data?.flows || []).map(f => ({ name: f.to, value: f.count }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={65}
                    paddingAngle={2}
                  >
                    {(data?.flows || []).map((f, i) => (
                      <Cell key={i} fill={DRUG_COLORS[f.to] || '#888'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline)', borderRadius: '0.5rem', fontSize: '11px' }}
                    formatter={(v: number, name: string) => [`${v} mentions`, name]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Outflow pie — who is losing patients */}
          <div className="analytical-border bg-surface-container-low p-5 rounded">
            <h3 className="text-label-caps text-on-surface-variant mb-3">OUTFLOW DISTRIBUTION</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(data?.flows || []).map(f => ({ name: f.from, value: f.count }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={65}
                    paddingAngle={2}
                  >
                    {(data?.flows || []).map((f, i) => (
                      <Cell key={i} fill={DRUG_COLORS[f.from] || '#888'} opacity={0.75} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline)', borderRadius: '0.5rem', fontSize: '11px' }}
                    formatter={(v: number, name: string) => [`${v} mentions`, name]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Why patients switch */}
      {reasons.length > 0 && (
        <div className="analytical-border bg-surface-container-low p-5 rounded mb-6">
          <h3 className="text-label-caps text-on-surface-variant mb-4">WHY PATIENTS SWITCH</h3>
          <div className="space-y-2">
            {reasons.map(([label, count]) => {
              const rule = REASON_RULES.find(r => r.label === label)!;
              const pct = Math.round((count / totalMentions) * 100);
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-body-sm text-on-surface w-32 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: rule.color }} />
                  </div>
                  <span className="text-data-mono text-[11px] text-on-surface-variant w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detected flow table */}
      <div className="analytical-border bg-surface-container-low rounded overflow-hidden">
        <div className="px-6 py-3 bg-surface-container-high border-b border-outline-variant flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-on-surface-variant" />
          <h3 className="text-label-caps text-on-surface-variant">DETECTED SWITCH FLOWS</h3>
          <span className="ml-auto text-[10px] text-on-surface-variant">Click row to see patient quotes</span>
        </div>
        <div className="divide-y divide-outline-variant">
          {(data?.flows || []).slice(0, 12).map(f => {
            const key = `${f.from}-${f.to}`;
            const isOpen = openFlow === key;
            const strength = (f.count / maxCount) * 100;
            const reason = inferReason(f.verbatims);
            return (
              <div key={key} className="cursor-pointer hover:bg-surface-container transition-colors" onClick={() => setOpenFlow(isOpen ? null : key)}>
                <div className="flex items-center gap-3 px-6 py-3">
                  {/* From */}
                  <div className="w-24 shrink-0">
                    <span className="text-body-sm font-semibold text-on-surface">{f.from}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-outline shrink-0" />
                  {/* To */}
                  <div className="w-24 shrink-0">
                    <span className="text-body-sm font-semibold" style={{ color: DRUG_COLORS[f.to] || 'var(--color-primary)' }}>{f.to}</span>
                  </div>
                  {/* Volume bar */}
                  <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden mx-2">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(strength, 4)}%`, backgroundColor: DRUG_COLORS[f.to] || 'var(--color-primary)' }} />
                  </div>
                  {/* Reason badge */}
                  {reason && (
                    <span className="text-[10px] px-2 py-0.5 rounded shrink-0 hidden sm:inline" style={{ color: reason.color, background: reason.color + '18' }}>
                      {reason.label}
                    </span>
                  )}
                  <span className="text-data-mono text-on-surface-variant text-[11px] w-16 text-right shrink-0">{f.count} mentions</span>
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-on-surface-variant shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />}
                </div>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 bg-surface-container space-y-3">
                    <div className="text-label-caps text-on-surface-variant">PATIENT VERBATIMS</div>
                    {f.verbatims.length > 0 ? f.verbatims.map((v, vi) => (
                      <blockquote key={vi} className="border-l-2 pl-3 text-body-sm text-on-surface-variant italic leading-relaxed" style={{ borderColor: DRUG_COLORS[f.to] || 'var(--color-outline)' }}>
                        "{v}"
                      </blockquote>
                    )) : (
                      <p className="text-[11px] text-on-surface-variant">No extractable verbatims — pattern matched on full post context.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {(data?.flows || []).length === 0 && (
            <div className="px-6 py-10 text-center text-body-sm text-on-surface-variant">
              No switch co-mentions detected in this window. Try a longer time window.
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
