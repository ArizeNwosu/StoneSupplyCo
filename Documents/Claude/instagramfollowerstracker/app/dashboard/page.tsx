'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AccountCard } from '@/components/tracker/AccountCard';
import { AddAccountForm } from '@/components/tracker/AddAccountForm';
import { FollowerChart } from '@/components/tracker/FollowerChart';
import { MetricsRow } from '@/components/tracker/MetricsRow';
import { EmptyState } from '@/components/tracker/EmptyState';
import { SnapshotProgress } from '@/components/tracker/SnapshotProgress';
import { ShareReportButton } from '@/components/tracker/ShareReportButton';
import { AuthenticityBadge } from '@/components/tracker/AuthenticityBadge';
import { PatternAlerts } from '@/components/tracker/PatternAlerts';
import { AutomaticTrackingPanel } from '@/components/tracker/AutomaticTrackingPanel';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { UpgradeModal } from '@/components/tracker/UpgradeModal';
import { UnfollowDetector } from '@/components/tracker/UnfollowDetector';

interface Account {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  latestCount: number | null;
  change24h: number | null;
  snapshotCount: number;
  chartReady: boolean;
  lastChecked: string | null;
  authenticityScore: number | null;
}

interface SnapshotPoint {
  takenAt: string;
  followerCount: number;
}

interface AuthenticityResult {
  score: number;
  label: 'authentic' | 'suspicious' | 'likely_fake';
  signals: string[];
}

interface SnapshotData {
  handle: string;
  snapshotCount: number;
  chartReady: boolean;
  snapshots: SnapshotPoint[];
  authenticityScore: AuthenticityResult | null;
  stats: {
    current: number | null;
    change: number | null;
    changePct: number | null;
    change7d: number | null;
    change30d: number | null;
    avgDailyGain: number | null;
    peakCount: number | null;
    peakDate: string | null;
  } | null;
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const backfillFiredRef = useRef(false);
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO' | 'AGENCY'>('FREE');

  const fetchAccounts = useCallback(async () => {
    const res = await fetch('/api/accounts');
    if (res.ok) {
      const data = (await res.json()) as Account[];
      setAccounts(data);
      setSelectedId((prev) => (data.length > 0 && !prev ? (data[0]?.id ?? null) : prev));
    }
    setLoading(false);
  }, []);

  const fetchSnapshots = useCallback(async (id: string) => {
    const res = await fetch(`/api/accounts/${id}/snapshots`);
    if (res.ok) {
      setSnapshotData((await res.json()) as SnapshotData);
    }
  }, []);

  const fetchPlan = useCallback(async () => {
    const res = await fetch('/api/me');
    if (res.ok) {
      const data = (await res.json()) as { plan: 'FREE' | 'PRO' | 'AGENCY' };
      setUserPlan(data.plan);
    }
  }, []);

