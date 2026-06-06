import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

const slug = 'instagram-tracking-tools';

export const metadata = getSeoPageMetadata(slug);

export default function InstagramTrackingToolsPage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
