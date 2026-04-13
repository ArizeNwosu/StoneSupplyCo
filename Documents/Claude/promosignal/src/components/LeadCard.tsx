import { useState, useEffect } from 'react';
import { Lead } from '../types';
import { X, Building2, MapPin, Users, Briefcase, Calendar, DollarSign, Target, Award, Megaphone, Link as LinkIcon, CheckSquare, Square, Plus, Check } from 'lucide-react';
import EmailGenerator from './EmailGenerator';
import { useLeads } from '../context/LeadContext';
import { motion, AnimatePresence } from 'motion/react';

interface LeadCardProps {
  lead: Lead;
  onClose: () => void;
}

export default function LeadCard({ lead: initialLead, onClose }: LeadCardProps) {
  const { leads, updateLeadStatus, addTask, toggleTask, updateLeadNotes, updateLeadDealValue, updateLeadSnoozeDate } = useLeads();
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  // Get the latest lead data from context
  const lead = leads.find(l => l.id === initialLead.id) || initialLead;

  const [notes, setNotes] = useState(lead.notes || '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [dealValue, setDealValue] = useState(lead.deal_value?.toString() || '');

  useEffect(() => {
    setNotes(lead.notes || '');
  }, [lead.notes]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLeadStatus(lead.id, e.target.value as Lead['status']);
  };

  const handleNotesBlur = async () => {
    await updateLeadNotes(lead.id, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleDealValueBlur = async () => {
    const val = parseFloat(dealValue);
    if (!isNaN(val) && val >= 0) {
      await updateLeadDealValue(lead.id, val);
    }
  };

  const handleSnoozeDateChange = async (date: string) => {
    await updateLeadSnoozeDate(lead.id, date);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;
    
    addTask(lead.id, {
      description: newTaskDesc,
      dueDate: newTaskDate || new Date().toISOString().split('T')[0],
      completed: false
    });
    setNewTaskDesc('');
    setNewTaskDate('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 50) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const renderVerticalSpecificDetails = () => {
    switch (lead.vertical) {
      case 'awards':
        return (
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Event Name</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center"><Award className="w-4 h-4 mr-2 text-indigo-500"/> {lead.event_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Event Date</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center"><Calendar className="w-4 h-4 mr-2 text-indigo-500"/> {lead.event_date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Est. Awards Needed</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{lead.estimated_awards_needed}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Budget Estimate</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center"><DollarSign className="w-4 h-4 mr-1 text-green-600"/> {lead.budget_estimate}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Categories</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {lead.award_categories.map((cat, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      case 'events':
        return (
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Event Name</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center"><Megaphone className="w-4 h-4 mr-2 text-indigo-500"/> {lead.event_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Sponsorship Level</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{lead.sponsorship_level}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Est. Attendees</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center"><Users className="w-4 h-4 mr-2 text-indigo-500"/> {lead.estimated_attendees.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Est. Swag Budget</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center"><DollarSign className="w-4 h-4 mr-1 text-green-600"/> {lead.estimated_swag_budget}</p>
            </div>
          </div>
        );
      case 'hiring':
        return (
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Open Positions</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center"><Briefcase className="w-4 h-4 mr-2 text-indigo-500"/> {lead.open_positions}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Growth Rate</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{lead.hiring_growth_rate}x</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Recent Funding</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{lead.recent_funding || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Est. Onboarding Budget</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center"><DollarSign className="w-4 h-4 mr-1 text-green-600"/> {lead.estimated_onboarding_budget}</p>
            </div>
          </div>
        );
      case 'leases':
        return (
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Lease Size</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center"><Building2 className="w-4 h-4 mr-2 text-indigo-500"/> {lead.lease_size.toLocaleString()} sq ft</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Lease Type</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{lead.lease_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Est. Employees in Office</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center"><Users className="w-4 h-4 mr-2 text-indigo-500"/> {lead.estimated_employees_in_office}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Est. Budget</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center"><DollarSign className="w-4 h-4 mr-1 text-green-600"/> {lead.estimated_branded_items_budget}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-2xl transform transition ease-in-out duration-500 sm:duration-700">
            <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
              
              {/* Header */}
              <div className="bg-gray-50 px-4 py-6 sm:px-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-2xl font-bold text-gray-900" id="slide-over-title">{lead.company_name}</h2>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border cursor-help ${getScoreColor(lead.urgency_score)}`}
                        title="Urgency Score: 0-100 based on time to event, company size, and other signals."
                      >
                        Score: {lead.urgency_score}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 flex items-center">
                      <Target className="w-4 h-4 mr-1"/> {lead.trigger_detail}
                    </p>
                  </div>
                  <div className="ml-3 flex h-7 items-center">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close panel</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                {/* Status Update */}
                <div className="mt-4 flex items-center flex-wrap gap-3">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <select
                    value={lead.status}
                    onChange={handleStatusChange}
                    className="block w-48 rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-gray-900 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="active">Active</option>
                    <option value="purchased">Purchased</option>
                    <option value="snoozed">Snoozed</option>
                    <option value="unqualified">Unqualified</option>
                  </select>

                  {lead.status === 'purchased' && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <input
                        type="number"
                        min="0"
                        placeholder="Deal value"
                        className="w-32 rounded-md border-gray-300 py-1.5 px-2 text-sm focus:ring-2 focus:ring-indigo-600"
                        value={dealValue}
                        onChange={e => setDealValue(e.target.value)}
                        onBlur={handleDealValueBlur}
                      />
                    </div>
                  )}

                  {lead.status === 'snoozed' && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <input
                        type="date"
                        className="rounded-md border-gray-300 py-1.5 px-2 text-sm focus:ring-2 focus:ring-indigo-600"
                        value={lead.snooze_until?.split('T')[0] || ''}
                        onChange={e => handleSnoozeDateChange(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="relative flex-1 px-4 py-6 sm:px-6">
                
                {/* Sources */}
                {lead.sources && lead.sources.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 uppercase tracking-wider">Signal Sources</h3>
                    <div className="flex flex-wrap gap-2">
                      {lead.sources.map((source, idx) => (
                        <a 
                          key={idx} 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          <LinkIcon className="w-3 h-3 mr-1" />
                          {source.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Urgency Breakdown */}
                {lead.urgency_breakdown && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Urgency Breakdown</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Time to Event</p>
                        <div className="flex items-end">
                          <span className="text-2xl font-bold text-gray-900">{lead.urgency_breakdown.timeToEvent}</span>
                          <span className="text-sm text-gray-500 ml-1 mb-1">pts</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Company Size</p>
                        <div className="flex items-end">
                          <span className="text-2xl font-bold text-gray-900">{lead.urgency_breakdown.companySize}</span>
                          <span className="text-sm text-gray-500 ml-1 mb-1">pts</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Recent Activity</p>
                        <div className="flex items-end">
                          <span className="text-2xl font-bold text-gray-900">{lead.urgency_breakdown.recentActivity}</span>
                          <span className="text-sm text-gray-500 ml-1 mb-1">pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Overview */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Company Profile</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Industry</p>
                      <p className="mt-1 text-sm text-gray-900">{lead.industry}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Headquarters</p>
                      <p className="mt-1 text-sm text-gray-900 flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400"/> {lead.headquarters}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company Size</p>
                      <p className="mt-1 text-sm text-gray-900 flex items-center"><Users className="w-4 h-4 mr-1 text-gray-400"/> {lead.company_size} employees</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Competitor Tracking</p>
                      <p className="mt-1 text-sm text-gray-900">{lead.competitor_tracking}</p>
                    </div>
                  </div>
                </div>

                {/* Vertical Specific Details */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 border-b pb-2">Trigger Details ({lead.vertical})</h3>
                  {renderVerticalSpecificDetails()}
                </div>

                {/* Contact Info */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Primary Contact</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-base font-medium text-gray-900">{lead.primary_contact}</p>
                    <div className="mt-2 flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-6">
                      <p className="text-sm text-gray-600 flex items-center">
                        <a href={`mailto:${lead.contact_email}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">{lead.contact_email}</a>
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <a href={`tel:${lead.contact_phone}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">{lead.contact_phone}</a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tasks Section */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Follow-up Tasks</h3>
                  
                  {/* Task List */}
                  {lead.tasks && lead.tasks.length > 0 ? (
                    <ul className="space-y-3 mb-4">
                      <AnimatePresence>
                        {lead.tasks.map(task => (
                          <motion.li 
                            key={task.id} 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                            className="flex items-start"
                          >
                            <button 
                              onClick={() => toggleTask(lead.id, task.id)}
                              className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-indigo-600 focus:outline-none"
                            >
                              <motion.div
                                animate={task.completed ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.3 }}
                              >
                                {task.completed ? (
                                  <CheckSquare className="h-5 w-5 text-indigo-600" />
                                ) : (
                                  <Square className="h-5 w-5" />
                                )}
                              </motion.div>
                            </button>
                            <div className={`ml-3 flex-1 transition-all duration-300 ${task.completed ? 'opacity-50 line-through' : ''}`}>
                              <p className="text-sm font-medium text-gray-900">{task.description}</p>
                              <p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">No tasks scheduled for this lead.</p>
                  )}

                  {/* Add Task Form */}
                  <form onSubmit={handleAddTask} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Task description..."
                          value={newTaskDesc}
                          onChange={(e) => setNewTaskDesc(e.target.value)}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                      <div className="w-40">
                        <input
                          type="date"
                          value={newTaskDate}
                          onChange={(e) => setNewTaskDate(e.target.value)}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!newTaskDesc.trim()}
                        className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </button>
                    </div>
                  </form>
                </div>

                {/* Notes Section */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-2 border-b pb-2">
                    <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                    {notesSaved && (
                      <span className="text-xs text-green-600 flex items-center">
                        <Check className="w-3 h-3 mr-1" />Saved
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
                    placeholder="Free-form notes about this lead..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                  />
                </div>

                {/* Email Generator */}
                <EmailGenerator lead={lead} onClose={onClose} />

              </div>

              {/* Footer Actions */}
              <div className="flex flex-shrink-0 justify-end px-4 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
