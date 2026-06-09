import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'instagram-recently-followed-list',
  title: 'Your Instagram Recently Followed List: What It Shows and How to Use It',
  h1: 'Instagram Recently Followed List',
  description: 'Understand exactly what your Instagram recently followed list shows, how to read follow timestamps from your data export, and how to use this data to audit your following activity.',
  publishedAt: '2026-06-09',
  updatedAt: '2026-06-09',
  category: 'Guides',
  keywords: [
    'instagram recently followed',
    'recently followed instagram',
    'instagram recently followed list',
    'instagram following list order',
    'ig following order',
    'instagram follow history',
    'instagram following timestamps',
    'how to see instagram follow history',
    'ig following',
  ],
  readingTime: 10,
  sections: [
    {
      type: 'p',
      text: 'Your Instagram recently followed list is not a separate section in the app — it is simply the top of your following list, sorted by the accounts you followed most recently. The list is always in reverse-chronological order: the account at position 1 is the most recent follow, the account at the very bottom is your oldest follow. This guide explains how to read the list, how to extract exact timestamps, how to identify patterns in your following history, and how to connect this data to your growth tracking with the <a href="/">Instagram Followers Tracker</a>.',
    },
    {
      type: 'h2',
      text: 'How the Instagram recently followed list works',
    },
    {
      type: 'p',
      text: 'Every time you follow an account on Instagram, that account is added to the top of your following list. The list functions as a chronological log of your follows, with the most recent at the top. Instagram does not display dates or timestamps next to each account in the app — the ordering itself is the only indicator of when you followed each account.',
    },
    {
      type: 'p',
      text: 'This means that if you followed 100 accounts yesterday during a growth campaign, all 100 will appear at the top of your following list today, pushing older follows further down. The list is purely ordered by follow time with no grouping, filtering, or date markers visible in the native app.',
    },
    {
      type: 'h2',
      text: 'Where to find your Instagram recently followed list',
    },
    {
      type: 'ol',
      items: [
        'Open Instagram and navigate to your profile.',
        'Tap the "Following" count beneath your bio.',
        'Your following list opens, sorted with the most recently followed accounts at the top.',
        'The accounts at the top of this list are your recently followed accounts.',
        'There is no separate "recently followed" tab — recent follows are simply the top portion of your complete following list.',
      ],
    },
    {
      type: 'h2',
      text: 'How to get exact timestamps for your Instagram recently followed list',
    },
    {
      type: 'p',
      text: 'The Instagram app does not show timestamps next to followed accounts. To get exact dates and times for every follow in your history, you need to download your Instagram data export. This is the only official way to access your complete follow history with timestamps.',
    },
    {
      type: 'h3',
      text: 'Step 1: Request your data export',
    },
    {
      type: 'ol',
      items: [
        'Go to Instagram Settings → Account Center.',
        'Tap "Your information and permissions".',
        'Tap "Download your information" → "Request a download".',
        'Select your Instagram account.',
        'Tap "Data to export" → choose "Connections (followers and following)" only.',
        'Set Format to "JSON" and tap "Save".',
        'Tap "Date range" → select "All time" → tap "Save".',
        'Tap "Start download". Instagram will email you a link when ready.',
      ],
    },
    {
      type: 'h3',
      text: 'Step 2: Find the following list with timestamps',
    },
    {
      type: 'ol',
      items: [
        'Download the ZIP file from the link in your email.',
        'Unzip the file and navigate to connections/followers_and_following/.',
        'Open following.json in any text editor or JSON viewer.',
        'Each entry in the file looks like: { "title": "", "string_list_data": [{ "href": "https://www.instagram.com/username", "value": "username", "timestamp": 1700000000 }] }',
        'The "timestamp" field is a Unix timestamp. Convert it to a readable date at any Unix timestamp converter.',
        'Or upload the file to the <a href="/instagram-follower-tracker-online-free">free Instagram follower tracker online</a> for an automatic formatted report.',
      ],
    },
    {
      type: 'tip',
      text: 'Unix timestamps are the number of seconds since January 1, 1970. A timestamp of 1700000000 converts to November 14, 2023. Most spreadsheet apps (Excel, Google Sheets) can convert Unix timestamps to readable dates with a formula.',
    },
    {
      type: 'h2',
      text: 'What your recently followed list reveals about your account',
    },
    {
      type: 'p',
      text: 'Analysing the timestamps in your recently followed list reveals patterns in your following behaviour that are not visible in the app. These patterns can explain changes in your own follower count and identify practices that may be hurting your account.',
    },
    {
      type: 'table',
      headers: ['Pattern in recently followed list', 'What it indicates'],
      rows: [
        ['Dozens of follows in a single day', 'Manual or automated mass-follow campaign'],
        ['Regular 10–20 follows per day', 'Organic, intentional growth strategy'],
        ['No follows for weeks, then a spike', 'One-time growth campaign or app was used temporarily'],
        ['Many follows of accounts with 100k+ followers', 'Following celebrities/brands, likely for content not follow-back'],
        ['Many follows of small, similar accounts', 'Niche follow campaign, hoping for follow-backs'],
        ['Follows immediately followed by unfollows', 'Follow/unfollow tactic — visible in export diffs over time'],
      ],
    },
    {
      type: 'h2',
      text: 'How Instagram recently followed data relates to follower count changes',
    },
    {
      type: 'p',
      text: 'When you run a follow campaign — following many accounts in a short period — you typically see a corresponding rise in your own follower count as some accounts follow back. When you stop following or begin unfollowing, some of those followers unfollow back. This creates a visible correlation between your recently followed list and your follower count trend.',
    },
    {
      type: 'p',
      text: 'Using the <a href="/instagram-unfollow-tracker">Instagram unfollow tracker</a> alongside your recently followed list lets you measure the effectiveness of follow campaigns: how many accounts you followed in a period and how many followed back. Upload your data export before and after a campaign to compute the exact follow-back rate.',
    },
    {
      type: 'h2',
      text: 'How to compare two recently followed lists to track changes',
    },
    {
      type: 'p',
      text: 'To see exactly which accounts you followed or unfollowed between two dates, you need two separate data exports taken at different times. The difference between the two following.json files shows every account you added (follows) and every account you removed (unfollows) in that period.',
    },
    {
      type: 'ol',
      items: [
        'Download your Instagram data export today (snapshot 1).',
        'Wait a week, two weeks, or a month.',
        'Download your data export again (snapshot 2).',
        'Upload both exports to the unfollow detector tool.',
        'The tool shows: accounts in snapshot 2\'s following list but not snapshot 1 (new follows), and accounts in snapshot 1\'s following list but not snapshot 2 (unfollows).',
      ],
    },
    {
      type: 'h2',
      text: 'Recently followed list vs recently unfollowed list',
    },
    {
      type: 'p',
      text: 'Your Instagram data export contains a file called recently_unfollowed_profiles.html in addition to following.json. The recently unfollowed file lists accounts you stopped following, with timestamps. Comparing your recently followed and recently unfollowed data gives you a complete picture of your following churn over any period.',
    },
    {
      type: 'table',
      headers: ['File', 'Contains', 'Use case'],
      rows: [
        ['following.json', 'All accounts you currently follow, with timestamps', 'See your complete follow history and current following list'],
        ['followers_1.json', 'All accounts that currently follow you, with timestamps', 'See your complete follower history and current followers'],
        ['recently_unfollowed_profiles.html', 'Accounts you recently unfollowed', 'See who you stopped following recently'],
      ],
    },
    {
      type: 'h2',
      text: 'Using recently followed data for competitive analysis',
    },
    {
      type: 'p',
      text: 'Your recently followed list is private — others can see who you follow but not when you followed them (unless they download their own export and are listed in it). However, you can use the recently followed data of your own account to benchmark your growth strategy against public account growth data.',
    },
    {
      type: 'p',
      text: 'For example: if a competitor gained 5,000 followers in a month and you also ran a follow campaign in the same period, comparing your follow-back rate to their growth rate gives insight into the relative effectiveness of each approach. Track competitor follower counts using the <a href="/instagram-tracking-tools">Instagram tracking tools</a> and compare against your own follow activity data.',
    },
    {
      type: 'h2',
      text: 'Automating recently followed tracking',
    },
    {
      type: 'p',
      text: 'Manually downloading and comparing data exports every month is effective but time-consuming. The most automated approach currently available is to connect your Instagram account to the Google Drive export option in Instagram\'s Account Center. Set Instagram to push daily exports to Google Drive, connect your drive to the <a href="/instagram-follower-tracker-online-free">Instagram follower tracker</a>, and your following data is updated automatically every day.',
    },
    {
      type: 'cta',
    },
  ],
  faqs: [
    {
      question: 'What is the Instagram recently followed list?',
      answer: 'The Instagram recently followed list is the top section of your following list, sorted by the accounts you followed most recently. Instagram does not have a dedicated "recently followed" tab — the following list is always sorted in reverse-chronological order, with the most recent follows at the top.',
    },
    {
      question: 'How do I see the dates of when I followed accounts on Instagram?',
      answer: 'Download your Instagram data export from Account Center (Settings → Account Center → Your information and permissions → Download your information → Connections → JSON format). The following.json file contains a Unix timestamp for every account you follow, showing the exact date and time you followed them.',
    },
    {
      question: 'Can I filter my Instagram following list to show only recent follows?',
      answer: 'No. Instagram does not offer date filtering in the following list UI. The list is always sorted by recency (newest first) but there are no filters or date range selectors. To see follows from a specific date range, use your data export and filter by the timestamp field.',
    },
    {
      question: 'How far back does the Instagram recently followed history go?',
      answer: 'Your Instagram data export contains your complete following history from the day you created your account. Every account you currently follow is listed with a timestamp. Note that accounts you followed and subsequently unfollowed do not appear in following.json — only your current following list is shown.',
    },
    {
      question: 'Does Instagram store a history of accounts I unfollowed?',
      answer: 'Instagram keeps a limited recently unfollowed list. Your data export includes a recently_unfollowed_profiles.html file, but it only covers a recent window — not your complete unfollow history. For complete follow/unfollow history, you need to compare two data exports taken at different times.',
    },
    {
      question: 'Why does the top of my following list show accounts I don\'t remember following?',
      answer: 'If unfamiliar accounts appear at the top of your recently followed list, a third-party app or service may have followed them on your behalf. Check Settings → Security → Apps and Websites and revoke access from any apps you do not recognise. Change your password as a precaution.',
    },
    {
      question: 'Can I see when I first followed someone on Instagram?',
      answer: 'Yes, if they are still in your following list. Download your data export in JSON format and find the account in following.json. The timestamp field shows the exact date and time you followed them. If you have unfollowed the account, this record is no longer in your export.',
    },
  ],
};

export default post;
