import { useState, useMemo } from 'react';
import { useLeads } from '../context/LeadContext';
import { Lead, Vertical } from '../types';
import LeadCard from './LeadCard';
import AddLeadModal from './AddLeadModal';
import AILeadScannerModal from './AILeadScannerModal';
import { Filter, Search, ChevronDown, Activity, Clock, Building2, Users, ArrowUpDown, Trash2, Tag, CheckSquare, Plus, Database, Sparkles, Download } from 'lucide-react';

export default function Dashboard() {
  const { leads, deleteLeads, updateLeadsStatus, assignLeadsTerritory, loadSampleData } = useLeads();
  const [selectedVertical, setSelectedVertical] = useState<Vertical | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  
  // New filters and sorting
  const [territoryFilter, setTerritoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'urgency_score' | 'company_name' | 'date_discovered'>('urgency_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Vertical-specific filters
  const [awardTimeToEvent, setAwardTimeToEvent] = useState('all');
  const [eventSponsorshipLevel, setEventSponsorshipLevel] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [hiringOpenPositions, setHiringOpenPositions] = useState('all');
  const [leaseSizeRange, setLeaseSizeRange] = useState('all');
  const [leaseType, setLeaseType] = useState('all');

  // Bulk actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  // Extract unique territories for the filter dropdown
  const territories = useMemo(() => {
    const t = new Set(leads.map(l => l.distributor_territory));
    return Array.from(t);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesVertical = selectedVertical === 'all' || lead.vertical === selectedVertical;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        lead.company_name.toLowerCase().includes(q) ||
        lead.trigger_detail.toLowerCase().includes(q) ||
        lead.industry.toLowerCase().includes(q) ||
        lead.trigger_type.toLowerCase().includes(q);
      const matchesTerritory = territoryFilter === 'all' || lead.distributor_territory === territoryFilter;
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

      let matchesVF = true;
      if (lead.vertical === 'awards' && awardTimeToEvent !== 'all') {
        const days = Math.ceil((new Date((lead as any).event_date).getTime() - Date.now()) / 86400000);
        if (awardTimeToEvent === '0-30') matchesVF = days >= 0 && days <= 30;
        else if (awardTimeToEvent === '30-60') matchesVF = days > 30 && days <= 60;
        else if (awardTimeToEvent === '60-90') matchesVF = days > 60 && days <= 90;
        else if (awardTimeToEvent === '90+') matchesVF = days > 90;
      }
      if (lead.vertical === 'events') {
        if (eventSponsorshipLevel !== 'all') matchesVF = matchesVF && (lead as any).sponsorship_level === eventSponsorshipLevel;
        if (eventType !== 'all') matchesVF = matchesVF && (lead as any).event_type === eventType;
      }
      if (lead.vertical === 'hiring' && hiringOpenPositions !== 'all') {
        const p = (lead as any).open_positions || 0;
        if (hiringOpenPositions === '5-10') matchesVF = p >= 5 && p <= 10;
        else if (hiringOpenPositions === '10-20') matchesVF = p > 10 && p <= 20;
        else if (hiringOpenPositions === '20+') matchesVF = p > 20;
      }
      if (lead.vertical === 'leases') {
        if (leaseSizeRange !== 'all') {
          const sz = (lead as any).lease_size || 0;
          if (leaseSizeRange === '5k-25k') matchesVF = matchesVF && sz >= 5000 && sz <= 25000;
          else if (leaseSizeRange === '25k-50k') matchesVF = matchesVF && sz > 25000 && sz <= 50000;
          else if (leaseSizeRange === '50k+') matchesVF = matchesVF && sz > 50000;
        }
        if (leaseType !== 'all') matchesVF = matchesVF && (lead as any).lease_type === leaseType;
      }

      return matchesVertical && matchesSearch && matchesTerritory && matchesStatus && matchesVF;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'urgency_score') {
        comparison = a.urgency_score - b.urgency_score;
      } else if (sortBy === 'company_name') {
        comparison = a.company_name.localeCompare(b.company_name);
      } else if (sortBy === 'date_discovered') {
        comparison = new Date(a.date_discovered).getTime() - new Date(b.date_discovered).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [leads, selectedVertical, searchQuery, territoryFilter, statusFilter, sortBy, sortOrder,
      awardTimeToEvent, eventSponsorshipLevel, eventType, hiringOpenPositions, leaseSizeRange, leaseType]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-600 bg-red-50 ring-red-500/10';
    if (score >= 50) return 'text-orange-600 bg-orange-50 ring-orange-500/10';
    return 'text-blue-600 bg-blue-50 ring-blue-500/10';
  };

  const getVerticalIcon = (vertical: string) => {
    switch (vertical) {
      case 'awards': return <Activity className="w-4 h-4" />;
      case 'events': return <Users className="w-4 h-4" />;
      case 'hiring': return <Users className="w-4 h-4" />;
      case 'leases': return <Building2 className="w-4 h-4" />;
      default: return null;
    }
  };

  const toggleLeadSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedLeadIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedLeadIds(newSelection);
  };

  const selectAllLeads = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedLeadIds.size} leads?`)) {
      deleteLeads(Array.from(selectedLeadIds));
      setSelectedLeadIds(new Set());
    }
  };

  const handleBulkStatusChange = (status: Lead['status']) => {
    updateLeadsStatus(Array.from(selectedLeadIds), status);
    setSelectedLeadIds(new Set());
  };

  const handleBulkTerritoryChange = (territory: string) => {
    assignLeadsTerritory(Array.from(selectedLeadIds), territory);
    setSelectedLeadIds(new Set());
  };

  const handleLoadSampleData = async () => {
    setIsLoadingSample(true);
    await loadSampleData();
    setIsLoadingSample(false);
  };

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ['Company','Vertical','Trigger Type','Trigger Detail','Industry','Status','Urgency Score','Territory','Contact','Email','Phone','HQ','Company Size','Date Discovered','Deal Value','Notes'];
    const rows = filteredLeads.map(l => [
      l.company_name, l.vertical, l.trigger_type, l.trigger_detail, l.industry,
      l.status, l.urgency_score, l.distributor_territory, l.primary_contact,
      l.contact_email, l.contact_phone, l.headquarters, l.company_size,
      new Date(l.date_discovered).toLocaleDateString(),
      l.deal_value ?? '', (l.notes ?? '').replace(/\n/g, ' '),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `promosignal-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prospecting Feed</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time trigger events for promotional products.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies, industry..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters & Sort
          </button>
          <button 
            onClick={() => setShowScannerModal(true)}
            className="inline-flex items-center px-4 py-2 border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
            AI Lead Finder
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            title={`Export ${filteredLeads.length} leads`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm disabled:opacity-40"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8">
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Territory</label>
                <select
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={territoryFilter}
                  onChange={(e) => setTerritoryFilter(e.target.value)}
                >
                  <option value="all">All Territories</option>
                  {territories.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="active">Active</option>
                  <option value="purchased">Purchased</option>
                  <option value="snoozed">Snoozed</option>
                  <option value="unqualified">Unqualified</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="urgency_score">Urgency Score</option>
                  <option value="company_name">Company Name</option>
                  <option value="date_discovered">Date Discovered</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </button>
              </div>
            </div>
            {/* Vertical-specific sub-filters */}
            {selectedVertical === 'awards' && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-700 mb-1 mt-3">Time to Event</label>
                <select className="border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={awardTimeToEvent} onChange={e => setAwardTimeToEvent(e.target.value)}>
                  <option value="all">Any Time</option>
                  <option value="0-30">0–30 days</option>
                  <option value="30-60">30–60 days</option>
                  <option value="60-90">60–90 days</option>
                  <option value="90+">90+ days</option>
                </select>
              </div>
            )}
            {selectedVertical === 'events' && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100 flex space-x-4">
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sponsorship Level</label>
                  <select className="border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={eventSponsorshipLevel} onChange={e => setEventSponsorshipLevel(e.target.value)}>
                    <option value="all">All Levels</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Exhibitor">Exhibitor</option>
                  </select>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Event Type</label>
                  <select className="border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={eventType} onChange={e => setEventType(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="Trade Show">Trade Show</option>
                    <option value="Conference">Conference</option>
                    <option value="User Conference">User Conference</option>
                    <option value="Webinar">Webinar</option>
                  </select>
                </div>
              </div>
            )}
            {selectedVertical === 'hiring' && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-700 mb-1 mt-3">Open Positions</label>
                <select className="border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={hiringOpenPositions} onChange={e => setHiringOpenPositions(e.target.value)}>
                  <option value="all">Any</option>
                  <option value="5-10">5–10</option>
                  <option value="10-20">10–20</option>
                  <option value="20+">20+</option>
                </select>
              </div>
            )}
            {selectedVertical === 'leases' && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100 flex space-x-4">
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lease Size</label>
                  <select className="border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={leaseSizeRange} onChange={e => setLeaseSizeRange(e.target.value)}>
                    <option value="all">Any Size</option>
                    <option value="5k-25k">5k–25k sq ft</option>
                    <option value="25k-50k">25k–50k sq ft</option>
                    <option value="50k+">50k+ sq ft</option>
                  </select>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lease Type</label>
                  <select className="border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={leaseType} onChange={e => setLeaseType(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="New Office">New Office</option>
                    <option value="Expansion">Expansion</option>
                    <option value="Relocation">Relocation</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {selectedLeadIds.size > 0 && (
          <div className="mb-6 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between shadow-sm">
            <div className="flex items-center">
              <span className="text-sm font-medium text-indigo-800 mr-4">
                {selectedLeadIds.size} lead{selectedLeadIds.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2 border-l border-indigo-200 pl-4">
                <select 
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  onChange={(e) => {
                    if (e.target.value) handleBulkStatusChange(e.target.value as Lead['status']);
                    e.target.value = '';
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Change Status...</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="active">Active</option>
                  <option value="purchased">Purchased</option>
                  <option value="snoozed">Snoozed</option>
                  <option value="unqualified">Unqualified</option>
                </select>
                <select 
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  onChange={(e) => {
                    if (e.target.value) handleBulkTerritoryChange(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Assign Territory...</option>
                  {territories.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete Selected
            </button>
          </div>
        )}

        {/* Vertical Tabs */}
        <div className="mb-8 border-b border-gray-200 flex items-center justify-between">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['all', 'awards', 'events', 'hiring', 'leases'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedVertical(tab as any)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize
                  ${selectedVertical === tab 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
          {filteredLeads.length > 0 && (
            <button 
              onClick={selectAllLeads}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
              <CheckSquare className="w-4 h-4 mr-1.5" />
              {selectedLeadIds.size === filteredLeads.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {/* Leads List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ul role="list" className="divide-y divide-gray-200">
            {filteredLeads.map((lead) => (
              <li 
                key={lead.id} 
                className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${selectedLeadIds.has(lead.id) ? 'bg-indigo-50/50' : ''}`}
                onClick={() => setSelectedLead(lead)}
              >
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0 pr-4">
                    <div 
                      className="mr-4 flex-shrink-0"
                      onClick={(e) => toggleLeadSelection(lead.id, e)}
                    >
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                        checked={selectedLeadIds.has(lead.id)}
                        readOnly
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-indigo-600 truncate">{lead.company_name}</p>
                        <div className="ml-2 flex-shrink-0 flex space-x-2">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                            {lead.status}
                          </span>
                          <p 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ring-1 ring-inset cursor-help ${getScoreColor(lead.urgency_score)}`}
                            title="Urgency Score: 0-100 based on time to event, company size, and other signals."
                          >
                            Score: {lead.urgency_score}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-900">
                        <span className="font-semibold">{lead.trigger_detail}</span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4 flex-wrap gap-y-2">
                        <span className="flex items-center capitalize">
                          {getVerticalIcon(lead.vertical)}
                          <span className="ml-1.5">{lead.vertical}</span>
                        </span>
                        <span className="flex items-center">
                          <Building2 className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {lead.industry}
                        </span>
                        <span className="flex items-center">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {new Date(lead.date_discovered).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <ChevronDown className="h-5 w-5 text-gray-400 -rotate-90" />
                  </div>
                </div>
              </li>
            ))}
            {filteredLeads.length === 0 && (
              <li className="px-6 py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No leads found</h3>
                <p className="text-gray-500 max-w-sm mb-6">
                  {leads.length === 0 
                    ? "Your database is empty. You can add leads manually or load some sample data to get started." 
                    : "No leads match your current filter criteria."}
                </p>
                {leads.length === 0 && (
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Manual Lead
                    </button>
                    <button 
                      onClick={handleLoadSampleData}
                      disabled={isLoadingSample}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm disabled:opacity-50"
                    >
                      {isLoadingSample ? 'Loading...' : 'Load Sample Data'}
                    </button>
                  </div>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Lead Detail Slide-over */}
      {selectedLead && (
        <LeadCard lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal onClose={() => setShowAddModal(false)} />
      )}

      {/* AI Lead Scanner Modal */}
      {showScannerModal && (
        <AILeadScannerModal onClose={() => setShowScannerModal(false)} />
      )}
    </div>
  );
}
