
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { COLORS, ARCHIVE_CLIPS } from '../constants';
import { ContentPillar } from '../types';

// Taurus World Stunt Awards 2027 — Feb 21, 2027
const TAURUS_2027 = new Date('2027-02-21T19:00:00');
// Campaign start: 364 days before the event (Feb 22, 2026)
const CAMPAIGN_START = new Date('2026-02-22T00:00:00');
const CAMPAIGN_DAYS = 364;

const growthData = [
  { name: 'Mo 1', followers: 0 },
  { name: 'Mo 2', followers: 1800 },
  { name: 'Mo 3', followers: 3900 },
  { name: 'Mo 4', followers: 6200 },
  { name: 'Mo 5', followers: 8400 },
  { name: 'Mo 6', followers: 10000 },
];

const pillarData = Object.values(ContentPillar).map(pillar => ({
  name: pillar.split(' ').slice(0, 2).join(' '),
  clips: ARCHIVE_CLIPS.filter(c => c.pillar === pillar).length,
  posted: ARCHIVE_CLIPS.filter(c => c.pillar === pillar && c.status === 'posted').length,
}));

const PILLAR_BAR_COLORS = ['#C5A059', '#7f1d1d', '#1e3a5f', '#064e3b', '#374151', '#4b5563'];

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function getCampaignProgress() {
  const now = Date.now();
  const elapsed = Math.max(0, now - CAMPAIGN_START.getTime());
  const daysElapsed = Math.floor(elapsed / 86400000);
  const daysInCampaign = Math.min(daysElapsed, CAMPAIGN_DAYS);
  const daysRemaining = Math.max(0, CAMPAIGN_DAYS - daysInCampaign);
  const pct = Math.min(100, Math.round((daysInCampaign / CAMPAIGN_DAYS) * 100));
  const isActive = now >= CAMPAIGN_START.getTime();
  return { daysInCampaign, daysRemaining, pct, isActive };
}

