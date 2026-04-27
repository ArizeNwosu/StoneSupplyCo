// types/index.ts

export type Unit = 'lbs' | 'kg'

export interface WeightEntry {
  date: string        // ISO date string "YYYY-MM-DD"
  weight: number
  note?: string       // annotation e.g. "Week 3 Plateau"
}

export interface CardData {
  id?: string
  slug?: string
  unit: Unit
  startWeight: number
  currentWeight: number
  goalWeight: number
  startDate: string   // ISO date string "YYYY-MM-DD"
  method: string      // e.g. "GLP-1 ASSISTED"
  habits: string[]    // e.g. ["CONSISTENCY", "PROTEIN", "WALKING", "HYDRATION"]
  beforePhotoUrl?: string  // signed Supabase URL or blob URL (preview); optional before upload
  afterPhotoUrl?: string
  weightEntries: WeightEntry[]
  watermarked: boolean
}

export function isSavedCard(card: CardData): card is CardData & { id: string; slug: string } {
  return card.id !== undefined && card.slug !== undefined
}

// State that the multi-step builder holds before saving
export interface BuilderState {
  step: 1 | 2 | 3 | 4 | 5
  unit: Unit
  startWeight: string     // kept as string until parsed (avoids NaN while typing)
  currentWeight: string
  goalWeight: string
  startDate: string
  method: string
  habits: string[]
  beforePhotoFile: File | null
  afterPhotoFile: File | null
  beforePhotoPreview: string   // blob URL for live preview
  afterPhotoPreview: string
  weightEntries: WeightEntry[]
}

export const BUILDER_DEFAULTS: BuilderState = {
  step: 1,
  unit: 'lbs',
  startWeight: '',
  currentWeight: '',
  goalWeight: '',
  startDate: '',
  method: '',
  habits: [],
  beforePhotoFile: null,
  afterPhotoFile: null,
  beforePhotoPreview: '',
  afterPhotoPreview: '',
  weightEntries: [],
}
