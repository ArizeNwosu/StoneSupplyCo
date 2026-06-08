'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PLAN_PRICES } from '@/lib/limits';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

type Interval = 'monthly' | 'annual';

const PRO_FEATURES = [
  '10 tracked accounts',
  'Email alerts on follower changes',
  'Unfollow detection via export',
  'CSV exports',
  'Full history — no limits',
];

const AGENCY_FEATURES = [
  'Unlimited tracked accounts',
  'Everything in Pro',
  'API access',
  'Shareable client report links',
  'Priority support',
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [interval, setInterval] = useState<Interval>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleCheckout = async (plan: 'PRO' | 'AGENCY') => {
    setLoadingPlan(plan);
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
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? `Checkout failed (${res.status}). Please try again.`);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Upgrade your plan">
      <div className="space-y-5">
        <p className="text-sm text-slate-500">
          You&apos;ve reached the 1-account limit on the Free plan. Choose a plan to keep tracking.
        </p>

        {/* Interval toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex rounded-full border border-cyan-950/10 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
                interval === 'monthly' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval('annual')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black transition ${
                interval === 'annual' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Annual
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                interval === 'annual' ? 'bg-teal-500 text-white' : 'bg-teal-100 text-teal-700'
              }`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pro */}
          <div className="rounded-xl border-2 border-teal-600 bg-teal-50/40 p-4 flex flex-col">
            <div className="mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-teal-700">Pro</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                ${interval === 'monthly' ? PLAN_PRICES.PRO.monthly : PLAN_PRICES.PRO.annual}
                <span className="text-sm font-semibold text-slate-500">/mo</span>
              </p>
              {interval === 'annual' && (
                <p className="text-xs text-slate-500">billed ${PLAN_PRICES.PRO.annual * 12}/yr</p>
              )}
            </div>
            <ul className="mb-4 flex-1 space-y-1.5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                  <span className="mt-0.5 text-teal-600">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleCheckout('PRO')}
              disabled={loadingPlan !== null}
              className="w-full rounded-full bg-teal-700 py-2 text-xs font-black text-white transition hover:bg-teal-800 disabled:opacity-50"
            >
              {loadingPlan === 'PRO' ? 'Redirecting…' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Agency */}
          <div className="rounded-xl border border-cyan-950/10 bg-slate-50 p-4 flex flex-col">
            <div className="mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Agency</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                ${interval === 'monthly' ? PLAN_PRICES.AGENCY.monthly : PLAN_PRICES.AGENCY.annual}
                <span className="text-sm font-semibold text-slate-500">/mo</span>
              </p>
              {interval === 'annual' && (
                <p className="text-xs text-slate-500">billed ${PLAN_PRICES.AGENCY.annual * 12}/yr</p>
              )}
            </div>
            <ul className="mb-4 flex-1 space-y-1.5">
              {AGENCY_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                  <span className="mt-0.5 text-slate-400">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleCheckout('AGENCY')}
              disabled={loadingPlan !== null}
              className="w-full rounded-full border border-slate-950 bg-white py-2 text-xs font-black text-slate-950 transition hover:bg-slate-950 hover:text-white disabled:opacity-50"
            >
              {loadingPlan === 'AGENCY' ? 'Redirecting…' : 'Upgrade to Agency'}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

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
