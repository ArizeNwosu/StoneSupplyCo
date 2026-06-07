'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface AddAccountFormProps {
  onAdd: (handle: string, followerCount?: string) => Promise<{ error?: string }>;
  onCancel: () => void;
}

export function AddAccountForm({ onAdd, onCancel }: AddAccountFormProps) {
  const [handle, setHandle] = useState('');
  const [followerCount, setFollowerCount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await onAdd(handle.trim(), followerCount.trim() || undefined);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setHandle('');
      setFollowerCount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Instagram handle"
        placeholder="@nike or instagram.com/nike"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        error={error}
        autoFocus
      />
      <Input
        label="Current follower count"
        placeholder="Optional: 18.2K or 18,292"
        value={followerCount}
        onChange={(e) => setFollowerCount(e.target.value)}
      />
      <p className="-mt-2 text-xs font-semibold leading-5 text-slate-500">
        Add the count shown on Instagram to create the first snapshot instantly.
      </p>
      <div className="flex gap-2">
        <Button type="submit" loading={loading} className="flex-1">
          Start Tracking Free
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
