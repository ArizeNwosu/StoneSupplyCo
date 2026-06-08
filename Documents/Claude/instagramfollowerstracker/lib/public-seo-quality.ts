const RESERVED_PUBLIC_HANDLES = new Set([
  'api',
  'auth',
  'blog',
  'dashboard',
  'pricing',
  'sitemap',
  'robots',
  'login',
  'signup',
  'settings',
  'admin',
  'instagram-follower-count',
]);

export interface PublicSeoQualityInput {
  handle: string;
  followerCount: number | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  snapshotCount: number;
}

export function getPublicSeoIndexStatus(account: PublicSeoQualityInput) {
  const handle = account.handle.toLowerCase().replace(/^@/, '');
  const hasFollowerCount = account.followerCount !== null;
  const hasProfileSignal = Boolean(account.displayName || account.avatarUrl || account.bio);
  const hasCleanHandle =
    /^[a-z0-9._]{1,30}$/.test(handle) &&
    !RESERVED_PUBLIC_HANDLES.has(handle) &&
    !handle.startsWith('.') &&
    !handle.endsWith('.');

  const indexable =
    account.snapshotCount >= 3 &&
    hasFollowerCount &&
    hasCleanHandle &&
    hasProfileSignal;

  const sitemapEligible =
    account.snapshotCount >= 7 &&
    hasFollowerCount &&
    hasCleanHandle &&
    hasProfileSignal;

  return {
    indexable,
    sitemapEligible,
    hasFollowerCount,
    hasProfileSignal,
    hasCleanHandle,
    snapshotCount: account.snapshotCount,
  };
}
