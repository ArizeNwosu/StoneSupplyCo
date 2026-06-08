import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'how-to-export-instagram-followers-list',
  title: 'How to Export Your Instagram Followers List (Official Method)',
  h1: 'How to Export Instagram Followers List',
  description:
    'The official way to export your Instagram followers list using Instagram\'s own data download feature. Step-by-step instructions and how to use the data.',
  publishedAt: '2026-06-08',
  updatedAt: '2026-06-08',
  category: 'How-To',
  keywords: [
    'export instagram followers list',
    'download instagram followers list',
    'instagram followers export',
    'instagram data download followers',
    'get instagram followers list',
  ],
  readingTime: 5,
  sections: [
    {
      type: 'p',
      text: 'Exporting your Instagram followers list is possible through Instagram\'s own official data download feature — no third-party tools required, no terms of service violations. This guide covers the exact steps to request and download your followers list and what you can do with the data once you have it.',
    },
    {
      type: 'cta',
    },
    {
      type: 'h2',
      text: 'The Official Way: Instagram\'s Data Download',
    },
    {
      type: 'p',
      text: 'Instagram allows you to download a full copy of your account data including your complete followers list. This is an official feature required by privacy regulations in multiple countries.',
    },
    {
      type: 'ol',
      items: [
        'Open Instagram and go to your profile',
        'Tap the three lines menu (top right) and select Settings and Privacy',
        'Scroll to "Your Activity" and tap "Download Your Information"',
        'Select "Download or Transfer Information"',
        'Choose "Some of your information"',
        'Under "Connections", check "Followers and Following"',
        'Select date range (All time recommended)',
        'Choose format: JSON or HTML',
        'Enter your email address',
        'Tap "Create Files" — Instagram will email you when the download is ready (can take up to 48 hours)',
      ],
    },
    {
      type: 'h2',
      text: 'What the Export Contains',
    },
    {
      type: 'p',
      text: 'The followers export includes the username and a timestamp for each follower. The following export includes the accounts you follow. Together, these files let you:',
    },
    {
      type: 'ul',
      items: [
        'See your complete followers list as a file',
        'Identify accounts you follow who do not follow you back',
        'Compare two exports over time to identify who unfollowed you',
        'Back up your followers list in case of account issues',
        'Import the data into a spreadsheet for analysis',
      ],
    },
    {
      type: 'h2',
      text: 'How to Find Unfollowers Using Your Export',
    },
    {
      type: 'p',
      text: 'Download your followers list today. Save the file. Wait 30-60 days and download it again. Compare the two files — any username in the first file that is not in the second has unfollowed you during that period.',
    },
    {
      type: 'p',
      text: 'For the JSON format, you can compare files programmatically. For the HTML format, you can open both in a browser and visually scan for differences, or copy the usernames into a comparison tool. This is the safest and most official method to detect unfollowers — it uses only Instagram-provided data.',
    },
    {
      type: 'h2',
      text: 'Limitations of the Export Approach',
    },
    {
      type: 'ul',
      items: [
        'Takes up to 48 hours to receive the download',
        'Manual process — not automatic or continuous',
        'Comparison requires two separate exports (point-in-time snapshots)',
        'Does not show the specific date someone unfollowed (only which period)',
        'File format requires some technical comfort to interpret',
      ],
    },
    {
      type: 'p',
      text: 'For continuous automated monitoring of your follower count changes, use our <a href="/instagram-unfollow-tracker">Instagram unfollow tracker</a> alongside the official export. The tracker gives you daily change data; the export gives you the specific usernames in aggregate.',
    },
    {
      type: 'h2',
      text: 'Why Not Use Third-Party Apps for This?',
    },
    {
      type: 'warning',
      text: 'Third-party apps that claim to download your followers list by connecting to your Instagram account via login typically violate Meta\'s Terms of Service and may compromise your account security. The official Instagram data download is the only safe method.',
    },
    {
      type: 'p',
      text: 'For tracking your follower count changes without exporting individual names, our <a href="/">Instagram Followers Tracker</a> records daily net changes automatically. For the full list of monitoring tools, see our <a href="/instagram-tracking-tools">Instagram tracking tools overview</a>.',
    },
    {
      type: 'cta',
    },
  ],
  faqs: [
    {
      question: 'Can I download my complete Instagram followers list?',
      answer:
        'Yes, through Instagram\'s official "Download Your Information" feature. It exports your full followers list as a JSON or HTML file. Requests typically take up to 48 hours to process.',
    },
    {
      question: 'Is there a faster way to get my Instagram followers list?',
      answer:
        'The official Instagram export is the only safe method. Third-party apps that claim faster access typically violate Meta\'s Terms of Service and risk account suspension.',
    },
    {
      question: 'What format does the Instagram followers export come in?',
      answer:
        'You can choose between JSON and HTML. JSON is better for programmatic processing. HTML can be opened directly in a browser. Both contain usernames and follow timestamps.',
    },
  ],
};

export default post;
