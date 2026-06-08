import { prisma } from '@/lib/prisma';
import {
  SEO_PUBLIC_ACCOUNTS,
  getSeoAccountByHandle,
  type SeoAccountPage,
} from '@/lib/seo-account-pages';

export async function ensureSeoPublicAccount(page: SeoAccountPage) {
  return prisma.publicAccount.upsert({
    where: { handle: page.username },
    create: {
      handle: page.username,
      displayName: page.displayName,
      category: page.category,
    },
    update: {
      displayName: page.displayName,
      category: page.category,
    },
  });
}

export async function ensureSeoPublicAccounts() {
  await Promise.all(
    SEO_PUBLIC_ACCOUNTS.map((account) =>
      prisma.publicAccount.upsert({
        where: { handle: account.handle },
        create: {
          handle: account.handle,
          displayName: account.displayName,
          category: account.category,
        },
        update: {
          displayName: account.displayName,
          category: account.category,
        },
      })
    )
  );
}

export async function ensureSeoPublicAccountByHandle(handle: string) {
  const account = getSeoAccountByHandle(handle);
  if (!account) return null;

  return prisma.publicAccount.upsert({
    where: { handle: account.handle },
    create: {
      handle: account.handle,
      displayName: account.displayName,
      category: account.category,
    },
    update: {
      displayName: account.displayName,
      category: account.category,
    },
  });
}

export async function ensurePublicAccountForHandle({
  handle,
  displayName,
  avatarUrl,
  bio,
  category,
}: {
  handle: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  category?: string | null;
}) {
  return prisma.publicAccount.upsert({
    where: { handle },
    create: {
      handle,
      displayName: displayName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
      bio: bio ?? undefined,
      category: category ?? undefined,
    },
    update: {
      displayName: displayName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
      bio: bio ?? undefined,
      category: category ?? undefined,
    },
  });
}

export async function savePublicSnapshotForHandle({
  handle,
  followerCount,
  followingCount,
  postCount,
  displayName,
  avatarUrl,
  bio,
  takenAt = startOfUtcDay(new Date()),
}: {
  handle: string;
  followerCount: number;
  followingCount?: number | null;
  postCount?: number | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  takenAt?: Date;
}) {
  const publicAccount = await prisma.publicAccount.upsert({
    where: { handle },
    create: {
      handle,
      followerCount,
      followingCount: followingCount ?? undefined,
      postCount: postCount ?? undefined,
      displayName: displayName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
      bio: bio ?? undefined,
      lastChecked: new Date(),
    },
    update: {
      followerCount,
      followingCount: followingCount ?? undefined,
      postCount: postCount ?? undefined,
      displayName: displayName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
      bio: bio ?? undefined,
      lastChecked: new Date(),
    },
  });

  await prisma.publicSnapshot.upsert({
    where: {
      publicAccountId_takenAt: {
        publicAccountId: publicAccount.id,
        takenAt,
      },
    },
    create: {
      publicAccountId: publicAccount.id,
      followerCount,
      followingCount: followingCount ?? undefined,
      postCount: postCount ?? undefined,
      takenAt,
    },
    update: {
      followerCount,
      followingCount: followingCount ?? undefined,
      postCount: postCount ?? undefined,
    },
  });

  return publicAccount;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}
