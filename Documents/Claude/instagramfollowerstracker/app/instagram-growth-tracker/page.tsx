import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

const slug = 'instagram-growth-tracker';

export const metadata = getSeoPageMetadata(slug);

export default function InstagramGrowthTrackerPage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
