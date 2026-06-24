import assert from 'node:assert/strict';
import test from 'node:test';
import { getPublicSeoIndexStatus } from '../lib/public-seo-quality';

const now = new Date('2026-06-23T12:00:00.000Z');
const base = {
  handle: 'example',
  followerCount: 10_000,
  displayName: 'Example Creator',
  avatarUrl: null,
  bio: null,
  now,
};

test('indexes useful recent account pages after three snapshots', () => {
  const status = getPublicSeoIndexStatus({
    ...base,
    snapshotCount: 3,
    lastUpdatedAt: new Date('2026-06-22T12:00:00.000Z'),
  });

  assert.equal(status.indexable, true);
  assert.equal(status.sitemapEligible, false);
});

test('adds only fresh pages with seven snapshots to the sitemap', () => {
  const status = getPublicSeoIndexStatus({
    ...base,
    snapshotCount: 7,
    lastUpdatedAt: new Date('2026-06-15T12:00:00.000Z'),
  });

  assert.equal(status.indexable, true);
  assert.equal(status.sitemapEligible, true);
});

test('keeps stale pages out of the index and sitemap', () => {
  const status = getPublicSeoIndexStatus({
    ...base,
    snapshotCount: 30,
    lastUpdatedAt: new Date('2026-05-01T12:00:00.000Z'),
  });

  assert.equal(status.indexable, false);
  assert.equal(status.sitemapEligible, false);
});

test('rejects thin pages without recognizable profile information', () => {
  const status = getPublicSeoIndexStatus({
    ...base,
    displayName: null,
    snapshotCount: 10,
    lastUpdatedAt: new Date('2026-06-22T12:00:00.000Z'),
  });

  assert.equal(status.indexable, false);
  assert.equal(status.sitemapEligible, false);
});
