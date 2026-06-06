'use client';

import { useState, useEffect } from 'react';

export function ApiKeyManager() {
  const [prefix, setPrefix] = useState<string | null | undefined>(undefined);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/v1/key')
      .then((r) => r.json())
      .then((d: { prefix?: string | null }) => setPrefix(d.prefix ?? null))
      .catch(() => setPrefix(null));
  }, []);

  const generate = async () => {
    setLoading(true);
    const res = await fetch('/api/v1/key', { method: 'POST' });
    const data = (await res.json()) as { key: string; prefix: string };
    setPrefix(data.prefix);
    setNewKey(data.key);
    setLoading(false);
  };

  const revoke = async () => {
    if (!confirm('Revoke API key? Any integrations using it will stop working immediately.')) return;
    await fetch('/api/v1/key', { method: 'DELETE' });
    setPrefix(null);
    setNewKey(null);
  };

  const copy = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (prefix === undefined) {
    return <div className="h-10 animate-pulse rounded-lg bg-slate-100" />;
  }

  return (
    <div className="space-y-4">
      {newKey && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-800 mb-2">
            Copy this key now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-xs text-slate-800">
              {newKey}
            </code>
            <button
              onClick={copy}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {prefix && !newKey && (
        <code className="block rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-600">
          {prefix}••••••••••••••••••••••••••••••••••••••••••••••••••••
        </code>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={generate}
          disabled={loading}
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900 disabled:opacity-40"
        >
          {loading ? 'Generating…' : prefix ? 'Regenerate key' : 'Generate API key'}
        </button>
        {prefix && (
          <button onClick={revoke} className="text-sm text-red-500 hover:text-red-600">
            Revoke
          </button>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-slate-500">
        <p>Use in requests:</p>
        <code className="block rounded-lg bg-slate-100 px-3 py-2 text-slate-600 leading-relaxed">
          Authorization: Bearer {'<your-key>'}
        </code>
        <p className="pt-1">
          <span className="text-slate-500">GET</span>{' '}
          <code className="text-slate-600">
            https://instagramfollowerstracker.com/api/v1/accounts
          </code>
        </p>
        <p>
          <span className="text-slate-500">GET</span>{' '}
          <code className="text-slate-600">
            /api/v1/accounts/{'<handle>'}/snapshots
          </code>
        </p>
      </div>
    </div>
  );
}
