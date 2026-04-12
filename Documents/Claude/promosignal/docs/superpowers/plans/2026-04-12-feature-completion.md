# PromoSignal Feature Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete 11 gaps between the existing PromoSignal codebase and the PRD — bug fixes, new lead fields, user profile settings, email generator improvements, Firestore-backed templates, CSV export, vertical filters, My Leads enhancements, and Analytics enhancements.

**Architecture:** All in-place edits to the existing stack. LeadContext expands to own templates (flat `templates` Firestore collection with `userId` field, same pattern as `leads`). No new npm dependencies needed.

**Tech Stack:** Vite 6 + React 19 + TypeScript 5.8 + Tailwind CSS v4 + Firebase 12 + @google/genai 1.29 + Recharts 3 + lucide-react + motion

---

## File Map

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `notes?`, `deal_value?`, `snooze_until?` to BaseLead; add `Template` interface |
| `src/context/LeadContext.tsx` | Export `UserSettings`; add profile fields; template CRUD; lead field update methods |
| `src/pages/Settings.tsx` | Add user profile section (name, company, territory, specializations, email signature) |
| `src/components/LeadCard.tsx` | Add Notes section; conditional deal value + snooze date inputs |
| `src/components/EmailGenerator.tsx` | Fix API key/model; add edit mode, signature injection, template picker, save-to-template |
| `src/pages/Templates.tsx` | Migrate to Firestore via LeadContext; add vertical filter tabs |
| `src/components/Dashboard.tsx` | Add CSV export button; add vertical-specific sub-filters |
| `src/pages/MyLeads.tsx` | Add stats bar (4 tiles) + vertical/status filters |
| `src/pages/Analytics.tsx` | Add KPI stat cards row + weekly trend LineChart |

---

## Task 1: Fix EmailGenerator — API Key and Model

**Files:** Modify `src/components/EmailGenerator.tsx`

- [ ] **Step 1: Move `ai` to module scope and fix model**

In `src/components/EmailGenerator.tsx`, after the imports block, add:
```tsx
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
```

Inside `generateEmail`, remove the local `const ai = ...` line and change the model from `'gemini-3-flash-preview'` to `'gemini-2.5-flash'`:
```tsx
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
```

- [ ] **Step 2: TypeScript check**
```bash
cd /Users/riz/Documents/Claude/promosignal && npm run lint
```
Expected: No errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/EmailGenerator.tsx
git commit -m "fix: correct EmailGenerator API key env var and model name"
```

---

## Task 2: Extend Type Definitions

**Files:** Modify `src/types/index.ts`

- [ ] **Step 1: Add fields to `BaseLead`**

Add three optional fields to `BaseLead` after `sources?`:
```ts
  notes?: string;
  deal_value?: number;
  snooze_until?: string;
