import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden="true">
          <rect width="48" height="48" rx="8" fill="#ecfeff" />
          <path d="M14 34 L24 14 L34 34" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 28 L31 28" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
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
