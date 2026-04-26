import { describe, it, expect } from 'vitest';
import { getExpiredFilePaths } from '../src/utils/expiration';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('getExpiredFilePaths', () => {
  it('returns files older than TTL days', () => {
    const now = Date.now();
    const files = [
      { name: 'old.mp4', mtimeMs: now - 8 * DAY_MS },
      { name: 'recent.mp4', mtimeMs: now - 3 * DAY_MS },
    ];
    const expired = getExpiredFilePaths(files, 7, now);
    expect(expired).toEqual(['old.mp4']);
  });

  it('returns empty array when all files are within TTL', () => {
    const now = Date.now();
    const files = [
      { name: 'a.mp4', mtimeMs: now - 2 * DAY_MS },
      { name: 'b.mp4', mtimeMs: now - 1 * DAY_MS },
    ];
    expect(getExpiredFilePaths(files, 7, now)).toEqual([]);
  });

  it('returns all files when TTL is 0', () => {
    const now = Date.now();
    const files = [
      { name: 'a.mp4', mtimeMs: now - 100 },
    ];
    expect(getExpiredFilePaths(files, 0, now)).toEqual(['a.mp4']);
  });

  it('handles empty file list', () => {
    expect(getExpiredFilePaths([], 7, Date.now())).toEqual([]);
  });
});
