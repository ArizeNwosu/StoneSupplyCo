import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { formatCount } from '@/lib/format';

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ theme?: string }>;
}) {
  const { handle } = await params;
  const { theme } = await searchParams;
  const dark = theme === 'dark';

  let followerCount: number | null = null;
  let trend: number | null = null;

  const publicAccount = await prisma.publicAccount.findUnique({
    where: { handle },
    include: {
      snapshots: {
        orderBy: { takenAt: 'desc' },
        take: 7,
        select: { followerCount: true },
      },
    },
  });

  if (publicAccount?.followerCount) {
    followerCount = publicAccount.followerCount;
    const snaps = publicAccount.snapshots.reverse();
    const first = snaps[0];
    const last = snaps[snaps.length - 1];
    if (snaps.length >= 2 && first && last) {
      trend = last.followerCount - first.followerCount;
    }
  } else {
    const snap = await prisma.snapshot.findFirst({
      where: { trackedAccount: { handle } },
      orderBy: { takenAt: 'desc' },
      select: { followerCount: true, trackedAccountId: true },
    });
    if (!snap) notFound();
    followerCount = snap.followerCount;
    const oldest = await prisma.snapshot.findFirst({
      where: { trackedAccountId: snap.trackedAccountId },
      orderBy: { takenAt: 'asc' },
      select: { followerCount: true },
    });
    if (oldest && oldest.followerCount !== snap.followerCount) {
      trend = snap.followerCount - oldest.followerCount;
    }
  }

  const bg = dark ? '#0f0f0f' : '#ffffff';
  const text = dark ? '#f9fafb' : '#111827';
  const muted = dark ? '#9ca3af' : '#6b7280';
  const border = dark ? '#1f2937' : '#f3f4f6';
  const trendColor = trend === null ? muted : trend >= 0 ? '#10b981' : '#ef4444';

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: '220px',
      }}
    >
      <div>
        <p style={{ fontSize: '11px', color: muted, marginBottom: '3px' }}>
          @{handle}
        </p>
        <p
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: text,
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          {followerCount !== null ? formatCount(followerCount) : '—'}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 400,
              color: muted,
              marginLeft: '5px',
            }}
          >
            followers
          </span>
        </p>
        {trend !== null && (
          <p style={{ fontSize: '11px', color: trendColor, marginTop: '3px' }}>
            {trend >= 0 ? '+' : ''}
            {formatCount(trend)} tracked period
          </p>
        )}
      </div>
      <a
        href="https://instagramfollowerstracker.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: '9px',
          color: muted,
          textDecoration: 'none',
          writingMode: 'vertical-rl',
          marginLeft: '12px',
          flexShrink: 0,
        }}
      >
        instagramfollowerstracker.com
      </a>
    </div>
  );
}
