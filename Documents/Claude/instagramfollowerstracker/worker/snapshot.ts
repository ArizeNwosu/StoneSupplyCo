import { prisma } from '@/lib/prisma';
import { fetchInstagramProfile, sleep } from '@/lib/scraper';
import { sendMilestoneEmail } from '@/lib/email';

export async function runDailySnapshot(): Promise<void> {
  console.log(`[snapshot] Starting daily run at ${new Date().toISOString()}`);

  // 1. Snapshot all user-tracked accounts
  const trackedAccounts = await prisma.trackedAccount.findMany({
    include: {
      snapshots: { orderBy: { takenAt: 'desc' }, take: 1 },
      user: true,
    },
  });

  for (const account of trackedAccounts) {
    try {
      const profile = await fetchInstagramProfile(account.handle);

      if (profile.followerCount !== null) {
        await prisma.snapshot.create({
          data: {
            trackedAccountId: account.id,
            followerCount: profile.followerCount,
            followingCount: profile.followingCount ?? undefined,
            postCount: profile.postCount ?? undefined,
          },
        });

        const updated = await prisma.trackedAccount.update({
          where: { id: account.id },
          data: {
            lastChecked: new Date(),
            displayName: profile.displayName ?? undefined,
            avatarUrl: profile.avatarUrl ?? undefined,
            snapshotCount: { increment: 1 },
          },
          include: { user: { select: { email: true } } },
        });

        // Milestone emails — check flag before sending, set flag before send
        const count = updated.snapshotCount;
        const email = updated.user.email;

        if (email) {
          if (count === 1 && !updated.milestone1Sent) {
            await prisma.trackedAccount.update({
              where: { id: account.id },
              data: { milestone1Sent: true },
            });
            await sendMilestoneEmail({
              to: email,
              handle: account.handle,
              snapshotCount: 1,
              followerCount: profile.followerCount,
            });
          } else if (count === 3 && !updated.milestone3Sent) {
            await prisma.trackedAccount.update({
              where: { id: account.id },
              data: { milestone3Sent: true },
            });
            await sendMilestoneEmail({
              to: email,
              handle: account.handle,
              snapshotCount: 3,
              followerCount: profile.followerCount,
            });
          } else if (count === 7 && !updated.milestone7Sent) {
            await prisma.trackedAccount.update({
              where: { id: account.id },
              data: { milestone7Sent: true },
            });
            await sendMilestoneEmail({
              to: email,
              handle: account.handle,
              snapshotCount: 7,
              followerCount: profile.followerCount,
            });
          } else if (count === 30 && !updated.milestone30Sent) {
            await prisma.trackedAccount.update({
              where: { id: account.id },
              data: { milestone30Sent: true },
            });
            await sendMilestoneEmail({
              to: email,
              handle: account.handle,
              snapshotCount: 30,
              followerCount: profile.followerCount,
            });
          }
        }
      }

      // Jitter between 2–5 seconds to avoid rate limits
      await sleep(2000 + Math.random() * 3000);
    } catch (err) {
      console.error(`[snapshot] Failed for @${account.handle}:`, err);
    }
  }

  // 2. Snapshot public SEO accounts
  const publicAccounts = await prisma.publicAccount.findMany({
    orderBy: { followerCount: 'desc' },
  });

  for (const account of publicAccounts) {
    try {
      const profile = await fetchInstagramProfile(account.handle);

      if (profile.followerCount !== null) {
        await prisma.publicSnapshot.create({
          data: {
            publicAccountId: account.id,
            followerCount: profile.followerCount,
            followingCount: profile.followingCount ?? undefined,
            postCount: profile.postCount ?? undefined,
          },
        });

        await prisma.publicAccount.update({
          where: { id: account.id },
          data: {
            followerCount: profile.followerCount,
            lastChecked: new Date(),
          },
        });
      }

      await sleep(2000 + Math.random() * 3000);
    } catch (err) {
      console.error(`[snapshot] Public @${account.handle} failed:`, err);
    }
  }

  console.log(`[snapshot] Daily run complete`);
}
