import { useState, useEffect } from 'react';
import { useLeads } from '../context/LeadContext';
import { Save, Sparkles, Clock, CheckCircle2, User } from 'lucide-react';
import { Vertical } from '../types';

type ScanVertical = Vertical | 'all';

const VERTICALS: { value: Vertical; label: string }[] = [
  { value: 'awards', label: 'Awards' },
  { value: 'events', label: 'Events' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'leases', label: 'Leases' },
];

const SCAN_VERTICALS: { value: ScanVertical; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'awards', label: 'Awards' },
  { value: 'events', label: 'Events' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'leases', label: 'Leases' },
];

export default function Settings() {
  const { settings, updateSettings } = useLeads();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => { setLocalSettings(settings); }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await updateSettings(localSettings);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSpecialization = (v: Vertical) => {
    const current = localSettings.specializations || [];
    const updated = current.includes(v) ? current.filter(s => s !== v) : [...current, v];
    setLocalSettings(s => ({ ...s, specializations: updated }));
  };

  const toggleScanVertical = (v: ScanVertical) => {
    if (v === 'all') {
      setLocalSettings(s => ({ ...s, autoScanVerticals: [] }));
      return;
    }
    const current = localSettings.autoScanVerticals || [];
    const updated = current.includes(v as Vertical)
      ? current.filter(x => x !== v)
      : [...current, v as Vertical];
    setLocalSettings(s => ({ ...s, autoScanVerticals: updated }));
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200 px-8 py-5 shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences.</p>
      </header>
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* User Profile */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center">
              <User className="w-5 h-5 text-indigo-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">User Profile</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Your name"
                    value={localSettings.displayName || ''}
                    onChange={e => setLocalSettings(s => ({ ...s, displayName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Your company"
                    value={localSettings.companyName || ''}
                    onChange={e => setLocalSettings(s => ({ ...s, companyName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Territory</label>
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., West Coast, Bay Area, National"
                  value={localSettings.territory || ''}
                  onChange={e => setLocalSettings(s => ({ ...s, territory: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                <div className="flex space-x-3">
                  {VERTICALS.map(v => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => toggleSpecialization(v.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        (localSettings.specializations || []).includes(v.value)
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Signature</label>
                <p className="text-xs text-gray-500 mb-2">Appended to AI-generated outreach emails.</p>
                <textarea
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={"Best,\nYour Name\nYour Company | your@email.com | (555) 000-0000"}
                  value={localSettings.emailSignature || ''}
                  onChange={e => setLocalSettings(s => ({ ...s, emailSignature: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* AI Lead Scanner */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center">
              <Sparkles className="w-5 h-5 text-indigo-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Automated AI Lead Scanner</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Enable Auto-Scan</h3>
                  <p className="text-sm text-gray-500">Automatically search the web for new leads in the background.</p>
                </div>
                <button
                  type="button"
                  className={`${localSettings.autoScanEnabled ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                  role="switch"
                  aria-checked={localSettings.autoScanEnabled}
                  onClick={() => setLocalSettings(s => ({ ...s, autoScanEnabled: !s.autoScanEnabled }))}
                >
                  <span
                    aria-hidden="true"
                    className={`${localSettings.autoScanEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
              {localSettings.autoScanEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scan Schedule</label>
                    <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                      <Clock className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                      Daily at 5:00 AM EST
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Signal Verticals</label>
                    <p className="text-xs text-gray-500 mb-2">Select which lead types to scan for automatically.</p>
                    <div className="flex space-x-2">
                      {SCAN_VERTICALS.map(v => {
                        const isAll = v.value === 'all';
                        const active = isAll
                          ? (localSettings.autoScanVerticals || []).length === 0
                          : (localSettings.autoScanVerticals || []).includes(v.value as Vertical);
                        return (
                          <button
                            key={v.value}
                            type="button"
                            onClick={() => toggleScanVertical(v.value)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                              active
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {v.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Context <span className="font-normal text-gray-400">(optional)</span></label>
                    <textarea
                      rows={2}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={localSettings.autoScanPrompt}
                      onChange={e => setLocalSettings(s => ({ ...s, autoScanPrompt: e.target.value }))}
                      placeholder="e.g., Focus on SaaS companies in the Southeast under 500 employees"
                    />
                  </div>
                  {settings.lastScanTime && (
                    <p className="text-xs text-gray-400">Last scan: {new Date(settings.lastScanTime).toLocaleString()}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
            <div className="text-sm text-green-600 flex items-center">
              {saveMessage && <><CheckCircle2 className="w-4 h-4 mr-1" />{saveMessage}</>}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
