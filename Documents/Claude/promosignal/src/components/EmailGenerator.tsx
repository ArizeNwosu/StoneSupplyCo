import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Lead } from '../types';
import { Loader2, Copy, Check, Send } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

interface EmailGeneratorProps {
  lead: Lead;
  onClose: () => void;
}

export default function EmailGenerator({ lead, onClose }: EmailGeneratorProps) {
  const [emailSubject, setEmailSubject] = useState<string | null>(null);
  const [emailBody, setEmailBody] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateEmail = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      let prompt = `You are an expert sales representative for a promotional products distributor. 
Write a short, punchy cold email to a prospect based on the following lead information.
The goal is to get a reply and schedule a quick call. Do not be overly formal.

Lead Details:
Company: ${lead.company_name}
Contact: ${lead.primary_contact}
Industry: ${lead.industry}
Trigger Event: ${lead.trigger_detail}
`;

      if (lead.vertical === 'awards') {
        prompt += `
Vertical: Awards
Event: ${lead.event_name}
Estimated Awards Needed: ${lead.estimated_awards_needed}
Pitch: We design custom awards and trophies that stand out. Mention their specific event and offer to send samples and a quote.`;
      } else if (lead.vertical === 'events') {
        prompt += `
Vertical: Event Swag
Event: ${lead.event_name}
Sponsorship Level: ${lead.sponsorship_level}
Pitch: We provide killer event swag that attendees actually want to keep. Mention their sponsorship level and offer ideas for their booth.`;
      } else if (lead.vertical === 'hiring') {
        prompt += `
Vertical: Onboarding Merch / Apparel
Open Positions: ${lead.open_positions}
Pitch: Great onboarding experiences improve retention. We provide custom welcome kits and apparel for new hires. Mention their hiring growth.`;
      } else if (lead.vertical === 'leases') {
        prompt += `
Vertical: Office Expansion / Branded Items
Lease Size: ${lead.lease_size} sq ft
Location: ${lead.location}
Pitch: A new office is a great time to reinforce culture with branded desk accessories and drinkware. Mention their new space.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
                description: "The subject line of the email",
              },
              body: {
                type: Type.STRING,
                description: "The body of the email",
              },
            },
            required: ["subject", "body"],
          },
        },
      });

      const result = JSON.parse(response.text || '{}');
      setEmailSubject(result.subject || 'Failed to generate subject.');
      setEmailBody(result.body || 'Failed to generate body.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the email.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (emailSubject && emailBody) {
      navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const sendEmail = () => {
    if (emailSubject && emailBody) {
      const mailtoLink = `mailto:${lead.contact_email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoLink;
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Outreach Generation</h3>
        {!emailBody && !isGenerating && (
          <button
            onClick={generateEmail}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Generate Email with AI
          </button>
        )}
      </div>

      {isGenerating && (
        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
          <Loader2 className="h-6 w-6 text-indigo-600 animate-spin mr-3" />
          <span className="text-gray-600">Drafting personalized outreach...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {emailBody && !isGenerating && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Generated Draft</span>
            <div className="flex space-x-2">
              <button
                onClick={generateEmail}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-2"
              >
                Regenerate
              </button>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium px-2 border-l border-gray-300"
              >
                {isCopied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={sendEmail}
                className="inline-flex items-center text-sm text-white bg-indigo-600 hover:bg-indigo-700 font-medium px-3 py-1 rounded-md transition-colors"
              >
                <Send className="h-3 w-3 mr-1.5" />
                Send
              </button>
            </div>
          </div>
          <div className="p-4 border-b border-gray-200 bg-white">
            <p className="text-sm font-medium text-gray-900">Subject: <span className="font-normal text-gray-700">{emailSubject}</span></p>
          </div>
          <div className="p-4 whitespace-pre-wrap text-sm text-gray-800 font-sans">
            {emailBody}
          </div>
        </div>
      )}
    </div>
  );
}
