'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  plan: 'FREE' | 'PRO' | 'AGENCY';
  createdAt: string;
  stripeSubId: string | null;
  trackedAccounts: {
    handle: string;
    snapshotCount: number;
    lastChecked: string | null;
  }[];
}

const PLAN_STYLES: Record<AdminUser['plan'], string> = {
  FREE: 'bg-slate-100 text-slate-600',
  PRO: 'bg-cyan-100 text-cyan-800',
  AGENCY: 'bg-purple-100 text-purple-800',
};

function lastActive(accounts: AdminUser['trackedAccounts']): string | null {
  const dates = accounts
    .map((a) => a.lastChecked)
    .filter(Boolean)
    .map((d) => new Date(d!).getTime());
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates)).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function totalSnapshots(accounts: AdminUser['trackedAccounts']): number {
  return accounts.reduce((sum, a) => sum + a.snapshotCount, 0);
}

export function AdminTable({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'ALL' | AdminUser['plan']>('ALL');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return users.filter((u) => {
      if (planFilter !== 'ALL' && u.plan !== planFilter) return false;
      if (!q) return true;
      if (u.email?.toLowerCase().includes(q)) return true;
      if (u.name?.toLowerCase().includes(q)) return true;
      if (u.trackedAccounts.some((a) => a.handle.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [users, query, planFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    paid: users.filter((u) => u.plan !== 'FREE').length,
    free: users.filter((u) => u.plan === 'FREE').length,
    accounts: users.reduce((sum, u) => sum + u.trackedAccounts.length, 0),
    snapshots: users.reduce((sum, u) => sum + totalSnapshots(u.trackedAccounts), 0),
  }), [users]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-cyan-400">Admin</p>
            <h1 className="mt-1 text-2xl font-black text-white">User Dashboard</h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            ← Back to app
          </Link>
        </div>

        {/* Stats strip */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'Total users', value: stats.total },
            { label: 'Paid', value: stats.paid },
            { label: 'Free', value: stats.free },
            { label: 'Tracked accounts', value: stats.accounts },
            { label: 'Total snapshots', value: stats.snapshots.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email, name, or handle…"
            className="min-h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          />
          <div className="flex gap-2">
            {(['ALL', 'FREE', 'PRO', 'AGENCY'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlanFilter(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  planFilter === p
                    ? 'bg-cyan-500 text-white'
                    : 'border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="shrink-0 text-xs text-slate-500">
            {filtered.length} of {users.length} users
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">User</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Plan</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Tracked accounts</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Snapshots</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Last active</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="transition hover:bg-white/[0.03]">
                    {/* User */}
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{user.email ?? '—'}</p>
                      {user.name && (
                        <p className="text-xs text-slate-500">{user.name}</p>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ${PLAN_STYLES[user.plan]}`}>
                        {user.plan}
                      </span>
                      {user.stripeSubId && (
                        <p className="mt-0.5 text-[10px] text-slate-600" title={user.stripeSubId}>
                          Stripe ✓
                        </p>
                      )}
                    </td>

                    {/* Tracked accounts */}
                    <td className="px-4 py-3">
                      {user.trackedAccounts.length === 0 ? (
                        <span className="text-xs text-slate-600">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.trackedAccounts.slice(0, 4).map((a) => (
                            <span
                              key={a.handle}
                              className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-xs font-bold text-slate-300"
                              title={`${a.snapshotCount} snapshots`}
                            >
                              @{a.handle}
                            </span>
                          ))}
                          {user.trackedAccounts.length > 4 && (
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-bold text-slate-500">
                              +{user.trackedAccounts.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Snapshots */}
                    <td className="px-4 py-3 text-sm font-bold text-slate-300 tabular-nums">
                      {totalSnapshots(user.trackedAccounts).toLocaleString()}
                    </td>

                    {/* Last active */}
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {lastActive(user.trackedAccounts) ?? '—'}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
