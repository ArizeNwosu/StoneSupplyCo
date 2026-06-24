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
  tools?: { title: string; description: string; href: string }[];
  faq: { question: string; answer: string }[];
}

export const SEO_PAGES: SeoPageConfig[] = [
  {
    slug: 'unfollow-tracker',
    title: 'Unfollow Tracker',
    metaTitle: 'Unfollow Tracker - See Follower Changes Without Login',
    description:
      'Use a safer unfollow tracker to compare official Instagram follower exports, find new and missing followers, and avoid sharing your Instagram password.',
    eyebrow: 'No-login unfollower tracking',
    h1: 'Unfollow Tracker',
    intro:
      'Find follower changes without handing over your Instagram login. Upload official exports or connect Google Drive for recurring follower-list snapshots.',
    primaryCta: 'Check unfollowers',
    secondaryCta: 'Compare plans',
    keywordCluster: [
      'unfollow tracker',
      'unfollowers track',
      'instagram unfollow tracker',
      'ig unfollow tracker',
      'unfollowers tracker online',
    ],
    proofPoints: [
      'Official Instagram export workflow',
      'New and missing follower diffs',
      'No mobile app required',
      'No Instagram password required',
    ],
    useCases: [
      {
        title: 'Find sudden drops',
        description:
          'Compare follower exports to see who disappeared between snapshots.',
      },
      {
        title: 'Track recovery',
        description:
          'See new followers alongside lost followers so you understand the net change.',
      },
      {
        title: 'Stay safer',
        description:
          'Avoid unfollower apps that ask for your Instagram username and password.',
      },
    ],
    workflow: [
      {
        title: 'Export your Instagram data',
        description: 'Use Accounts Center to request follower data in HTML or JSON format.',
      },
      {
        title: 'Upload or connect Drive',
        description: 'Upload the small followers_and_following files once or set Instagram to send scheduled exports to Google Drive.',
      },
      {
        title: 'Review follower changes',
        description: 'Compare exports to see new followers, lost followers, and CSV downloads.',
      },
    ],
    faq: [
      {
        question: 'Can this show exactly who unfollowed me?',
        answer:
          'Yes. Upload two or more official Instagram follower exports and the app compares the lists to show new and missing followers.',
      },
      {
        question: 'Does it work without my Instagram password?',
        answer:
          'Yes. The unfollower workflow uses files exported from Instagram Accounts Center, so you do not share your Instagram login with this product.',
      },
    ],
  },
  {
    slug: 'instagram-unfollow-tracker',
    title: 'Instagram Unfollow Tracker',
    metaTitle: 'Instagram Unfollow Tracker - Find Who Unfollowed You',
    description:
      'Find who unfollowed you on Instagram using official Instagram data exports or scheduled Google Drive exports. No Instagram password required.',
    eyebrow: 'Safer Instagram unfollower tracking',
    h1: 'Instagram Unfollow Tracker',
    intro:
      'Upload your Instagram export or connect Google Drive to compare follower lists over time and see who followed or unfollowed you.',
    primaryCta: 'Find unfollowers',
    secondaryCta: 'See pricing',
    keywordCluster: [
      'instagram unfollow tracker',
      'track followers and unfollowers on instagram',
      'free instagram unfollow tracker',
      'track lost followers instagram',
      'instagram unfollow tracker online',
    ],
    proofPoints: [
      'Official export upload',
      'Scheduled Google Drive sync',
      'New and lost follower lists',
      'No Instagram password required',
    ],
    useCases: [
      {
        title: 'Creator retention',
        description:
          'See which followers appeared or disappeared after posts, collaborations, and launches.',
      },
      {
        title: 'Owned-account monitoring',
        description:
          'Use your own Instagram data exports for person-level follower change tracking.',
      },
      {
        title: 'Follower list diffing',
        description:
          'Compare exports over time to reveal the exact handles behind the change.',
      },
    ],
    workflow: [
      {
        title: 'Choose export mode',
        description: 'Upload the small followers_and_following files manually or set Instagram to export daily to Google Drive.',
      },
      {
        title: 'Save follower snapshots',
        description: 'Each export becomes a snapshot of your follower and following lists.',
      },
      {
        title: 'See who changed',
        description: 'Review new followers, lost followers, and export CSVs from the dashboard.',
      },
    ],
    faq: [
      {
        question: 'Can I set this up once?',
        answer:
          'For your own account, you can set Instagram to export data to Google Drive on a recurring cadence, then connect Drive so the app checks for new exports.',
      },
      {
        question: 'Can this track competitors?',
        answer:
          'Person-level unfollower detection only works for your own Instagram export. Public competitor tracking uses follower-count snapshots, not private follower lists.',
      },
    ],
  },
  {
    slug: 'track-who-unfollowed-you-on-instagram',
    title: 'Track Who Unfollowed You on Instagram',
    metaTitle: 'Track Who Unfollowed You on Instagram - Safe Export Method',
    description:
      'Learn how to track who unfollowed you on Instagram with official follower exports, Google Drive sync, and no password-sharing apps.',
    eyebrow: 'Step-by-step unfollower guide',
    h1: 'Track Who Unfollowed You on Instagram',
    intro:
      'The safest way to see who unfollowed you is to compare your own Instagram follower exports over time instead of giving a third-party app your password.',
    primaryCta: 'Start the safe check',
    secondaryCta: 'View plans',
    keywordCluster: [
      'track who unfollowed you on instagram free',
      'free who unfollowed me on instagram',
      'keep track of who unfollowed you on instagram',
      'track who follows and unfollows you on instagram',
    ],
    proofPoints: [
      'Uses Instagram Accounts Center exports',
      'Works with HTML or JSON follower files',
      'Google Drive sync option',
      'CSV exports on Pro',
    ],
    useCases: [
      {
        title: 'First unfollower check',
        description: 'Upload your first export to create the baseline follower list.',
      },
      {
        title: 'Repeat comparisons',
        description: 'Upload another export later to see exactly what changed.',
      },
      {
        title: 'Recurring checks',
        description: 'Use scheduled Google Drive exports so new snapshots arrive without manual uploads.',
      },
    ],
    workflow: [
      {
        title: 'Request your export',
        description: 'Open Instagram Accounts Center and choose follower data in HTML or JSON format.',
      },
      {
        title: 'Create a baseline',
        description: 'Upload the small followers_and_following files to save the first follower-list snapshot.',
      },
      {
        title: 'Compare the next export',
        description: 'The app shows new followers, lost followers, and downloadable CSVs.',
      },
    ],
    faq: [
      {
        question: 'Can I see who unfollowed me from one export?',
        answer:
          'One export creates the baseline. You need a later export to compare against before exact lost-follower names can be shown.',
      },
      {
        question: 'Is this safer than unfollower apps?',
        answer:
          'Yes. This workflow avoids password sharing and uses data you export directly from Instagram.',
      },
    ],
  },
  {
    slug: 'instagram-unfollow-tracker-without-login',
    title: 'Instagram Unfollow Tracker Without Login',
    metaTitle: 'Instagram Unfollow Tracker Without Login - No Password Needed',
    description:
      'Use an Instagram unfollow tracker without login sharing. Compare official Instagram exports to find new and lost followers safely.',
    eyebrow: 'No-password Instagram tracking',
    h1: 'Instagram Unfollow Tracker Without Login',
    intro:
      'Do not give unfollower apps your Instagram credentials. Use official exports and follower-list comparisons to find changes without risky login sharing.',
    primaryCta: 'Use no-login tracking',
    secondaryCta: 'Compare plans',
    keywordCluster: [
      'instagram unfollowers tracker without login',
      'instagram unfollow tracker website',
      'online instagram unfollow tracker',
      'unfollower tracker instagram online',
    ],
    proofPoints: [
      'No Instagram credentials stored',
      'Official data export workflow',
      'Manual upload or Drive sync',
      'Follower-list diff reports',
    ],
    useCases: [
      {
        title: 'Avoid risky permissions',
        description: 'Get follower changes without giving another app control of your Instagram account.',
      },
      {
        title: 'Check from the web',
        description: 'Use a browser dashboard instead of installing a mobile unfollower app.',
      },
      {
        title: 'Keep export history',
        description: 'Store export snapshots so each comparison has a clear timestamp.',
      },
    ],
    workflow: [
      {
        title: 'Export from Instagram',
        description: 'Use Instagram Accounts Center instead of third-party login screens.',
      },
      {
        title: 'Upload or sync',
        description: 'Choose a one-time small-file upload or recurring Google Drive exports.',
      },
      {
        title: 'Review diffs',
        description: 'See counts for everyone new and everyone missing since the previous export.',
      },
    ],
    faq: [
      {
        question: 'Do I have to log in with Instagram?',
        answer:
          'No. The product never needs your Instagram password for unfollower detection.',
      },
      {
        question: 'Why use exports instead of login?',
        answer:
          'Exports keep you in control of the data source and reduce the risk that comes with credential-sharing unfollower apps.',
      },
    ],
  },
  {
    slug: 'instagram-followers-and-unfollowers-tracker',
    title: 'Instagram Followers and Unfollowers Tracker',
    metaTitle: 'Instagram Followers and Unfollowers Tracker - Compare Changes',
    description:
      'Track Instagram followers and unfollowers by comparing official follower exports, scheduled Drive snapshots, and follower-count history.',
    eyebrow: 'Followers and unfollowers',
    h1: 'Instagram Followers and Unfollowers Tracker',
    intro:
      'Combine follower-count history with official export diffs so you can see both the size of the audience change and the handles behind it.',
    primaryCta: 'Track follower changes',
    secondaryCta: 'See pricing',
    keywordCluster: [
      'track followers and unfollowers on instagram',
      'instagram followers and unfollowers tracker',
      'followers and unfollowers tracker for instagram',
      'best app to track followers and unfollowers on instagram',
    ],
    proofPoints: [
      'Follower-count snapshots',
      'Follower export diffs',
      'Lost and new follower counts',
      'CSV downloads for Pro',
    ],
    useCases: [
      {
        title: 'Growth and churn',
        description: 'Separate net follower growth from the people who came and went.',
      },
      {
        title: 'Creator analysis',
        description: 'Understand audience reaction after content, promos, and launches.',
      },
      {
        title: 'Owned-account reports',
        description: 'Use official export data when you need person-level follower lists.',
      },
    ],
    workflow: [
      {
        title: 'Create follower history',
        description: 'Capture or sync follower counts so the chart starts building.',
      },
      {
        title: 'Add export snapshots',
        description: 'Upload official Instagram exports or connect scheduled Drive exports.',
      },
      {
        title: 'Download results',
        description: 'Export follower lists, following lists, and unfollower diffs as CSVs.',
      },
    ],
    faq: [
      {
        question: 'Can this show both followers and unfollowers?',
        answer:
          'Yes. Export comparisons show new followers and lost followers between snapshots.',
      },
      {
        question: 'Does it track public accounts too?',
        answer:
          'Public accounts can be tracked by follower count. Exact follower and unfollower names require the official export for your own account.',
      },
    ],
  },
  {
    slug: 'instagram-follower-tracker-online-free',
    title: 'Instagram Follower Tracker Online Free',
    metaTitle: 'Instagram Follower Tracker Online Free - Track Public Accounts',
    description:
      'Track public Instagram accounts online for free. Watch competitors, creators, brands, clients, and campaign targets with follower-count history.',
    eyebrow: 'Free public account tracking',
    h1: 'Instagram Follower Tracker Online Free',
    intro:
      'Look up any public Instagram account and start building follower-count history for the accounts Instagram Insights will not show you.',
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
        title: 'Track competitors',
        description:
          'Create a free account and start collecting follower snapshots for a public competitor or creator.',
      },
      {
        title: 'Monitor clients',
        description:
          'Follow client and campaign accounts so you can report growth trends over time.',
      },
    ],
    workflow: [
      {
        title: 'Search a handle',
        description: 'Use @handle, a profile URL, or the plain username.',
      },
      {
        title: 'Save it to your dashboard',
        description: 'Your first public tracked account is free and keeps full history.',
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
          'Yes. The free plan tracks 1 public Instagram account with follower-count history.',
      },
      {
        question: 'Is this mainly for my own account?',
        answer:
          'The follower tracker is strongest for public accounts you do not own, such as competitors, creators, brands, and clients. For your own exact unfollower names, use the Instagram export workflow.',
      },
    ],
  },
  {
    slug: 'instagram-growth-tracker',
    title: 'Instagram Growth Tracker',
    metaTitle: 'Instagram Growth Tracker - Track Follower Growth',
    description:
      'Track Instagram follower growth for public competitors, creators, brands, and clients with snapshots, growth charts, 7-day trends, and 30-day trends.',
    eyebrow: 'Public growth analytics',
    h1: 'Instagram Growth Tracker',
    intro:
      'Measure public Instagram growth over time for the accounts you need to watch outside your own native Insights dashboard.',
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
        title: 'Campaign watchlists',
        description:
          'Watch public campaign targets, collaborators, and ambassador accounts during launches.',
      },
      {
        title: 'Competitor benchmarks',
        description:
          'Track public competitor growth and compare momentum over time.',
      },
      {
        title: 'Creator reporting',
        description:
          'Use clean public follower charts for client, sponsor, and partnership updates.',
      },
    ],
    workflow: [
      {
        title: 'Choose accounts',
        description: 'Track public creators, brands, competitors, clients, or campaign targets.',
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
          'It tracks public follower-count changes over time, including daily deltas and longer trend windows.',
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
    metaTitle: 'Instagram Follower Count Tracker - Public Account History',
    description:
      'Use an Instagram follower count tracker to save historical public follower counts for competitors, creators, brands, and clients.',
    eyebrow: 'Public follower count history',
    h1: 'Instagram Follower Count Tracker',
    intro:
      'Save public Instagram follower counts over time so you can answer what changed, when it changed, and how fast another account is growing.',
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
          'Build a record of public follower count changes for accounts outside your own Insights.',
      },
      {
        title: 'Trend analysis',
        description:
          'Compare the current count against previous snapshots to see the direction of travel.',
      },
      {
        title: 'Simple reporting',
        description:
          'Use public follower-count history as the baseline for competitor, creator, or client reporting.',
      },
    ],
    workflow: [
      {
        title: 'Add the account',
        description: 'Start tracking a public competitor, creator, brand, client, or campaign handle.',
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
          'Instagram shows current public counts, but not a clear public history for accounts you do not own. This tracker fills that gap.',
      },
      {
        question: 'How many days of history are stored?',
        answer:
          'All plans are designed to keep full follower-count history for tracked public accounts.',
      },
    ],
  },
  {
    slug: 'instagram-tracking-tools',
    title: 'Instagram Tracking Tools',
    metaTitle: 'Instagram Tracking Tools - Follower Growth and Reports',
    description:
      'Explore Instagram tracking tools for public follower growth, competitor monitoring, unfollow detection, client reports, widgets, and API access.',
    eyebrow: 'Creator and agency toolkit',
    h1: 'Instagram Tracking Tools',
    intro:
      'Use one focused toolkit for public Instagram account monitoring, owned-account unfollow workflows, client reports, widgets, and API access.',
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
          'Track public creator growth and follower drops without juggling multiple apps.',
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
        description: 'Add public accounts and collect follower-count snapshots.',
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
    tools: [
      {
        title: 'Instagram Follower Count Checker',
        description: 'Check the live follower count for any public account instantly.',
        href: '/instagram-follower-count',
      },
      {
        title: 'Instagram Growth Tracker',
        description: 'Track how any public account grows over time with daily charts.',
        href: '/instagram-growth-tracker',
      },
      {
        title: 'Instagram Unfollow Tracker',
        description: 'Find out who unfollowed you using your official Instagram data export.',
        href: '/instagram-unfollow-tracker',
      },
      {
        title: 'Fake Follower Checker',
        description: 'Score any public account for fake followers and bot activity.',
        href: '/instagram-fake-follower-checker',
      },
      {
        title: 'Instagram Video Downloader',
        description: 'Download any public Instagram video or Reel as an MP4 — free, no login.',
        href: '/instagram-video-downloader',
      },
      {
        title: 'Instagram Reels Downloader',
        description: 'Save any public Reel as a full-quality MP4 — no watermark, no login.',
        href: '/instagram-reels-downloader',
      },
      {
        title: 'Instagram Story Downloader',
        description: 'Save public stories before they expire and view them anonymously.',
        href: '/instagram-story-downloader',
      },
    ],
    faq: [
      {
        question: 'What Instagram tracking tools are included?',
        answer:
          'The product includes public follower tracking, growth charts, export-based owned-account unfollow detection, report links, widgets, and API access by plan.',
      },
      {
        question: 'Is this for brands?',
        answer:
          'Yes. Brands use it to monitor competitor accounts, track campaign targets, and report follower growth to stakeholders without needing access to Instagram Insights on accounts they do not own.',
      },
      {
        question: 'Is this for solo creators?',
        answer:
          'Yes. Solo creators use it to track their own public growth, watch competitors, find who unfollowed them after posts, and share clean follower charts with sponsors or brand partners.',
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
      'Compare what a good Instagram follower tracker app should include for public account monitoring: daily history, growth charts, competitor tracking, and reports.',
    eyebrow: 'App alternative',
    h1: 'Best Instagram Follower Tracker App',
    intro:
      'A strong Instagram follower tracker should help you watch public accounts you do not own: competitors, creators, brands, clients, and campaign targets.',
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
          'Track public follower counts without handing over Instagram login credentials or relying on native Insights.',
      },
      {
        title: 'Get usable history',
        description:
          'Daily snapshots create a real chart instead of a one-time follower lookup.',
      },
      {
        title: 'Upgrade only when needed',
        description:
          'Start with one public account, then add more watchlist accounts and workflows as usage grows.',
      },
    ],
    workflow: [
      {
        title: 'Search online',
        description: 'Look up a handle from your browser.',
      },
      {
        title: 'Create a tracker',
        description: 'Save a public account and start collecting history.',
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
          'Look for public account history, competitor watchlists, clear limits, reporting workflows, and no need to share your Instagram password.',
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
