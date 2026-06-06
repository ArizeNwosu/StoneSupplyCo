import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Top Instagram accounts by follower count (approximate, for SEO seeding)
const TOP_ACCOUNTS = [
  { handle: 'cristiano', displayName: 'Cristiano Ronaldo', followerCount: 639_000_000, category: 'Sports' },
  { handle: 'leomessi', displayName: 'Leo Messi', followerCount: 503_000_000, category: 'Sports' },
  { handle: 'selenagomez', displayName: 'Selena Gomez', followerCount: 424_000_000, category: 'Entertainment' },
  { handle: 'kyliejenner', displayName: 'Kylie Jenner', followerCount: 399_000_000, category: 'Entertainment' },
  { handle: 'therock', displayName: 'Dwayne Johnson', followerCount: 396_000_000, category: 'Entertainment' },
  { handle: 'arianagrande', displayName: 'Ariana Grande', followerCount: 380_000_000, category: 'Music' },
  { handle: 'kimkardashian', displayName: 'Kim Kardashian', followerCount: 364_000_000, category: 'Entertainment' },
  { handle: 'beyonce', displayName: 'Beyoncé', followerCount: 316_000_000, category: 'Music' },
  { handle: 'khloekardashian', displayName: 'Khloé Kardashian', followerCount: 312_000_000, category: 'Entertainment' },
  { handle: 'nike', displayName: 'Nike', followerCount: 304_000_000, category: 'Brand' },
  { handle: 'justinbieber', displayName: 'Justin Bieber', followerCount: 293_000_000, category: 'Music' },
  { handle: 'natgeo', displayName: 'National Geographic', followerCount: 283_000_000, category: 'Media' },
  { handle: 'kendalljenner', displayName: 'Kendall Jenner', followerCount: 295_000_000, category: 'Entertainment' },
  { handle: 'taylorswift', displayName: 'Taylor Swift', followerCount: 282_000_000, category: 'Music' },
  { handle: 'neymarjr', displayName: 'Neymar Jr', followerCount: 221_000_000, category: 'Sports' },
  { handle: 'kevinhart4real', displayName: 'Kevin Hart', followerCount: 173_000_000, category: 'Entertainment' },
  { handle: 'mileycyrus', displayName: 'Miley Cyrus', followerCount: 213_000_000, category: 'Music' },
  { handle: 'katyperry', displayName: 'Katy Perry', followerCount: 204_000_000, category: 'Music' },
  { handle: 'jlo', displayName: 'Jennifer Lopez', followerCount: 247_000_000, category: 'Entertainment' },
  { handle: 'zendaya', displayName: 'Zendaya', followerCount: 181_000_000, category: 'Entertainment' },
  { handle: 'instagram', displayName: 'Instagram', followerCount: 680_000_000, category: 'Tech' },
  { handle: 'nasa', displayName: 'NASA', followerCount: 98_000_000, category: 'Science' },
  { handle: 'apple', displayName: 'Apple', followerCount: 32_000_000, category: 'Tech' },
  { handle: 'google', displayName: 'Google', followerCount: 14_000_000, category: 'Tech' },
  { handle: 'facebook', displayName: 'Facebook', followerCount: 14_000_000, category: 'Tech' },
  { handle: 'realmadrid', displayName: 'Real Madrid C.F.', followerCount: 163_000_000, category: 'Sports' },
  { handle: 'fcbarcelona', displayName: 'FC Barcelona', followerCount: 152_000_000, category: 'Sports' },
  { handle: 'nba', displayName: 'NBA', followerCount: 87_000_000, category: 'Sports' },
  { handle: 'nfl', displayName: 'NFL', followerCount: 26_000_000, category: 'Sports' },
  { handle: 'championsleague', displayName: 'UEFA Champions League', followerCount: 93_000_000, category: 'Sports' },
  { handle: 'dualipa', displayName: 'Dua Lipa', followerCount: 88_000_000, category: 'Music' },
  { handle: 'bts.bighitofficial', displayName: 'BTS', followerCount: 72_000_000, category: 'Music' },
  { handle: 'billieeilish', displayName: 'Billie Eilish', followerCount: 113_000_000, category: 'Music' },
  { handle: 'harrystyles', displayName: 'Harry Styles', followerCount: 49_000_000, category: 'Music' },
  { handle: 'oprah', displayName: 'Oprah Winfrey', followerCount: 21_000_000, category: 'Entertainment' },
  { handle: 'elonmusk', displayName: 'Elon Musk', followerCount: 10_000_000, category: 'Tech' },
  { handle: 'emmawatson', displayName: 'Emma Watson', followerCount: 73_000_000, category: 'Entertainment' },
  { handle: 'tomholland2013', displayName: 'Tom Holland', followerCount: 67_000_000, category: 'Entertainment' },
  { handle: 'chrishemsworth', displayName: 'Chris Hemsworth', followerCount: 60_000_000, category: 'Entertainment' },
  { handle: 'priyankachopra', displayName: 'Priyanka Chopra Jonas', followerCount: 91_000_000, category: 'Entertainment' },
  { handle: 'shraddhakapoor', displayName: 'Shraddha Kapoor', followerCount: 91_000_000, category: 'Entertainment' },
  { handle: 'virat.kohli', displayName: 'Virat Kohli', followerCount: 265_000_000, category: 'Sports' },
  { handle: 'rogerfederer', displayName: 'Roger Federer', followerCount: 16_000_000, category: 'Sports' },
  { handle: 'lebronjames', displayName: 'LeBron James', followerCount: 157_000_000, category: 'Sports' },
  { handle: 'stephencurry30', displayName: 'Stephen Curry', followerCount: 41_000_000, category: 'Sports' },
  { handle: 'adele', displayName: 'Adele', followerCount: 52_000_000, category: 'Music' },
  { handle: 'edsheeran', displayName: 'Ed Sheeran', followerCount: 43_000_000, category: 'Music' },
  { handle: 'shakira', displayName: 'Shakira', followerCount: 86_000_000, category: 'Music' },
  { handle: 'badgalriri', displayName: 'Rihanna', followerCount: 151_000_000, category: 'Music' },
  { handle: 'drake', displayName: 'Drake', followerCount: 148_000_000, category: 'Music' },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log(`Seeding ${TOP_ACCOUNTS.length} top Instagram accounts...`);

  let created = 0;
  let skipped = 0;

  for (const account of TOP_ACCOUNTS) {
    try {
      const seededAccount = await prisma.publicAccount.upsert({
        where: { handle: account.handle },
        create: {
          handle: account.handle,
          displayName: account.displayName,
          followerCount: account.followerCount,
          category: account.category,
          lastChecked: new Date(),
        },
        update: {
          displayName: account.displayName,
          followerCount: account.followerCount,
          category: account.category,
        },
      });

      const existingSnapshot = await prisma.publicSnapshot.findFirst({
        where: { publicAccountId: seededAccount.id },
        select: { id: true },
      });

      if (!existingSnapshot) {
        await prisma.publicSnapshot.create({
          data: {
            publicAccountId: seededAccount.id,
            followerCount: account.followerCount,
            takenAt: seededAccount.lastChecked ?? seededAccount.createdAt,
          },
        });
      }

      created++;
    } catch (err) {
      console.error(`Failed to upsert @${account.handle}:`, err);
      skipped++;
    }
  }

  console.log(`Done. Created/updated: ${created}, skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
