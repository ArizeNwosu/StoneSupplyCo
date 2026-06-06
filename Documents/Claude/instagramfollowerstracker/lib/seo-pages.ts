import type { Metadata } from 'next';

export interface SeoPageConfig {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  primaryCta: string;
  secondaryCta: string;
  keywordCluster: string[];
  proofPoints: string[];
  useCases: { title: string; description: string }[];
  workflow: { title: string; description: string }[];
  faq: { question: string; answer: string }[];
}

export const SEO_PAGES: SeoPageConfig[] = [
  {
    slug: 'unfollow-tracker',
    title: 'Unfollow Tracker',
    metaTitle: 'Unfollow Tracker - Track Follower Drops Over Time',
    description:
      'Use a browser-based unfollow tracker to spot follower drops, new followers, and daily Instagram audience changes without installing an app.',
    eyebrow: 'Follower loss monitoring',
    h1: 'Unfollow Tracker',
    intro:
      'Track daily follower changes, spot unusual drops, and keep a clean timeline of when your Instagram audience moved up or down.',
    primaryCta: 'Start Tracking Free',
    secondaryCta: 'Compare plans',
    keywordCluster: [
      'unfollow tracker',
      'unfollowers track',
      'instagram unfollow tracker',
      'ig unfollow tracker',
    ],
    proofPoints: [
      'Daily follower snapshots',
      'Follower gain and loss history',
      'No mobile app required',
      'Works with public Instagram accounts',
    ],
    useCases: [
      {
        title: 'Find sudden drops',
        description:
          'See when an account lost followers and compare the change against previous days.',
      },
      {
        title: 'Track recovery',
        description:
          'Monitor whether follower count rebounds after a campaign, post, or algorithm shift.',
      },
      {
        title: 'Report client changes',
        description:
          'Turn recurring follower-count tracking into simple reports for creators and brands.',
      },
    ],
    workflow: [
      {
        title: 'Add a handle',
        description: 'Paste any public Instagram username or profile URL.',
      },
      {
        title: 'Collect snapshots',
        description: 'The tracker stores follower counts daily and keeps full history.',
      },
      {
        title: 'Review gains and losses',
        description: 'Use charts and deltas to see what changed and when.',
      },
    ],
    faq: [
      {
        question: 'Can this show exactly who unfollowed me?',
        answer:
          'Follower-count tracking shows when drops happened. Pro users can upload their own Instagram data exports to compare follower lists between uploads.',
      },
      {
        question: 'Does it work without an app?',
        answer:
          'Yes. The tracker runs in the browser and stores daily follower-count history for public Instagram accounts.',
      },
    ],
  },
  {
    slug: 'instagram-unfollow-tracker',
    title: 'Instagram Unfollow Tracker',
    metaTitle: 'Instagram Unfollow Tracker - Find Follower Changes',
    description:
      'Track Instagram unfollow events by combining daily follower counts with optional Instagram data export diffing for Pro accounts.',
    eyebrow: 'Instagram-specific unfollow tracking',
    h1: 'Instagram Unfollow Tracker',
    intro:
      'Use daily Instagram follower snapshots and optional data-export uploads to understand who followed, who left, and when changes happened.',
    primaryCta: 'Track an account',
    secondaryCta: 'See pricing',
    keywordCluster: [
      'instagram unfollow tracker',
      'track followers and unfollowers on instagram',
      'free instagram unfollow tracker',
      'track lost followers instagram',
    ],
    proofPoints: [
      'Public account follower-count tracking',
      'Optional export-based follower list diffing',
      'Daily change timeline',
      'Shareable reports for Agency users',
    ],
    useCases: [
      {
        title: 'Creator retention',
        description:
          'Understand how your audience reacts after posts, collaborations, and launches.',
      },
      {
        title: 'Brand monitoring',
        description:
          'Watch competitor and ambassador accounts for sharp follower drops or spikes.',
      },
      {
        title: 'Follower list diffing',
        description:
          'Upload exports over time to compare follower lists from your own Instagram data.',
      },
    ],
    workflow: [
      {
        title: 'Start with count tracking',
        description: 'Add a public account and collect follower-count history automatically.',
      },
      {
        title: 'Upload exports if needed',
        description: 'Use Pro export uploads when you need person-level follower changes.',
      },
      {
        title: 'Act on the pattern',
        description: 'Review drops, spikes, and repeat events from one dashboard.',
      },
    ],
    faq: [
      {
        question: 'Is this compliant with Instagram data access limits?',
        answer:
          'The public tracker stores public follower counts. Person-level unfollow detection uses data files the user exports from their own Instagram account.',
      },
      {
        question: 'How often does the tracker update?',
        answer:
          'Tracked accounts are designed for daily snapshots, with history kept over time.',
      },
    ],
  },
  {
    slug: 'instagram-follower-tracker-online-free',
    title: 'Instagram Follower Tracker Online Free',
    metaTitle: 'Instagram Follower Tracker Online Free - No App Required',
    description:
      'Track Instagram followers online for free. Look up public accounts, save daily follower history, and build growth charts from your browser.',
    eyebrow: 'Free browser-based tracking',
    h1: 'Instagram Follower Tracker Online Free',
    intro:
      'Look up public Instagram follower counts online and start building daily follower history with one free tracked account.',
    primaryCta: 'Start free',
    secondaryCta: 'View pricing',
    keywordCluster: [
      'instagram follower tracker online free',
      'instagram follower tracker free',
      'instagram follower tracker online',
      'instagram follower tracker without login',
    ],
    proofPoints: [
      'Free plan includes 1 tracked account',
      'No credit card required',
      'Public pages work without login',
      'Full history on every plan',
    ],
    useCases: [
      {
        title: 'Check a public account',
        description:
          'Look up cached follower data for seeded and already-tracked public handles.',
      },
      {
        title: 'Track your own account',
        description:
          'Create a free account and start collecting daily follower snapshots.',
      },
      {
        title: 'Watch competitors',
        description:
          'Follow public competitor accounts and see growth trends over time.',
      },
    ],
    workflow: [
      {
        title: 'Search a handle',
        description: 'Use @handle, a profile URL, or the plain username.',
      },
      {
        title: 'Save it to your dashboard',
        description: 'Your first tracked account is free and keeps full history.',
      },
      {
        title: 'Return as history builds',
        description: 'Charts unlock as daily snapshots accumulate.',
      },
    ],
    faq: [
      {
        question: 'Is the online follower tracker free?',
        answer:
          'Yes. The free plan tracks 1 public Instagram account with full follower-count history.',
      },
      {
        question: 'Do I need to install anything?',
        answer:
          'No. It is a browser-based tracker, so there is no app download required.',
      },
    ],
  },
  {
    slug: 'instagram-growth-tracker',
    title: 'Instagram Growth Tracker',
    metaTitle: 'Instagram Growth Tracker - Track Follower Growth',
    description:
      'Track Instagram follower growth with daily snapshots, growth charts, 7-day trends, 30-day trends, and average daily gain metrics.',
    eyebrow: 'Growth analytics',
    h1: 'Instagram Growth Tracker',
    intro:
      'Measure Instagram growth over time with follower-count history, daily deltas, trend metrics, and shareable account reports.',
    primaryCta: 'Track growth',
    secondaryCta: 'See plans',
    keywordCluster: [
      'instagram growth tracker',
      'track instagram follower growth',
      'instagram track follower growth',
      'track instagram growth over time',
    ],
    proofPoints: [
      'Daily, 7-day, and 30-day views',
      'Average daily gain metrics',
      'Peak follower count tracking',
      'Competitor-friendly public account tracking',
    ],
    useCases: [
      {
        title: 'Campaign measurement',
        description:
          'Connect follower growth to launches, collaborations, and posting cadence.',
      },
      {
        title: 'Competitor benchmarks',
        description:
          'Track public competitor growth and compare momentum over time.',
      },
      {
        title: 'Creator reporting',
        description:
          'Use clean follower charts for client and sponsor updates.',
      },
    ],
    workflow: [
      {
        title: 'Choose accounts',
        description: 'Track your own profile or any public creator, brand, or competitor.',
      },
      {
        title: 'Build history',
        description: 'Daily snapshots create a reliable growth record.',
      },
      {
        title: 'Read the trend',
        description: 'Use changes and averages to understand momentum.',
      },
    ],
    faq: [
      {
        question: 'What does an Instagram growth tracker measure?',
        answer:
          'It tracks follower-count changes over time, including daily deltas and longer trend windows.',
      },
      {
        question: 'Can I track competitors?',
        answer:
          'Yes. You can track any public Instagram account, including competitors and creators.',
      },
    ],
  },
  {
    slug: 'instagram-follower-count-tracker',
    title: 'Instagram Follower Count Tracker',
    metaTitle: 'Instagram Follower Count Tracker - Historical Counts',
    description:
      'Use an Instagram follower count tracker to save daily follower numbers, chart historical counts, and see how an account changes over time.',
    eyebrow: 'Follower count history',
    h1: 'Instagram Follower Count Tracker',
    intro:
      'Save Instagram follower counts over time so you can answer what changed, when it changed, and how fast the account is growing.',
    primaryCta: 'Track follower count',
    secondaryCta: 'See pricing',
    keywordCluster: [
      'instagram follower count tracker',
      'follower count tracker instagram',
      'track instagram follower count',
      'track instagram followers over time',
    ],
    proofPoints: [
      'Permanent daily snapshots',
      'Historical follower-count chart',
      'Current count and trend metrics',
      'Public account pages',
    ],
    useCases: [
      {
        title: 'Historical lookup',
        description:
          'Build a record of follower count changes that Instagram does not provide natively.',
      },
      {
        title: 'Trend analysis',
        description:
          'Compare the current count against previous snapshots to see the direction of travel.',
      },
      {
        title: 'Simple reporting',
        description:
          'Use follower-count history as the baseline for social reporting.',
      },
    ],
    workflow: [
      {
        title: 'Add the account',
        description: 'Start tracking a public Instagram handle in seconds.',
      },
      {
        title: 'Store the count',
        description: 'The system records follower count snapshots automatically.',
      },
      {
        title: 'Review the history',
        description: 'Use the dashboard and public pages to see historical movement.',
      },
    ],
    faq: [
      {
        question: 'Why track follower count history?',
        answer:
          'Instagram shows the current count, but not a clear historical chart. This tracker fills that gap.',
      },
      {
        question: 'How many days of history are stored?',
        answer:
          'All plans are designed to keep full follower-count history for tracked accounts.',
      },
    ],
  },
  {
    slug: 'instagram-tracking-tools',
    title: 'Instagram Tracking Tools',
    metaTitle: 'Instagram Tracking Tools - Follower Growth and Reports',
    description:
      'Explore Instagram tracking tools for follower growth, unfollow detection, public account monitoring, share reports, widgets, and API access.',
    eyebrow: 'Creator and agency toolkit',
    h1: 'Instagram Tracking Tools',
    intro:
      'Use one focused toolkit for Instagram follower counts, growth history, unfollow workflows, client reports, widgets, and API access.',
    primaryCta: 'Try the tracker',
    secondaryCta: 'View plans',
    keywordCluster: [
      'instagram tracking tools',
      'instagram tracking apps',
      'ig tracking app',
      'track social media followers',
    ],
    proofPoints: [
      'Follower-count tracking',
      'Unfollow export diffing',
      'Agency report links',
      'Embeddable widgets and API',
    ],
    useCases: [
      {
        title: 'Creator monitoring',
        description:
          'Track growth and follower drops without juggling multiple apps.',
      },
      {
        title: 'Agency reporting',
        description:
          'Manage many client accounts and share read-only reports.',
      },
      {
        title: 'Developer access',
        description:
          'Use API access on Agency plans to pull account and snapshot data.',
      },
    ],
    workflow: [
      {
        title: 'Start with tracking',
        description: 'Add accounts and collect daily follower-count snapshots.',
      },
      {
        title: 'Layer on workflows',
        description: 'Use alerts, reports, export uploads, and widgets as needed.',
      },
      {
        title: 'Scale to clients',
        description: 'Upgrade when you need more accounts and agency features.',
      },
    ],
    faq: [
      {
        question: 'What Instagram tracking tools are included?',
        answer:
          'The product includes follower tracking, growth charts, export-based unfollow detection, report links, widgets, and API access by plan.',
      },
      {
        question: 'Is this for agencies?',
        answer:
          'Yes. The Agency plan is built for many accounts, reports, widgets, and API usage.',
      },
    ],
  },
  {
    slug: 'best-instagram-follower-tracker-app',
    title: 'Best Instagram Follower Tracker App',
    metaTitle: 'Best Instagram Follower Tracker App - Browser Alternative',
    description:
      'Compare what a good Instagram follower tracker app should include: public account tracking, daily history, growth charts, and unfollow workflows.',
    eyebrow: 'App alternative',
    h1: 'Best Instagram Follower Tracker App',
    intro:
      'A strong Instagram follower tracker should be accurate, transparent, browser-based, and useful on day one without asking for risky account access.',
    primaryCta: 'Use the browser tracker',
    secondaryCta: 'Compare plans',
    keywordCluster: [
      'best instagram follower tracker app',
      'best follower tracker for instagram',
      'best instagram tracking app',
      'app to track instagram followers',
    ],
    proofPoints: [
      'No Instagram password required',
      'Free account tracking',
      'Daily follower-count history',
      'Pro and Agency workflows',
    ],
    useCases: [
      {
        title: 'Avoid risky app access',
        description:
          'Track public follower counts without handing over Instagram login credentials.',
      },
      {
        title: 'Get usable history',
        description:
          'Daily snapshots create a real chart instead of a one-time follower lookup.',
      },
      {
        title: 'Upgrade only when needed',
        description:
          'Start with one free account, then add more accounts and workflows as usage grows.',
      },
    ],
    workflow: [
      {
        title: 'Search online',
        description: 'Look up a handle from your browser.',
      },
      {
        title: 'Create a tracker',
        description: 'Save an account and start collecting history.',
      },
      {
        title: 'Use the dashboard',
        description: 'Review charts, metrics, exports, and reports in one place.',
      },
    ],
    faq: [
      {
        question: 'Is this a mobile app?',
        answer:
          'No. It is a browser-based alternative to follower tracker apps, designed to work without app installation.',
      },
      {
        question: 'What should the best follower tracker include?',
        answer:
          'Look for daily history, public account support, clear limits, export workflows, and no need to share your Instagram password.',
      },
    ],
  },
];

export const SEO_PAGE_MAP = new Map(SEO_PAGES.map((page) => [page.slug, page]));

export function getSeoPage(slug: string): SeoPageConfig {
  const page = SEO_PAGE_MAP.get(slug);
  if (!page) throw new Error(`Unknown SEO page: ${slug}`);
  return page;
}

export function getSeoPageMetadata(slug: string): Metadata {
  const page = getSeoPage(slug);
  const url = `https://instagramfollowerstracker.com/${page.slug}`;

  return {
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: page.metaTitle,
      description: page.description,
      siteName: 'Instagram Followers Tracker',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.description,
    },
  };
}