  const handleAdd = useCallback(async (handle: string): Promise<{ error?: string }> => {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok) {
      if (res.status === 402) {
        setShowAddModal(false);
        setShowUpgradeModal(true);
        return {};
      }
      return { error: data.error ?? 'Something went wrong' };
    }
    // Fire Wayback backfill in the background — don't block the UI
    if (data.id) {
      fetch(`/api/accounts/${data.id}/backfill`, { method: 'POST' }).catch(() => {});
    }
    await fetchAccounts();
    if (data.id) setSelectedId(data.id);
    setShowAddModal(false);
    return {};
  }, [fetchAccounts]);

  useEffect(() => {
    const pending = sessionStorage.getItem('pending_handle');
    if (pending) sessionStorage.removeItem('pending_handle');

    // Await initial fetch so handleAdd's refresh doesn't get overwritten by a stale response
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAccounts().then(() => {
      if (pending) handleAdd(pending).catch(() => {}); // handleAdd calls fetchAccounts internally
    });
    void fetchPlan();
  }, [fetchAccounts, fetchPlan, handleAdd]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedId) void fetchSnapshots(selectedId);
  }, [selectedId, fetchSnapshots]);

  // On first load: for accounts with no snapshots, fire a live refresh then backfill
  useEffect(() => {
    if (loading || backfillFiredRef.current) return;
    backfillFiredRef.current = true;
    accounts
      .filter((a) => a.snapshotCount === 0)
      .forEach((a) => {
        // Live scrape first — updates snapshotCount immediately if successful
        fetch(`/api/accounts/${a.id}/refresh`, { method: 'POST' })
          .then(async () => {
            await fetchAccounts();
            void fetchSnapshots(a.id);
          })
          .catch(() => {});
        // Backfill runs in parallel for historical data
        fetch(`/api/accounts/${a.id}/backfill`, { method: 'POST' }).catch(() => {});
      });
  }, [loading, accounts, fetchAccounts, fetchSnapshots]);

  // Poll while waiting for first snapshot (every 5s) or while building chart (every 60s)
  useEffect(() => {
    const selected = accounts.find((a) => a.id === selectedId);
    if (!selected || selected.chartReady) return;

    const interval = selected.snapshotCount === 0 ? 5000 : 60_000;
    const timer = setInterval(() => {
      fetchAccounts();
      if (selectedId) fetchSnapshots(selectedId);
    }, interval);
    return () => clearInterval(timer);
  }, [selectedId, accounts, fetchAccounts, fetchSnapshots]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) {
      const next = accounts.find((a) => a.id !== id);
      setSelectedId(next?.id ?? null);
      setSnapshotData(null);
    }
  };

  const selected = accounts.find((a) => a.id === selectedId);

  return (
    <>
      <Sidebar>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-sm font-black text-slate-950">
            Tracked Accounts
          </h1>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            + Add
          </Button>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                {...account}
                selected={account.id === selectedId}
                onClick={() => setSelectedId(account.id)}
                onDelete={handleDelete}
                authenticityScore={account.authenticityScore}
              />
            ))}
          </div>
        )}
      </Sidebar>

      <main className="flex-1 overflow-y-auto bg-sky-50 p-6">
        {loading ? (
          <DashboardLoadingPanel />
        ) : accounts.length === 0 ? (
          <EmptyState onAdd={() => setShowAddModal(true)} />
        ) : selected && snapshotData ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <PatternAlerts />
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  @{selected.handle}
                </h2>
                {selected.displayName && (
                  <p className="text-sm font-semibold text-slate-500">{selected.displayName}</p>
                )}
                <div className="mt-2">
                  {snapshotData.authenticityScore ? (
                    <AuthenticityBadge
                      score={snapshotData.authenticityScore.score}
                      label={snapshotData.authenticityScore.label}
                      signals={snapshotData.authenticityScore.signals}
                    />
                  ) : snapshotData.snapshotCount >= 1 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-950/10 bg-white px-2.5 py-1 text-xs font-bold text-slate-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-300" />
                      Analyzing · {snapshotData.snapshotCount}/5 snapshots
                    </span>
                  ) : null}
                </div>
              </div>
              <ShareReportButton accountId={selected.id} />
            </div>
            {snapshotData.chartReady && snapshotData.stats ? (
              <>
                <MetricsRow
                  current={snapshotData.stats.current}
                  change24h={selected.change24h}
                  change7d={snapshotData.stats.change7d}
                  change30d={snapshotData.stats.change30d}
                  avgDailyGain={snapshotData.stats.avgDailyGain}
                />
                <div className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-xl shadow-cyan-950/10">
                  <h3 className="mb-4 text-sm font-black text-slate-700">
                    Follower Count History
                  </h3>
                  <FollowerChart
                    snapshots={snapshotData.snapshots}
                    handle={selected.handle}
                  />
                </div>
              </>
            ) : (
              <SnapshotProgress
                handle={selected.handle}
                snapshotCount={snapshotData.snapshotCount}
                latestCount={selected.latestCount}
                lastChecked={selected.lastChecked}
              />
            )}
            <AutomaticTrackingPanel
              handle={selected.handle}
              snapshotCount={snapshotData.snapshotCount}
              lastChecked={selected.lastChecked}
              onRefresh={async () => {
                await fetch(`/api/accounts/${selected.id}/refresh`, { method: 'POST' });
                await fetchAccounts();
                await fetchSnapshots(selected.id);
              }}
            />
            <UnfollowDetector userPlan={userPlan} />
          </div>
        ) : selected ? (
          <DashboardLoadingPanel handle={selected.handle} />
        ) : (
          <EmptyState onAdd={() => setShowAddModal(true)} />
        )}
      </main>

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Track Instagram Account"
      >
        <AddAccountForm
          onAdd={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}

function DashboardLoadingPanel({ handle }: { handle?: string }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            Loading tracker
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            {handle ? `@${handle}` : 'Preparing dashboard'}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Fetching account history and follower snapshots.
          </p>
        </div>
        <div className="h-10 w-32 animate-pulse rounded-full bg-slate-200" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-cyan-950/10 bg-white shadow-sm"
          />
        ))}
      </div>

      <div className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-xl shadow-cyan-950/10">
        <div className="mb-5 h-4 w-44 animate-pulse rounded-full bg-slate-200" />
        <div className="h-80 animate-pulse rounded-lg bg-cyan-50" />
      </div>
    </div>
  );
}
