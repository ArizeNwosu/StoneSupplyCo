'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ManualSnapshotPanelProps {
  accountId: string;
  handle: string;
  onSaved: () => void;
}

export function ManualSnapshotPanel({
  accountId,
  handle,
  onSaved,
}: ManualSnapshotPanelProps) {
  const [followerCount, setFollowerCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);

    const res = await fetch(`/api/accounts/${accountId}/manual-snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerCount }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Could not save snapshot');
      return;
    }

    setFollowerCount('');
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px_auto] lg:items-end">
        <div>
          <h3 className="text-sm font-black text-slate-950">
            Create today&apos;s snapshot
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Paste the follower count visible on @{handle} to start the chart now.
          </p>
        </div>
        <Input
          label="Follower count"
          placeholder="18.2K or 18,292"
          value={followerCount}
          onChange={(e) => setFollowerCount(e.target.value)}
          error={error}
        />
        <Button type="submit" loading={loading}>
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
