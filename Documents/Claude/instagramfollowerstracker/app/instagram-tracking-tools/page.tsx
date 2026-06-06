import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

const slug = 'instagram-tracking-tools';

export const metadata = getSeoPageMetadata(slug);

export default function InstagramTrackingToolsPage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
