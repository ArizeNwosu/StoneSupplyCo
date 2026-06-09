import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6">
        <Image src="/site-icon.png" alt="" width={48} height={48} priority />
      </div>
      <h2 className="mb-2 text-xl font-black text-slate-950">
        No accounts tracked yet
      </h2>
      <p className="mb-6 max-w-sm text-sm leading-6 text-slate-500">
        Add any public Instagram account to start tracking follower growth over
        time.
      </p>
      <Button onClick={onAdd}>Start Tracking Free</Button>
    </div>
  );
}
