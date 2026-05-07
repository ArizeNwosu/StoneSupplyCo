import React, { useState } from 'react';
import {
  TrendingUp, ArrowRight, ExternalLink, Search, Inbox, X, Activity, MessageSquare
} from 'lucide-react';
import { WarningIcon } from './WarningIcon';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const TOPIC_DOMAINS = [
  { name: 'Side Effects & Tolerability', tags: ['Muscle Loss', 'Facial Volume', 'Nausea', 'Gastrointestinal', 'Hair Loss'] },
  { name: 'Market Access & Pricing', tags: ['Compounding', 'Insurance Appeals', 'Shortages', 'Coupons'] },
  { name: 'Clinical Efficacy', tags: ['Cardiac Benefits', 'Weight Plateau', 'PCOS', 'Fertility'] },
  { name: 'Off-label Prescribing', tags: ['Maintenance', 'Transition', 'Athletes'] }
];

const DRUGS = ['Ozempic', 'Wegovy', 'Mounjaro', 'Zepbound', 'Semaglutide'];

const MOCK_TREND_DATA = [
  { day: 'D1', volume: 120 }, { day: 'D2', volume: 150 }, { day: 'D3', volume: 180 }, { day: 'D4', volume: 160 }, { day: 'D5', volume: 220 }, { day: 'D6', volume: 280 }, { day: 'D7', volume: 300 }
];

const TIMEFRAME_DAYS: Record<string, number> = { '7D': 7, '30D': 30, '90D': 90 };