```

- [ ] **Step 2: Add `Template` interface**

Append at the end of `src/types/index.ts`:
```ts
export interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  vertical?: Vertical | 'all';
  createdAt: string;
}
```

- [ ] **Step 3: TypeScript check + commit**
```bash
cd /Users/riz/Documents/Claude/promosignal && npm run lint && git add src/types/index.ts && git commit -m "feat: extend BaseLead with notes/deal_value/snooze_until; add Template type"
```

---

## Task 3: Extend LeadContext

**Files:** Modify `src/context/LeadContext.tsx`

- [ ] **Step 1: Update import line to include `Template` and `Vertical`**

```tsx
import { Lead, Task, Template, Vertical } from '../types';
```

- [ ] **Step 2: Replace `UserSettings` interface with exported, expanded version**

```tsx
export interface UserSettings {
  autoScanEnabled: boolean;
  autoScanFrequencyHours: number;
  lastScanTime: number | null;
  autoScanPrompt: string;
  displayName: string;
  companyName: string;
  territory: string;
  specializations: Vertical[];
  emailSignature: string;
}
```

- [ ] **Step 3: Update `defaultSettings`**

```tsx
const defaultSettings: UserSettings = {
  autoScanEnabled: false,
  autoScanFrequencyHours: 24,
  lastScanTime: null,
  autoScanPrompt: 'Tech companies in California that recently announced series A funding',
  displayName: '',
  companyName: '',
  territory: '',
  specializations: [],
  emailSignature: '',
};
```

- [ ] **Step 4: Update `LeadContextType` interface — replace the existing one with:**

```tsx
interface LeadContextType {
  leads: Lead[];
  updateLeadStatus: (leadId: string, status: Lead['status']) => void;
  addTask: (leadId: string, task: Omit<Task, 'id'>) => void;
  toggleTask: (leadId: string, taskId: string) => void;
  deleteLeads: (leadIds: string[]) => void;
  updateLeadsStatus: (leadIds: string[], status: Lead['status']) => void;
  assignLeadsTerritory: (leadIds: string[], territory: string) => void;
  addLead: (lead: Omit<Lead, 'id'>) => Promise<void>;
  loadSampleData: () => Promise<void>;
  updateLeadNotes: (leadId: string, notes: string) => Promise<void>;
  updateLeadDealValue: (leadId: string, dealValue: number) => Promise<void>;
  updateLeadSnoozeDate: (leadId: string, snoozeUntil: string) => Promise<void>;
  userId: string | null;
  isAuthReady: boolean;
  login: () => void;
  logout: () => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  templates: Template[];
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => Promise<void>;
  updateTemplate: (id: string, data: Partial<Omit<Template, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}
```

- [ ] **Step 5: Add `templates` state inside `LeadProvider`**

Right after `const [settings, setSettings] = useState<UserSettings>(defaultSettings);`:
```tsx
const [templates, setTemplates] = useState<Template[]>([]);
```

- [ ] **Step 6: Add Firestore templates listener inside the `useEffect([isAuthReady, userId])` block**

In the early-return branch, add `setTemplates([]);`:
```tsx
if (!isAuthReady || !userId) {
  setLeads([]);
  setSettings(defaultSettings);
  setTemplates([]);
  return;
}
```

After the `unsubscribeSettings` listener setup, add:
```tsx
const q2 = query(collection(db, 'templates'), where('userId', '==', userId));
const unsubscribeTemplates = onSnapshot(q2, (snapshot) => {
  const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Template[];
  setTemplates(fetched);
}, (error) => {
  handleFirestoreError(error, OperationType.LIST, 'templates');
});
```

In the cleanup return:
```tsx
return () => {
  unsubscribeLeads();
  unsubscribeSettings();
  unsubscribeTemplates();
};
```

- [ ] **Step 7: Add template CRUD methods (after `assignLeadsTerritory`)**

```tsx
const addTemplate = async (templateData: Omit<Template, 'id' | 'createdAt'>) => {
  if (!userId) return;
  try {
    await addDoc(collection(db, 'templates'), {
      ...templateData,
      userId,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'templates');
  }
};

const updateTemplate = async (id: string, data: Partial<Omit<Template, 'id' | 'createdAt'>>) => {
  if (!userId) return;
  try {
    await updateDoc(doc(db, 'templates', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `templates/${id}`);
  }
};

const deleteTemplate = async (id: string) => {
  if (!userId) return;
  try {
    await deleteDoc(doc(db, 'templates', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `templates/${id}`);
  }
};
```

- [ ] **Step 8: Add lead field update methods (after template methods)**

```tsx
const updateLeadNotes = async (leadId: string, notes: string) => {
  if (!userId) return;
  try {
    await updateDoc(doc(db, 'leads', leadId), { notes });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
  }
};

const updateLeadDealValue = async (leadId: string, dealValue: number) => {
  if (!userId) return;
  try {
    await updateDoc(doc(db, 'leads', leadId), { deal_value: dealValue });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
  }
};

const updateLeadSnoozeDate = async (leadId: string, snoozeUntil: string) => {
  if (!userId) return;
  try {
    await updateDoc(doc(db, 'leads', leadId), { snooze_until: snoozeUntil });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
  }
};
```

- [ ] **Step 9: Update `LeadContext.Provider` value to include all new members**

```tsx
<LeadContext.Provider value={{
  leads, updateLeadStatus, addTask, toggleTask, deleteLeads, updateLeadsStatus, assignLeadsTerritory,
  addLead, loadSampleData,
  updateLeadNotes, updateLeadDealValue, updateLeadSnoozeDate,
  userId, isAuthReady, login, logout,
  settings, updateSettings,
  templates, addTemplate, updateTemplate, deleteTemplate,
}}>
```

- [ ] **Step 10: TypeScript check + commit**
```bash
cd /Users/riz/Documents/Claude/promosignal && npm run lint && git add src/context/LeadContext.tsx && git commit -m "feat: add template CRUD, lead field update methods, and profile settings to LeadContext"
```

---

## Task 4: Settings Page — User Profile Section

**Files:** Replace `src/pages/Settings.tsx`

- [ ] **Step 1: Write new Settings.tsx**

```tsx
import { useState, useEffect } from 'react';
import { useLeads } from '../context/LeadContext';
import { Save, Sparkles, Clock, CheckCircle2, User } from 'lucide-react';
import { Vertical } from '../types';

const VERTICALS: { value: Vertical; label: string }[] = [
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scan Frequency</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={localSettings.autoScanFrequencyHours}
                        onChange={e => setLocalSettings(s => ({ ...s, autoScanFrequencyHours: Number(e.target.value) }))}
                      >
                        <option value={1}>Every Hour</option>
                        <option value={6}>Every 6 Hours</option>
                        <option value={12}>Every 12 Hours</option>
                        <option value={24}>Daily</option>
                        <option value={168}>Weekly</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Prompt</label>
                    <textarea
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={localSettings.autoScanPrompt}
                      onChange={e => setLocalSettings(s => ({ ...s, autoScanPrompt: e.target.value }))}
                      placeholder="e.g., Tech companies in California that recently announced series A funding"
                    />
                  </div>
                  {settings.lastScanTime && (
                    <p className="text-xs text-gray-500">Last scan: {new Date(settings.lastScanTime).toLocaleString()}</p>
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
```

- [ ] **Step 2: TypeScript check + commit**
```bash
cd /Users/riz/Documents/Claude/promosignal && npm run lint && git add src/pages/Settings.tsx && git commit -m "feat: add user profile section to Settings"
```

---

## Task 5: LeadCard — Notes, Deal Value, Snooze Date

**Files:** Modify `src/components/LeadCard.tsx`

- [ ] **Step 1: Add `Check` to lucide import and update `useLeads` destructure**

Change the lucide import to include `Check`:
```tsx
import { X, Building2, MapPin, Users, Briefcase, Calendar, DollarSign, Target, Award, Megaphone, Link as LinkIcon, CheckSquare, Square, Plus, Check } from 'lucide-react';
```

Update the `useLeads` destructure:
```tsx
const { leads, updateLeadStatus, addTask, toggleTask, updateLeadNotes, updateLeadDealValue, updateLeadSnoozeDate } = useLeads();
```

- [ ] **Step 2: Add state for notes, saved indicator, deal value**

After existing state declarations:
```tsx
const [notes, setNotes] = useState(lead.notes || '');
const [notesSaved, setNotesSaved] = useState(false);
const [dealValue, setDealValue] = useState(lead.deal_value?.toString() || '');
```

Add a useEffect to sync notes when the lead updates from Firestore:
```tsx
useEffect(() => {
  setNotes(lead.notes || '');
}, [lead.notes]);
```

Add `useEffect` to the imports if not already present: `import { useState, useEffect } from 'react';`

- [ ] **Step 3: Add handlers**

After existing handlers:
```tsx
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
```

- [ ] **Step 4: Replace the status section in the header**

Replace the existing `{/* Status Update */}` div with:
```tsx
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
```

- [ ] **Step 5: Add Notes section between Tasks and Email Generator**

Insert after the closing `</div>` of the Tasks Section and before `{/* Email Generator */}`:
```tsx
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
```

- [ ] **Step 6: TypeScript check + commit**
```bash
cd /Users/riz/Documents/Claude/promosignal && npm run lint && git add src/components/LeadCard.tsx && git commit -m "feat: add notes, deal value, and snooze date to LeadCard"
```

---

## Task 6: EmailGenerator — Full Rewrite

**Files:** Replace `src/components/EmailGenerator.tsx`

- [ ] **Step 1: Write new EmailGenerator.tsx**

```tsx
import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Lead, Template } from '../types';
import { Loader2, Copy, Check, Send, Save, BookOpen } from 'lucide-react';
import { useLeads } from '../context/LeadContext';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

interface EmailGeneratorProps {
  lead: Lead;
  onClose: () => void;
}

export default function EmailGenerator({ lead }: EmailGeneratorProps) {
  const { settings, templates, addTemplate } = useLeads();
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [hasContent, setHasContent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [savedTemplate, setSavedTemplate] = useState(false);

  const buildPrompt = () => {
    const distributorName = settings.displayName || '[Your Name]';
    const distributorCompany = settings.companyName || '[Your Company]';
    const sig = settings.emailSignature ? `\n\nAppend this exact signature at the end:\n${settings.emailSignature}` : '';

    let prompt = `You are an expert sales rep for a promo products distributor: ${distributorName} at ${distributorCompany}.
Write a short punchy cold email. Goal: get a reply, schedule a call. Not overly formal.

Company: ${lead.company_name}
Contact: ${lead.primary_contact}
Industry: ${lead.industry}
Trigger: ${lead.trigger_detail}
`;
    if (lead.vertical === 'awards') {
      prompt += `Vertical: Awards\nEvent: ${lead.event_name}\nEst Awards: ${lead.estimated_awards_needed}\nPitch: Custom awards/trophies for their event. Offer samples + quote.`;
    } else if (lead.vertical === 'events') {
      prompt += `Vertical: Event Swag\nEvent: ${lead.event_name}\nSponsorship: ${lead.sponsorship_level}\nPitch: Event swag attendees actually keep. Ideas for their booth.`;
    } else if (lead.vertical === 'hiring') {
      prompt += `Vertical: Onboarding Merch\nOpen Positions: ${lead.open_positions}\nPitch: Custom welcome kits + apparel for new hires improve retention.`;
    } else if (lead.vertical === 'leases') {
      prompt += `Vertical: Office Branded Items\nLease: ${lead.lease_size} sq ft in ${lead.location}\nPitch: New office = culture opportunity. Branded drinkware, desk accessories.`;
    }
    prompt += sig;
    return prompt;
  };

  const generateEmail = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: buildPrompt(),
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ['subject', 'body'],
          },
        },
      });
      const result = JSON.parse(response.text || '{}');
      setEmailSubject(result.subject || '');
      setEmailBody(result.body || '');
      setHasContent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate email.');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadTemplate = (t: Template) => {
    setEmailSubject(t.subject);
    setEmailBody(t.body);
    setHasContent(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const sendEmail = () => {
    window.location.href = `mailto:${lead.contact_email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    setIsSavingTemplate(true);
    try {
      await addTemplate({ name: templateName.trim(), subject: emailSubject, body: emailBody, vertical: lead.vertical });
      setSavedTemplate(true);
      setShowSaveForm(false);
      setTemplateName('');
      setTimeout(() => setSavedTemplate(false), 2000);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const relevantTemplates = templates.filter(t => !t.vertical || t.vertical === 'all' || t.vertical === lead.vertical);

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Outreach Generation</h3>
        <div className="flex items-center space-x-2">
          {relevantTemplates.length > 0 && (
            <div className="relative">
              <BookOpen className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                className="pl-8 text-sm border-gray-300 rounded-md shadow-sm bg-white pr-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                onChange={e => { const t = templates.find(t => t.id === e.target.value); if (t) loadTemplate(t); e.target.value = ''; }}
                defaultValue=""
              >
                <option value="" disabled>Use template...</option>
                {relevantTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          {!hasContent && !isGenerating && (
            <button onClick={generateEmail} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              Generate with AI
            </button>
          )}
        </div>
      </div>

      {isGenerating && (
        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
          <Loader2 className="h-6 w-6 text-indigo-600 animate-spin mr-3" />
          <span className="text-gray-600">Drafting personalized outreach...</span>
        </div>
      )}

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}

      {hasContent && !isGenerating && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Email Draft</span>
            <div className="flex space-x-2 items-center">
              <button onClick={generateEmail} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-2">Regenerate</button>
              <button onClick={copyToClipboard} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium px-2 border-l border-gray-300">
                {isCopied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={sendEmail} className="inline-flex items-center text-sm text-white bg-indigo-600 hover:bg-indigo-700 font-medium px-3 py-1 rounded-md">
                <Send className="h-3 w-3 mr-1.5" />Send
              </button>
            </div>
          </div>
          <div className="p-4 border-b border-gray-200">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Subject</label>
            <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="block w-full rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="p-4 border-b border-gray-200">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Body</label>
            <textarea rows={8} value={emailBody} onChange={e => setEmailBody(e.target.value)} className="block w-full rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-sans resize-none" />
          </div>
          <div className="p-4 bg-gray-50">
            {showSaveForm ? (
              <div className="flex items-center space-x-2">
                <input type="text" placeholder="Template name..." value={templateName} onChange={e => setTemplateName(e.target.value)} className="flex-1 rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                <button onClick={handleSaveTemplate} disabled={!templateName.trim() || isSavingTemplate} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                  {isSavingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
                <button onClick={() => setShowSaveForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowSaveForm(true)} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                {savedTemplate ? <><Check className="w-4 h-4 mr-1 text-green-500" />Saved!</> : <><Save className="w-4 h-4 mr-1" />Save as Template</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check + commit**
```bash
cd /Users/riz/Documents/Claude/promosignal && npm run lint && git add src/components/EmailGenerator.tsx && git commit -m "feat: EmailGenerator — edit mode, signature, template picker, save-to-template"
```

---

## Task 7: Templates Page — Firestore Migration + Vertical Tags

**Files:** Replace `src/pages/Templates.tsx`

- [ ] **Step 1: Write new Templates.tsx**

```tsx
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
```

- [ ] **Step 2: TypeScript check + commit**
```bash
cd /Users/riz/Documents/Claude/promosignal && npm run lint && git add src/pages/Templates.tsx && git commit -m "feat: migrate Templates to Firestore with vertical filter tabs"
```

---

## Task 8: Dashboard — CSV Export

**Files:** Modify `src/components/Dashboard.tsx`

- [ ] **Step 1: Add `Download` to the lucide import**

```tsx
import { Filter, Search, ChevronDown, Activity, Clock, Building2, Users, ArrowUpDown, Link as LinkIcon, Trash2, CheckSquare, Plus, Database, Sparkles, Download } from 'lucide-react';
```

- [ ] **Step 2: Add `handleExportCSV` function inside `Dashboard` (after `handleLoadSampleData`)**

```tsx
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
```

- [ ] **Step 3: Add export button to the header actions row (before the "New Lead" button)**

```tsx
<button
  onClick={handleExportCSV}
  disabled={filteredLeads.length === 0}
  title={`Export ${filteredLeads.length} leads`}
  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm disabled:opacity-40"
>
  <Download className="w-4 h-4 mr-2" />
  Export CSV
</button>
```

- [ ] **Step 4: TypeScript check + commit**
```bash
cd /Users/riz/Documents/Claude/promosignal && npm run lint && git add src/components/Dashboard.tsx && git commit -m "feat: add CSV export to Dashboard"
```

---

## Task 9: Dashboard — Vertical-Specific Filters

**Files:** Modify `src/components/Dashboard.tsx`

- [ ] **Step 1: Add vertical-specific filter state (after existing filter state)**

```tsx
const [awardTimeToEvent, setAwardTimeToEvent] = useState('all');
const [eventSponsorshipLevel, setEventSponsorshipLevel] = useState('all');
const [eventType, setEventType] = useState('all');
const [hiringOpenPositions, setHiringOpenPositions] = useState('all');
const [leaseSizeRange, setLeaseSizeRange] = useState('all');
const [leaseType, setLeaseType] = useState('all');
```

- [ ] **Step 2: Replace the `filteredLeads` useMemo with one that includes vertical-specific filtering**

```tsx
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
    if (sortBy === 'urgency_score') comparison = a.urgency_score - b.urgency_score;
    else if (sortBy === 'company_name') comparison = a.company_name.localeCompare(b.company_name);
    else if (sortBy === 'date_discovered') comparison = new Date(a.date_discovered).getTime() - new Date(b.date_discovered).getTime();
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}, [leads, selectedVertical, searchQuery, territoryFilter, statusFilter, sortBy, sortOrder,
    awardTimeToEvent, eventSponsorshipLevel, eventType, hiringOpenPositions, leaseSizeRange, leaseType]);
```

- [ ] **Step 3: Add vertical-specific sub-filter row inside `{showFilters && (...)}` panel**

After the closing `</div>` of the 4-column grid, add:
```tsx
{/* Vertical-specific sub-filters */}
{selectedVertical === 'awards' && (
  <div className="mt-4 pt-4 border-t border-gray-100">
    <label className="block text-xs font-medium text-gray-700 mb-1">Time to Event</label>
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
  <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-4">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Sponsorship Level</label>
      <select className="border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={eventSponsorshipLevel} onChange={e => setEventSponsorshipLevel(e.target.value)}>
        <option value="all">All Levels</option>
        <option value="Platinum">Platinum</option>
        <option value="Gold">Gold</option>
        <option value="Silver">Silver</option>
        <option value="Exhibitor">Exhibitor</option>
      </select>
    </div>
    <div>
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
  <div className="mt-4 pt-4 border-t border-gray-100">
    <label className="block text-xs font-medium text-gray-700 mb-1">Open Positions</label>
    <select className="border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={hiringOpenPositions} onChange={e => setHiringOpenPositions(e.target.value)}>
      <option value="all">Any</option>
      <option value="5-10">5–10</option>
      <option value="10-20">10–20</option>
      <option value="20+">20+</option>
    </select>
  </div>
)}
{selectedVertical === 'leases' && (
  <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-4">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Lease Size</label>
      <select className="border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={leaseSizeRange} onChange={e => setLeaseSizeRange(e.target.value)}>
        <option value="all">Any Size</option>
        <option value="5k-25k">5k–25k sq ft</option>
        <option value="25k-50k">25k–50k sq ft</option>
        <option value="50k+">50k+ sq ft</option>
      </select>
    </div>
    <div>
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
```

- [ ] **Step 4: TypeScript check + commit**
```bash
cd /Users/riz/Documents/Claude/promosignal && npm run lint && git add src/components/Dashboard.tsx && git commit -m "feat: add vertical-specific filter controls to Dashboard"
```

---

## Task 10: My Leads — Stats Bar + Filters

**Files:** Replace `src/pages/MyLeads.tsx`

- [ ] **Step 1: Write new MyLeads.tsx**

```tsx
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
```

- [ ] **Step 2: TypeScript check + commit**
```bash
cd /Users/riz/Documents/Claude/promosignal && npm run lint && git add src/pages/MyLeads.tsx && git commit -m "feat: add stats bar and filters to My Leads page"
```

---

## Task 11: Analytics — KPI Cards + Trend Chart

**Files:** Replace `src/pages/Analytics.tsx`

- [ ] **Step 1: Write new Analytics.tsx**

```tsx
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
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => percent > 0.05 ? `${name} (${(percent*100).toFixed(0)}%)` : ''} outerRadius={100} dataKey="value">
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
```

- [ ] **Step 2: TypeScript check + commit**
```bash
cd /Users/riz/Documents/Claude/promosignal && npm run lint && git add src/pages/Analytics.tsx && git commit -m "feat: add KPI cards and weekly trend chart to Analytics"
```

---

## Self-Review

**Spec coverage:** All 11 items covered across Tasks 1–11. ✓

**Placeholder scan:** None. All code blocks are complete. ✓

**Type consistency:**
- `Template` defined Task 2, used in Tasks 3, 6, 7 ✓
- `UserSettings` exported Task 3, used in Tasks 4, 6 ✓  
- `updateLeadNotes/DealValue/SnoozeDate` defined Task 3, destructured Task 5 ✓
- `addTemplate/updateTemplate/deleteTemplate/templates` defined Task 3, used Tasks 6, 7 ✓
- `deal_value`, `notes`, `snooze_until` on BaseLead Task 2, used Tasks 5, 10, 11 ✓
- `deleteDoc` used in Task 3 — already imported from `firebase/firestore` in existing code ✓
