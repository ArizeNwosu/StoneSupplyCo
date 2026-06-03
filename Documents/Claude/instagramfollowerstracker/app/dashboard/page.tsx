'use client';

import { useState, useEffect, useCallback } from 'react';
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
    avgDailyGain: number | null;
    peakCount: number | null;
    peakDate: string | null;
  } | null;
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0]?.id ?? null);
      }
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    fetchAccounts();
    fetchPlan();
  }, [fetchAccounts, fetchPlan]);

  useEffect(() => {
    if (selectedId) fetchSnapshots(selectedId);
  }, [selectedId, fetchSnapshots]);

  const handleAdd = async (handle: string): Promise<{ error?: string }> => {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      if (res.status === 402) {
        setShowAddModal(false);
        setShowUpgradeModal(true);
        return {};
      }
      return { error: data.error ?? 'Something went wrong' };
    }
    await fetchAccounts();
    setShowAddModal(false);
    return {};
  };

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
          <h1 className="text-sm font-semibold text-gray-900">
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
                className="h-16 bg-gray-100 animate-pulse rounded-xl"
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
              />
            ))}
          </div>
        )}
      </Sidebar>

      <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {!loading && accounts.length === 0 ? (
          <EmptyState onAdd={() => setShowAddModal(true)} />
        ) : selected && snapshotData ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <PatternAlerts />
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  @{selected.handle}
                </h2>
                {selected.displayName && (
                  <p className="text-sm text-gray-500">{selected.displayName}</p>
                )}
                {snapshotData.authenticityScore && (
                  <div className="mt-2">
                    <AuthenticityBadge
                      score={snapshotData.authenticityScore.score}
                      label={snapshotData.authenticityScore.label}
                      signals={snapshotData.authenticityScore.signals}
                    />
                  </div>
                )}
              </div>
              <ShareReportButton accountId={selected.id} />
            </div>
            {snapshotData.chartReady && snapshotData.stats ? (
              <>
                <MetricsRow
                  current={snapshotData.stats.current}
                  change24h={selected.change24h}
                  change7d={null}
                  change30d={snapshotData.stats.change}
                  avgDailyGain={snapshotData.stats.avgDailyGain}
                />
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
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
            <UnfollowDetector userPlan={userPlan} />
          </div>
        ) : null}
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
