import { useLeads } from '../context/LeadContext';
import { Building2, Clock, Users, Activity, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import LeadCard from '../components/LeadCard';
import { Lead, Vertical } from '../types';

export default function MyLeads() {
  const { leads } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [verticalFilter, setVerticalFilter] = useState<Vertical | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'urgency_score' | 'date_discovered'>('urgency_score');

  const activeLeads = useMemo(() => leads.filter(l => l.status !== 'new'), [leads]);

  const filteredLeads = useMemo(() => {
    return activeLeads
      .filter(l => verticalFilter === 'all' || l.vertical === verticalFilter)
      .filter(l => statusFilter === 'all' || l.status === statusFilter)
      .sort((a, b) => sortBy === 'urgency_score'
        ? b.urgency_score - a.urgency_score
        : new Date(b.date_discovered).getTime() - new Date(a.date_discovered).getTime());
  }, [activeLeads, verticalFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const contacted = activeLeads.filter(l => l.status === 'contacted').length;
    const purchased = activeLeads.filter(l => l.status === 'purchased');
    const totalDealValue = purchased.reduce((sum, l) => sum + (l.deal_value || 0), 0);
    const snoozed = activeLeads.filter(l => l.status === 'snoozed').length;
    return { total: activeLeads.length, contacted, purchased: purchased.length, totalDealValue, snoozed };
  }, [activeLeads]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-600 bg-red-50 ring-red-500/10';
    if (score >= 50) return 'text-orange-600 bg-orange-50 ring-orange-500/10';
    return 'text-blue-600 bg-blue-50 ring-blue-500/10';
  };

  const getVerticalIcon = (v: string) => {
    if (v === 'awards') return <Activity className="w-4 h-4" />;
    if (v === 'leases') return <Building2 className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200 px-8 py-5 shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900">My Leads</h1>
        <p className="text-sm text-gray-500 mt-1">Leads you are actively working on.</p>
      </header>
      <div className="flex-1 overflow-auto p-8">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Active', value: stats.total, color: 'text-gray-900' },
            { label: 'Contacted', value: stats.contacted, color: 'text-blue-600' },
            { label: 'Purchased', value: stats.totalDealValue > 0 ? `${stats.purchased} · $${stats.totalDealValue.toLocaleString()}` : stats.purchased, color: 'text-green-600' },
            { label: 'Snoozed', value: stats.snoozed, color: 'text-gray-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center space-x-3">
          <div className="flex space-x-1 bg-white rounded-lg border border-gray-200 p-1">
            {(['all', 'awards', 'events', 'hiring', 'leases'] as const).map(v => (
              <button key={v} onClick={() => setVerticalFilter(v)} className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${verticalFilter === v ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{v}</button>
            ))}
          </div>
          <select className="text-sm border-gray-300 rounded-md shadow-sm bg-white focus:ring-indigo-500 focus:border-indigo-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="contacted">Contacted</option>
            <option value="active">Active</option>
            <option value="purchased">Purchased</option>
            <option value="snoozed">Snoozed</option>
            <option value="unqualified">Unqualified</option>
          </select>
          <button onClick={() => setSortBy(s => s === 'urgency_score' ? 'date_discovered' : 'urgency_score')} className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
            <ArrowUpDown className="w-4 h-4 mr-1.5" />{sortBy === 'urgency_score' ? 'By Score' : 'By Date'}
          </button>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ul role="list" className="divide-y divide-gray-200">
            {filteredLeads.map(lead => (
              <li key={lead.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedLead(lead)}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-indigo-600 truncate">{lead.company_name}</p>
                      <div className="ml-2 flex space-x-2 shrink-0">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">{lead.status}</span>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ring-1 ring-inset ${getScoreColor(lead.urgency_score)}`}>Score: {lead.urgency_score}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 truncate">{lead.trigger_detail}</p>
                    <div className="mt-1 flex items-center text-xs text-gray-500 space-x-3">
                      <span className="flex items-center capitalize">{getVerticalIcon(lead.vertical)}<span className="ml-1">{lead.vertical}</span></span>
                      <span className="flex items-center"><Building2 className="w-3 h-3 mr-1 text-gray-400"/>{lead.distributor_territory}</span>
                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1 text-gray-400"/>{new Date(lead.date_discovered).toLocaleDateString()}</span>
                      {(lead.deal_value ?? 0) > 0 && <span className="text-green-600 font-medium">${lead.deal_value!.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {filteredLeads.length === 0 && (
              <li className="px-6 py-12 text-center text-gray-500">
                {activeLeads.length === 0 ? 'No active leads yet. Start contacting leads from the Dashboard!' : 'No leads match your current filters.'}
              </li>
            )}
          </ul>
        </div>
      </div>
      {selectedLead && <LeadCard lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}
