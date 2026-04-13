import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Lead, Template } from '../types';
import { Loader2, Copy, Check, Send, Save, BookOpen } from 'lucide-react';
import { useLeads } from '../context/LeadContext';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

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
