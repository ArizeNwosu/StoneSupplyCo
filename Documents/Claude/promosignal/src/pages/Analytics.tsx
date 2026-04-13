import { useMemo } from 'react';
import { useLeads } from '../context/LeadContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

function weekLabel(weeksAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Analytics() {
  const { leads } = useLeads();

  const kpis = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter(l => ['contacted', 'active', 'purchased'].includes(l.status)).length;
    const purchased = leads.filter(l => l.status === 'purchased');
    const totalDealValue = purchased.reduce((sum, l) => sum + (l.deal_value || 0), 0);
    const conversionRate = contacted > 0 ? ((purchased.length / contacted) * 100).toFixed(1) : '0.0';
    return { total, contacted, purchased: purchased.length, totalDealValue, conversionRate };
  }, [leads]);

  const statusData = useMemo(() => {
    const counts = leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {} as Record<string, number>);
    return [
      { name: 'New', value: counts['new'] || 0 },
      { name: 'Contacted', value: counts['contacted'] || 0 },
      { name: 'Active', value: counts['active'] || 0 },
      { name: 'Purchased', value: counts['purchased'] || 0 },
      { name: 'Snoozed', value: counts['snoozed'] || 0 },
    ];
  }, [leads]);

  const verticalData = useMemo(() => {
    const counts = leads.reduce((acc, l) => { acc[l.vertical] = (acc[l.vertical] || 0) + 1; return acc; }, {} as Record<string, number>);
    return ['awards','events','hiring','leases'].map(v => ({ name: v.charAt(0).toUpperCase() + v.slice(1), count: counts[v] || 0 }));
  }, [leads]);

  const territoryData = useMemo(() => {
    const counts = leads.reduce((acc, l) => { acc[l.distributor_territory] = (acc[l.distributor_territory] || 0) + 1; return acc; }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 10);
  }, [leads]);

  const trendData = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const ago = 7 - i;
      const start = new Date(); start.setDate(start.getDate() - ago * 7); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(end.getDate() + 7);
      return { label: weekLabel(ago), start, end, count: 0 };
    });
    leads.forEach(l => {
      const d = new Date(l.date_discovered);
      const w = weeks.find(w => d >= w.start && d < w.end);
      if (w) w.count++;
    });
    return weeks.map(w => ({ week: w.label, 'Leads Discovered': w.count }));
  }, [leads]);

  const COLORS = ['#3b82f6','#f59e0b','#10b981','#6b7280','#ef4444'];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200 px-8 py-5 shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Track your performance and conversions.</p>
      </header>
      <div className="flex-1 overflow-auto p-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Leads', value: kpis.total, sub: '', color: 'text-gray-900' },
            { label: 'Contacted', value: kpis.contacted, sub: kpis.total > 0 ? `${((kpis.contacted/kpis.total)*100).toFixed(0)}% of total` : '', color: 'text-blue-600' },
            { label: 'Purchased', value: `${kpis.purchased} (${kpis.conversionRate}%)`, sub: 'of contacted', color: 'text-green-600' },
            { label: 'Total Deal Value', value: kpis.totalDealValue > 0 ? `$${kpis.totalDealValue.toLocaleString()}` : '—', sub: 'from purchased leads', color: 'text-indigo-600' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{k.label}</p>
              <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              {k.sub && <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Weekly Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Leads Discovered — Last 8 Weeks</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Leads Discovered" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Lead Status Distribution</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={(props) => { const { name, percent } = props as { name?: string; percent?: number }; return (percent ?? 0) > 0.05 ? `${name} (${((percent ?? 0)*100).toFixed(0)}%)` : ''; }} outerRadius={100} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By Vertical */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Leads by Vertical</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={verticalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" /><YAxis allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By Territory */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Leads by Territory</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={territoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" /><YAxis allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
