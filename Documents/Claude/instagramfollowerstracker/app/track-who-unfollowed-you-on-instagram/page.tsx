import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

const slug = 'track-who-unfollowed-you-on-instagram';

export const metadata = getSeoPageMetadata(slug);

export default function TrackWhoUnfollowedYouOnInstagramPage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
