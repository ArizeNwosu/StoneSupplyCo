import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

const slug = 'unfollow-tracker';

export const metadata = getSeoPageMetadata(slug);

export default function UnfollowTrackerPage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
