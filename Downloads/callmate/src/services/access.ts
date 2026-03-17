import { supabase } from './supabase';

export type AccessTier = 'free' | 'trial' | 'monthly' | 'annual' | 'admin';
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

const TRIAL_SELECTED_PLAN_KEY = 'callmate_trial_selected_plan';

function getStoredTrialPlan(): SelectedPlan {
  if (typeof localStorage === 'undefined') return null;
  const value = localStorage.getItem(TRIAL_SELECTED_PLAN_KEY);
  return value === 'monthly' || value === 'annual' ? value : null;
}

function persistTrialPlan(plan: SelectedPlan) {
  if (typeof localStorage === 'undefined') return;
  if (plan === 'monthly' || plan === 'annual') {
    localStorage.setItem(TRIAL_SELECTED_PLAN_KEY, plan);
  } else {
    localStorage.removeItem(TRIAL_SELECTED_PLAN_KEY);
  }
}

function buildTrialState(selectedPlan: SelectedPlan, trialStartedAt: number | null, scriptsUsed: number): AccessState {
  if (!trialStartedAt) {
    return {
      ...DEFAULT_ACCESS_STATE,
      selectedPlan,
      scriptsUsed,
    };
  }

  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const trialEndsAt = trialStartedAt + threeDays;
  const trialDaysRemaining = Math.max(0, Math.ceil((trialEndsAt - Date.now()) / 86400000));
  const isTrialActive = trialEndsAt > Date.now();

  if (!isTrialActive) {
    return {
      ...DEFAULT_ACCESS_STATE,
      selectedPlan,
      scriptsUsed,
    };
  }

  return {
    tier: 'trial',
    selectedPlan,
    scriptsUsed,
    scriptLimit: 5,
    trialStartedAt,
    trialEndsAt,
    trialDaysRemaining,
    hasPremium: true,
    canGenerate: true,
    canPractice: true,
  };
}

export async function fetchAccessState(): Promise<AccessState> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const user = data.session?.user;
  if (!user) {
    return DEFAULT_ACCESS_STATE;
  }

  const normalizedEmail = user.email?.trim().toLowerCase() ?? '';

  const adminQuery = normalizedEmail
    ? supabase
        .from('admin_users')
        .select('email, is_active')
        .eq('email', normalizedEmail)
        .eq('is_active', true)
        .maybeSingle()
    : Promise.resolve({ data: null as { email: string; is_active: boolean } | null, error: null });

  const [
    { data: adminRow, error: adminError },
    { data: profile, error: profileError },
    { count: scriptCount, error: scriptCountError },
  ] = await Promise.all([
    adminQuery,
    supabase
      .from('profiles')
      .select('tier, trial_start_date')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('scripts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  if (adminError) {
    console.warn('Admin allowlist lookup failed; continuing with normal access state.', adminError);
  }
  if (profileError) throw profileError;
  if (scriptCountError) throw scriptCountError;

  const scriptsUsed = scriptCount ?? 0;

  if (!adminError && adminRow) {
    return {
      tier: 'admin',
      selectedPlan: null,
      scriptsUsed,
      scriptLimit: Number.MAX_SAFE_INTEGER,
      trialStartedAt: null,
      trialEndsAt: null,
      trialDaysRemaining: 0,
      hasPremium: true,
      canGenerate: true,
      canPractice: true,
    };
  }

  const storedTier = profile?.tier as AccessTier | undefined;
  const selectedPlan = storedTier === 'monthly' || storedTier === 'annual'
    ? storedTier
    : storedTier === 'trial'
      ? getStoredTrialPlan()
      : null;
  const trialStartedAt = profile?.trial_start_date ?? null;

  if (storedTier === 'monthly' || storedTier === 'annual') {
    persistTrialPlan(null);
    return {
      tier: storedTier,
      selectedPlan,
      scriptsUsed,
      scriptLimit: Number.MAX_SAFE_INTEGER,
      trialStartedAt,
      trialEndsAt: null,
      trialDaysRemaining: 0,
      hasPremium: true,
      canGenerate: true,
      canPractice: true,
    };
  }

  if (storedTier === 'trial') {
    persistTrialPlan(selectedPlan);
    return buildTrialState(selectedPlan, trialStartedAt, scriptsUsed);
  }

  persistTrialPlan(null);
  return {
    ...DEFAULT_ACCESS_STATE,
    scriptsUsed,
  };
}

export async function startTrial(plan: Exclude<SelectedPlan, null>): Promise<AccessState> {
  const now = Date.now();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const user = data.session?.user;
  if (!user) throw new Error('You must be signed in to start a trial.');

  const { error: updateError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, tier: 'trial', trial_start_date: now, updated_at: new Date().toISOString() });
  if (updateError) throw updateError;

  persistTrialPlan(plan);
  return buildTrialState(plan, now, 0);
}
