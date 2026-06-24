import { notFound, permanentRedirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isValidHandle, parseHandle } from '@/lib/handles';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function LegacyHandlePage({ params }: PageProps) {
  const { handle } = await params;
  const normalizedHandle = parseHandle(handle);

  if (!isValidHandle(normalizedHandle)) notFound();

  const account = await prisma.publicAccount.findUnique({
    where: { handle: normalizedHandle },
    select: { id: true },
  });

  if (!account) notFound();

  permanentRedirect(`/instagram-follower-count/${normalizedHandle}`);
}
