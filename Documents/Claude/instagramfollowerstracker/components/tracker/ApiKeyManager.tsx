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

      <div className="space-y-4 border-t border-cyan-950/10 pt-4">
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-1.5">Authentication</p>
          <p className="text-xs text-slate-500 mb-2">Pass your API key as a Bearer token in every request:</p>
          <code className="block rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 leading-relaxed">
            Authorization: Bearer {'<your-key>'}
          </code>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-700 mb-1.5">Endpoints</p>
          <div className="space-y-2">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-mono">
                <span className="font-bold text-teal-700">GET</span>{' '}
                <span className="text-slate-700">/api/v1/accounts</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-500">List all your tracked accounts with latest follower counts.</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-mono">
                <span className="font-bold text-teal-700">GET</span>{' '}
                <span className="text-slate-700">/api/v1/accounts/<span className="text-cyan-700">:handle</span>/snapshots</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Full snapshot history for one account. Returns an array of <code className="bg-slate-100 px-1 rounded">{'{ takenAt, followerCount }'}</code> objects sorted oldest first.</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-700 mb-1.5">Example request</p>
          <code className="block rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 leading-relaxed whitespace-pre">{'curl https://instagramfollowerstracker.com/api/v1/accounts \\\n  -H "Authorization: Bearer <your-key>"'}</code>
        </div>

        <p className="text-xs text-slate-400">Keys are hashed server-side. If you lose your key, regenerate it — the old one is immediately revoked.</p>
      </div>
    </div>
  );
}
