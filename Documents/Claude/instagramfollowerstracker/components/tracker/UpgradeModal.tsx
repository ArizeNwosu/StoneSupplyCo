'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PLAN_PRICES } from '@/lib/limits';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'PRO', interval: 'monthly' }),
      });
      if (res.status === 401) {
        window.location.href = '/auth/signin';
        return;
      }
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
        setError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setLoading(false);
      setError('Network error. Please try again.');
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Upgrade to Pro">
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-600">
          You&apos;ve reached the 1-account limit on the Free plan. Upgrade to
          Pro to track up to 10 accounts.
        </p>
        <div className="space-y-2 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">Pro — ${PLAN_PRICES.PRO.monthly}/mo</p>
          <ul className="space-y-1 text-sm text-slate-500">
            <li>✓ 10 tracked accounts</li>
            <li>✓ Email alerts</li>
            <li>✓ Unfollow detection</li>
            <li>✓ Full history</li>
          </ul>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded-full bg-slate-950 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Redirecting to checkout…' : `Upgrade to Pro — $${PLAN_PRICES.PRO.monthly}/mo`}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="w-full text-sm font-semibold text-slate-400 transition hover:text-slate-600"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
