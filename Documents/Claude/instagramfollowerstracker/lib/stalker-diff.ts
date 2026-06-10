// lib/stalker-diff.ts
// SERVER-SIDE ONLY. Pure functions — no DB access, no side effects.

export type StalkerSignal =
  | 'BIO_CHANGED'
  | 'LINK_CHANGED'
  | 'AVATAR_CHANGED'
  | 'NEW_POST'
  | 'POST_DELETED'
  | 'NEW_FOLLOW'
  | 'WENT_PRIVATE'
  | 'DISPLAY_NAME_CHANGED'
  | 'USERNAME_CHANGED'
  | 'VERIFIED_CHANGED'
  | 'CATEGORY_CHANGED'
  | 'PRONOUNS_CHANGED';

export interface StalkerProfileState {
  username: string;
  displayName: string | null;
  bio: string | null;
  externalUrl: string | null;
  avatarUrl: string | null;
  postCount: number | null;
  highlightCount: number | null;
  isVerified: boolean;
  category: string | null;
  pronouns: string[];
  recentFollowing: string[];
  isPrivate: boolean;
}

export interface StalkerChange {
  signal: StalkerSignal;
  oldValue: string | null;
  newValue: string | null;
}

// Alert only when this many posts are deleted in a single scrape cycle.
export const BULK_DELETE_THRESHOLD = 3;

/**
 * Compares two profile states and returns all detected changes.
 * Returns an empty array when nothing changed.
 */
export function diffStalkerProfiles(
  prev: StalkerProfileState,
  next: StalkerProfileState
): StalkerChange[] {
  const changes: StalkerChange[] = [];

  if (next.isPrivate && !prev.isPrivate) {
    changes.push({ signal: 'WENT_PRIVATE', oldValue: 'public', newValue: 'private' });
    // Can't diff further — content is hidden once account goes private
    return changes;
  }

  if (prev.username !== next.username) {
    changes.push({ signal: 'USERNAME_CHANGED', oldValue: prev.username, newValue: next.username });
  }

  if (prev.displayName !== next.displayName) {
    changes.push({ signal: 'DISPLAY_NAME_CHANGED', oldValue: prev.displayName, newValue: next.displayName });
  }

  if (prev.bio !== next.bio) {
    changes.push({ signal: 'BIO_CHANGED', oldValue: prev.bio, newValue: next.bio });
  }

  if (prev.externalUrl !== next.externalUrl) {
    changes.push({ signal: 'LINK_CHANGED', oldValue: prev.externalUrl, newValue: next.externalUrl });
  }

  if (prev.avatarUrl !== next.avatarUrl && next.avatarUrl !== null) {
    changes.push({ signal: 'AVATAR_CHANGED', oldValue: prev.avatarUrl, newValue: next.avatarUrl });
  }

  if (prev.isVerified !== next.isVerified) {
    changes.push({ signal: 'VERIFIED_CHANGED', oldValue: String(prev.isVerified), newValue: String(next.isVerified) });
  }

  if (prev.category !== next.category) {
    changes.push({ signal: 'CATEGORY_CHANGED', oldValue: prev.category, newValue: next.category });
  }

  const prevPronouns = prev.pronouns.join(',');
  const nextPronouns = next.pronouns.join(',');
  if (prevPronouns !== nextPronouns) {
    changes.push({ signal: 'PRONOUNS_CHANGED', oldValue: prevPronouns || null, newValue: nextPronouns || null });
  }

  const prevPostCount = prev.postCount ?? 0;
  const nextPostCount = next.postCount ?? 0;
  if (nextPostCount > prevPostCount) {
    changes.push({
      signal: 'NEW_POST',
      oldValue: String(prevPostCount),
      newValue: String(nextPostCount),
    });
  } else if (prevPostCount - nextPostCount >= BULK_DELETE_THRESHOLD) {
    changes.push({
      signal: 'POST_DELETED',
      oldValue: String(prevPostCount),
      newValue: String(nextPostCount),
    });
  }

  const prevSet = new Set(prev.recentFollowing);
  for (const handle of next.recentFollowing) {
    if (!prevSet.has(handle)) {
      changes.push({ signal: 'NEW_FOLLOW', oldValue: null, newValue: handle });
    }
  }

  return changes;
}

/** Human-readable summary for each signal (used in emails and UI). */
export function formatStalkerChange(change: StalkerChange, accountHandle: string): string {
  switch (change.signal) {
    case 'BIO_CHANGED':
      return `@${accountHandle} updated their bio`;
    case 'LINK_CHANGED':
      return change.newValue
        ? `@${accountHandle} changed their link to ${change.newValue}`
        : `@${accountHandle} removed their link`;
    case 'AVATAR_CHANGED':
      return `@${accountHandle} changed their profile photo`;
    case 'NEW_POST':
      return `@${accountHandle} posted something new (${change.newValue} posts total)`;
    case 'POST_DELETED':
      return `@${accountHandle} deleted ${Number(change.oldValue) - Number(change.newValue)} post(s)`;
    case 'NEW_FOLLOW':
      return `@${accountHandle} followed @${change.newValue}`;
    case 'WENT_PRIVATE':
      return `@${accountHandle} switched to a private account`;
    case 'DISPLAY_NAME_CHANGED':
      return `@${accountHandle} changed their display name to "${change.newValue}"`;
    case 'USERNAME_CHANGED':
      return `@${change.oldValue} changed their username to @${change.newValue}. Blocked? Who cares, we do the stalking for you.`;
    case 'VERIFIED_CHANGED':
      return change.newValue === 'true'
        ? `@${accountHandle} got verified ✓`
        : `@${accountHandle} lost their verified badge`;
    case 'CATEGORY_CHANGED':
      return change.newValue
        ? `@${accountHandle} changed their category to "${change.newValue}"`
        : `@${accountHandle} removed their category`;
    case 'PRONOUNS_CHANGED':
      return change.newValue
        ? `@${accountHandle} updated their pronouns to ${change.newValue}`
        : `@${accountHandle} removed their pronouns`;
  }
}
