import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">📊</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        No accounts tracked yet
      </h2>
      <p className="text-gray-500 mb-6 max-w-sm text-sm">
        Add any public Instagram account to start tracking follower growth over
        time.
      </p>
      <Button onClick={onAdd}>Start Tracking Free</Button>
    </div>
  );
}
