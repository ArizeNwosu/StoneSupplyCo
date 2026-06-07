'use client';

import { Button } from '@/components/ui/Button';

interface AutomaticTrackingPanelProps {
  handle: string;
  snapshotCount: number;
  lastChecked: string | null;
  onRefresh: () => Promise<void> | void;
}

export function AutomaticTrackingPanel({
  handle,
  snapshotCount,
  lastChecked,
  onRefresh,
}: AutomaticTrackingPanelProps) {
  const hasSnapshots = snapshotCount > 0;

  return (
    <div className="rounded-lg border border-teal-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-teal-700">
            Automatic daily tracking
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-950">
            @{handle} is queued for daily snapshots
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            We collect follower counts in the background once per day. Users only
            need to provide the Instagram username.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void onRefresh()}>
          Run now
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatusItem
          label="Collection mode"
          value="Automated"
          detail="Server-side daily job"
        />
        <StatusItem
          label="Snapshots"
          value={String(snapshotCount)}
          detail={hasSnapshots ? 'History is building' : 'First capture pending'}
        />
        <StatusItem
          label="Last checked"
          value={lastChecked ? new Date(lastChecked).toLocaleDateString() : 'Pending'}
          detail={hasSnapshots ? 'Next run is scheduled' : 'Usually starts shortly'}
        />
      </div>
    </div>
  );
}

function StatusItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-cyan-950/10 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  );
}
