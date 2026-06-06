import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

const slug = 'best-instagram-follower-tracker-app';

export const metadata = getSeoPageMetadata(slug);

export default function BestInstagramFollowerTrackerAppPage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
