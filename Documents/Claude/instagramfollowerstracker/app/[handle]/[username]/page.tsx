import { notFound, permanentRedirect } from 'next/navigation';
import { getSeoAccountPage } from '@/lib/seo-account-pages';

interface PageProps {
  params: Promise<{ handle: string; username: string }>;
}

export default async function LegacySeoAccountPage({ params }: PageProps) {
  const { handle, username } = await params;
  const page = getSeoAccountPage(handle, username);

  if (!page) notFound();

  permanentRedirect(`/instagram-follower-count/${page.username}`);
}
