import type { RealtimeChannel, SupabaseClient, User } from '@supabase/supabase-js';
import type { CallScript, Persona, Reflection } from '../types';

type AnxietyRating = { id?: string; scriptId: string; rating: number; timestamp: number };

type SyncCallbacks = {
  onScriptChange?: (script: CallScript | null, event: 'INSERT' | 'UPDATE' | 'DELETE', id?: string) => void;
  onReflectionChange?: (reflection: Reflection | null, event: 'INSERT' | 'UPDATE' | 'DELETE', id?: string) => void;
  onPersonaChange?: (persona: Persona | null, event: 'INSERT' | 'UPDATE' | 'DELETE', id?: string) => void;
  onRatingChange?: (rating: AnxietyRating | null, event: 'INSERT' | 'UPDATE' | 'DELETE', id?: string) => void;
};

export async function createSyncSubscriptions(
  _supabase: SupabaseClient,
  _user: User,
  _callbacks: SyncCallbacks
): Promise<RealtimeChannel[]> {
  return [];
}
