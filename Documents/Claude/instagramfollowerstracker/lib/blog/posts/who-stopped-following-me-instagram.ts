import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'who-stopped-following-me-instagram',
  title: 'Who Stopped Following Me on Instagram? Here\'s What You Can Find Out',
  h1: 'Who Stopped Following Me on Instagram',
  description:
    'Can you see who stopped following you on Instagram? What data is actually available, what tools claim but cannot deliver, and how to track unfollow activity legitimately.',
  publishedAt: '2026-06-08',
  updatedAt: '2026-06-08',
  category: 'How-To',
  keywords: [
    'who stopped following me on instagram',
    'see who unfollowed me instagram',
    'instagram who stopped following me',
    'how to see who unfollowed you on instagram',
    'instagram unfollow checker',
  ],
  readingTime: 5,
  sections: [
    {
      type: 'p',
      text: 'Instagram does not notify you when someone stops following you. There is no built-in feature to see a list of accounts that recently unfollowed you. This leads millions of users to search for third-party solutions — with mixed results. Here is the honest breakdown of what you can and cannot find out.',
    },
    {
      type: 'cta',
    },
    {
      type: 'h2',
      text: 'What Instagram Shows You Natively',
    },
    {
      type: 'p',
      text: 'Instagram\'s native app shows your current follower count and lets you browse your current follower list. It does not show changes to that list over time. You cannot filter by "new followers" or "recent unfollowers" in the native app. Business and Creator accounts get Insights with net follower change over 7, 14, 30, or 90 days — but no names.',
    },
    {
      type: 'h2',
      text: 'The Manual Method: Comparing Lists',
    },
    {
      type: 'p',
      text: 'The only way to know exactly who stopped following you is to compare a saved snapshot of your follower list from yesterday with your current list today. This requires downloading your Instagram data (Settings → Your Activity → Download Your Information) and comparing the follower JSON files over time. It is tedious, and most people only do it once.',
    },
    {
      type: 'h2',
      text: 'What Third-Party Unfollow Trackers Can Actually Show',
    },
    {
      type: 'p',
      text: 'Legitimate third-party trackers can tell you: your follower count dropped by 47 yesterday, your count has been declining for 5 consecutive days, or you lost 300 followers in the past month. This is net change data — the difference between follows and unfollows — not individual usernames.',
    },
    {
      type: 'p',
      text: 'Our <a href="/">Instagram Followers Tracker</a> records daily follower count snapshots. When your count drops, you see the exact date and magnitude. Combined with your content history, this often tells you what caused the drop even without knowing who left.',
    },
    {
      type: 'h2',
      text: 'Apps That Claim to Show Exact Unfollowers',
    },
    {
      type: 'p',
      text: 'Apps claiming to show you the exact usernames of people who unfollowed you typically work one of three ways:',
    },
    {
      type: 'ul',
      items: [
        'They require your Instagram login and scrape your follower list periodically (TOS violation, account risk)',
        'They use Meta\'s official API — but Meta does not provide an endpoint for follower list changes',
        'They show you fake or generated data that looks plausible but is not real',
      ],
    },
    {
      type: 'warning',
      text: 'Apps that show you "Top Unfollowers" with profile pictures and usernames without ever asking for your account access are displaying fabricated data. The information is not real.',
    },
    {
      type: 'h2',
      text: 'The Practical Value of Follower Count Tracking',
    },
    {
      type: 'p',
      text: 'For most purposes — understanding whether your account is healthy, whether a content change caused audience churn, whether you are growing net positive — knowing exact unfollow names matters less than understanding the trend. If you posted a controversial opinion and lost 500 followers in two days, you know the cause. The names of the 500 do not change what you do next.',
    },
    {
      type: 'p',
      text: 'For detailed guidance on the unfollow tracking tools available, see our <a href="/instagram-unfollow-tracker">unfollow tracker</a> guide and our <a href="/how-to-see-who-unfollowed-you-instagram">how to see who unfollowed you on Instagram</a> deep dive. All tracking options are listed in our <a href="/instagram-tracking-tools">Instagram tracking tools</a> overview. Start free with our <a href="/instagram-follower-tracker-online-free">free online tracker</a>.',
    },
    {
      type: 'cta',
    },
  ],
  faqs: [
    {
      question: 'Does Instagram tell you when someone unfollows you?',
      answer:
        'No. Instagram does not send any notification when someone unfollows you. The only way to know is to compare your follower list over time.',
    },
    {
      question: 'Can I see a list of everyone who unfollowed me this week?',
      answer:
        'Not by name through any safe method. You can see how much your follower count changed this week through a follower tracker, but individual usernames require account-access methods that violate Instagram\'s Terms of Service.',
    },
    {
      question: 'How do I know if someone unfollowed me or deactivated their account?',
      answer:
        'Instagram does not distinguish between unfollows and deactivations in any data it provides. Both result in a follower count decrease. You would need to check manually whether the person\'s account is still active.',
    },
  ],
};

export default post;
