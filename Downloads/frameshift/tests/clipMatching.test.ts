import { describe, it, expect } from 'vitest';
import { findBestClipForSlot } from '../src/utils/clipMatching';
import type { Clip } from '../src/types';

const makeClip = (id: string, type: Clip['type']): Clip => ({
  id,
  videoId: 'v1',
  type,
  duration: 10,
  thumbnail: '',
  visualQuality: 'high',
  tags: [],
});

describe('findBestClipForSlot', () => {
  it('returns hook clip for a "hook" slot', () => {
    const clips = [makeClip('c1', 'b-roll'), makeClip('c2', 'hook'), makeClip('c3', 'tutorial')];
    const result = findBestClipForSlot('hook', clips, new Set());
    expect(result?.id).toBe('c2');
  });

  it('falls back to interview when no hook clip available', () => {
    const clips = [makeClip('c1', 'b-roll'), makeClip('c2', 'interview')];
    const result = findBestClipForSlot('hook', clips, new Set());
    expect(result?.id).toBe('c2');
  });

  it('returns b-roll clip for a "b-roll 1" slot', () => {
    const clips = [makeClip('c1', 'tutorial'), makeClip('c2', 'b-roll')];
    const result = findBestClipForSlot('b-roll 1', clips, new Set());
    expect(result?.id).toBe('c2');
  });

  it('returns tutorial clip for a "step 1" slot', () => {
    const clips = [makeClip('c1', 'hook'), makeClip('c2', 'tutorial')];
    const result = findBestClipForSlot('step 1', clips, new Set());
    expect(result?.id).toBe('c2');
  });

  it('returns reveal clip for a "result" slot', () => {
    const clips = [makeClip('c1', 'b-roll'), makeClip('c2', 'reveal')];
    const result = findBestClipForSlot('result', clips, new Set());
    expect(result?.id).toBe('c2');
  });

  it('skips clips already used', () => {
    const clips = [makeClip('c1', 'hook'), makeClip('c2', 'interview')];
    const used = new Set(['c1']);
    const result = findBestClipForSlot('hook', clips, used);
    expect(result?.id).toBe('c2');
  });

  it('returns any unused clip as final fallback', () => {
    const clips = [makeClip('c1', 'drone')];
    const result = findBestClipForSlot('cta', clips, new Set());
    expect(result?.id).toBe('c1');
  });

  it('returns null when all clips are used', () => {
    const clips = [makeClip('c1', 'b-roll')];
    const result = findBestClipForSlot('hook', clips, new Set(['c1']));
    expect(result).toBeNull();
  });
});
