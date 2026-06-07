import { KeywordLandingPage } from '@/components/seo/KeywordLandingPage';
import { getSeoPage, getSeoPageMetadata } from '@/lib/seo-pages';

export const dynamic = 'force-dynamic';

const slug = 'instagram-unfollow-tracker-without-login';

export const metadata = getSeoPageMetadata(slug);

export default function InstagramUnfollowTrackerWithoutLoginPage() {
  return <KeywordLandingPage page={getSeoPage(slug)} />;
}
