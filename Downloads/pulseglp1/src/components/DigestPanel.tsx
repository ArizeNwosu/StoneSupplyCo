import { useState, useEffect } from 'react';
import { X, Mail, RefreshCw } from 'lucide-react';
import { WarningIcon } from './WarningIcon';

interface DigestData {
  topInsights:    { title: string; description?: string }[];
  emergingTopics: { topic: string }[];
  sentimentShifts: { drug: string; shift: number; recentPct: number; priorPct: number }[];
  riskAlerts:     { drug: string; riskPct: number; riskCount: number }[];
  dbTotal:        number;
  generatedAt:    number;
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function DigestPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [digest, setDigest]         = useState<DigestData | null>(null);
  const [loading, setLoading]       = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/digest/latest')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setDigest(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open]);

  const generate = () => {
    setGenerating(true);
    fetch('/api/digest/generate', { method: 'POST' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setDigest(d); setGenerating(false); })
      .catch(() => setGenerating(false));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div
        className="absolute top-16 right-4 w-full max-w-md rounded-lg analytical-border shadow-2xl overflow-y-auto max-h-[80vh]"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant sticky top-0" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-label-caps text-on-surface">WEEKLY INTELLIGENCE DIGEST</span>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <p className="text-center py-8 text-body-sm text-on-surface-variant">Loading digest…</p>
          ) : !digest ? (
            <div className="text-center py-8">
              <p className="text-body-sm text-on-surface-variant mb-4">No digest generated yet.</p>
              <button
                onClick={generate}
                disabled={generating}
                className="px-4 py-2 bg-primary text-on-primary rounded text-label-caps cursor-pointer disabled:opacity-60"
              >
                {generating ? 'Generating…' : 'GENERATE NOW'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Meta */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-on-surface-variant">Generated {fmtDate(digest.generatedAt)}</span>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="flex items-center gap-1 text-[10px] text-primary cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className="w-3 h-3" />
                  {generating ? 'Generating…' : 'Refresh'}
                </button>
              </div>
              <div className="text-[10px] text-on-surface-variant">
                Corpus: {digest.dbTotal.toLocaleString()} posts &amp; comments
              </div>

              {/* Top Insights */}
              {digest.topInsights.length > 0 && (
                <div>
                  <h3 className="text-label-caps text-on-surface mb-3">TOP INSIGHTS THIS WEEK</h3>
                  <div className="space-y-2">
                    {digest.topInsights.slice(0, 3).map((ins, i) => (
                      <div key={i} className="bg-surface-container-high rounded p-3">
                        <p className="text-body-sm font-medium text-on-surface">{ins.title}</p>
                        {ins.description && (
                          <p className="text-[10px] text-on-surface-variant mt-1">{ins.description.substring(0, 120)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment Shifts */}
              {digest.sentimentShifts.length > 0 && (
                <div>
                  <h3 className="text-label-caps text-on-surface mb-3">SENTIMENT SHIFTS</h3>
                  <div className="space-y-2">
                    {digest.sentimentShifts.slice(0, 5).map(d => (
                      <div key={d.drug} className="flex items-center gap-3">
                        <span className="text-body-sm text-on-surface w-24 shrink-0">{d.drug}</span>
                        <span className={`text-data-mono text-[11px] ${d.shift > 0 ? 'text-success' : 'text-error'}`}>
                          {d.shift > 0 ? '+' : ''}{d.shift}pp
                        </span>
                        <span className="text-[10px] text-on-surface-variant">{d.recentPct}% positive this week</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Spikes */}
              {digest.riskAlerts.length > 0 && (
                <div>
                  <h3 className="text-label-caps text-error mb-3">RISK SPIKES</h3>
                  <div className="space-y-2">
                    {digest.riskAlerts.map(r => (
                      <div key={r.drug} className="flex items-center gap-2">
                        <WarningIcon className="w-3.5 h-3.5 text-error shrink-0" />
                        <span className="text-body-sm text-on-surface">{r.drug}</span>
                        <span className="text-data-mono text-error text-[11px]">{r.riskPct}% risk alerts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emerging Topics */}
              {digest.emergingTopics.length > 0 && (
                <div>
                  <h3 className="text-label-caps text-on-surface mb-3">EMERGING TOPICS</h3>
                  <div className="flex flex-wrap gap-2">
                    {digest.emergingTopics.slice(0, 8).map((t, i) => (
                      <span key={i} className="text-[10px] bg-surface-container-high px-2 py-1 rounded text-on-surface">{t.topic}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
