import { GoogleGenAI } from '@google/genai';
import { Lead } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

export async function scanForLeads(prompt: string): Promise<Partial<Lead>[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find 3-5 real, recent news events about companies that indicate they might need promotional products or corporate gifting.
      Look for companies that recently announced funding, are opening new offices, are hiring rapidly, or are sponsoring large events.
      Focus on this specific query/criteria: "${prompt}".

      Return ONLY a raw JSON array (no markdown, no code fences) where each object has these fields:
      company_name (string), trigger_type (string, e.g. funding/hiring_spike/new_office/event_sponsorship),
      trigger_detail (string, one sentence), company_size (number), industry (string), headquarters (string),
      primary_contact (string), contact_email (string), contact_phone (string),
      distributor_territory (string, e.g. North America), competitor_tracking (string),
      urgency_score (number 0-100), vertical (one of: awards, events, hiring, leases),
      source_name (string), source_url (string).`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) return [];

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    
    const rawLeads = JSON.parse(cleaned);
    
    return rawLeads.map((raw: any) => {
      const lead: Partial<Lead> = {
        company_name: raw.company_name,
        trigger_type: raw.trigger_type,
        trigger_detail: raw.trigger_detail,
        company_size: raw.company_size || 0,
        industry: raw.industry || 'Unknown',
        headquarters: raw.headquarters || 'Unknown',
        primary_contact: raw.primary_contact || 'Unknown',
        contact_email: raw.contact_email || '',
        contact_phone: raw.contact_phone || '',
        distributor_territory: raw.distributor_territory || 'Unassigned',
        competitor_tracking: raw.competitor_tracking || '',
        urgency_score: raw.urgency_score || 70,
        status: 'new',
        date_discovered: new Date().toISOString(),
        vertical: ['awards', 'events', 'hiring', 'leases'].includes(raw.vertical) ? raw.vertical : 'events',
        sources: raw.source_url ? [{ name: raw.source_name || 'Web Search', url: raw.source_url }] : []
      };
      
      // Add required vertical-specific fields with defaults
      if (lead.vertical === 'awards') {
        Object.assign(lead, { event_name: 'Annual Awards', event_date: 'TBD', event_location: 'TBD', award_categories: [], estimated_awards_needed: 0, budget_estimate: '$0' });
      } else if (lead.vertical === 'events') {
        Object.assign(lead, { event_name: 'Upcoming Event', event_date: 'TBD', event_location: 'TBD', event_type: 'Conference', estimated_attendees: 0, sponsorship_level: 'None', booth_size: 'N/A', estimated_swag_budget: '$0', estimated_unit_count: '0' });
      } else if (lead.vertical === 'hiring') {
        Object.assign(lead, { open_positions: 0, positions_posted_30d: 0, hiring_growth_rate: 1, target_hire_count_6m: 0, estimated_onboarding_budget: '$0', estimated_unit_count: '0' });
      } else if (lead.vertical === 'leases') {
        Object.assign(lead, { lease_size: 0, lease_type: 'Office', location: 'TBD', lease_date: 'TBD', estimated_employees_in_office: 0, office_count: 1, estimated_branded_items_budget: '$0', estimated_unit_count: '0' });
      }
      
      return lead;
    });
  } catch (error) {
    console.error("Error scanning for leads:", error);
    throw error;
  }
}
