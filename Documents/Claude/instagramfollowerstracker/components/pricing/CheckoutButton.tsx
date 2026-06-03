'use client';

import { useState } from 'react';

interface CheckoutButtonProps {
  plan: 'PRO' | 'AGENCY';
  interval: 'monthly' | 'annual';
  className?: string;
  children: React.ReactNode;
}

export function CheckoutButton({ plan, interval, className, children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Not signed in or already subscribed — send to sign-in
        window.location.href = '/auth/signin';
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading ? 'Redirecting…' : children}
    </button>
  );
}
