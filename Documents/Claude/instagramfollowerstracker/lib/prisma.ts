import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const adapter = new PrismaPg({ connectionString: '' });
    return new PrismaClient({ adapter, log: ['error'] });
  }
  // Append pgbouncer=true if using Supabase transaction pooler (port 6543)
  const url = connectionString.includes('6543') && !connectionString.includes('pgbouncer')
    ? `${connectionString}${connectionString.includes('?') ? '&' : '?'}pgbouncer=true`
    : connectionString;
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter, log: ['error'] });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
