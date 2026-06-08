export interface SeoAccountPage {
  keyword: string;
  slug: string;
  username: string;
  displayName: string;
  category: string;
  description: string;
}

export const SEO_ACCOUNT_PAGES: SeoAccountPage[] = [
  {
    keyword: 'cardi b instagram',
    slug: 'cardi-b-instagram',
    username: 'iamcardib',
    displayName: 'Cardi B',
    category: 'Music',
    description: 'Track Cardi B Instagram follower count history and daily public growth snapshots.',
  },
  {
    keyword: 'cardi b ig',
    slug: 'cardi-b-ig',
    username: 'iamcardib',
    displayName: 'Cardi B',
    category: 'Music',
    description: 'See Cardi B IG follower growth, saved snapshots, and public trend history.',
  },
  {
    keyword: 'bad bunny instagram',
    slug: 'bad-bunny-instagram',
    username: 'badbunnypr',
    displayName: 'Bad Bunny',
    category: 'Music',
    description: 'Track Bad Bunny Instagram follower count history with public daily snapshots.',
  },
  {
    keyword: '50 cent instagram',
    slug: '50-cent-instagram',
    username: '50cent',
    displayName: '50 Cent',
    category: 'Music',
    description: 'Monitor 50 Cent Instagram follower count changes and public growth history.',
  },
  {
    keyword: 'instagram kim kardashian',
    slug: 'instagram-kim-kardashian',
    username: 'kimkardashian',
    displayName: 'Kim Kardashian',
    category: 'Celebrity',
    description: 'Track Kim Kardashian Instagram followers, growth history, and public daily snapshots.',
  },
  {
    keyword: 'instagram kylie jenner',
    slug: 'instagram-kylie-jenner',
    username: 'kyliejenner',
    displayName: 'Kylie Jenner',
    category: 'Celebrity',
    description: 'Track Kylie Jenner Instagram followers and public follower-count history.',
  },
  {
    keyword: 'kim kardashian ig',
    slug: 'kim-kardashian-ig',
    username: 'kimkardashian',
    displayName: 'Kim Kardashian',
    category: 'Celebrity',
    description: 'See Kim Kardashian IG follower count snapshots and growth trends.',
  },
  {
    keyword: 'kylie jenner ig',
    slug: 'kylie-jenner-ig',
    username: 'kyliejenner',
    displayName: 'Kylie Jenner',
    category: 'Celebrity',
    description: 'See Kylie Jenner IG follower count snapshots and growth trends.',
  },
  {
    keyword: 'most followed people on instagram',
    slug: 'most-followed-people-on-instagram',
    username: 'cristiano',
    displayName: 'Cristiano Ronaldo',
    category: 'Sports',
    description: 'Track Cristiano Ronaldo, the most-followed individual Instagram account, with public growth snapshots.',
  },
  {
    keyword: 'shade room instagram',
    slug: 'shade-room-instagram',
    username: 'theshaderoom',
    displayName: 'The Shade Room',
    category: 'Media',
    description: 'Track The Shade Room Instagram follower count history and public daily changes.',
  },
  {
    keyword: 'shade room ig',
    slug: 'shade-room-ig',
    username: 'theshaderoom',
    displayName: 'The Shade Room',
    category: 'Media',
    description: 'See The Shade Room IG follower growth, saved snapshots, and public trends.',
  },
  {
    keyword: 'sydney sweeney instagram',
    slug: 'sydney-sweeney-instagram',
    username: 'sydney_sweeney',
    displayName: 'Sydney Sweeney',
    category: 'Celebrity',
    description: 'Track Sydney Sweeney Instagram follower count and public growth history.',
  },
  {
    keyword: 'taylor swift instagram',
    slug: 'taylor-swift-instagram',
    username: 'taylorswift',
    displayName: 'Taylor Swift',
    category: 'Music',
    description: 'Track Taylor Swift Instagram follower count snapshots and public growth history.',
  },
  {
    keyword: 'violet myers instagram',
    slug: 'violet-myers-instagram',
    username: 'waifuviolet',
    displayName: 'Violet Myers',
    category: 'Creator',
    description: 'Track Violet Myers Instagram follower count snapshots and public growth history.',
  },
] as const;

export const SEO_PUBLIC_ACCOUNTS = Array.from(
  new Map(
    SEO_ACCOUNT_PAGES.map((page) => [
      page.username,
      {
        handle: page.username,
        displayName: page.displayName,
        category: page.category,
      },
    ])
  ).values()
);

export function getSeoAccountPage(slug: string, username: string) {
  const normalizedSlug = slug.toLowerCase();
  const normalizedUsername = username.toLowerCase().replace(/^@/, '');

  return SEO_ACCOUNT_PAGES.find(
    (page) =>
      page.slug === normalizedSlug &&
      page.username.toLowerCase() === normalizedUsername
  );
}

export function getSeoAccountByHandle(handle: string) {
  const normalizedHandle = handle.toLowerCase().replace(/^@/, '');
  return SEO_PUBLIC_ACCOUNTS.find((account) => account.handle === normalizedHandle) ?? null;
}
