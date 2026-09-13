// src/types.ts

export type MechanicPrimitive =
  | 'precision_stop'
  | 'multi_dial'
  | 'pick_one'
  | 'hold_release'
  | 'reaction'
  | 'drag_target'
  | 'fill_meter';

export interface SkinConfig {
  // precision_stop skins
  targetValue?: number;
  maxValue?: number;
  speed?: 'slow' | 'medium' | 'fast';
  unit?: string;
  vessel_shape?: string;
  // multi_dial skins
  digits?: number;
  solution?: number[];
  // pick_one skins
  count?: number;
  box_labels?: string[];
  colors?: string[];
  // hold_release / fill_meter skins
  peak_zone_min?: number;
  peak_zone_max?: number;
  target_min?: number;
  target_max?: number;
  label?: string;
  // reaction skins
  flash_color?: string;
  window_ms?: number;
  object_label?: string;
  fall_speed?: 'slow' | 'medium' | 'fast';
  // drag_target skins
  item_labels?: string[];
  container_label?: string;
  items?: string[];
  bins?: string[];
  // misc
  orientation?: 'horizontal' | 'vertical';
  [key: string]: unknown;
}

export interface GameSpec {
  experience: {
    name: string;
    goal: 'lead_capture' | 'conversion' | 'aov' | 'brand_awareness';
    surface: 'popup' | 'embedded' | 'exit_intent' | 'cart';
  };
  branding: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontStyle: 'sans' | 'serif' | 'mono' | 'display';
    tone: string;
  };
  intro: {
    headline: string;
    body: string;
    cta: string;
  };
  mechanic: {
    primitive: MechanicPrimitive;
    skin: string;
    config: SkinConfig;
  };
  result: {
    headline: string;
    body: string;
    delayMs: number;
    type: 'deny' | 'reveal' | 'near_miss' | 'success';
  };
  reward: {
    type: 'free_shipping' | 'percentage_off' | 'fixed_off' | 'free_product' | 'mystery';
    value?: string;
    message: string;
  };
  conversion: {
    provider: 'klaviyo' | 'none';
    winnerFormId?: string;
    standardFormId?: string;
  };
}

export interface BrandProfile {
  brandName: string;
  productName: string;
  category: string;
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
  tone: string;
  usp: string;
  targetCustomer: string;
  playableAttributes: { label: string; reason: string }[];
  interactionMetaphors: string[];
}

export interface ConceptScores {
  brandSpecificity: number;
  productDemonstration: number;
  simplicity: number;
  suspense: number;
  rewardFit: number;
  mobileUsability: number;
  conversionPotential: number;
}

export interface Concept {
  id: string;
  name: string;
  premise: string;
  whyItFits: string;
  primitive: MechanicPrimitive;
  skin: string;
  skinDescription: string;
  headline: string;
  ctaText: string;
  resultHeadline: string;
  rewardMessage: string;
  scores: ConceptScores;
}

export interface StoreConfig {
  storeName: string;
  url: string;
}

export type ExperienceStatus = 'active' | 'draft' | 'paused';

export interface AppState {
  store: StoreConfig | null;
  brandProfile: BrandProfile | null;
  concepts: Concept[];
  selectedConcept: Concept | null;
  gameSpec: GameSpec | null;
  experience: { id: string; name: string; status: ExperienceStatus } | null;
  analyzing: boolean;
  generatingConcepts: boolean;
  buildingSpec: boolean;
  error: string | null;
}

// Legacy — keep for Dashboard compatibility
export interface Experience {
  id: string;
  name: string;
  status: ExperienceStatus;
  placement: string;
  impressions: number;
  plays: number;
  revenue: number;
  leadRate: number;
  createdAt: string;
  thumbnail: string;
}

export interface PlayableConfig {
  mechanic: MechanicPrimitive;
  duration: number;
  headline: string;
  reward: { type: 'free_shipping' | 'percentage_off' | 'fixed_off' | 'free_product' | 'mystery'; value?: string };
  result: { type: 'deny' | 'reveal' | 'near_miss' | 'success' };
  targeting: { delay: number; newVisitors: boolean };
}
