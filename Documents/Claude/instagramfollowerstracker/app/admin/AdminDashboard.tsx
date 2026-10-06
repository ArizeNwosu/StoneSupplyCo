'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminTable, type AdminUser } from './AdminTable';
import { RevenuePanel } from './RevenuePanel';
import { CampaignPanel } from './CampaignPanel';
import { ReplyInbox } from './ReplyInbox';

type Tab = 'Users' | 'Revenue' | 'Campaigns' | 'Replies';
export function AdminDashboard({ users }: { users: AdminUser[] }) {
  const [tab, setTab] = useState<Tab>('Users'); const [range, setRange] = useState('30d'); const [data, setData] = useState<any>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (tab === 'Users') return; setLoading(true); setError(''); try { const route = tab === 'Revenue' ? 'revenue' : tab === 'Campaigns' ? 'campaigns' : 'replies'; const response = await fetch(`/api/admin/${route}?range=${range}`); if (!response.ok) throw new Error(`Request failed (${response.status})`); setData(await response.json()); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load data'); } finally { setLoading(false); } }, [range, tab]);
  useEffect(() => { void load(); }, [load]);
  if (tab === 'Users') return <div><nav className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 gap-1 rounded-full border border-white/10 bg-slate-900 p-1 shadow-xl">{(['Users','Revenue','Campaigns','Replies'] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-xs font-bold ${item === tab ? 'bg-cyan-500 text-white' : 'text-slate-400'}`}>{item}</button>)}</nav><AdminTable users={users} /></div>;
  return <div className="min-h-screen bg-slate-950 px-4 py-10 text-white"><div className="mx-auto max-w-7xl"><header className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-cyan-400">Admin</p><h1 className="text-2xl font-black">{tab}</h1></div><Link href="/dashboard" className="text-sm text-slate-400">← Back to app</Link></header><nav className="mb-6 flex flex-wrap gap-2">{(['Users','Revenue','Campaigns','Replies'] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm font-bold ${item === tab ? 'bg-cyan-500' : 'border border-white/10 text-slate-400'}`}>{item}</button>)}</nav>{tab !== 'Replies' && <label className="mb-5 block text-sm text-slate-400">Range <select value={range} onChange={(e) => setRange(e.target.value)} className="ml-2 rounded-lg bg-slate-800 p-2 text-white"><option value="7d">7 days</option><option value="30d">30 days</option><option value="all">All time</option></select></label>}{loading ? <p>Loading…</p> : error ? <div><p className="text-red-400">{error}</p><button onClick={load}>Retry</button></div> : tab === 'Revenue' ? <RevenuePanel data={data} /> : tab === 'Campaigns' ? <CampaignPanel data={data} /> : <ReplyInbox data={data} reload={load} />}</div></div>;
}
