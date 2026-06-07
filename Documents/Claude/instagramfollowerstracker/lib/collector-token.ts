import { createHmac, timingSafeEqual } from 'crypto';

interface CollectorTokenPayload {
  v: 1;
  userId: string;
  accountId: string;
  handle: string;
}

function getSecret(): string {
  const secret = process.env.COLLECTOR_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('COLLECTOR_TOKEN_SECRET or NEXTAUTH_SECRET is required');
  return secret;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function unbase64url(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64');
}

function signPayload(encodedPayload: string): string {
  return base64url(
    createHmac('sha256', getSecret()).update(encodedPayload).digest()
  );
}

export function createCollectorToken(payload: Omit<CollectorTokenPayload, 'v'>): string {
  const encodedPayload = base64url(
    JSON.stringify({
      v: 1,
      ...payload,
    } satisfies CollectorTokenPayload)
  );
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyCollectorToken(token: string): CollectorTokenPayload | null {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expected = signPayload(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(unbase64url(encodedPayload).toString('utf8')) as Partial<CollectorTokenPayload>;
    if (
      parsed.v !== 1 ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.accountId !== 'string' ||
      typeof parsed.handle !== 'string'
    ) {
      return null;
    }
    return parsed as CollectorTokenPayload;
  } catch {
    return null;
  }
}
