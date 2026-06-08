import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Diagnostics',
  robots: { index: false },
};

export default async function DiagnosticsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!canViewDiagnostics(session.user.email)) notFound();

  const today = startOfUtcDay(new Date());
  const [
    trackedDue,
    publicDue,
    trackedAccounts,
    publicAccounts,
    latestTrackedSnapshots,
    latestPublicSnapshots,
  ] = await Promise.all([
    prisma.trackedAccount.count({
      where: { OR: [{ lastChecked: null }, { lastChecked: { lt: today } }] },
    }),
    prisma.publicAccount.count({
      where: { OR: [{ lastChecked: null }, { lastChecked: { lt: today } }] },
    }),
    prisma.trackedAccount.count(),
    prisma.publicAccount.count(),
    prisma.snapshot.findMany({
      orderBy: { takenAt: 'desc' },
      take: 5,
      include: { trackedAccount: { select: { handle: true } } },
    }),
    prisma.publicSnapshot.findMany({
      orderBy: { takenAt: 'desc' },
      take: 5,
      include: { publicAccount: { select: { handle: true } } },
    }),
  ]);

  const env = [
    { label: 'Apify token', ok: Boolean(process.env.APIFY_TOKEN) },
    { label: 'Apify actor', ok: Boolean(process.env.APIFY_ACTOR_ID) },
    { label: 'Cron secret', ok: Boolean(process.env.CRON_SECRET) },
    { label: 'Database URL', ok: Boolean(process.env.DATABASE_URL) },
    { label: 'Google OAuth', ok: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-sky-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-xs font-black uppercase text-cyan-700">
            Protected admin view
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">
            Collection Diagnostics
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Use this to verify that automated collection is configured and that
            the daily queues are moving.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Tracked accounts" value={trackedAccounts} />
          <Metric label="Tracked due today" value={trackedDue} />
          <Metric label="Public accounts" value={publicAccounts} />
          <Metric label="Public due today" value={publicDue} />
        </div>

        <section className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-950">
            Production configuration
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {env.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-cyan-950/10 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    item.ok
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {item.ok ? 'Set' : 'Missing'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <SnapshotList
            title="Latest tracked snapshots"
            rows={latestTrackedSnapshots.map((snapshot) => ({
              handle: snapshot.trackedAccount.handle,
              count: snapshot.followerCount,
              takenAt: snapshot.takenAt,
            }))}
          />
          <SnapshotList
            title="Latest public snapshots"
            rows={latestPublicSnapshots.map((snapshot) => ({
              handle: snapshot.publicAccount.handle,
              count: snapshot.followerCount,
              takenAt: snapshot.takenAt,
            }))}
          />
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-cyan-950/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function SnapshotList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ handle: string; count: number; takenAt: Date }>;
}) {
  return (
    <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black text-slate-950">{title}</h2>
      <div className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400">No snapshots yet.</p>
        ) : (
          rows.map((row) => (
            <div
              key={`${row.handle}-${row.takenAt.toISOString()}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">
                  @{row.handle}
                </p>
                <p className="text-xs font-semibold text-slate-400">
                  {row.takenAt.toLocaleString()}
                </p>
              </div>
              <span className="shrink-0 text-sm font-black text-teal-700">
                {row.count.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function canViewDiagnostics(email?: string | null) {
  if (process.env.NODE_ENV !== 'production') return true;
  if (!email) return false;

  const allowedEmails = (process.env.DIAGNOSTICS_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.toLowerCase());
}
