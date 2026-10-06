'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { saveCheckoutIntent } from '@/lib/revenue/checkout-intent';
import type { CheckoutSource } from '@/lib/revenue/types';

interface CheckoutButtonProps {
  plan: 'PRO' | 'AGENCY';
  interval: 'monthly' | 'annual';
  className?: string;
  children: ReactNode;
  source?: CheckoutSource;
}

export function CheckoutButton({ plan, interval, className, children, source = 'pricing' }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval, source }),
      });
      if (res.status === 401) {
        saveCheckoutIntent({ plan, interval, source });
        window.location.href = '/auth/signin?returnTo=%2Fpricing%3FresumeCheckout%3D1';
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; redirect?: string };
      if (data.url) {
        window.location.href = data.url;
      } else if (res.status === 409 && data.redirect) {
        // Already subscribed — send to billing settings to manage/upgrade
        window.location.href = data.redirect;
      } else {
        setLoading(false);
        setError(data.error ?? `Checkout failed (${res.status}). Please try again.`);
      }
    } catch {
      setLoading(false);
      setError('Network error. Please try again.');
    }
  };

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        {loading ? 'Redirecting…' : children}
      </button>
      {error && <p className="mt-2 text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
