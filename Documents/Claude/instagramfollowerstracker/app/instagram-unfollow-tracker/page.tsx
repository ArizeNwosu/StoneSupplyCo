import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

const slug = 'instagram-unfollow-tracker';

export const metadata = getSeoPageMetadata(slug);

export default function InstagramUnfollowTrackerPage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