export default function Explorer({ data }: { data: any }) {
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>(['Ozempic', 'Wegovy', 'Mounjaro', 'Zepbound', 'Semaglutide']);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState<string>('30D');
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  // Extract all available tags from the API data to prefill selected tags if empty
  const allApiTags = React.useMemo(() => {
    const tags = new Set<string>();
    data?.emergingTopics?.forEach((t: any) => t.tags?.forEach((tag: string) => tags.add(tag)));
    return Array.from(tags);
  }, [data]);

  // If no tags selected by user, initialize with available API tags
  React.useEffect(() => {
    if (selectedTags.length === 0 && allApiTags.length > 0) {
      setSelectedTags(allApiTags.slice(0, 5));
    }
  }, [allApiTags, selectedTags.length]);

  const toggleDrug = (drug: string) => {
    setSelectedDrugs(prev => prev.includes(drug) ? prev.filter(d => d !== drug) : [...prev, drug]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Build the topics with a unique index if ID is missing from API
  const emergingTopics = (data?.emergingTopics || []).map((topic: any, idx: number) => ({
    id: idx + 1,
    ...topic,
    tags: topic.tags || [],
    relatedDrugs: topic.relatedDrugs || [],
    sentimentColor: topic.sentimentScore > 60 ? 'primary' : topic.sentimentScore < 40 ? 'error' : 'tertiary'
  }));

  const filteredData = emergingTopics.filter((item: any) => {
    const matchTag = selectedTags.length === 0 || item.tags.some((t: string) => selectedTags.includes(t));
    const matchDrug = selectedDrugs.length === 0 || item.relatedDrugs.some((d: string) => selectedDrugs.includes(d));
    return matchTag && matchDrug;
  });

  const selectedTopicData = emergingTopics.find((t: any) => t.id === selectedTopicId);

  // Collect related evidence for the selected topic, filtered by timeframe
  const cutoff = Date.now() - TIMEFRAME_DAYS[timeframe] * 86400_000;
  const relatedEvidence = data?.evidenceFeed?.filter((post: any) =>
    (selectedTopicData?.tags?.some((tag: string) => post.tags?.includes(tag)) ||
     selectedTopicData?.relatedDrugs?.includes(post.drug)) &&
    (post.timestamp || 0) >= cutoff
  ).slice(0, 3) || [];

  return (
    <div>
      {/* Filter Section */}
      <section className="mb-10">
        <div className="flex flex-col gap-6 analytical-border bg-surface-container-low p-6 rounded">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <div className="w-full md:flex-1">
              <label className="block text-label-caps text-on-surface-variant mb-2">DRUG SELECTION (MULTI)</label>
              <div className="flex flex-wrap gap-2">
                {DRUGS.map(drug => (
                  <button 
                    key={drug} 
                    onClick={() => toggleDrug(drug)}
                    className={`px-4 py-2 border text-body-sm rounded-full transition-colors cursor-pointer ${
                      selectedDrugs.includes(drug) 
                        ? 'border-primary text-primary bg-primary/10' 
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {drug}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <label className="block text-label-caps text-on-surface-variant mb-2">TIMEFRAME</label>
              <div className="flex border border-outline-variant rounded overflow-hidden">
                {['7D', '30D', '90D'].map(tf => (
                  <button 
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`flex-1 py-2 text-label-caps transition-colors cursor-pointer ${
                      timeframe === tf 
                        ? 'bg-surface-container-high text-primary' 
                        : 'hover:bg-surface-container hover:text-on-surface text-on-surface-variant'
                    } ${tf === '30D' ? 'border-x border-outline-variant' : ''}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full border-t border-outline-variant pt-6">
            <label className="block text-label-caps text-on-surface-variant mb-4">SPECIFIC TAGS BY DOMAIN</label>
            <div className="flex flex-col gap-4">
              {TOPIC_DOMAINS.map(domain => {
                // merge statically defined tags with dynamically found ones
                const domainTags = Array.from(new Set([...domain.tags, ...(allApiTags.filter(t => t.toLowerCase().includes(domain.name.split(' ')[0].toLowerCase())) || []) ]));

                return (
                  <div key={domain.name} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <span className="text-body-sm text-on-surface-variant w-48">{domain.name}</span>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {domainTags.map(tag => (
                        <button 
                          key={tag} 
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 border text-xs rounded transition-colors cursor-pointer ${
                            selectedTags.includes(tag) 
                              ? 'border-primary text-primary bg-primary/10' 
                              : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Content Section: Topic List */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-headline-md text-on-surface">Emerging Sub-Topics</h2>
          <div className="flex gap-4 text-label-caps text-on-surface-variant">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> HIGH VOLUME</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary"></span> SENTIMENT SHIFT</span>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-low analytical-border rounded">
            <Inbox className="w-12 h-12 text-outline mb-4" />
            <h3 className="text-headline-md mb-2 text-on-surface">No results found</h3>
            <p className="text-body-sm text-on-surface-variant max-w-sm">
              Adjust your drug or topic domain filters to see emerging sub-topics and trends.
            </p>
          </div>
        ) : (
          <div className="bg-surface-container analytical-border rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="px-6 py-4 text-label-caps text-on-surface-variant border-r border-outline-variant/30">SUB-TOPIC</th>
                  <th className="px-6 py-4 text-label-caps text-on-surface-variant text-right border-r border-outline-variant/30">VOLUME</th>
                  <th className="px-6 py-4 text-label-caps text-on-surface-variant text-right border-r border-outline-variant/30">SENTIMENT SCORE</th>
                  <th className="px-6 py-4 text-label-caps text-on-surface-variant text-right">MOMENTUM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredData.map((item: any) => (
                  <tr key={item.id} onClick={() => setSelectedTopicId(item.id)} className="hover:bg-surface-container-highest transition-colors cursor-pointer group">
                    <td className="px-6 py-5 border-r border-outline-variant/30">
                      <div className="flex gap-2 mb-1">
                        {item.tags.map((t: string) => <span key={t} className="text-[10px] text-tertiary uppercase">{t}</span>)}
                      </div>
                      <div className="text-body-base text-on-surface font-semibold group-hover:text-primary transition-colors">{item.topic}</div>
                      <div className="text-body-sm text-on-surface-variant mt-1">{item.desc}</div>
                    </td>
                    <td className="px-6 py-5 text-right text-data-mono border-r border-outline-variant/30">
                      {item.volume}
                      <span className={`block text-[10px] mt-1 ${item.momStr?.startsWith('+') ? 'text-primary' : item.momStr?.startsWith('-') ? 'text-error' : 'text-on-surface-variant'}`}>
                        {item.momStr}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right border-r border-outline-variant/30">
                      <div className="flex flex-col items-end">
                        <span className={`text-data-mono text-${item.sentimentColor}`}>{item.sentimentScore}/100</span>
                        <div className="w-24 h-1 bg-surface-container-lowest mt-2 rounded-full overflow-hidden">
                          <div className={`h-full bg-${item.sentimentColor}`} style={{width: `${item.sentimentScore}%`}}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {item.momentum === 'up' ? (
                        <TrendingUp className="inline-block w-5 h-5 align-middle text-primary" />
                      ) : item.momentum === 'down' ? (
                        <WarningIcon className="inline-block w-5 h-5 align-middle text-error" />
                      ) : (
                        <ArrowRight className="inline-block w-5 h-5 align-middle text-on-surface-variant" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Side Intelligence Panel */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface-container analytical-border p-6 rounded">
          <h3 className="text-label-caps text-on-surface-variant mb-4">DRUG COMPARISON DELTA</h3>
          <div className="flex items-center justify-between py-2 border-b border-outline-variant/50">
            <span className="text-body-base">Ozempic vs Wegovy</span>
            <span className="text-data-mono text-primary">+12.4%</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-outline-variant/50">
            <span className="text-body-base">Mounjaro Volume</span>
            <span className="text-data-mono text-tertiary">-2.1%</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-body-base">Zepbound Penetration</span>
            <span className="text-data-mono text-primary">+8.8%</span>
          </div>
        </div>
        
        <div className="bg-surface-container analytical-border p-6 rounded col-span-1 md:col-span-2 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-label-caps text-on-surface-variant mb-2">QUARTERLY SENTIMENT DRIFT</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">
              Patient sentiment toward access has improved significantly since last quarter due to supply chain stabilizations.
            </p>
            <a href="/api/report" target="_blank" rel="noreferrer" className="text-primary text-label-caps flex items-center gap-2 hover:underline cursor-pointer">
              VIEW REPORT <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="w-32 h-32 hidden sm:flex bg-surface-container-low rounded relative overflow-hidden items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary-fixed-dim)_0%,transparent_70%)] opacity-20"></div>
            <svg className="w-full h-full p-4 relative z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,80 Q25,60 50,40 T100,10" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Detailed View Modal */}
      {selectedTopicId && selectedTopicData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTopicId(null)}></div>
          <div className="bg-surface-container w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg analytical-border relative z-10 shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-surface-container p-6 border-b border-outline-variant flex justify-between items-start z-20">
              <div>
                <div className="flex gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[10px] uppercase tracking-wider rounded">{selectedTopicData.topicDomain}</span>
                  {selectedTopicData.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] uppercase tracking-wider rounded">{tag}</span>
                  ))}
                </div>
                <h2 className="text-display-sm text-on-surface">{selectedTopicData.topic}</h2>
                <p className="text-body-base text-on-surface-variant mt-2">{selectedTopicData.desc}</p>
              </div>
              <button onClick={() => setSelectedTopicId(null)} className="p-2 hover:bg-surface-container-highest rounded transition-colors cursor-pointer">
                <X className="w-6 h-6 text-on-surface-variant" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 md:col-span-2 space-y-6">
                <div className="bg-surface-container-low p-6 analytical-border rounded">
                  <h3 className="text-label-caps text-on-surface-variant mb-4">VOLUME TREND (7D)</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={MOCK_TREND_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
                        <XAxis dataKey="day" stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline)' }}
                          itemStyle={{ color: 'var(--color-primary)' }}
                        />
                        <Line type="monotone" dataKey="volume" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-surface)' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-label-caps text-on-surface-variant mb-4">RELATED PATIENT VERBATIMS</h3>
                  <div className="space-y-3">
                    {relatedEvidence.length > 0 ? relatedEvidence.map((ev: any, i: number) => (
                      <div key={i} className="bg-surface-container-highest p-4 rounded text-body-sm text-on-surface">
                        "{ev.text.length > 250 ? ev.text.substring(0, 250) + '...' : ev.text}"
                        <div className="flex gap-4 mt-3 text-on-surface-variant text-xs">
                          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {ev.source}</span>
                          <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Recent</span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-on-surface-variant text-sm p-4 bg-surface-container-highest rounded">
                        No direct verbatims found for this topic in the recent payload.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-1 space-y-6">
                <div className="bg-surface-container-low p-6 analytical-border rounded">
                  <h3 className="text-label-caps text-on-surface-variant mb-4">METRICS</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-on-surface-variant mb-1">Total Volume</div>
                      <div className="text-headline-md text-on-surface font-mono">{selectedTopicData.volume}</div>
                    </div>
                    <div>
                      <div className="text-sm text-on-surface-variant mb-1">Momentum (MoM)</div>
                      <div className={`text-headline-md font-mono ${selectedTopicData.momStr?.startsWith('+') ? 'text-primary' : 'text-error'}`}>{selectedTopicData.momStr}</div>
                    </div>
                    <div>
                      <div className="text-sm text-on-surface-variant mb-2">Sentiment Score</div>
                      <div className={`text-headline-md font-mono text-${selectedTopicData.sentimentColor}`}>{selectedTopicData.sentimentScore}/100</div>
                      <div className="w-full h-1.5 bg-surface-container-highest mt-2 rounded-full overflow-hidden">
                        <div className={`h-full bg-${selectedTopicData.sentimentColor}`} style={{width: `${selectedTopicData.sentimentScore}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
