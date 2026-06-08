'use client';

import { formatChange, formatCount, formatDate } from '@/lib/format';

interface SnapshotPoint {
  takenAt: string;
  followerCount: number;
}

interface ActivityFeedProps {
  handle: string;
  snapshots: SnapshotPoint[];
  lastChecked: string | null;
}

interface ActivityItem {
  title: string;
  detail: string;
  tone: 'neutral' | 'positive' | 'negative' | 'warning';
}

export function ActivityFeed({ handle, snapshots, lastChecked }: ActivityFeedProps) {
  const items = buildActivities(handle, snapshots, lastChecked);

  return (
    <section className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700">
            Activity feed
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-950">
            What changed recently
          </h3>
        </div>
        <p className="text-xs font-semibold text-slate-400">
          {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="animate-dashboard-pop flex gap-3 rounded-lg border border-cyan-950/10 bg-slate-50 p-3"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${toneDot(item.tone)}`} />
            <div>
              <p className="text-sm font-black text-slate-950">{item.title}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildActivities(handle: string, snapshots: SnapshotPoint[], lastChecked: string | null): ActivityItem[] {
  if (snapshots.length === 0) {
    return [
      {
        title: `@${handle} is queued`,
        detail: 'The dashboard will populate as soon as the first follower-count snapshot is captured.',
        tone: 'warning',
      },
    ];
  }

  const newest = snapshots.at(-1)!;
  const previous = snapshots.at(-2);
  const peak = snapshots.reduce((best, point) => point.followerCount > best.followerCount ? point : best, newest);
  const items: ActivityItem[] = [
    {
      title: `Latest count: ${formatCount(newest.followerCount)}`,
      detail: `Captured ${formatDate(newest.takenAt)}${lastChecked ? ` · last checked ${new Date(lastChecked).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}.`,
      tone: 'neutral',
    },
  ];

  if (previous) {
    const delta = newest.followerCount - previous.followerCount;
    items.push({
      title: delta === 0 ? 'No follower movement' : `${delta > 0 ? 'Gained' : 'Lost'} ${formatCount(Math.abs(delta))} followers`,
      detail: `Daily movement from ${formatDate(previous.takenAt)} to ${formatDate(newest.takenAt)} was ${formatChange(delta)}.`,
      tone: delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral',
    });
  } else {
    items.push({
      title: 'Baseline created',
      detail: 'This first point gives future daily snapshots something to compare against.',
      tone: 'positive',
    });
  }

  if (peak.takenAt === newest.takenAt) {
    items.push({
      title: 'Highest count recorded',
      detail: `@${handle} is currently at the highest follower count in this dashboard history.`,
      tone: 'positive',
    });
  } else {
    items.push({
      title: `Peak was ${formatCount(peak.followerCount)}`,
      detail: `The highest saved count was captured on ${formatDate(peak.takenAt)}.`,
      tone: 'neutral',
    });
  }

  if (snapshots.length < 5) {
    items.push({
      title: 'Pattern analysis is warming up',
      detail: `${5 - snapshots.length} more snapshot${5 - snapshots.length !== 1 ? 's' : ''} until authenticity and spike signals become more reliable.`,
      tone: 'warning',
    });
  }

  return items.slice(0, 4);
}

function toneDot(tone: ActivityItem['tone']) {
  if (tone === 'positive') return 'bg-emerald-500';
  if (tone === 'negative') return 'bg-rose-500';
  if (tone === 'warning') return 'bg-amber-400';
  return 'bg-slate-400';
}
