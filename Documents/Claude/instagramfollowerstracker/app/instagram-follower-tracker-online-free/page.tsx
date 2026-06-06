import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

const slug = 'instagram-follower-tracker-online-free';

export const metadata = getSeoPageMetadata(slug);

export default function InstagramFollowerTrackerOnlineFreePage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
