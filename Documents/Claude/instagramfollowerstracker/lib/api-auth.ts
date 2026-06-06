import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export interface ApiUser {
  id: string;
  plan: string;
}

/** Generate a new API key. Returns raw key (show once) + hash + prefix for storage. */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = 'ift_' + randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');
  const prefix = raw.slice(0, 12); // "ift_" + first 8 chars
  return { raw, hash, prefix };
}

/** Hash an incoming API key for safe comparison. */
export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Validate a Bearer token from an Authorization header.
 * Returns the User if valid and on AGENCY plan, null otherwise.
 */
export async function validateApiKey(
  authHeader: string | null
): Promise<ApiUser | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const raw = authHeader.slice(7).trim();
  if (!raw.startsWith('ift_')) return null;

  const hash = hashApiKey(raw);
  const user = await prisma.user.findFirst({
    where: { apiKeyHash: hash },
    select: { id: true, plan: true },
  });

  if (!user || user.plan !== 'AGENCY') return null;
  return user;
}
