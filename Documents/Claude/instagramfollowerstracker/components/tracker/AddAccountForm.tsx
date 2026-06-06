'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface AddAccountFormProps {
  onAdd: (handle: string) => Promise<{ error?: string }>;
  onCancel: () => void;
}

export function AddAccountForm({ onAdd, onCancel }: AddAccountFormProps) {
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await onAdd(handle.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setHandle('');
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
