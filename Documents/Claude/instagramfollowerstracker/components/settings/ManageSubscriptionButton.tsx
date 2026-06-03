'use client';

import { useState } from 'react';

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (res.status === 401) {
        window.location.href = '/auth/signin';
        return;
      }
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        // loading stays true — page is navigating away
        window.location.href = data.url;
      } else {
        setLoading(false);
        setError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setLoading(false);
      setError('Could not connect. Check your internet connection and try again.');
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-40 transition"
      >
        {loading ? 'Opening portal…' : 'Manage subscription →'}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
