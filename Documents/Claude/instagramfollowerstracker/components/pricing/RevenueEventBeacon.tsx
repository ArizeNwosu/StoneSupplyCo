'use client';

import { useEffect } from 'react';
import type { CheckoutSource, RevenueEventType } from '@/lib/revenue/types';

export function RevenueEventBeacon({ type, source, eventKey }: {
  type: Extract<RevenueEventType, 'PAYWALL_VIEWED' | 'PRICING_VIEWED'>;
  source: CheckoutSource;
  eventKey: string;
}) {
  useEffect(() => {
    const key = `revenue_beacon:${eventKey}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* analytics must never block UI */ }
    void fetch('/api/revenue/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, source, idempotencyKey: `${eventKey}:${Date.now()}` }),
      keepalive: true,
    });
  }, [eventKey, source, type]);
  return null;
}
