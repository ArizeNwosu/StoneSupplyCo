import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

const slug = 'instagram-followers-and-unfollowers-tracker';

export const metadata = getSeoPageMetadata(slug);

export default function InstagramFollowersAndUnfollowersTrackerPage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
