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
