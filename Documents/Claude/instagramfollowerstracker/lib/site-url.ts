export const SITE_URL = 'https://instagramfollowerstracker.com';

export function publicAccountUrl(handle: string) {
  return `${SITE_URL}/instagram-follower-count/${handle}`;
}
