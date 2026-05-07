import React, { useState } from 'react';
import {
  TrendingUp, Sparkles, MessageSquare, Wallet, Inbox, Activity
} from 'lucide-react';
import { WarningIcon } from './WarningIcon';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

const TREND_DATA = [
  { week: 'Wk 1', plateau: 120, nausea: 320 },
  { week: 'Wk 2', plateau: 145, nausea: 250 },
  { week: 'Wk 3', plateau: 180, nausea: 210 },
  { week: 'Wk 4', plateau: 240, nausea: 180 },
];

export default function Overview({ data }: { data: any }) {
  const topInsights = data?.topInsights || [];
  
  const getInsightIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CRITICAL': return <WarningIcon className="text-error w-6 h-6" />;
      case 'EMERGING': return <Sparkles className="text-primary w-6 h-6" />;
      default: return <TrendingUp className="text-tertiary w-6 h-6" />;
    }
  };

  const getInsightColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CRITICAL': return 'text-error';
      case 'EMERGING': return 'text-primary';
      default: return 'text-tertiary';
    }
  };

  return (
    <div>
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-headline-md text-on-surface">This Week's Top Insights</h2>
          <div className="flex gap-4 items-center">
            <span className="text-data-mono text-outline uppercase tracking-widest hidden sm:inline">
              Update: {new Date(data?.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        </div>
        
        {topInsights.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant analytical-border rounded-lg bg-surface-container-low">
            <span className="text-body-base">No trending insights this week.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {topInsights.slice(0, 3).map((insight: any, i: number) => (
              <div key={i} className={`bg-surface-container p-6 analytical-border transition-colors cursor-default hover:border-${getInsightColor(insight.status).split('-')[1]}/50`}>
                <div className="flex justify-between items-start mb-4">
                  {getInsightIcon(insight.status)}
                  <span className={`text-data-mono ${getInsightColor(insight.status)}`}>{insight.momentum || insight.status}</span>
                </div>
                <h3 className="text-headline-md mb-2">{insight.title}</h3>
                <p className="text-on-surface-variant text-body-sm leading-relaxed">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {topInsights.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-headline-md text-on-surface">Why It Matters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {topInsights.slice(0, 3).map((insight: any, i: number) => (
              <div key={i} className="bg-surface-container-low p-6 analytical-border rounded flex flex-col">
                <h3 className={`text-body-base font-bold mb-2 ${getInsightColor(insight.status)}`}>{insight.title}</h3>
                <div className="text-body-sm text-on-surface-variant mb-4 flex-1">
                  {insight.actionDesc || "Monitor community sentiment patterns to track this trend."}
                </div>
                <div className="bg-surface-container p-3 rounded border border-outline-variant/50">
                  <span className="text-label-caps text-outline block mb-1">Action</span>
                  <span className="text-body-sm text-on-surface">{insight.action}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-headline-md text-on-surface">Insight Momentum (4-Week Trend)</h2>
        </div>
        <div className="bg-surface-container p-6 analytical-border h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TREND_DATA} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
               <XAxis dataKey="week" stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
               <YAxis stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
               <Tooltip
                 contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline)', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                 itemStyle={{ color: 'var(--color-on-surface)' }}
                 labelStyle={{ color: 'var(--color-on-surface-variant)' }}
               />
               <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
               <Line type="monotone" dataKey="plateau" name="Plateau Mentions" stroke="var(--color-tertiary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-surface)', strokeWidth: 2 }} activeDot={{ r: 6, fill: 'var(--color-tertiary)' }} />
               <Line type="monotone" dataKey="nausea" name="Nausea Concerns" stroke="var(--color-error)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-surface)', strokeWidth: 2 }} activeDot={{ r: 6, fill: 'var(--color-error)' }} />
             </LineChart>
           </ResponsiveContainer>
        </div>
      </section>

      <div className="bento-grid mb-10 items-stretch">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low analytical-border p-6 rounded">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-headline-md">Rising Active Mentions</h2>
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-outline-variant hover:bg-surface-container transition-colors group rounded">
              <div className="col-span-4 flex items-center gap-3">
                <span className="w-1 h-1 bg-tertiary rounded-full"></span><span className="text-body-base">Accessibility Drop</span>
              </div>
              <div className="col-span-2 text-data-mono text-right text-on-surface">2,841</div>
              <div className="col-span-4 px-8">
                 <div className="h-4 flex items-end gap-[2px]">
                   {[20, 40, 30, 60, 90, 75].map((h, i) => (<div key={i} className="bg-outline-variant group-hover:bg-tertiary w-full transition-colors" style={{height: `${h}%`}}></div>))}
                  <div className="bg-tertiary w-full h-[100%] transition-colors"></div>
                </div>
              </div>
              <div className="col-span-2 text-right"><span className="text-data-mono text-tertiary">+12.4%</span></div>
            </div>
            <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-outline-variant hover:bg-surface-container transition-colors group rounded">
               <div className="col-span-4 flex items-center gap-3">
                <span className="w-1 h-1 bg-primary rounded-full"></span><span className="text-body-base">Site Fatigue</span>
              </div>
              <div className="col-span-2 text-data-mono text-right text-on-surface">1,102</div>
              <div className="col-span-4 px-8">
                <div className="h-4 flex items-end gap-[2px]">
                  {[60, 55, 58, 40, 30, 25].map((h, i) => (<div key={i} className="bg-outline-variant group-hover:bg-primary w-full transition-colors" style={{height: `${h}%`}}></div>))}
                  <div className="bg-primary w-full h-[15%] transition-colors"></div>
                </div>
              </div>
              <div className="col-span-2 text-right"><span className="text-data-mono text-primary">-4.2%</span></div>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low analytical-border relative overflow-hidden rounded p-6 flex flex-col gap-5">
          {/* dot-grid background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at center, var(--color-primary) 1px, transparent 1px)`, backgroundSize: `32px 32px` }} />

          {/* Header */}
          <div className="relative z-10">
            <h3 className="text-headline-md text-on-surface mb-0.5">Global Coverage</h3>
            <p className="text-body-sm text-on-surface-variant">Live · 5 subreddits · posts &amp; comments</p>
          </div>

          {/* Metrics grid */}
          <div className="relative z-10 grid grid-cols-2 gap-3 flex-1">

            <div className="bg-surface-container rounded p-3 border border-outline-variant/40 flex flex-col justify-between">
              <span className="text-label-caps text-outline mb-2">CORPUS SIZE</span>
              <span className="text-data-mono text-headline-md text-on-surface">{(data?.dbStats?.total || 0).toLocaleString()}</span>
              <span className="text-[10px] text-on-surface-variant mt-1">posts &amp; comments</span>
            </div>

            <div className="bg-surface-container rounded p-3 border border-outline-variant/40 flex flex-col justify-between">
              <span className="text-label-caps text-outline mb-2">COMMENT RATIO</span>
              <span className="text-data-mono text-headline-md text-primary">
                {data?.dbStats?.total
                  ? `${Math.round((data.dbStats.comments / data.dbStats.total) * 100)}%`
                  : '—'}
              </span>
              <span className="text-[10px] text-on-surface-variant mt-1">of corpus are comments</span>
            </div>

            <div className="bg-surface-container rounded p-3 border border-outline-variant/40 flex flex-col justify-between">
              <span className="text-label-caps text-outline mb-2">RISK ALERTS</span>
              <span className="text-data-mono text-headline-md text-error">
                {data?.evidenceFeed
                  ? data.evidenceFeed.filter((e: any) => e.sentimentLabel === 'Risk-Alert').length
                  : '—'}
              </span>
              <span className="text-[10px] text-on-surface-variant mt-1">in latest batch</span>
            </div>

            <div className="bg-surface-container rounded p-3 border border-outline-variant/40 flex flex-col justify-between">
              <span className="text-label-caps text-outline mb-2">POSITIVE SIGNAL</span>
              <span className="text-data-mono text-headline-md" style={{ color: 'var(--color-success)' }}>
                {data?.evidenceFeed
                  ? `${Math.round((data.evidenceFeed.filter((e: any) => e.sentimentLabel === 'Positive').length / Math.max(data.evidenceFeed.length, 1)) * 100)}%`
                  : '—'}
              </span>
              <span className="text-[10px] text-on-surface-variant mt-1">of latest batch</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
