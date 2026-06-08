import type { ExportPerson } from '@/lib/export-parser';

export interface RelationshipIntelligence {
  followerCount: number;
  followingCount: number;
  mutualCount: number;
  notFollowingBackCount: number;
  fansNotFollowedCount: number;
  followRatio: number | null;
  healthScore: number;
  healthLabel: string;
  insights: string[];
  notFollowingBack: ExportPerson[];
  fansNotFollowed: ExportPerson[];
}

export function buildRelationshipIntelligence({
  followers,
  following,
}: {
  followers: ExportPerson[];
  following: ExportPerson[];
}): RelationshipIntelligence {
  const followerHandles = new Set(followers.map((person) => person.handle));
  const followingHandles = new Set(following.map((person) => person.handle));

  const notFollowingBack = following.filter((person) => !followerHandles.has(person.handle));
  const fansNotFollowed = followers.filter((person) => !followingHandles.has(person.handle));
  const mutualCount = followers.filter((person) => followingHandles.has(person.handle)).length;
  const followRatio = followers.length > 0 ? following.length / followers.length : null;

  const nonFollowbackRate = following.length > 0 ? notFollowingBack.length / following.length : 0;
  const mutualRate = followers.length > 0 ? mutualCount / followers.length : 0;
  const fanOpportunityRate = followers.length > 0 ? fansNotFollowed.length / followers.length : 0;

  const score = clampScore(
    100
      - nonFollowbackRate * 45
      - Math.max(0, (followRatio ?? 0) - 1) * 7
      + mutualRate * 20
      + Math.min(fanOpportunityRate, 0.35) * 10
  );

  return {
    followerCount: followers.length,
    followingCount: following.length,
    mutualCount,
    notFollowingBackCount: notFollowingBack.length,
    fansNotFollowedCount: fansNotFollowed.length,
    followRatio,
    healthScore: score,
    healthLabel: labelForScore(score),
    insights: buildInsights({
      followerCount: followers.length,
      followingCount: following.length,
      mutualCount,
      notFollowingBackCount: notFollowingBack.length,
      fansNotFollowedCount: fansNotFollowed.length,
      followRatio,
    }),
    notFollowingBack,
    fansNotFollowed,
  };
}

function buildInsights({
  followerCount,
  followingCount,
  mutualCount,
  notFollowingBackCount,
  fansNotFollowedCount,
  followRatio,
}: {
  followerCount: number;
  followingCount: number;
  mutualCount: number;
  notFollowingBackCount: number;
  fansNotFollowedCount: number;
  followRatio: number | null;
}) {
  const insights: string[] = [];

  if (followRatio !== null && followRatio > 3) {
    insights.push(
      `You follow ${followRatio.toFixed(1)}x more accounts than follow you. Start with the non-followback cleanup list.`
    );
  } else if (followRatio !== null && followRatio <= 1) {
    insights.push('Your follow/follower balance is healthy. Focus on keeping high-value mutuals engaged.');
  }

  if (notFollowingBackCount > 0 && followingCount > 0) {
    const percent = Math.round((notFollowingBackCount / followingCount) * 100);
    insights.push(`${percent}% of accounts you follow do not follow you back.`);
  }

  if (fansNotFollowedCount > 0) {
    insights.push(`${fansNotFollowedCount.toLocaleString()} followers are fans you do not follow back.`);
  }

  if (mutualCount > 0 && followerCount > 0) {
    const percent = Math.round((mutualCount / followerCount) * 100);
    insights.push(`${percent}% of your followers are mutual relationships.`);
  }

  if (insights.length === 0) {
    insights.push('Upload another export later to unlock change-based follower intelligence.');
  }

  return insights.slice(0, 4);
}

function labelForScore(score: number) {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Stable';
  if (score >= 40) return 'Needs cleanup';
  return 'Heavy cleanup';
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
