import type { Clip, ClipType } from '../types';

// Maps a template slot name keyword to an ordered list of preferred clip types.
// First match wins; we fall back through the list until we find an unused clip.
const SLOT_PRIORITY: Record<string, ClipType[]> = {
  hook:       ['hook', 'interview'],
  interview:  ['interview', 'hook'],
  'b-roll':   ['b-roll', 'drone'],
  drone:      ['drone', 'b-roll'],
  step:       ['tutorial', 'b-roll'],
  tutorial:   ['tutorial', 'b-roll'],
  result:     ['reveal', 'interview'],
  reveal:     ['reveal'],
  before:     ['b-roll', 'drone'],
  after:      ['reveal', 'tutorial'],
  problem:    ['b-roll', 'interview'],
  transition: ['drone', 'b-roll'],
  cta:        ['interview', 'hook'],
};

/**
 * Finds the best available clip for a template slot name.
 * Matches slot keywords to preferred clip types in priority order.
 * Skips clip IDs in `usedClipIds` to avoid reuse within a variant.
 * Returns null if no unused clips remain.
 */
export function findBestClipForSlot(
  slotName: string,
  clips: Clip[],
  usedClipIds: Set<string>
): Clip | null {
  const lower = slotName.toLowerCase();

  // Find the first keyword that matches anywhere in the slot name
  const matchKey = Object.keys(SLOT_PRIORITY).find(key => lower.includes(key));
  const priorities = matchKey ? SLOT_PRIORITY[matchKey] : (['b-roll', 'drone', 'hook', 'tutorial', 'interview', 'reveal'] as ClipType[]);

  for (const type of priorities) {
    const clip = clips.find(c => c.type === type && !usedClipIds.has(c.id));
    if (clip) return clip;
  }

  // Final fallback: any unused clip
  return clips.find(c => !usedClipIds.has(c.id)) ?? null;
}
