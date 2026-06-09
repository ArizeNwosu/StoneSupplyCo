import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'ig-following',
  title: 'IG Following: The Complete Guide to Managing Who You Follow on Instagram',
  h1: 'IG Following',
  description: 'Everything you need to know about your IG following list — how it is sorted, how to audit it, how to find ghost follows, and how to keep your following count healthy.',
  publishedAt: '2026-06-09',
  updatedAt: '2026-06-09',
  category: 'Guides',
  keywords: [
    'ig following',
    'instagram following',
    'instagram following list',
    'ig following list',
    'manage instagram following',
    'instagram following count',
    'who i follow on instagram',
    'instagram following too high',
    'ig following order',
    'recently followed instagram',
  ],
  readingTime: 11,
  sections: [
    {
      type: 'p',
      text: 'Your IG following list is one of the most important signals of account credibility on Instagram. A following count that is disproportionately high relative to your follower count signals low authority. An IG following list full of inactive or bot accounts signals low engagement. This guide explains how your Instagram following list works, how to read it, how to audit it effectively, and how to use an <a href="/instagram-tracking-tools">Instagram tracking tool</a> to monitor your following activity over time.',
    },
    {
      type: 'h2',
      text: 'What is the IG following list',
    },
    {
      type: 'p',
      text: 'Your IG following list is the complete list of Instagram accounts you have chosen to follow. When you follow an account, their posts appear in your Instagram feed and their Stories appear in your Stories bar. Your following count — visible on your profile page — is the total number of accounts currently in this list.',
    },
    {
      type: 'p',
      text: 'The following list is distinct from your followers list. Followers are accounts that follow you; following are accounts you follow. The relationship can be mutual (they follow you back) or one-directional (you follow them but they do not follow you).',
    },
    {
      type: 'h2',
      text: 'How Instagram sorts the IG following list',
    },
    {
      type: 'p',
      text: 'Instagram sorts your following list in reverse-chronological order by default. The account you followed most recently appears at the top; the account you followed first appears at the bottom. This makes the top of your following list a record of your most recently followed accounts.',
    },
    {
      type: 'tip',
      text: 'If the order of your following list changes without you following any new accounts, a third-party app may have followed accounts on your behalf. This is a red flag for compromised account access or an unauthorised automation tool.',
    },
    {
      type: 'h2',
      text: 'IG following count limits',
    },
    {
      type: 'p',
      text: 'Instagram enforces hard limits on the following count. Understanding these limits helps you plan your following strategy and avoid account restrictions.',
    },
    {
      type: 'table',
      headers: ['Limit type', 'Limit', 'Consequence of exceeding'],
      rows: [
        ['Maximum following count', '7,500 accounts', 'Instagram blocks all further follows'],
        ['Follows per hour', '~60 follows/hour (varies)', 'Temporary follow block (hours to days)'],
        ['Follows per day', '~200 follows/day (varies)', 'Temporary follow block'],
        ['New account follow rate', 'Lower limits for new accounts', 'Action blocked, potential account flag'],
      ],
    },
    {
      type: 'h2',
      text: 'What a healthy IG following count looks like',
    },
    {
      type: 'p',
      text: 'There is no single correct following count, but the ratio of following to followers is widely used as a credibility signal. An account following 5,000 accounts with only 200 followers is using a mass follow strategy and is widely recognised as doing so. An account with 10,000 followers and 500 following has a healthy ratio that signals organic growth.',
    },
    {
      type: 'table',
      headers: ['Follower count', 'Healthy following range', 'Follow ratio'],
      rows: [
        ['Under 1,000', 'Under 1,000', 'Approximately 1:1 acceptable early on'],
        ['1,000 – 10,000', 'Under 500', 'At least 2:1 followers to following'],
        ['10,000 – 100,000', 'Under 1,000', 'At least 10:1 followers to following'],
        ['100,000+', 'Under 2,000', 'At least 50:1 followers to following'],
        ['Celebrity / mega accounts', 'Often under 500', 'Hundreds or thousands to 1'],
      ],
    },
    {
      type: 'h2',
      text: 'Ghost follows: what they are and why they matter',
    },
    {
      type: 'p',
      text: 'A ghost follow is an account you follow that does not follow you back. Every IG following list contains some ghost follows — these are often celebrities, brands, media outlets, or creators you follow for their content with no expectation of a follow back. Ghost follows become a problem when they make up a large percentage of your following list, dragging your ratio down without any reciprocal relationship.',
    },
    {
      type: 'p',
      text: 'Ghost follows are typically the result of follow/unfollow campaigns — following accounts hoping they will follow back, then forgetting to unfollow if they do not. Over time, these accumulate. Using the <a href="/instagram-unfollow-tracker">Instagram unfollow tracker</a>, you can identify all ghost follows in your following list in one step by uploading your data export.',
    },
    {
      type: 'h2',
      text: 'How to audit your IG following list',
    },
    {
      type: 'h3',
      text: 'Method 1: Manual audit in the app',
    },
    {
      type: 'ol',
      items: [
        'Open your Instagram profile and tap the "Following" count.',
        'Scroll through the list. The top accounts are those you followed most recently.',
        'Tap each account to view their profile and check if they follow you back.',
        'If they do not follow back and you do not need to follow them, tap "Following" → "Unfollow".',
        'Suitable for following lists under 200 accounts. Time-consuming for larger lists.',
      ],
    },
    {
      type: 'h3',
      text: 'Method 2: Data export audit (recommended for large lists)',
    },
    {
      type: 'ol',
      items: [
        'Go to Instagram Settings → Account Center → Your information and permissions → Download your information.',
        'Select Connections (followers and following) only, choose JSON format, and request the export.',
        'Download the ZIP file and upload it to the <a href="/instagram-follower-tracker-online-free">free Instagram follower tracker</a>.',
        'The tool automatically compares your followers list against your following list.',
        'It shows: ghost follows (you follow them, they do not follow back), fans not followed (they follow you, you do not follow back), and mutual follows.',
        'Review the ghost follows list and decide who to unfollow based on relevance and engagement.',
      ],
    },
    {
      type: 'h2',
      text: 'Follow/unfollow tactics and how to detect them',
    },
    {
      type: 'p',
      text: 'The follow/unfollow tactic involves following a large number of accounts to gain follow-backs, then unfollowing them after they follow back. This inflates follower count artificially and is widely considered low-quality growth. Instagram\'s algorithm is increasingly penalising accounts that use this tactic.',
    },
    {
      type: 'p',
      text: 'If you have used a third-party app that ran a follow/unfollow campaign, your following list may contain hundreds or thousands of accounts you do not recognise. These appear at the bottom of your following list (the oldest follows) if the campaign ran and unfollowed subsequently, or at the top if the campaign ran recently. The <a href="/instagram-tracking-tools">Instagram tracking tools</a> page includes tools for identifying and cleaning up mass-follow activity.',
    },
    {
      type: 'warning',
      text: 'Third-party apps that automate following and unfollowing violate Instagram\'s Terms of Service. Using them risks a temporary action block, a permanent ban, or reduced reach. If you have used such apps, revoke their access immediately in Settings → Security → Apps and Websites.',
    },
    {
      type: 'h2',
      text: 'How to clean up your IG following list efficiently',
    },
    {
      type: 'ul',
      items: [
        'Focus on ghost follows first — accounts you follow that do not follow you back and whose content you do not actively engage with',
        'Do not mass-unfollow all at once — Instagram\'s algorithm may flag sudden large drops in your following count',
        'Unfollow 10–20 accounts per day to reduce your following count gradually and safely',
        'Prioritise unfollowing inactive accounts — accounts with no posts in over a year add no value to your feed',
        'Keep following accounts whose content genuinely interests you regardless of whether they follow back',
        'After cleaning up, monitor your following-to-follower ratio using the <a href="/">Instagram Followers Tracker</a> to track improvement over time',
      ],
    },
    {
      type: 'h2',
      text: 'How the IG following list appears in your data export',
    },
    {
      type: 'p',
      text: 'When you download your Instagram data export in JSON format, your following list is stored in a file called following.json inside the connections/followers_and_following/ directory. Each entry contains three fields: the account handle (value), the account\'s Instagram URL (href), and a Unix timestamp showing exactly when you followed that account.',
    },
    {
      type: 'p',
      text: 'This timestamp data is not visible anywhere in the Instagram app UI. The data export is the only official way to get precise follow dates for every account in your following list. Converting the Unix timestamps to human-readable dates gives you a complete timeline of your following activity.',
    },
    {
      type: 'h2',
      text: 'Monitoring your IG following activity over time',
    },
    {
      type: 'p',
      text: 'A one-time audit of your IG following list tells you the current state. Ongoing monitoring tells you trends. If your following count is increasing when you are not actively following new accounts, an app or script is running on your account without your knowledge. If your following count drops sharply, you may have been caught in an Instagram purge of bot or inactive accounts that you were following.',
    },
    {
      type: 'p',
      text: 'By uploading your data export monthly to the <a href="/instagram-follower-tracker-online-free">free Instagram follower tracker online</a>, you get a precise diff each time — showing exactly which accounts you followed and unfollowed in the intervening period. This makes it easy to spot anomalies and maintain an accurate picture of your following activity.',
    },
    {
      type: 'cta',
    },
  ],
  faqs: [
    {
      question: 'What is IG following?',
      answer: 'IG following refers to the list of Instagram accounts you have chosen to follow. Your following count is displayed on your profile page and represents how many accounts you currently follow. When you follow an account, their posts and Stories appear in your Instagram feed.',
    },
    {
      question: 'How is the Instagram following list sorted?',
      answer: 'Your Instagram following list is sorted in reverse-chronological order. The account you followed most recently appears at the top of the list. The account you followed first — when you created your account — appears at the bottom.',
    },
    {
      question: 'What is the maximum number of accounts you can follow on Instagram?',
      answer: 'Instagram limits accounts to following a maximum of 7,500 accounts. If you reach this limit, you cannot follow any new accounts until you unfollow some. Instagram also enforces hourly and daily follow rate limits to prevent spam behaviour.',
    },
    {
      question: 'How do I find ghost follows in my IG following list?',
      answer: 'Ghost follows are accounts you follow that do not follow you back. To find them, download your Instagram data export (Settings → Account Center → Download your information → Connections → JSON), then upload both your following.json and followers_1.json files to the unfollow tracker tool. It automatically identifies all ghost follows.',
    },
    {
      question: 'Can other people see my IG following list?',
      answer: 'Yes, if your account is public, anyone can view your following list. If your account is private, only your approved followers can see it. Your following count is always visible on your public profile regardless of privacy settings.',
    },
    {
      question: 'Why is my IG following count higher than I expected?',
      answer: 'If your following count is unexpectedly high, a third-party app may have followed accounts on your behalf. Check Settings → Security → Apps and Websites to see which apps have access to your account. Revoke access from any apps you do not recognise or no longer use.',
    },
    {
      question: 'How do I reduce my Instagram following count without getting blocked?',
      answer: 'Unfollow accounts gradually — 10 to 20 per day is a safe rate. Avoid using automated unfollow tools, which can trigger Instagram\'s spam detection. Focus first on ghost follows (accounts that do not follow you back) and inactive accounts (no posts in over a year).',
    },
    {
      question: 'Does unfollowing someone on Instagram notify them?',
      answer: 'No. Instagram does not send a notification when you unfollow someone. However, if the person checks their followers list or uses a follower tracking tool, they can see that you no longer follow them.',
    },
  ],
};

export default post;
