'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

interface CheckoutButtonProps {
  plan: 'PRO' | 'AGENCY';
  interval: 'monthly' | 'annual';
  className?: string;
  children: ReactNode;
}

export function CheckoutButton({ plan, interval, className, children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      });
      if (res.status === 401) {
        window.location.href = '/auth/signin';
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
