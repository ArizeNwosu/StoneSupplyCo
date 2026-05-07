import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useFetch, SectionShell, timeAgo } from './shared';

interface PayerCat { id: string; label: string; color: string; total: number; trend: number; recentWeek: number; priorWeek: number; byDrug: { drug: string; count: number }[]; verbatims: any[]; }

export function PayerIntel({ days }: { days: number }) {
  const { data, loading, error } = useFetch<PayerCat[]>(`/api/intel/payer?days=${days}`, [days]);
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <SectionShell title="Access & Payer Intelligence" subtitle="Insurance denials, cost barriers, compounding adoption, and telehealth signals — with week-over-week trends." loading={loading} error={error}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data || []).map(cat => {
          const isOpen = openId === cat.id;
          const TrendIcon = cat.trend > 10 ? TrendingUp : cat.trend < -10 ? TrendingDown : Minus;
          const trendColor = cat.trend > 10 ? 'var(--color-error)' : cat.trend < -10 ? 'var(--color-success)' : 'var(--color-on-surface-variant)';
          return (
            <div key={cat.id} className={`analytical-border rounded overflow-hidden cursor-pointer transition-colors ${isOpen ? 'bg-surface-container' : 'bg-surface-container-low hover:bg-surface-container'}`} onClick={() => setOpenId(isOpen ? null : cat.id)}>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-label-caps text-on-surface-variant">{cat.label.toUpperCase()}</span>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />
                    <span className="text-[10px] font-medium" style={{ color: trendColor }}>{cat.trend > 0 ? '+' : ''}{cat.trend}% WoW</span>
                  </div>
                </div>
                <div className="text-data-mono text-headline-md mb-1" style={{ color: cat.color }}>{cat.total.toLocaleString()}</div>
                <div className="text-[10px] text-on-surface-variant mb-3">mentions in window</div>
                {cat.byDrug?.length > 0 && (
                  <div className="space-y-1.5">
                    {cat.byDrug.slice(0, 3).map((d: any) => (
                      <div key={d.drug} className="flex items-center gap-2">
                        <span className="text-[10px] text-on-surface-variant w-20 truncate">{d.drug}</span>
                        <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.round((d.count / (cat.byDrug[0]?.count || 1)) * 100)}%`, background: cat.color }} />
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
                  {cat.verbatims.map((v: any, i: number) => (
                    <div key={i} className="bg-surface-container-highest rounded p-3">
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
