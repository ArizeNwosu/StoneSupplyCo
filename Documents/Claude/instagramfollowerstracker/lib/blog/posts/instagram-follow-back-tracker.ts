import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'instagram-follow-back-tracker',
  title: 'Instagram Follow Back Tracker: Find Who Does Not Follow You Back',
  h1: 'Instagram Follow Back Tracker',
  description:
    'Find accounts that do not follow you back using official Instagram export files. Build a safer follow-back cleanup report without logging into a risky third-party app.',
  publishedAt: '2026-06-08',
  updatedAt: '2026-06-08',
  category: 'How-To',
  keywords: [
    'instagram follow back tracker',
    'following tracker instagram',
    'follow unfollow tracker instagram',
    'track followers and unfollowers on instagram',
    'app to track instagram activity',
    'instagram follower activity tracker',
  ],
  readingTime: 6,
  sections: [
    {
      type: 'p',
      text: 'An Instagram follow back tracker compares two lists: people who follow you and people you follow. If someone appears in your following list but not your followers list, they are not following you back.',
    },
    {
      type: 'p',
      text: 'This is different from public follower count tracking. Follow-back tracking is private account intelligence, so the safest source is your own official Instagram export.',
    },
    { type: 'cta' },
    {
      type: 'h2',
      text: 'What a Follow Back Tracker Shows',
    },
    {
      type: 'ul',
      items: [
        'Accounts you follow that do not follow you back',
        'Mutual followers',
        'Fans you do not follow back',
        'Follow/follower ratio',
        'Relationship health score',
        'Cleanup opportunities for large following lists',
      ],
    },
    {
      type: 'h2',
      text: 'Why Instagram Does Not Make This Easy',
    },
    {
      type: 'p',
      text: 'Instagram shows followers and following lists inside the app, but it does not give you a clean side-by-side comparison. Manually checking thousands of accounts is slow. Export-based comparison turns that manual work into a structured report.',
    },
    {
      type: 'h2',
      text: 'How to Use Official Export Files',
    },
    {
      type: 'ol',
      items: [
        'Request your Instagram data from Accounts Center.',
        'Choose HTML or JSON format.',
        'Download and unzip the export.',
        'Open connections/followers_and_following.',
        'Upload followers and following files.',
        'Review the not-following-back and fans-not-followed reports.',
      ],
    },
    {
      type: 'h2',
      text: 'How to Use the Cleanup List',
    },
    {
      type: 'p',
      text: 'The point is not to unfollow everyone automatically. The best use is triage: identify accounts you followed years ago, inactive-looking accounts, or accounts that do not fit your current audience strategy.',
    },
    {
      type: 'tip',
      text: 'Use fans-not-followed as an engagement list. These accounts already follow you, so they may be better relationship opportunities than cold outreach.',
    },
  ],
  faqs: [
    {
      question: 'What is an Instagram follow back tracker?',
      answer:
        'It compares your followers list with your following list to show who does not follow you back, who is mutual, and which followers you do not follow back.',
    },
    {
      question: 'Can I track follow backs without Instagram login?',
      answer:
        'Yes. Use official Instagram export files instead of giving a third-party app your Instagram password.',
    },
    {
      question: 'Can this track another account\'s follow-back list?',
      answer:
        'No. Exact follow-back lists require private follower and following files from the account owner. Public tracking can monitor follower counts, not private relationship lists.',
    },
  ],
};

export default post;
