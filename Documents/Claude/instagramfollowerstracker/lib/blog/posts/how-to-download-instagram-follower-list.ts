import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'how-to-download-instagram-follower-list',
  title: 'How to Download Your Instagram Follower List (2026 Guide)',
  h1: 'How to Download Your Instagram Follower List',
  description:
    'Step-by-step guide to downloading your complete Instagram follower list using Instagram\'s data export feature. What you get, what format it comes in, and how to use it.',
  publishedAt: '2026-06-08',
  updatedAt: '2026-06-08',
  category: 'How-To',
  keywords: [
    'how to download instagram follower list',
    'instagram follower list export',
    'download instagram followers data',
    'instagram data export followers',
    'get instagram follower list',
  ],
  readingTime: 5,
  sections: [
    {
      type: 'p',
      text: 'Instagram allows you to download a complete copy of your account data — including your full follower list — using their built-in data export feature. This is the only legitimate way to get a complete list of your followers as a downloadable file.',
    },
    {
      type: 'cta',
    },
    {
      type: 'h2',
      text: 'How to Request Your Instagram Data Export',
    },
    {
      type: 'ol',
      items: [
        'Open Instagram and go to your profile',
        'Tap the menu (three lines, top right)',
        'Go to Settings → Your Activity',
        'Tap "Download Your Information"',
        'Enter your email address for delivery',
        'Select "HTML" or "JSON" format (JSON is more useful for analysis)',
        'Choose "All Time" for the date range',
        'Tap "Submit Request"',
        'Instagram will email you a link within 14-48 hours',
        'Download the ZIP file and extract it',
      ],
    },
    {
      type: 'h2',
      text: 'What the Follower List File Contains',
    },
    {
      type: 'p',
      text: 'In the downloaded ZIP file, navigate to the "connections" folder. You will find "followers_1.json" (and additional numbered files if you have many followers). Each entry contains the username and the timestamp of when they followed you.',
    },
    {
      type: 'h2',
      text: 'Using Your Follower List',
    },
    {
      type: 'ul',
      items: [
        'Export to a spreadsheet to count and organize your followers',
        'Compare two exports from different dates to identify who unfollowed you',
        'Cross-reference with your following list to find mutual follows',
        'Identify your earliest followers (check timestamps)',
        'Build a record of your audience at a specific point in time',
      ],
    },
    {
      type: 'h2',
      text: 'How to Find Who Unfollowed You by Comparing Exports',
    },
    {
      type: 'p',
      text: 'If you have two data exports from different dates, you can compare the follower lists to find who unfollowed you in that period. This is the only accurate, legitimate method for identifying specific unfollowers without using risky third-party apps.',
    },
    {
      type: 'p',
      text: 'Technical method: export both JSON follower files, extract the username arrays, and compare them. Anyone in the older list but not in the new one unfollowed you in that period. This requires basic technical comfort with JSON data or a spreadsheet tool.',
    },
    {
      type: 'warning',
      text: 'Instagram data export requests can take up to 14 days to fulfill and the link expires after 14 days. Request your data well in advance if you need it for a specific date comparison.',
    },
    {
      type: 'h2',
      text: 'Limitations of the Data Export Method',
    },
    {
      type: 'ul',
      items: [
        'Takes up to 48 hours to receive (not real-time)',
        'Can only be requested every 14 days',
        'Requires manual comparison — no built-in "diff" feature',
        'Only works for your own account, not accounts you follow or track externally',
        'Follower list can be very large (thousands of entries) making manual review impractical',
      ],
    },
    {
      type: 'p',
      text: 'For ongoing follower monitoring without manual export work, our <a href="/">Instagram Followers Tracker</a> automates daily snapshot capture. For unfollow-specific tracking, see our <a href="/instagram-unfollow-tracker">unfollow tracker</a> guide. For how we handled exports to detect unfollows, see our <a href="/how-to-export-instagram-followers-list">export Instagram followers list</a> guide. All tools are at <a href="/instagram-tracking-tools">Instagram tracking tools</a>. Use our <a href="/instagram-follower-tracker-online-free">free online tracker</a> for automatic daily monitoring.',
    },
    {
      type: 'cta',
    },
  ],
  faqs: [
    {
      question: 'Can I download someone else\'s Instagram follower list?',
      answer:
        'No. Instagram only allows you to download your own account\'s data. You cannot access another account\'s follower list through the data export system.',
    },
    {
      question: 'How long does Instagram take to send my data export?',
      answer:
        'Usually 1-48 hours for smaller accounts. Accounts with many followers or extensive activity history can take up to 14 days. The email includes a download link that expires after 14 days.',
    },
    {
      question: 'Is there a limit to how often I can request my Instagram data?',
      answer:
        'Instagram allows one data request per 14-day period per account. If you need more frequent snapshots, a follower count tracker is more practical for ongoing monitoring.',
    },
  ],
};

export default post;
