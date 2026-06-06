import { NextRequest, NextResponse } from 'next/server';

export function authorizeCron(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 401 }
    );
  }

  const expected = `Bearer ${secret}`;
  if (req.headers.get('authorization') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
