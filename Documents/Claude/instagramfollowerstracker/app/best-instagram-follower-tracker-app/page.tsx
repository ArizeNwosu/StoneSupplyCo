import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

const slug = 'best-instagram-follower-tracker-app';

export const metadata = getSeoPageMetadata(slug);

export default function BestInstagramFollowerTrackerAppPage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
