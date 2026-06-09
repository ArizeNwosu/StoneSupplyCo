import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'recently-followed-instagram',
  title: 'Recently Followed on Instagram: How to See and Manage Your Following List',
  h1: 'Recently Followed on Instagram',
  description: 'Learn how to see who you recently followed on Instagram, how Instagram sorts your following list, and how to audit accounts you no longer want to follow.',
  publishedAt: '2026-06-09',
  updatedAt: '2026-06-09',
  category: 'How-To',
  keywords: [
    'recently followed instagram',
    'instagram recently followed',
    'see recently followed instagram',
    'who i recently followed on instagram',
    'instagram following list order',
    'instagram recently followed list',
    'how to see recently followed on instagram',
    'ig following',
    'instagram following',
  ],
  readingTime: 9,
  sections: [
    {
      type: 'p',
      text: 'When you open your Instagram following list, the accounts at the top are the ones you most recently followed. Instagram sorts your following list in reverse-chronological order by default — the last account you followed appears first. This guide explains exactly how to access your recently followed list, what the sort order means, how to audit it, and how to use a dedicated <a href="/instagram-tracking-tools">Instagram tracking tool</a> to monitor your following activity over time.',
    },
    {
      type: 'h2',
      text: 'How Instagram sorts your recently followed list',
    },
    {
      type: 'p',
      text: 'Instagram displays your following list in reverse-chronological order. The account you followed most recently is shown at the top; the account you followed first is at the bottom. This ordering makes it easy to review who you recently followed without any additional sorting or filtering.',
    },
    {
      type: 'p',
      text: 'There is no explicit date stamp shown in the mobile app, but the ordering itself is the timestamp. If you followed 500 accounts, the account at position 1 is the most recent, and the account at position 500 is the oldest follow.',
    },
    {
      type: 'tip',
      text: 'If you exported your Instagram data in JSON format, each entry in following.json includes a numeric Unix timestamp showing exactly when you followed each account. This is the most reliable way to see precise follow dates.',
    },
    {
      type: 'h2',
      text: 'How to see who you recently followed on Instagram (step by step)',
    },
    {
      type: 'h3',
      text: 'On iPhone or Android',
    },
    {
      type: 'ol',
      items: [
        'Open the Instagram app and tap your profile photo in the bottom-right corner.',
        'Tap the number shown under "Following" on your profile page.',
        'Your following list opens. The accounts at the very top are the ones you most recently followed.',
        'Scroll down to see older follows in reverse-chronological order.',
        'To search within your following list, tap the search bar at the top of the list and type a username.',
      ],
    },
    {
      type: 'h3',
      text: 'On desktop (instagram.com)',
    },
    {
      type: 'ol',
      items: [
        'Go to instagram.com and sign in.',
        'Click your profile photo in the top-right corner to open your profile.',
        'Click the "Following" count below your bio.',
        'A modal opens showing your following list sorted by most recently followed at the top.',
        'Use the search box inside the modal to find a specific account.',
      ],
    },
    {
      type: 'h2',
      text: 'What counts as "recently followed" on Instagram',
    },
    {
      type: 'p',
      text: 'Instagram does not define a specific time window for "recently followed." The term simply describes the top portion of your following list — accounts you followed in the past few days, weeks, or months depending on how actively you follow new accounts. Heavy users who follow dozens of accounts per week will find their "recent" follows cycling quickly; casual users may see the same accounts at the top for months.',
    },
    {
      type: 'table',
      headers: ['Follow activity level', 'What "recently followed" typically means'],
      rows: [
        ['Casual (1–5 follows/week)', 'Accounts followed in the last 1–3 months'],
        ['Moderate (10–20 follows/week)', 'Accounts followed in the last 2–4 weeks'],
        ['Active (50+ follows/week)', 'Accounts followed in the last few days'],
        ['Mass follow campaigns', 'Accounts followed in the last 24–48 hours'],
      ],
    },
    {
      type: 'h2',
      text: 'Why your recently followed list matters',
    },
    {
      type: 'p',
      text: 'Your recently followed list is useful for several reasons. First, it helps you identify whether a follow/unfollow campaign has been run on your account — if you see dozens of unfamiliar accounts at the top of your following list that you do not remember following, this can indicate compromised account access or a third-party app acting on your behalf.',
    },
    {
      type: 'p',
      text: 'Second, auditing your recently followed list helps you clean up ghost follows — accounts you followed that have never followed you back. Using the <a href="/instagram-unfollow-tracker">Instagram unfollow tracker</a>, you can upload your following list and immediately see which accounts have not reciprocated.',
    },
    {
      type: 'ul',
      items: [
        'Identify accounts you followed during a growth campaign that did not follow back',
        'Spot accounts followed by a third-party app without your knowledge',
        'Review follows made during a period when you were actively networking',
        'Audit influencer accounts you followed for research but no longer need',
        'Detect if someone else accessed your account and followed accounts without permission',
      ],
    },
    {
      type: 'h2',
      text: 'How to see exact follow dates from your Instagram data export',
    },
    {
      type: 'p',
      text: 'The Instagram app does not display exact follow dates in its UI. To get precise timestamps, you need to request your Instagram data export. This gives you a JSON file (following.json) where each entry includes the exact date and time you followed that account.',
    },
    {
      type: 'ol',
      items: [
        'Go to Instagram Settings → Account Center → Your information and permissions → Download your information.',
        'Select your account, choose "Connections (followers and following)" only, and set format to JSON.',
        'Request the export. Instagram will email a download link, usually within minutes.',
        'Download the ZIP, extract it, and open the connections/followers_and_following/following.json file.',
        'Each entry shows the handle and a timestamp field — this is the Unix timestamp of when you followed that account.',
        'Upload the file to the <a href="/instagram-follower-tracker-online-free">free Instagram follower tracker</a> to get a formatted report showing all follow dates.',
      ],
    },
    {
      type: 'h2',
      text: 'How to audit and clean up your recently followed list',
    },
    {
      type: 'p',
      text: 'Auditing your recently followed list means reviewing who you followed in a specific period and deciding who to unfollow. The most common reason to do this is to improve your following-to-follower ratio, which signals credibility on Instagram. Accounts with 5,000 followers but 4,800 following appear less authoritative than accounts with 5,000 followers and 500 following.',
    },
    {
      type: 'h3',
      text: 'Manual audit (small following lists)',
    },
    {
      type: 'ol',
      items: [
        'Open your following list (the top section shows most recently followed).',
        'Tap each account to check whether they follow you back.',
        'If they do not follow back and you do not genuinely want to follow them, tap "Following" → "Unfollow".',
        'Work through the top 50–100 accounts to clean up recent follows.',
      ],
    },
    {
      type: 'h3',
      text: 'Data export audit (large following lists)',
    },
    {
      type: 'ol',
      items: [
        'Download your Instagram data export as described above.',
        'Upload the following.json and followers_1.json files to the unfollow detector tool.',
        'The tool automatically identifies ghost follows — accounts you follow that do not follow you back.',
        'Review the list and decide who to unfollow based on engagement, relevance, and follow-back status.',
      ],
    },
    {
      type: 'h2',
      text: 'Recently followed vs recently unfollowed: what is the difference',
    },
    {
      type: 'p',
      text: 'Instagram distinguishes between two related concepts that are often confused. Your recently followed list shows accounts you chose to follow. Your recently unfollowed list — available in your Instagram data export as recently_unfollowed_profiles.html — shows accounts you chose to stop following. Both lists are useful for understanding your own activity, but they serve different purposes.',
    },
    {
      type: 'table',
      headers: ['Concept', 'Where to find it', 'What it shows'],
      rows: [
        ['Recently followed', 'Top of your following list in the app', 'Accounts you followed, newest first'],
        ['Recently unfollowed', 'Instagram data export → recently_unfollowed_profiles.html', 'Accounts you unfollowed recently'],
        ['Ghost follows', 'Unfollow detector tool', 'Accounts you follow that do not follow you back'],
        ['Recent followers', 'Your followers list in the app', 'Accounts that recently followed you'],
      ],
    },
    {
      type: 'h2',
      text: 'How to track your following activity over time',
    },
    {
      type: 'p',
      text: 'The Instagram app only shows a snapshot of your current following list. It does not show historical data — you cannot see who you followed six months ago unless you have saved your data exports from that time. To track your following activity over time, you need to take regular snapshots using the <a href="/">Instagram Followers Tracker</a> or export your data periodically and compare snapshots.',
    },
    {
      type: 'p',
      text: 'The recommended approach is to upload your Instagram data export once per month. Each upload creates a timestamped snapshot of your followers and following lists. When you upload again the following month, the tool automatically computes the diff — showing exactly who you followed and unfollowed in the intervening period. This gives you a precise audit trail of your following activity without relying on the app\'s sorted list.',
    },
    {
      type: 'h2',
      text: 'Common questions about the recently followed list',
    },
    {
      type: 'h3',
      text: 'Can other people see who I recently followed?',
    },
    {
      type: 'p',
      text: 'Other users cannot directly see your following list in chronological order unless they open your profile and scroll through your following list themselves. However, if someone follows you and monitors your following count over time using an <a href="/instagram-tracking-tools">Instagram tracking tool</a>, they can infer that you have been following new accounts. The specific accounts you followed are visible to anyone who can see your following list (all users if your account is public; only approved followers if your account is private).',
    },
    {
      type: 'h3',
      text: 'Does Instagram notify accounts when you follow them?',
    },
    {
      type: 'p',
      text: 'Yes. When you follow a public account, they receive a notification that you followed them. When you follow a private account, they receive a follow request notification. If you unfollow an account, they do not receive a notification — but they can see you are no longer following them if they check.',
    },
    {
      type: 'h2',
      text: 'Using an Instagram tracker to monitor your following list',
    },
    {
      type: 'p',
      text: 'Manual audits of your recently followed list are time-consuming for accounts with large following lists. The most efficient approach is to use a dedicated Instagram follower and following tracker that automatically computes changes between uploads. Visit the <a href="/instagram-follower-tracker-online-free">free Instagram follower tracker online</a> to get started — no Instagram login required.',
    },
    {
      type: 'cta',
    },
  ],
  faqs: [
    {
      question: 'How do I see who I recently followed on Instagram?',
      answer: 'Open your Instagram profile and tap the "Following" count. Your following list opens sorted with the most recently followed accounts at the top. The further down the list, the longer ago you followed that account.',
    },
    {
      question: 'Does Instagram show exact dates for when you followed someone?',
      answer: 'The Instagram app does not show exact follow dates in its UI. To see precise timestamps, download your Instagram data export (Settings → Account Center → Download your information → Connections → JSON format). The following.json file includes a Unix timestamp for each follow.',
    },
    {
      question: 'Can I search my recently followed list on Instagram?',
      answer: 'Yes. Open your following list, then tap the search bar at the top of the list. You can search by username or display name. This searches your entire following list, not just recently followed accounts.',
    },
    {
      question: 'Why does my following list order change?',
      answer: 'Your following list is sorted by most recently followed. Each time you follow a new account, it moves to the top. The order changes constantly as you follow new accounts. If the order changes without you following anyone, a third-party app may have followed accounts on your behalf.',
    },
    {
      question: 'How do I find accounts I followed but who never followed me back?',
      answer: 'Download your Instagram data export and upload both your followers_1.json and following.json files to the unfollow detector tool. It automatically identifies ghost follows — accounts you follow that are not in your followers list.',
    },
    {
      question: 'Is there a limit to how many accounts I can follow on Instagram?',
      answer: 'Instagram limits accounts to following a maximum of 7,500 accounts. Additionally, Instagram limits how many accounts you can follow per hour and per day to prevent spam behaviour. Exceeding these rate limits can result in a temporary follow block.',
    },
    {
      question: 'What is the difference between recently followed and recent followers?',
      answer: '"Recently followed" refers to accounts you chose to follow — visible at the top of your following list. "Recent followers" refers to accounts that chose to follow you — visible at the top of your followers list. These are two separate lists tracking opposite directions of the follow relationship.',
    },
    {
      question: 'Can I export my recently followed list?',
      answer: 'Yes. Request your Instagram data export from Account Center, choose Connections (followers and following) in JSON format. The following.json file contains your complete following list with timestamps, which you can open in any spreadsheet or analysis tool.',
    },
  ],
};

export default post;
