'use client';

import { useState, useEffect } from 'react';

interface ReportLink {
  id: string;
  token: string;
  label: string | null;
  viewCount: number;
  createdAt: string;
  expiresAt: string | null;
  trackedAccount: { handle: string };
}

export function ReportLinksList() {
  const [links, setLinks] = useState<ReportLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/report-links')
      .then((r) => r.json())
      .then((data: ReportLink[]) => {
        setLinks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const revoke = async (id: string) => {
    await fetch(`/api/report-links/${id}`, { method: 'DELETE' });
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/r/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return <div className="h-12 animate-pulse rounded-lg bg-slate-100" />;
  }

  if (links.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No active report links. Use &ldquo;Share Report&rdquo; on any tracked
        account to generate one.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {links.map((link) => (
        <li
          key={link.id}
          className="flex items-center justify-between border-b border-cyan-950/10 py-3 last:border-0"
        >
          <div>
            <p className="text-sm font-semibold text-slate-950">
              @{link.trackedAccount.handle}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {link.viewCount} view{link.viewCount !== 1 ? 's' : ''} &middot;{' '}
              {new Date(link.createdAt).toLocaleDateString()}
              {link.expiresAt && (
                <>
                  {' '}
                  &middot; Expires{' '}
                  {new Date(link.expiresAt).toLocaleDateString()}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => copyLink(link.token)}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-900"
            >
              {copied === link.token ? 'Copied!' : 'Copy link'}
            </button>
            <button
              onClick={() => revoke(link.id)}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Revoke
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
