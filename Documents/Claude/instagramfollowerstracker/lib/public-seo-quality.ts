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
  lastUpdatedAt?: Date | null;
  now?: Date;
}

export function getPublicSeoIndexStatus(account: PublicSeoQualityInput) {
  const now = account.now ?? new Date();
  const handle = account.handle.toLowerCase().replace(/^@/, '');
  const hasFollowerCount = account.followerCount !== null;
  const hasProfileSignal = Boolean(account.displayName || account.avatarUrl || account.bio);
  const hasCleanHandle =
    /^[a-z0-9._]{1,30}$/.test(handle) &&
    !RESERVED_PUBLIC_HANDLES.has(handle) &&
    !handle.startsWith('.') &&
    !handle.endsWith('.');
  const ageInDays = account.lastUpdatedAt
    ? Math.floor((now.getTime() - account.lastUpdatedAt.getTime()) / 86_400_000)
    : Number.POSITIVE_INFINITY;
  const hasRecentData = ageInDays <= 30;
  const hasFreshSitemapData = ageInDays <= 14;

  const indexable =
    account.snapshotCount >= 3 &&
    hasFollowerCount &&
    hasCleanHandle &&
    hasProfileSignal &&
    hasRecentData;

  const sitemapEligible =
    account.snapshotCount >= 7 &&
    hasFollowerCount &&
    hasCleanHandle &&
    hasProfileSignal &&
    hasFreshSitemapData;

  return {
    indexable,
    sitemapEligible,
    hasFollowerCount,
    hasProfileSignal,
    hasCleanHandle,
    hasRecentData,
    hasFreshSitemapData,
    ageInDays,
    snapshotCount: account.snapshotCount,
  };
}
