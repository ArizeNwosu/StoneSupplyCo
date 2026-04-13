import { useState } from 'react';
import { useLeads } from '../context/LeadContext';
import { Template, Vertical } from '../types';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

type VFilter = Vertical | 'all';
const TABS: VFilter[] = ['all', 'awards', 'events', 'hiring', 'leases'];
const TAB_LABELS: Record<VFilter, string> = { all: 'All', awards: 'Awards', events: 'Events', hiring: 'Hiring', leases: 'Leases' };

export default function Templates() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useLeads();
  const [editing, setEditing] = useState<Omit<Template, 'createdAt'> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tab, setTab] = useState<VFilter>('all');

  const filtered = tab === 'all' ? templates : templates.filter(t => !t.vertical || t.vertical === 'all' || t.vertical === tab);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setIsSaving(true);
    try {
      if (isCreating) {
        await addTemplate({ name: editing.name, subject: editing.subject, body: editing.body, vertical: editing.vertical });
      } else {
        await updateTemplate(editing.id, { name: editing.name, subject: editing.subject, body: editing.body, vertical: editing.vertical });
      }
      setEditing(null);
      setIsCreating(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this template?')) await deleteTemplate(id);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Outreach Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage your email templates.</p>
        </div>
        <button onClick={() => { setEditing({ id: '', name: '', subject: '', body: '', vertical: 'all' }); setIsCreating(true); }} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />New Template
        </button>
      </header>
      <div className="flex-1 overflow-auto p-8">
        {editing ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-lg font-medium text-gray-900">{isCreating ? 'Create Template' : 'Edit Template'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-500"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input required type="text" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" placeholder="e.g., Post-Event Follow Up" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vertical</label>
                  <select value={editing.vertical || 'all'} onChange={e => setEditing({ ...editing, vertical: e.target.value as VFilter })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border">
                    {TABS.map(v => <option key={v} value={v}>{TAB_LABELS[v]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                <input required type="text" value={editing.subject} onChange={e => setEditing({ ...editing, subject: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                <textarea required rows={8} value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border font-sans" />
                <p className="mt-1 text-xs text-gray-500">Use [Name], [Company], [Trigger Event] as placeholders.</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                  <Save className="h-4 w-4 mr-2" />{isSaving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-6">
                {TABS.map(v => (
                  <button key={v} onClick={() => setTab(v)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize ${tab === v ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {TAB_LABELS[v]}
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                      {v === 'all' ? templates.length : templates.filter(t => !t.vertical || t.vertical === 'all' || t.vertical === v).length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(t => (
                <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <h3 className="text-base font-medium text-gray-900 truncate">{t.name}</h3>
                      {t.vertical && t.vertical !== 'all' && <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full capitalize">{t.vertical}</span>}
                    </div>
                    <div className="flex space-x-1 shrink-0">
                      <button onClick={() => { setEditing(t); setIsCreating(false); }} className="p-1 text-gray-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-sm font-medium text-gray-900 mb-2 truncate">Subj: <span className="font-normal text-gray-600">{t.subject}</span></p>
                    <div className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap flex-1">{t.body}</div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500 mb-3">No templates found.</p>
                  <button onClick={() => { setEditing({ id: '', name: '', subject: '', body: '', vertical: 'all' }); setIsCreating(true); }} className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500">
                    <Plus className="h-4 w-4 mr-1" />Create your first template
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
