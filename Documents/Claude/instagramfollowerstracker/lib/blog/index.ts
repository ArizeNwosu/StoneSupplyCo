import type { BlogPost } from './types';
import instagramFollowersTracker from './posts/instagram-followers-tracker';
import instagramUnfollowTracker from './posts/instagram-unfollow-tracker';
import trackInstagramFollowerGrowth from './posts/track-instagram-follower-growth';
import bestInstagramFollowerTrackerApps from './posts/best-instagram-follower-tracker-apps';
import instagramFollowerTrackerWithoutLogin from './posts/instagram-follower-tracker-without-login';
import trackSomeonesInstagramFollowers from './posts/track-someones-instagram-followers';
import instagramTrackingTools from './posts/instagram-tracking-tools';
import instagramNewFollowersTracker from './posts/instagram-new-followers-tracker';
import freeInstagramFollowerTracker from './posts/free-instagram-follower-tracker';
import instagramFakeFollowerChecker from './posts/instagram-fake-follower-checker';
import instagramLikesTracker from './posts/instagram-likes-tracker';
import trackInstagramFollowingActivity from './posts/track-instagram-following-activity';
import instagramFollowerTrackerOnline from './posts/instagram-follower-tracker-online';
import instagramGrowthTrackerForInfluencers from './posts/instagram-growth-tracker-for-influencers';
import howToGainInstagramFollowers from './posts/how-to-gain-instagram-followers';
import instagramFollowerTrackerReddit from './posts/instagram-follower-tracker-reddit';
import freeInstagramUnfollowTracker from './posts/free-instagram-unfollow-tracker';
import instagramFollowBackTracker from './posts/instagram-follow-back-tracker';
import instagramFollowerTrackerThatWorks from './posts/instagram-follower-tracker-that-works';

export const ALL_POSTS: BlogPost[] = [
  instagramFollowersTracker,
  instagramUnfollowTracker,
  trackInstagramFollowerGrowth,
  bestInstagramFollowerTrackerApps,
  instagramFollowerTrackerWithoutLogin,
  trackSomeonesInstagramFollowers,
  instagramTrackingTools,
  instagramNewFollowersTracker,
  freeInstagramFollowerTracker,
  instagramFakeFollowerChecker,
  instagramLikesTracker,
  trackInstagramFollowingActivity,
  instagramFollowerTrackerOnline,
  instagramGrowthTrackerForInfluencers,
  howToGainInstagramFollowers,
  instagramFollowerTrackerReddit,
  freeInstagramUnfollowTracker,
  instagramFollowBackTracker,
  instagramFollowerTrackerThatWorks,
];

export function getPost(slug: string): BlogPost | undefined {
  return ALL_POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return ALL_POSTS.map((p) => p.slug);
}

export type { BlogPost };
