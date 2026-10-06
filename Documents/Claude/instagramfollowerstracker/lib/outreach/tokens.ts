import { createHmac, timingSafeEqual } from 'node:crypto';

export interface OutreachToken { userId: string; campaignId: string; email: string; exp: number }

function secret() {
  const value = process.env.OUTREACH_TOKEN_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error('OUTREACH_TOKEN_SECRET is not configured');
  return value;
}

const encode = (value: string) => Buffer.from(value).toString('base64url');

export function signOutreachToken(value: Omit<OutreachToken, 'exp'> & { exp?: number }) {
  const payload = encode(JSON.stringify({ ...value, exp: value.exp ?? Date.now() + 90 * 86_400_000 }));
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyOutreachToken(token: string, now = Date.now()): OutreachToken | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const expected = createHmac('sha256', secret()).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as OutreachToken;
    if (!parsed.userId || !parsed.campaignId || !parsed.email || parsed.exp < now) return null;
    return { ...parsed, email: parsed.email.trim().toLowerCase() };
  } catch { return null; }
}

export function createReplyToken() {
  return crypto.randomUUID().replaceAll('-', '');
}
