import { useState } from 'react';
import { useLeads } from '../context/LeadContext';
import { X, Loader2, Sparkles, Check, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { scanForLeads } from '../services/geminiService';
import { Lead, Vertical } from '../types';

interface AILeadScannerModalProps {
  onClose: () => void;
}

type VerticalOption = Vertical | 'all';

const VERTICAL_OPTIONS: { value: VerticalOption; label: string; description: string }[] = [
  { value: 'all', label: 'All Signals', description: 'Every trigger type' },
  { value: 'awards', label: 'Awards', description: 'Awards & recognition events' },
  { value: 'events', label: 'Events', description: 'Trade shows & conferences' },
  { value: 'hiring', label: 'Hiring', description: 'Rapid headcount growth' },
  { value: 'leases', label: 'Leases', description: 'New office signings' },
];

const VERTICAL_PROMPTS: Record<Vertical, string> = {
  awards: 'companies planning annual awards ceremonies, employee recognition programs, or industry award events',
  events: 'companies sponsoring or exhibiting at upcoming trade shows, conferences, or user summits',
  hiring: 'companies with rapid hiring growth — 50+ open positions or recently announced major headcount expansion',
  leases: 'companies that recently signed new office leases, announced expansions, or are moving to new locations',
};

function buildPrompt(selectedVerticals: VerticalOption[], context: string): string {
  const allVerticals: Vertical[] = ['awards', 'events', 'hiring', 'leases'];
  const targets: Vertical[] = selectedVerticals.includes('all')
    ? allVerticals
    : (selectedVerticals as Vertical[]);

  const desc = targets.map(v => VERTICAL_PROMPTS[v]).join('; ');
  const base = `Find companies that are: ${desc}.`;
  return context.trim() ? `${base} Additional focus: ${context.trim()}` : base;
}

export default function AILeadScannerModal({ onClose }: AILeadScannerModalProps) {
  const { addLead } = useLeads();
  const [step, setStep] = useState<'setup' | 'results'>('setup');
  const [selectedVerticals, setSelectedVerticals] = useState<VerticalOption[]>(['all']);
  const [showContext, setShowContext] = useState(false);
  const [context, setContext] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<Partial<Lead>[]>([]);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  const toggleVertical = (v: VerticalOption) => {
    if (v === 'all') {
      setSelectedVerticals(['all']);
      return;
    }
    setSelectedVerticals(prev => {
      const without = prev.filter(x => x !== 'all');
      if (without.includes(v)) {
        const next = without.filter(x => x !== v);
        return next.length === 0 ? ['all'] : next;
      }
      return [...without, v];
    });
  };

  const handleScan = async () => {
    setIsScanning(true);
    setError('');
    try {
      const prompt = buildPrompt(selectedVerticals, context);
      const leads = await scanForLeads(prompt);
      setResults(leads);
      setStep('results');
    } catch {
      setError('Scan failed. Please check your Gemini API key and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddOne = async (idx: number) => {
    const lead = results[idx];
    await addLead(lead as Omit<Lead, 'id'>);
    setAddedIds(prev => new Set(prev).add(idx));
  };

  const handleAddAll = async () => {
    setIsScanning(true);
    try {
      for (let i = 0; i < results.length; i++) {
        if (!addedIds.has(i)) {
          await addLead(results[i] as Omit<Lead, 'id'>);
        }
      }
      onClose();
    } catch {
      setError('Failed to save some leads.');
      setIsScanning(false);
    }
  };

  const unadded = results.filter((_, i) => !addedIds.has(i)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75" aria-hidden="true" onClick={onClose} />

        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mr-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">AI Lead Finder</h3>
                <p className="text-xs text-gray-500">Scan the web for new prospecting signals</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 rounded-lg p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {step === 'setup' ? (
            <>
              <div className="px-6 py-5 space-y-5">
                {/* Vertical selector */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">What signals are you looking for?</p>
                  <div className="grid grid-cols-5 gap-2">
                    {VERTICAL_OPTIONS.map(opt => {
                      const active = selectedVerticals.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleVertical(opt.value)}
                          className={`flex flex-col items-center px-2 py-3 rounded-lg border text-center transition-all ${
                            active
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          {active && (
                            <span className="mb-1 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </span>
                          )}
                          {!active && <span className="mb-1 w-4 h-4 rounded-full border-2 border-gray-300" />}
                          <span className="text-xs font-medium leading-tight">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional context */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowContext(!showContext)}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showContext ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                    Add optional context
                  </button>
                  {showContext && (
                    <textarea
                      rows={3}
                      className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                      placeholder="e.g., SaaS companies in Texas, Series B+, under 500 employees"
                      value={context}
                      onChange={e => setContext(e.target.value)}
                    />
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
                )}
              </div>

              <div className="px-6 pb-6 flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={isScanning}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isScanning ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning web...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Find Leads</>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-6 py-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Found {results.length} potential lead{results.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {results.map((lead, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-lg border transition-colors ${addedIds.has(idx) ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{lead.company_name}</p>
                            <span className="shrink-0 px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded capitalize">{lead.vertical}</span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{lead.trigger_detail}</p>
                          <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                            <span>{lead.industry}</span>
                            <span>Score: {lead.urgency_score}</span>
                            {lead.sources && lead.sources.length > 0 && (
                              <a
                                href={lead.sources[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-500 hover:underline"
                                onClick={e => e.stopPropagation()}
                              >
                                {lead.sources[0].name}
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddOne(idx)}
                          disabled={addedIds.has(idx)}
                          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                            addedIds.has(idx)
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                          }`}
                        >
                          {addedIds.has(idx) ? (
                            <><Check className="w-3 h-3" /> Added</>
                          ) : (
                            <><Plus className="w-3 h-3" /> Add</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
                )}
              </div>

              <div className="px-6 pb-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => { setStep('setup'); setResults([]); setAddedIds(new Set()); setError(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  ← New Search
                </button>
                <div className="flex gap-2">
                  {unadded === 0 ? (
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Done
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddAll}
                      disabled={isScanning}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                    >
                      {isScanning ? (
                        <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...</>
                      ) : (
                        `Add All (${unadded})`
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
    </div>
  );
}
