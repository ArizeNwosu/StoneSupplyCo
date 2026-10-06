'use client';

import { useEffect, useState } from 'react';
import { clearCheckoutIntent, readCheckoutIntent } from '@/lib/revenue/checkout-intent';

export function PendingCheckout() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('resumeCheckout')) return;
    const intent = readCheckoutIntent();
    if (!intent) return;
    void fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intent),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? 'Could not resume checkout');
      clearCheckoutIntent();
      window.location.href = data.url;
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not resume checkout'));
  }, []);

  if (!error) return null;
  return <p className="mx-auto mt-4 max-w-xl text-center text-sm text-red-600">{error}</p>;
}

