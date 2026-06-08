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
import { AccountIntelligenceHeader } from '@/components/tracker/AccountIntelligenceHeader';
import { AccountComparisonPanel } from '@/components/tracker/AccountComparisonPanel';
import { ActivityFeed } from '@/components/tracker/ActivityFeed';
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
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);
  const [backfillingIds, setBackfillingIds] = useState<Set<string>>(new Set());

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

  const startBackfill = useCallback((id: string) => {
    setBackfillingIds((prev) => new Set([...prev, id]));
    fetch(`/api/accounts/${id}/backfill`, { method: 'POST' })
      .then(async () => {
        setBackfillingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await fetchAccounts();
        await fetchSnapshots(id);
      })
      .catch(() => {
        setBackfillingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
  }, [fetchAccounts, fetchSnapshots]);

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
    if (data.id) startBackfill(data.id);
    await fetchAccounts();
    if (data.id) setSelectedId(data.id);
    setShowAddModal(false);
    return {};
  }, [fetchAccounts, startBackfill]);

  useEffect(() => {
    const pending = sessionStorage.getItem('pending_handle');
    if (pending) sessionStorage.removeItem('pending_handle');

    // Await initial fetch so handleAdd's refresh doesn't get overwritten by a stale response
    const timer = window.setTimeout(() => {
      void fetchAccounts().then(() => {
        if (pending) handleAdd(pending).catch(() => {}); // handleAdd calls fetchAccounts internally
      });
      void fetchPlan();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAccounts, fetchPlan, handleAdd]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (selectedId) void fetchSnapshots(selectedId);
      setBackfillMsg(null);
    }, 0);
    return () => window.clearTimeout(timer);
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
        startBackfill(a.id);
      });
  }, [loading, accounts, fetchAccounts, fetchSnapshots, startBackfill]);

  // Poll while waiting for first snapshot (5s), backfilling (15s), or building chart (60s)
  useEffect(() => {
    const selected = accounts.find((a) => a.id === selectedId);
    if (!selected || selected.chartReady) return;

    const isBackfilling = selectedId ? backfillingIds.has(selectedId) : false;
    const interval = selected.snapshotCount === 0 ? 5000 : isBackfilling ? 15_000 : 60_000;
    const timer = setInterval(() => {
      fetchAccounts();
      if (selectedId) fetchSnapshots(selectedId);
    }, interval);
    return () => clearInterval(timer);
  }, [selectedId, accounts, backfillingIds, fetchAccounts, fetchSnapshots]);

  const handleRefresh = useCallback(async (id: string) => {
    setRefreshLoading(true);
    await fetch(`/api/accounts/${id}/refresh`, { method: 'POST' });
    await fetchAccounts();
    await fetchSnapshots(id);
    setRefreshLoading(false);
  }, [fetchAccounts, fetchSnapshots]);

  const handleBackfill = useCallback(async (id: string) => {
    setBackfillLoading(true);
    setBackfillMsg(null);
    setBackfillingIds((prev) => new Set([...prev, id]));
    const res = await fetch(`/api/accounts/${id}/backfill`, { method: 'POST' });
    const data = (await res.json().catch(() => ({}))) as { inserted?: number };
    setBackfillingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    await fetchAccounts();
    await fetchSnapshots(id);
    setBackfillLoading(false);
    setBackfillMsg(
      data.inserted !== undefined
        ? data.inserted > 0
          ? `Added ${data.inserted} historical snapshot${data.inserted !== 1 ? 's' : ''}`
          : 'No new historical data found'
        : null
    );
    setTimeout(() => setBackfillMsg(null), 5000);
  }, [fetchAccounts, fetchSnapshots]);

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
  const daysTracked = snapshotData ? calculateDaysTracked(snapshotData.snapshots) : null;
  const volatilityScore = snapshotData ? calculateVolatility(snapshotData.snapshots) : null;

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
        ) : (
          <div className="mx-auto max-w-6xl space-y-6">
            {selected && snapshotData ? (
              <>
                <PatternAlerts />
                <AccountIntelligenceHeader
                  handle={selected.handle}
                  displayName={selected.displayName}
                  avatarUrl={selected.avatarUrl}
                  current={snapshotData.stats?.current ?? selected.latestCount}
                  change24h={selected.change24h}
                  change7d={snapshotData.stats?.change7d ?? null}
                  change30d={snapshotData.stats?.change30d ?? null}
                  snapshotCount={snapshotData.snapshotCount}
                  lastChecked={selected.lastChecked}
                  snapshots={snapshotData.snapshots}
                  actions={
                    <DashboardActions
                      accountId={selected.id}
                      refreshLoading={refreshLoading}
                      backfillLoading={backfillLoading}
                      backfillMsg={backfillMsg}
                      onRefresh={handleRefresh}
                      onBackfill={handleBackfill}
                    />
                  }
                />
                {snapshotData.chartReady && snapshotData.stats ? (
                  <>
                    <MetricsRow
                      current={snapshotData.stats.current}
                      change24h={selected.change24h}
                      change7d={snapshotData.stats.change7d}
                      change30d={snapshotData.stats.change30d}
                      avgDailyGain={snapshotData.stats.avgDailyGain}
                      peakCount={snapshotData.stats.peakCount}
                      daysTracked={daysTracked}
                      volatilityScore={volatilityScore}
                    />
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                      <section className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-xl shadow-cyan-950/10">
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700">
                              Growth graph
                            </p>
                            <h3 className="mt-1 text-lg font-black text-slate-950">
                              Follower count history
                            </h3>
                          </div>
                          {snapshotData.authenticityScore ? (
                            <AuthenticityBadge
                              score={snapshotData.authenticityScore.score}
                              label={snapshotData.authenticityScore.label}
                              signals={snapshotData.authenticityScore.signals}
                            />
                          ) : snapshotData.snapshotCount >= 1 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-950/10 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-400">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-300" />
                              Analyzing · {snapshotData.snapshotCount}/5 snapshots
                            </span>
                          ) : null}
                        </div>
                        <FollowerChart
                          snapshots={snapshotData.snapshots}
                          handle={selected.handle}
                        />
                      </section>
                      <div className="space-y-6">
                        <ActivityFeed
                          handle={selected.handle}
                          snapshots={snapshotData.snapshots}
                          lastChecked={selected.lastChecked}
                        />
                        <AccountComparisonPanel
                          accounts={accounts}
                          selectedId={selectedId}
                          onSelect={setSelectedId}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <SnapshotProgress
                    handle={selected.handle}
                    snapshotCount={snapshotData.snapshotCount}
                    latestCount={selected.latestCount}
                    lastChecked={selected.lastChecked}
                    isBackfilling={backfillingIds.has(selected.id)}
                  />
                )}
                <AutomaticTrackingPanel
                  handle={selected.handle}
                  snapshotCount={snapshotData.snapshotCount}
                  lastChecked={selected.lastChecked}
                />
              </>
            ) : selected ? (
              <DashboardLoadingPanel handle={selected.handle} />
            ) : null}

            {/* Unfollow Detector is always visible — independent of which account is selected */}
            <UnfollowDetector userPlan={userPlan} />
          </div>
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

