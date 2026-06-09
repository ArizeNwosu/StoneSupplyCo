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
  fakePctRange?: { min: number; max: number };
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="hidden text-sm font-black text-slate-950 md:block">
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

      <main className="flex-1 overflow-y-auto bg-sky-50 p-4 sm:p-6">
        {/* Mobile top bar — opens sidebar and shows selected account */}
        <div className="mb-4 flex items-center gap-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-cyan-950/10 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm active:bg-slate-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Accounts
          </button>
          {selected && (
            <span className="truncate text-sm font-bold text-slate-500">
              @{selected.handle}
            </span>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="ml-auto shrink-0 rounded-full bg-cyan-950 px-3 py-2 text-xs font-black text-white"
          >
            + Add
          </button>
        </div>

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
                              fakePctRange={snapshotData.authenticityScore.fakePctRange}
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

function Shimmer({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-100 ${className}`}>
      <div className="animate-shimmer absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

function DashboardLoadingPanel({ handle }: { handle?: string }) {
  return (
    <div className="mx-auto max-w-6xl space-y-5 animate-[rise-in_0.3s_ease-out]">

      {/* Status bar */}
      <div className="flex items-center gap-2.5 rounded-xl border border-cyan-500/20 bg-cyan-50 px-4 py-3">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
        </span>
        <p className="text-sm font-bold text-cyan-900">
          {handle
            ? `Taking first snapshot of @${handle} — this usually takes a few seconds…`
            : 'Loading your dashboard…'}
        </p>
      </div>

      {/* Header skeleton — mirrors AccountIntelligenceHeader */}
      <div className="rounded-2xl border border-cyan-950/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <Shimmer className="h-16 w-16 shrink-0 rounded-full" />
            <div className="space-y-2.5">
              {/* Handle */}
              <Shimmer className="h-5 w-32 rounded-full" />
              {/* Follower count */}
              <Shimmer className="h-8 w-24 rounded-lg" />
              {/* Stat chips */}
              <div className="flex gap-2">
                <Shimmer className="h-5 w-16 rounded-full" />
                <Shimmer className="h-5 w-16 rounded-full" />
                <Shimmer className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex gap-2">
            <Shimmer className="h-9 w-20 rounded-full" />
            <Shimmer className="h-9 w-28 rounded-full" />
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-cyan-950/10 bg-slate-100 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2 bg-white p-4">
              <Shimmer className="h-3 w-16 rounded-full" />
              <Shimmer className="h-6 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Metrics row skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-cyan-950/10 bg-white p-4 shadow-sm">
            <Shimmer className="mb-2 h-3 w-16 rounded-full" />
            <Shimmer className="h-7 w-24 rounded-md" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-xl border border-cyan-950/10 bg-white p-5 shadow-xl shadow-cyan-950/10">
        <div className="mb-5 flex items-center justify-between">
          <div className="space-y-2">
            <Shimmer className="h-3 w-24 rounded-full" />
            <Shimmer className="h-5 w-40 rounded-md" />
          </div>
          <Shimmer className="h-7 w-24 rounded-full" />
        </div>

        {/* Chart area with fake axis lines */}
        <div className="relative h-72 overflow-hidden rounded-xl bg-slate-50">
          {/* Horizontal grid lines */}
          {[20, 40, 60, 80].map((pct) => (
            <div
              key={pct}
              className="absolute inset-x-0 border-t border-slate-100"
              style={{ top: `${pct}%` }}
            />
          ))}
          {/* Fake chart bars that shimmer */}
          <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-1">
            {[55, 70, 45, 80, 60, 75, 50, 85, 65, 90, 70, 80].map((h, i) => (
              <div
                key={i}
                className="relative flex-1 overflow-hidden rounded-t bg-slate-100"
                style={{ height: `${h}%` }}
              >
                <div className="animate-shimmer absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              </div>
            ))}
          </div>
          {/* Overlay message */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
              <svg className="h-5 w-5 animate-spin text-cyan-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-400">
              {handle ? `Collecting @${handle}'s follower data…` : 'Building your chart…'}
            </p>
          </div>
        </div>

        {/* X-axis labels skeleton */}
        <div className="mt-3 flex justify-between px-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Shimmer key={i} className="h-3 w-10 rounded-full" />
          ))}
        </div>
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
