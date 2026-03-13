import { supabase } from './supabase';

export type AccessTier = 'free' | 'trial' | 'monthly' | 'annual';
export type SelectedPlan = 'monthly' | 'annual' | null;

export interface AccessState {
  tier: AccessTier;
  selectedPlan: SelectedPlan;
  scriptsUsed: number;
  scriptLimit: number;
  trialStartedAt: number | null;
  trialEndsAt: number | null;
  trialDaysRemaining: number;
  hasPremium: boolean;
  canGenerate: boolean;
  canPractice: boolean;
}

const DEFAULT_ACCESS_STATE: AccessState = {
  tier: 'free',
  selectedPlan: null,
  scriptsUsed: 0,
  scriptLimit: 3,
  trialStartedAt: null,
  trialEndsAt: null,
  trialDaysRemaining: 0,
  hasPremium: false,
  canGenerate: true,
  canPractice: true,
};

export async function fetchAccessState(): Promise<AccessState> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  if (!data.session?.user) {
    return DEFAULT_ACCESS_STATE;
  }

  return DEFAULT_ACCESS_STATE;
}

export async function startTrial(plan: Exclude<SelectedPlan, null>): Promise<AccessState> {
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  return {
    tier: 'trial',
    selectedPlan: plan,
    scriptsUsed: 0,
    scriptLimit: 5,
    trialStartedAt: now,
    trialEndsAt: now + threeDays,
    trialDaysRemaining: 3,
    hasPremium: true,
    canGenerate: true,
    canPractice: true,
  };
}