function DashboardActions({
  accountId,
  refreshLoading,
  backfillLoading,
  backfillMsg,
  onRefresh,
  onBackfill,
}: {
  accountId: string;
  refreshLoading: boolean;
  backfillLoading: boolean;
  backfillMsg: string | null;
  onRefresh: (id: string) => void;
  onBackfill: (id: string) => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <ShareReportButton accountId={accountId} />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onRefresh(accountId)}
          disabled={refreshLoading || backfillLoading}
          loading={refreshLoading}
          title="Re-fetch current follower count and update profile photo"
        >
          Refresh
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onBackfill(accountId)}
          disabled={refreshLoading || backfillLoading}
          loading={backfillLoading}
          title="Load historical follower counts from the Wayback Machine"
        >
          Load history
        </Button>
      </div>
      {backfillMsg && (
        <p className="text-xs font-semibold text-teal-700">{backfillMsg}</p>
      )}
    </div>
  );
}

function calculateDaysTracked(snapshots: SnapshotPoint[]) {
  if (snapshots.length === 0) return 0;
  if (snapshots.length === 1) return 1;
  const first = new Date(snapshots[0]!.takenAt).getTime();
  const last = new Date(snapshots.at(-1)!.takenAt).getTime();
  return Math.max(1, Math.round((last - first) / (1000 * 60 * 60 * 24)) + 1);
}

function calculateVolatility(snapshots: SnapshotPoint[]) {
  if (snapshots.length < 3) return null;
  const deltas = snapshots.slice(1).map((snapshot, index) => {
    const previous = snapshots[index];
    return previous ? Math.abs(snapshot.followerCount - previous.followerCount) : 0;
  });
  const current = snapshots.at(-1)?.followerCount ?? 0;
  if (current <= 0) return null;
  const averageSwing = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
  return Math.min(100, Math.round((averageSwing / current) * 1000));
}
