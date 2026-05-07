import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, CheckCircle, Activity, Download, Inbox, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { WarningIcon } from './WarningIcon';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

function getTimeAgo(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hr = Math.floor(mins / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const PREVIEW_LENGTH = 300;
const PAGE_SIZE = 50;
const ALL_SOURCES = ['r/Ozempic', 'r/Mounjaro', 'r/WegovyWeightLoss', 'r/Zepbound', 'r/Semaglutide'];
const TIMEFRAMES = [
  { label: '7D',  days: 7  },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

export default function Evidence({ data }: { data: any }) {
  const [selectedSources, setSelectedSources] = useState(ALL_SOURCES);
  const [sortNewest, setSortNewest]           = useState(true);
  const [timeframeDays, setTimeframeDays]     = useState(30);
  const [expanded, setExpanded]               = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore]     = useState(false);
  const [historicalItems, setHistoricalItems] = useState<any[]>([]);
  const [histOffset, setHistOffset]           = useState(PAGE_SIZE); // we already have 0..50
  const [histTotal, setHistTotal]             = useState<number | null>(null);
  const [isLoading, setIsLoading]             = useState(true);

  const initialFeed: any[] = data?.evidenceFeed || [];

  // Simulate brief loading on mount / data change
  useEffect(() => {
    setIsLoading(true);
    setHistoricalItems([]);
    setHistOffset(PAGE_SIZE);
    setHistTotal(null);
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, [initialFeed]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  // Cutoff timestamp for timeframe filter
  const cutoff = Date.now() - timeframeDays * 86400_000;

  // Merge initial + historical, apply filters
  const allItems = [...initialFeed, ...historicalItems];
  const filteredData = allItems
    .filter(item => selectedSources.includes(item.source))
    .filter(item => (item.timestamp || 0) >= cutoff)
    .sort((a, b) => sortNewest ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/evidence?offset=${histOffset}&limit=${PAGE_SIZE}&days=${timeframeDays}`);
      const json = await res.json();
      const newItems = (json.items || []).map((row: any) => ({
        ...row,
        timestamp: row.post_ts ?? row.timestamp,
        sentimentLabel: row.sentiment ?? row.sentimentLabel,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
      }));
      setHistoricalItems(prev => [...prev, ...newItems]);
      setHistOffset(prev => prev + PAGE_SIZE);
      setHistTotal(json.total);
    } catch (e) {
      console.error('loadMore failed', e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [histOffset, timeframeDays]);

  const hasMore = histTotal === null || histOffset < histTotal;

  const sentimentCounts = filteredData.reduce((acc: any, item: any) => {
    acc[item.sentimentLabel] = (acc[item.sentimentLabel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentChartData = Object.keys(sentimentCounts).map(key => ({
    name: key,
    count: sentimentCounts[key],
    fill: key === 'Positive'    ? 'var(--color-primary)'           :
          key === 'Neutral-Low' ? 'var(--color-tertiary)'          :
          key === 'Risk-Alert'  ? 'var(--color-error)'             :
                                  'var(--color-on-surface-variant)'
  }));

  const handleExportCSV = () => {
    const headers = ['URL', 'Drug', 'Type', 'Journey_Stage', 'Source', 'Time_Ago', 'Sentiment', 'Body_Text', 'Tags'];
    const rows = filteredData.map((item: any) => [
      item.url, item.drug, item.type, item.stage, item.source,
      getTimeAgo(item.timestamp), item.sentimentLabel,
      `"${(item.text || '').replace(/"/g, '""')}"`,
      (item.tags || []).join(';')
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = Object.assign(document.createElement('a'), { href: encodeURI(csv), download: 'pulseglp1_evidence.csv' });
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-gutter">
      {/* Sidebar */}
      <aside className="hidden lg:block lg:col-span-3 py-2 space-y-6">
        {/* Timeframe */}
        <div className="analytical-border bg-surface-container-low p-margin rounded">
          <h3 className="text-label-caps text-on-surface-variant mb-3">TIMEFRAME</h3>
          <div className="flex border border-outline-variant rounded overflow-hidden">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.label}
                onClick={() => { setTimeframeDays(tf.days); setHistoricalItems([]); setHistOffset(PAGE_SIZE); setHistTotal(null); }}
                className={`flex-1 py-2 text-label-caps transition-colors cursor-pointer ${
                  timeframeDays === tf.days
                    ? 'bg-surface-container-high text-primary'
                    : 'hover:bg-surface-container text-on-surface-variant'
                } ${tf.label === '30D' ? 'border-x border-outline-variant' : ''}`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-on-surface-variant mt-2">
            Showing posts &amp; comments from the last {timeframeDays} days.
          </p>
        </div>

        {/* Source filter */}
        <div className="analytical-border bg-surface-container-low p-margin rounded">
          <h3 className="text-label-caps text-on-surface-variant mb-4">EVIDENCE SOURCE</h3>
          <div className="space-y-3">
            {ALL_SOURCES.map(source => (
              <label key={source} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedSources.includes(source)}
                  onChange={() => toggleSource(source)}
                  className="rounded border-outline-variant bg-surface-container text-primary focus:ring-0 w-4 h-4"
                />
                <span className="text-body-sm group-hover:text-primary transition-colors">{source}</span>
              </label>
            ))}
          </div>
        </div>

        {/* DB stats */}
        {data?.dbStats && (
          <div className="analytical-border bg-surface-container-low p-margin rounded">
            <h3 className="text-label-caps text-on-surface-variant mb-3">DATABASE</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-body-sm text-on-surface-variant">Total items</span><span className="text-data-mono text-on-surface">{data.dbStats.total.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-body-sm text-on-surface-variant">Posts</span><span className="text-data-mono text-primary">{data.dbStats.posts.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-body-sm text-on-surface-variant">Comments</span><span className="text-data-mono text-tertiary">{data.dbStats.comments.toLocaleString()}</span></div>
            </div>
          </div>
        )}
      </aside>

      {/* Feed */}
      <section className="lg:col-span-9 py-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-outline-variant pb-4 gap-4">
          <div>
            <h2 className="text-headline-md text-on-surface">Evidence Feed</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {filteredData.length} items · last {timeframeDays} days · posts &amp; comments
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setSortNewest(!sortNewest)}
              className="analytical-border px-4 py-2 text-label-caps bg-surface-container hover:bg-surface-container-high transition-colors rounded flex-1 md:flex-none text-center cursor-pointer"
            >
              SORT: {sortNewest ? 'NEWEST' : 'OLDEST'}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              className="analytical-border px-4 py-2 text-label-caps bg-surface-container hover:bg-surface-container-high transition-colors rounded flex-1 md:flex-none text-center flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" /> EXPORT CSV
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-density-comfortable">
            {[1, 2, 3].map(i => (
              <div key={i} className="analytical-border bg-surface-container-low p-margin rounded animate-pulse">
                <div className="flex gap-2 mb-4">
                  <div className="h-6 w-20 bg-surface-container-highest rounded" />
                  <div className="h-6 w-24 bg-surface-container-highest rounded" />
                  <div className="h-6 w-16 bg-surface-container-highest rounded ml-auto" />
                </div>
                <div className="h-4 bg-surface-container-highest rounded w-full mb-2" />
                <div className="h-4 bg-surface-container-highest rounded w-[90%] mb-2" />
                <div className="h-4 bg-surface-container-highest rounded w-[75%] mb-6" />
                <div className="flex gap-4">
                  <div className="h-5 w-24 bg-surface-container-highest rounded" />
                  <div className="h-5 w-32 bg-surface-container-highest rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-surface-container-low analytical-border rounded">
            <Inbox className="w-12 h-12 text-outline mb-4" />
            <h3 className="text-headline-md mb-2 text-on-surface">No results in this window</h3>
            <p className="text-body-sm text-on-surface-variant max-w-sm">
              Try a wider timeframe or load historical evidence to see older data.
            </p>
          </div>
        ) : (
          <div className="space-y-density-comfortable">
            {filteredData.map((item: any) => {
              const Icon       = item.sentimentLabel === 'Positive'   ? CheckCircle :
                                 item.sentimentLabel === 'Risk-Alert' ? WarningIcon : Activity;
              const colorClass = item.sentimentLabel === 'Positive'   ? 'text-primary' :
                                 item.sentimentLabel === 'Risk-Alert' ? 'text-error'   : 'text-tertiary';
              return (
                <article key={item.id} className="analytical-border bg-surface-container-low hover:bg-surface-container transition-colors group rounded">
                  <div className="p-margin flex flex-col md:flex-row gap-gutter">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-label-caps rounded">{item.drug}</span>
                        <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-label-caps rounded">{item.stage}</span>
                        {item.type === 'comment' && (
                          <span className="text-[10px] uppercase tracking-widest text-tertiary border border-tertiary/30 px-1.5 py-0.5 rounded">comment</span>
                        )}
                        <span className="text-data-mono text-outline-variant ml-auto">{getTimeAgo(item.timestamp)}</span>
                      </div>
                      <p className="text-body-base text-on-surface mb-3 leading-relaxed">
                        {expanded.has(item.id) || item.text.length <= PREVIEW_LENGTH
                          ? item.text
                          : item.text.substring(0, PREVIEW_LENGTH) + '…'}
                      </p>
                      {item.text.length > PREVIEW_LENGTH && (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="flex items-center gap-1 text-primary text-label-caps mb-3 hover:underline cursor-pointer"
                        >
                          {expanded.has(item.id)
                            ? <><ChevronUp className="w-3 h-3" /> SHOW LESS</>
                            : <><ChevronDown className="w-3 h-3" /> SHOW MORE</>}
                        </button>
                      )}
                      <div className="flex items-center gap-4 text-on-surface-variant flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-body-sm">{item.source}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-4 h-4 ${colorClass}`} />
                          <span className="text-body-sm">Sentiment: {item.sentimentLabel}</span>
                        </div>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1.5 text-outline hover:text-primary transition-colors" title="Open on Reddit">
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="text-label-caps hover:underline">REDDIT</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="hidden md:block w-px bg-outline-variant/30 self-stretch" />
                    <div className="md:w-48 flex flex-col justify-center mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-outline-variant/30">
                      <div className="text-label-caps text-outline mb-1">SIGNAL STRENGTH</div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${item.coverage || 50}%` }} />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1">
                        {(item.tags || []).map((tag: string) => (
                          <span key={tag} className="text-[10px] bg-surface-container-highest px-1.5 py-0.5 rounded text-on-surface-variant border border-transparent group-hover:border-outline-variant/50 transition-colors">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Load Historical Evidence */}
        {!isLoading && (
          <div className="mt-8 flex flex-col items-center gap-2">
            {histTotal !== null && (
              <p className="text-label-caps text-on-surface-variant">
                Showing {Math.min(histOffset, histTotal).toLocaleString()} of {histTotal.toLocaleString()} total items in DB
              </p>
            )}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="bg-primary hover:brightness-110 text-on-primary text-label-caps px-8 py-3 rounded transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoadingMore
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> LOADING…</>
                  : 'LOAD HISTORICAL EVIDENCE'}
              </button>
            )}
            {histTotal !== null && histOffset >= histTotal && (
              <p className="text-label-caps text-on-surface-variant">All historical evidence loaded.</p>
            )}
          </div>
        )}

        {/* Sentiment Distribution Chart */}
        {!isLoading && filteredData.length > 0 && (
          <div className="mt-12 bg-surface-container-low analytical-border p-6 rounded">
            <h3 className="text-headline-md text-on-surface mb-6">Sentiment Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentChartData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis allowDecimals={false} stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--color-surface-container-highest)' }}
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline)', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: 'var(--color-on-surface)' }}
                    labelStyle={{ color: 'var(--color-on-surface-variant)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
