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

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'PRO', interval: 'monthly' }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = '/auth/signin';
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upgrade to Pro">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          You&apos;ve reached the 1-account limit on the Free plan. Upgrade to
          Pro to track up to 10 accounts.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-900">Pro — ${PLAN_PRICES.PRO.monthly}/mo</p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>✓ 10 tracked accounts</li>
            <li>✓ Email alerts</li>
            <li>✓ Unfollow detection</li>
            <li>✓ Full history</li>
          </ul>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-3 text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Redirecting to checkout…' : `Upgrade to Pro — $${PLAN_PRICES.PRO.monthly}/mo`}
        </button>
        <button
          onClick={onClose}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
