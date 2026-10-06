'use client';

import { CheckoutButton } from '@/components/pricing/CheckoutButton';
import { RevenueEventBeacon } from '@/components/pricing/RevenueEventBeacon';
import type { CheckoutSource } from '@/lib/revenue/types';

export function ResultPaywall({ title, detail, source }: { title: string; detail: string; source: Extract<CheckoutSource, 'unfollowers' | 'export'> }) {
  return (
    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-center">
      <RevenueEventBeacon type="PAYWALL_VIEWED" source={source} eventKey={`result:${source}`} />
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{detail}</p>
      <CheckoutButton plan="PRO" interval="monthly" source={source} className="mt-3 rounded-full bg-slate-950 px-5 py-2 text-sm font-black text-white">
        Unlock with Pro
      </CheckoutButton>
    </div>
  );
}
