export type Vertical = 'awards' | 'events' | 'hiring' | 'leases';

export interface Task {
  id: string;
  description: string;
  dueDate: string;
  completed: boolean;
}

export interface Source {
  name: string;
  url: string;
}

export interface UrgencyBreakdown {
  timeToEvent: number;
  companySize: number;
  recentActivity: number;
}

export interface BaseLead {
  id: string;
  company_name: string;
  trigger_type: string;
  trigger_detail: string;
  company_size: number;
  industry: string;
  headquarters: string;
  primary_contact: string;
  contact_email: string;
  contact_phone: string;
  distributor_territory: string;
  competitor_tracking: string;
  urgency_score: number;
  urgency_breakdown?: UrgencyBreakdown;
  status: 'new' | 'contacted' | 'active' | 'purchased' | 'snoozed' | 'unqualified';
  date_discovered: string;
  tasks?: Task[];
  sources?: Source[];
  notes?: string;
  deal_value?: number;
  snooze_until?: string;
}

export interface AwardLead extends BaseLead {
  vertical: 'awards';
  event_name: string;
  event_date: string;
  event_location: string;
  award_categories: string[];
  estimated_awards_needed: number;
  budget_estimate: string;
}

export interface EventLead extends BaseLead {
  vertical: 'events';
  event_name: string;
  event_date: string;
  event_location: string;
  event_type: string;
  estimated_attendees: number;
  sponsorship_level: string;
  booth_size: string;
  estimated_swag_budget: string;
  estimated_unit_count: string;
}

export interface HiringLead extends BaseLead {
  vertical: 'hiring';
  open_positions: number;
  positions_posted_30d: number;
  hiring_growth_rate: number;
  recent_funding?: string;
  target_hire_count_6m: number;
  estimated_onboarding_budget: string;
  estimated_unit_count: string;
}

export interface LeaseLead extends BaseLead {
  vertical: 'leases';
  lease_size: number;
  lease_type: string;
  location: string;
  lease_date: string;
  estimated_employees_in_office: number;
  office_count: number;
  estimated_branded_items_budget: string;
  estimated_unit_count: string;
}

export type Lead = AwardLead | EventLead | HiringLead | LeaseLead;

export interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  vertical?: Vertical | 'all';
  createdAt: string;
}
