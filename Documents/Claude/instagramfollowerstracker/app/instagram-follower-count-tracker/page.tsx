import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

const slug = 'instagram-follower-count-tracker';

export const metadata = getSeoPageMetadata(slug);

export default function InstagramFollowerCountTrackerPage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
