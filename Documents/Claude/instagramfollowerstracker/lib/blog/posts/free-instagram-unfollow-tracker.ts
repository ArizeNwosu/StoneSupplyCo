import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'free-instagram-unfollow-tracker',
  title: 'Free Instagram Unfollow Tracker Without Login',
  h1: 'Free Instagram Unfollow Tracker',
  description:
    'Use a free Instagram unfollow tracker without sharing your password. Learn how official export files reveal lost followers, new followers, and follow-back gaps safely.',
  publishedAt: '2026-06-08',
  updatedAt: '2026-06-08',
  category: 'Guides',
  keywords: [
    'free instagram unfollow tracker',
    'instagram unfollow tracker free',
    'free unfollow tracker instagram',
    'free who unfollowed me on instagram',
    'track who unfollowed you on instagram free',
    'instagram unfollow tracker online',
    'unfollow tracker without login',
  ],
  readingTime: 6,
  sections: [
    {
      type: 'p',
      text: 'A free Instagram unfollow tracker should answer one question safely: what changed in your follower list? The safest way to do that is not by sharing your Instagram password. It is by comparing the follower files Instagram already lets you export from Accounts Center.',
    },
    {
      type: 'p',
      text: 'That export-based workflow gives you a private baseline. Upload the small followers_and_following files once, upload again later, and the tracker can show new followers, lost followers, accounts that do not follow you back, and fans you do not follow back.',
    },
    { type: 'cta' },
    {
      type: 'h2',
      text: 'What You Can See From One Free Upload',
    },
    {
      type: 'ul',
      items: [
        'Your current follower count from the official follower list',
        'Your current following count from the official following list',
        'Accounts you follow that do not follow you back',
        'Followers you do not follow back',
        'Mutual relationships',
        'Recently unfollowed profiles when Instagram includes that file',
      ],
    },
    {
      type: 'h2',
      text: 'What Requires a Second Upload',
    },
    {
      type: 'p',
      text: 'Exact lost-follower detection needs two snapshots. The first upload creates the baseline. The second upload shows which handles disappeared and which handles were added since the previous export.',
    },
    {
      type: 'h2',
      text: 'Why Small Files Are Better Than a Full Export ZIP',
    },
    {
      type: 'p',
      text: 'Instagram exports can include photos, videos, messages, and other large media files. Those are not needed for unfollower tracking. The only folder needed for the core report is connections/followers_and_following, and both HTML and JSON formats work.',
    },
    {
      type: 'warning',
      text: 'Do not upload your full media-heavy Instagram export just to check unfollowers. Use the small follower and following files instead.',
    },
    {
      type: 'h2',
      text: 'Free vs Pro Results',
    },
    {
      type: 'p',
      text: 'The free workflow is useful for establishing a baseline and understanding count-level movement. Pro unlocks the complete handle lists, CSV exports, and repeated account tracking for users who need full cleanup and reporting.',
    },
    {
      type: 'h2',
      text: 'Best Internal Workflow',
    },
    {
      type: 'ol',
      items: [
        'Request your Instagram export from Accounts Center.',
        'Choose HTML or JSON format.',
        'Unzip the export when Instagram emails it.',
        'Open connections/followers_and_following.',
        'Upload the small folder or the files inside it.',
        'Upload again later to see exact new and lost followers.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Is there a free Instagram unfollow tracker that does not need my password?',
      answer:
        'Yes. An export-based unfollow tracker can compare official Instagram follower files without requiring your Instagram password.',
    },
    {
      question: 'Can one export show who unfollowed me?',
      answer:
        'One export creates a baseline and shows relationship cleanup data. Exact lost-follower names require a later export to compare against.',
    },
    {
      question: 'Do I need to upload my Instagram photos and videos?',
      answer:
        'No. For unfollower tracking, upload only the small followers_and_following files. Media, messages, and photos are not needed.',
    },
    {
      question: 'Does HTML work or do I need JSON?',
      answer:
        'Both HTML and JSON follower files work. The important files are followers, following, and optionally recently_unfollowed_profiles.',
    },
  ],
};

export default post;
