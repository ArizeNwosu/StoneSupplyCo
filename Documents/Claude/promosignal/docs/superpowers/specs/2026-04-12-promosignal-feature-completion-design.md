# PromoSignal Feature Completion Design
**Date:** 2026-04-12  
**Status:** Approved

## Overview

Fill in the gaps between the existing PromoSignal codebase and the PRD. The app structure, Firebase backend, and Gemini AI integration are all in place. This spec covers 11 concrete work items across bug fixes, new fields, UX features, and analytics enhancements.

---

## 1. Bug Fixes

### EmailGenerator API Key + Model
- Change `process.env.GEMINI_API_KEY` → `import.meta.env.VITE_GEMINI_API_KEY` (Vite browser context)
- Change model `gemini-3-flash-preview` → `gemini-2.5-flash`
- Instantiate `GoogleGenAI` outside the handler (reuse across calls)

---

## 2. Data Model Extensions (`types/index.ts`)

Add to `BaseLead`:
```ts
notes?: string;
deal_value?: number;       // dollar amount, set when status → purchased
snooze_until?: string;     // ISO date, set when status → snoozed
```

---

## 3. LeadContext Extensions

New methods:
- `updateLeadNotes(leadId, notes)` — `updateDoc` with `{ notes }`
- `updateLeadDealValue(leadId, dealValue)` — `updateDoc` with `{ deal_value }`
- `updateLeadSnoozeDate(leadId, snoozeUntil)` — `updateDoc` with `{ snooze_until }`

Expand `UserSettings`:
```ts
displayName: string;
companyName: string;
territory: string;
specializations: string[];  // e.g., ['awards', 'events']
emailSignature: string;
```

---

## 4. LeadCard Enhancements

**Notes section** (after Tasks, before Email Generator):
- Textarea, auto-saves on blur via `updateLeadNotes`
- Shows "Saved" tick briefly after save

**Deal value** (conditional, shown when status is `purchased`):
- Number input labeled "Deal Value ($)"
- Saves via `updateLeadDealValue` on blur

**Snooze date** (conditional, shown when status is `snoozed`):
- Date picker labeled "Snooze until"
- Saves via `updateLeadSnoozeDate` on change

---

## 5. Settings Page: User Profile

New section above AI Scanner section:
- Fields: Display Name, Company Name, Default Territory (text), Specializations (multi-select of 4 verticals), Email Signature (textarea)
- Saves to Firestore `userSettings/{userId}`

---

## 6. EmailGenerator Enhancements

**Signature injection:** Pull `settings.emailSignature` from context; append to generated email body.

**"Use Template" picker:**
- Dropdown at top of EmailGenerator section listing templates from Firestore
- On select: pre-populates subject + body fields as an editable starting point (no AI call needed)
- Fields become editable text areas after selection or after generation

**"Save as Template" button:**
- Appears after email is generated
- Opens small inline form: template name input + confirm
- Saves to Firestore templates collection

**Edit mode:** After generation (or template selection), subject and body become editable textareas so user can tweak before copying.

---

## 7. Templates: Firestore Migration

**Data location:** `userTemplates/{userId}/items/{templateId}`

**Schema:**
```ts
interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  vertical?: Vertical | 'all';  // optional vertical tag
  createdAt: string;
}
```

**Templates page changes:**
- Remove localStorage, use Firestore real-time listener
- Add vertical filter tabs (All / Awards / Events / Hiring / Leases) at top of grid
- Templates page loads templates from context (new `templates` + `addTemplate` + `updateTemplate` + `deleteTemplate` in LeadContext or a separate hook)

---

## 8. CSV Export

Button in Dashboard header (next to "New Lead"): **Export CSV**
- Only exports currently filtered leads (respects all active filters)
- CSV columns: Company, Vertical, Trigger, Industry, Status, Score, Territory, Contact, Email, Phone, Date Discovered, Deal Value
- Uses browser download via `URL.createObjectURL(new Blob(...))`

---

## 9. Vertical-Specific Filters

Extend the Dashboard filter panel. When a specific vertical is selected (not "all"), show additional filter row:

| Vertical | Additional Filters |
|----------|-------------------|
| Awards | Time to event (0-30d, 30-60d, 60-90d, 90+d) |
| Events | Sponsorship level (Platinum/Gold/Silver/Exhibitor), Event type (Trade Show/Conference/User Conference/Webinar) |
| Hiring | Open positions (5-10, 10-20, 20+), Funding recency (0-60d, 60-180d, 180+d) |
| Leases | Lease size (5k-25k, 25k-50k, 50k+), Lease type (New Office/Expansion/Relocation) |

Filter logic lives in the existing `filteredLeads` `useMemo`.

---

## 10. My Leads Page Enhancements

**Stats bar** at top (4 tiles):
- Total Active Leads
- Contacted
- Purchased (with total deal value if available)
- Snoozed

**Filter controls** (same pattern as Dashboard):
- Vertical filter tabs
- Status filter dropdown
- Sort: urgency score / date discovered / company name

**Richer list item:** Show trigger detail, vertical badge, territory, and date (currently only company name + status).

---

## 11. Analytics Enhancements

**KPI stat cards row** (4 cards at top):
- Total Leads
- Contacted (count + % of total)
- Converted/Purchased (count + % of contacted)
- Total Deal Value ($)

**Weekly trend chart** (LineChart, Recharts):
- X-axis: last 8 weeks
- Lines: Leads discovered, Leads contacted, Leads purchased
- Data derived from `date_discovered` and status (note: we don't have status-change timestamps, so we use current status + date_discovered as a proxy)

**Conversion funnel** (replace or add next to existing pie):
- Simple horizontal funnel: New → Contacted → Active → Purchased

---

## Implementation Order

1. Bug fixes (EmailGenerator)
2. `types/index.ts` data model extensions
3. `LeadContext` new methods + settings expansion
4. `Settings` user profile section
5. `LeadCard` notes + deal value + snooze date
6. `EmailGenerator` fixes + signature + edit mode + save/use templates
7. `Templates` Firestore migration + vertical tags
8. `Dashboard` CSV export
9. `Dashboard` vertical-specific filters
10. `My Leads` stats + filters
11. `Analytics` KPI cards + trend chart

---

## Files Changed

- `src/types/index.ts`
- `src/context/LeadContext.tsx`
- `src/pages/Settings.tsx`
- `src/components/LeadCard.tsx`
- `src/components/EmailGenerator.tsx`
- `src/pages/Templates.tsx`
- `src/components/Dashboard.tsx`
- `src/pages/MyLeads.tsx`
- `src/pages/Analytics.tsx`