const Dashboard: React.FC = () => {
  const countdown = useCountdown(TAURUS_2027);
  const campaign = getCampaignProgress();

  const archiveStats = {
    posted: ARCHIVE_CLIPS.filter(c => c.status === 'posted').length,
    scheduled: ARCHIVE_CLIPS.filter(c => c.status === 'scheduled').length,
    available: ARCHIVE_CLIPS.filter(c => c.status === 'available').length,
    igOnly: ARCHIVE_CLIPS.filter(c => c.platform.includes('Instagram') && !c.platform.includes('TikTok')).length,
    ttOnly: ARCHIVE_CLIPS.filter(c => c.platform.includes('TikTok') && !c.platform.includes('Instagram')).length,
    both: ARCHIVE_CLIPS.filter(c => c.platform.includes('Instagram') && c.platform.includes('TikTok')).length,
  };

  return (
    <div className="p-16 space-y-12 animate-fadeIn">

      {/* ── Header ── */}
      <header className="flex justify-between items-end border-b border-zinc-900 pb-12">
        <div className="space-y-4">
          <h2 className="text-6xl oswald font-black uppercase tracking-tighter taurus-text-gold italic">Mission Control</h2>
          <p className="text-zinc-500 font-medium max-w-lg uppercase text-[10px] tracking-widest">
            The Rolling Hype Machine — <span className="text-zinc-200">Taurus 2027 Countdown</span>
          </p>
        </div>
        <div className={`border px-10 py-5 flex items-center space-x-6 ${campaign.isActive ? 'bg-zinc-900 border-emerald-800/40 cinematic-glow' : 'bg-zinc-900 border-[#C5A059]/30 cinematic-glow'}`}>
          <div className="text-right">
            <p className={`text-[10px] font-black uppercase tracking-widest ${campaign.isActive ? 'text-emerald-400' : 'text-[#C5A059]'}`}>Campaign Status</p>
            <p className="text-3xl oswald font-black text-zinc-100 italic tracking-tighter">
              {campaign.isActive ? 'LIVE' : 'PRE-LAUNCH'}
            </p>
          </div>
          <div className="h-10 w-[1px] bg-zinc-800"></div>
          <div className={`w-3 h-3 rounded-full ${campaign.isActive ? 'bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,0.8)]'}`}></div>
        </div>
      </header>

      {/* ── Live Countdown ── */}
      <div className="bg-black border border-[#C5A059]/20 p-12 cinematic-glow relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#C5A059]/3 via-transparent to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-2">
            <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] italic">Countdown to Taurus 2027</p>
            <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Feb 21, 2027 · Hollywood, CA</p>
          </div>

          <div className="flex items-center gap-6 md:gap-10 pr-2">
            {[
              { label: 'Days',    value: String(countdown.days).padStart(3, '0') },
              { label: 'Hours',   value: String(countdown.hours).padStart(2, '0') },
              { label: 'Minutes', value: String(countdown.minutes).padStart(2, '0') },
              { label: 'Seconds', value: String(countdown.seconds).padStart(2, '0') },
            ].map((unit, i) => (
              <React.Fragment key={unit.label}>
                {i > 0 && <span className="text-zinc-800 text-2xl font-black">:</span>}
                <div className="text-center">
                  <div className="text-4xl md:text-5xl oswald font-black italic taurus-text-gold tabular-nums leading-none pl-1">
                    {unit.value}
                  </div>
                  <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-2">{unit.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Campaign Progress Bar ── */}
      <div className="bg-[#0A0A0A] border border-zinc-900 p-8 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.3em]">Campaign Progress</p>
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
            {campaign.isActive ? `Day ${campaign.daysInCampaign} of ${CAMPAIGN_DAYS}` : `Launches ${CAMPAIGN_START.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
          </p>
        </div>
        <div className="h-2 bg-zinc-900 rounded-none overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8E6D31] via-[#C5A059] to-[#EAD196] transition-all duration-1000"
            style={{ width: `${Math.max(campaign.pct, 0.5)}%` }}
          ></div>
        </div>
        <div className="flex justify-between">
          <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Launch</span>
          <span className="text-[8px] font-black text-[#C5A059] uppercase tracking-widest">{campaign.pct}% Complete</span>
          <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Taurus 2027</span>
        </div>
      </div>

      {/* ── Growth Chart + KPIs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-black border border-zinc-900 p-10 cinematic-glow relative">
          <div className="mb-10 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#C5A059]">Algorithmic Growth Path</h3>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold italic">Projected 6-Month Trajectory</p>
            </div>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#C5A059" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="name" stroke="#333" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#555' }} />
                <YAxis stroke="#333" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#555' }} tickFormatter={v => v >= 1000 ? `${v/1000}K` : v} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #C5A05933', borderRadius: '0px', padding: '12px' }}
                  itemStyle={{ color: '#C5A059', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                  formatter={(v: number | undefined) => [(v ?? 0).toLocaleString(), 'Followers']}
                />
                <Area type="monotone" dataKey="followers" stroke="#C5A059" fillOpacity={1} fill="url(#colorFollowers)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0A0A0A] border border-zinc-900 p-8">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 border-b border-zinc-900 pb-4">KPI Targets</h4>
            <div className="space-y-5">
              {[
                { label: 'Followers (Month 1)', value: '0 – 1K',  color: 'text-[#C5A059]' },
                { label: 'Followers (Month 6)', value: '10K',     color: 'text-white' },
                { label: 'Engagement Yield',   value: '4.8%',     color: 'text-white' },
                { label: 'Platform Share',     value: '62 / 38',  color: 'text-white' },
                { label: 'Daily Output',       value: '1 Reel',   color: 'text-white' },
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-center border-b border-zinc-900 pb-4 last:border-0 last:pb-0">
                  <span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">{stat.label}</span>
                  <span className={`text-[10px] font-black ${stat.color} uppercase tracking-tighter`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-900/10 border-l-2 border-[#C5A059] p-6">
            <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-2 italic">Strategy Yield</p>
            <p className="text-[10px] text-zinc-500 leading-relaxed italic font-medium">
              "Building a digital monument to the Taurus legacy that scales with every reel posted."
            </p>
          </div>
        </div>
      </div>

      {/* ── Archive Content Health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Content Pillar Breakdown */}
        <div className="bg-black border border-zinc-900 p-10">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#C5A059] mb-8">Content Pillar Distribution</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pillarData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="name" stroke="#333" fontSize={8} tickLine={false} axisLine={false} tick={{ fill: '#555' }} />
                <YAxis stroke="#333" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#555' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '0', padding: '10px' }}
                  itemStyle={{ color: '#C5A059', fontSize: '10px', fontWeight: '900' }}
                />
                <Bar dataKey="clips" name="Total Clips">
                  {pillarData.map((_, index) => (
                    <Cell key={index} fill={PILLAR_BAR_COLORS[index]} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Archive Status + Platform Split */}
        <div className="space-y-6">
          <div className="bg-[#0A0A0A] border border-zinc-900 p-8">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 border-b border-zinc-900 pb-4">Archive Status</h3>
            <div className="space-y-4">
              {[
                { label: 'Posted',    value: archiveStats.posted,    color: 'bg-emerald-500',  pct: Math.round(archiveStats.posted / ARCHIVE_CLIPS.length * 100) },
                { label: 'Scheduled', value: archiveStats.scheduled, color: 'bg-[#C5A059]',    pct: Math.round(archiveStats.scheduled / ARCHIVE_CLIPS.length * 100) },
                { label: 'Available', value: archiveStats.available, color: 'bg-zinc-600',     pct: Math.round(archiveStats.available / ARCHIVE_CLIPS.length * 100) },
              ].map(s => (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</span>
                    <span className="text-[9px] font-black text-zinc-300">{s.value} clips · {s.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-none overflow-hidden">
                    <div className={`h-full ${s.color} transition-all duration-700`} style={{ width: `${s.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-zinc-900 p-8">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 border-b border-zinc-900 pb-4">Platform Distribution</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'IG + TikTok', value: archiveStats.both,   icon: 'fa-layer-group', color: 'text-[#C5A059]' },
                { label: 'IG Only',    value: archiveStats.igOnly,  icon: 'fa-instagram',   color: 'text-zinc-300' },
                { label: 'TikTok Only', value: archiveStats.ttOnly, icon: 'fa-tiktok',      color: 'text-emerald-400' },
              ].map(p => (
                <div key={p.label} className="bg-black border border-zinc-900 p-4">
                  <i className={`fa-${p.label === 'IG + TikTok' ? 'solid' : 'brands'} ${p.icon} ${p.color} text-sm mb-2 block`}></i>
                  <div className={`text-2xl oswald font-black italic ${p.color}`}>{p.value}</div>
                  <div className="text-[7px] font-black text-zinc-700 uppercase tracking-widest mt-1">{p.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: 'fa-film',        label: 'Archive Clips',   value: `${ARCHIVE_CLIPS.length}`,      sub: 'Demo Pool Ready' },
          { icon: 'fa-chart-simple', label: 'Projected Reach', value: '2.4M',                         sub: 'Organic Peak' },
          { icon: 'fa-bullseye',    label: 'Niche Value',     value: 'INDUSTRY #1',                   sub: 'Category Dominance' },
          { icon: 'fa-award',       label: 'Target Event',    value: '2027 TAURUS',                   sub: 'Rolling Hype Goal' },
        ].map((stat, i) => (
          <div key={i} className="bg-black border border-zinc-900 p-8 hover:border-[#C5A059]/40 transition duration-500 group cursor-default">
            <i className={`fa-solid ${stat.icon} text-zinc-800 group-hover:text-[#C5A059] transition-colors mb-6 block text-xl`}></i>
            <div className="text-2xl oswald font-black group-hover:text-white transition-colors italic uppercase">{stat.value}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-[#C5A059] mt-2 italic">{stat.label}</div>
            <div className="text-[8px] text-zinc-700 mt-2 font-bold uppercase tracking-widest">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
