import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseBrowserRevenueEvent, recordRevenueEvent } from '@/lib/revenue/events';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const event = parseBrowserRevenueEvent(await req.json());
    const recorded = await recordRevenueEvent({ ...event, userId: session.user.id });
    return NextResponse.json({ id: (recorded as { id: string }).id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid event' },
      { status: 400 }
    );
  }
}

