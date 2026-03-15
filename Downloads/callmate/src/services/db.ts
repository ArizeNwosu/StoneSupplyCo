import { supabase } from './supabase';
import { CallScript, Reflection, Persona } from '../types';

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string | null;
  gender: string | null;
  age_range: string | null;
  anxiety_severity: string | null;
  anxiety_triggers: string[] | null;
  life_impact: string[] | null;
  discovery_source: string | null;
  call_streak: number;
  tier: string;
  trial_start_date: number | null;
  dark_mode: boolean;
  updated_at: string;
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data ?? null;
}

export async function upsertProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'updated_at'>>) {
  return supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() });
}

// ─── Scripts ─────────────────────────────────────────────────────────────────

function scriptToRow(userId: string, s: CallScript) {
  return {
    id: s.id,
    user_id: userId,
    description: s.description,
    tone: s.tone,
    opening: s.opening,
    main_ask: s.mainAsk,
    branch_x: s.branchX,
    branch_y: s.branchY,
    extra_branches: s.extraBranches ?? [],
    close: s.close,
    timestamp: s.timestamp,
  };
}

function rowToScript(row: Record<string, unknown>): CallScript {
  return {
    id: row.id as string,
    description: row.description as string,
    tone: row.tone as CallScript['tone'],
    opening: row.opening as string,
    mainAsk: row.main_ask as string,
    branchX: row.branch_x as CallScript['branchX'],
    branchY: row.branch_y as CallScript['branchY'],
    extraBranches: (row.extra_branches as CallScript['extraBranches']) ?? [],
    close: row.close as string,
    timestamp: row.timestamp as number,
  };
}

export async function fetchScripts(userId: string): Promise<CallScript[]> {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToScript);
}

export async function saveScript(userId: string, script: CallScript) {
  return supabase.from('scripts').upsert(scriptToRow(userId, script));
}

export async function syncScripts(userId: string, scripts: CallScript[]) {
  if (!scripts.length) return;
  return supabase
    .from('scripts')
    .upsert(scripts.map(s => scriptToRow(userId, s)), { onConflict: 'id' });
}

export async function deleteScript(scriptId: string) {
  return supabase.from('scripts').delete().eq('id', scriptId);
}

export async function deleteAllScriptsForUser(userId: string) {
  return supabase.from('scripts').delete().eq('user_id', userId);
}

// ─── Reflections ─────────────────────────────────────────────────────────────

function reflectionToRow(userId: string, r: Reflection) {
  return {
    id: r.id,
    user_id: userId,
    script_id: r.scriptId,
    feedback: r.feedback,
    timestamp: r.timestamp,
  };
}

function rowToReflection(row: Record<string, unknown>): Reflection {
  return {
    id: row.id as string,
    scriptId: row.script_id as string,
    feedback: row.feedback as string,
    timestamp: row.timestamp as number,
  };
}

export async function fetchReflections(userId: string): Promise<Reflection[]> {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToReflection);
}

export async function saveReflection(userId: string, reflection: Reflection) {
  return supabase.from('reflections').upsert(reflectionToRow(userId, reflection));
}

export async function syncReflections(userId: string, reflections: Reflection[]) {
  if (!reflections.length) return;
  return supabase
    .from('reflections')
    .upsert(reflections.map(r => reflectionToRow(userId, r)), { onConflict: 'id' });
}

// ─── Anxiety Ratings ─────────────────────────────────────────────────────────

export interface AnxietyRatingRow {
  id: string;
  script_id: string;
  rating: number;
  timestamp: number;
}

export async function syncAnxietyRatings(
  userId: string,
  ratings: Array<{ id?: string; scriptId: string; rating: number; timestamp: number }>
) {
  if (!ratings.length) return;
  const rows = ratings.map(r => ({
    id: r.id ?? crypto.randomUUID(),
    user_id: userId,
    script_id: r.scriptId,
    rating: r.rating,
    timestamp: r.timestamp,
  }));
  return supabase.from('anxiety_ratings').upsert(rows, { onConflict: 'id' });
}

export async function fetchAnxietyRatings(userId: string) {
  const { data, error } = await supabase
    .from('anxiety_ratings')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });
  if (error || !data) return [];
  return data as AnxietyRatingRow[];
}

// ─── Personas ────────────────────────────────────────────────────────────────

function personaToRow(userId: string, p: Persona) {
  return { id: p.id, user_id: userId, name: p.name, context: p.context };
}

function rowToPersona(row: Record<string, unknown>): Persona {
  return {
    id: row.id as string,
    name: row.name as string,
    context: row.context as string,
  };
}

export async function fetchPersonas(userId: string): Promise<Persona[]> {
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data.map(rowToPersona);
}

export async function savePersona(userId: string, persona: Persona) {
  return supabase.from('personas').upsert(personaToRow(userId, persona));
}

export async function deletePersona(personaId: string) {
  return supabase.from('personas').delete().eq('id', personaId);
}

export async function syncPersonas(userId: string, personas: Persona[]) {
  if (!personas.length) return;
  return supabase
    .from('personas')
    .upsert(personas.map(p => personaToRow(userId, p)), { onConflict: 'id' });
}

// ─── Full sync (localStorage → Supabase on first login/signup) ───────────────

export async function pushLocalDataToSupabase(
  userId: string,
  data: {
    scripts: CallScript[];
    reflections: Reflection[];
    anxietyRatings: Array<{ id?: string; scriptId: string; rating: number; timestamp: number }>;
    personas: Persona[];
    name: string;
    gender: string;
    ageRange: string;
    anxietySeverity: string | null;
    anxietyTriggers: string[];
    lifeImpact: string[];
    discoverySource: string;
    callStreak: number;
    tier: string;
    trialStartDate: number | null;
    darkMode: boolean;
  }
) {
  await Promise.allSettled([
    syncScripts(userId, data.scripts),
    syncReflections(userId, data.reflections),
    syncAnxietyRatings(userId, data.anxietyRatings),
    syncPersonas(userId, data.personas),
    upsertProfile(userId, {
      name: data.name || null,
      gender: data.gender || null,
      age_range: data.ageRange || null,
      anxiety_severity: data.anxietySeverity || null,
      anxiety_triggers: data.anxietyTriggers.length ? data.anxietyTriggers : null,
      life_impact: data.lifeImpact.length ? data.lifeImpact : null,
      discovery_source: data.discoverySource || null,
      call_streak: data.callStreak,
      tier: data.tier,
      trial_start_date: data.trialStartDate,
      dark_mode: data.darkMode,
    }),
  ]);
}
