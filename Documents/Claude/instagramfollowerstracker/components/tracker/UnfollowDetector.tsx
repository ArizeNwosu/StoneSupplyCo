'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Person {
  handle: string;
  displayName?: string;
}

interface DiffResult {
  newFollowers: Person[];
  lostFollowers: Person[];
}

interface UploadResult {
  uploadId: string;
  followerCount: number | null;
  followingCount: number | null;
  uploadedAt: string;
  diff: DiffResult | null;
}

interface StoredExport {
  id: string;
  uploadedAt: string;
  followerCount: number | null;
  followingCount: number | null;
}

interface UnfollowDetectorProps {
  userPlan: 'FREE' | 'PRO' | 'AGENCY';
}

export function UnfollowDetector({ userPlan }: UnfollowDetectorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [storedExports, setStoredExports] = useState<StoredExport[]>([]);
  const [loadingExports, setLoadingExports] = useState(userPlan !== 'FREE');
  const [error, setError] = useState<string | null>(null);

  const loadExports = useCallback(async () => {
    if (userPlan === 'FREE') return;

    setLoadingExports(true);
    try {
      const res = await fetch('/api/exports');
      if (res.ok) {
        setStoredExports((await res.json()) as StoredExport[]);
      }
    } finally {
      setLoadingExports(false);
    }
  }, [userPlan]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadExports();
  }, [loadExports]);

  if (userPlan === 'FREE') {
    return (
      <div className="rounded-lg border border-cyan-950/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-black text-slate-950">Unfollow Detector</h3>
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-black text-teal-800">PRO</span>
        </div>
        <p className="mb-4 text-sm leading-6 text-slate-500">
          See exactly who followed and unfollowed you. Upload your Instagram data export and we&apos;ll show you every change since your last upload.
        </p>
        <Link
          href="/pricing"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/exports', { method: 'POST', body: formData });
      const data = (await res.json()) as UploadResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Upload failed. Please try again.');
      } else {
        setResult(data);
        if (fileRef.current) fileRef.current.value = '';
        await loadExports();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5 rounded-lg border border-cyan-950/10 bg-white p-6 shadow-xl shadow-cyan-950/10">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-black text-slate-950">Unfollow Detector</h3>
        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-black text-teal-800">PRO</span>
      </div>

      {/* Instructions */}
      <div className="space-y-1.5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        <p className="mb-2 font-black text-slate-800">How to get your Instagram export:</p>
        <p>1. Open Instagram → <strong>Settings → Your Activity → Download Your Information</strong></p>
        <p>2. Select <strong>JSON format</strong>, tap &quot;Request a download&quot;</p>
        <p>3. Wait for the email (up to 48 hours), download the ZIP</p>
        <p>4. Upload the original ZIP below, or upload <strong>followers_1.json</strong> if you already extracted it</p>
      </div>

      {/* Upload area */}
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".zip,.json,application/zip,application/x-zip-compressed,application/json"
          className="text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-700 file:transition hover:file:bg-slate-200"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="shrink-0 rounded-full bg-slate-950 px-5 py-2 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {uploading ? 'Analysing…' : 'Upload'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Results */}
      {result && (
        <div className="space-y-4 border-t border-cyan-950/10 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              {formatCount(result.followerCount)} followers in this export
            </p>
            <p className="text-xs font-semibold text-slate-400">
              {new Date(result.uploadedAt).toLocaleDateString()}
            </p>
          </div>

          <ExportButtons
            exportId={result.uploadId}
            hasFollowing={Boolean(result.followingCount)}
            hasDiff={result.diff !== null}
          />

          {result.diff === null ? (
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
              <p className="text-sm text-blue-700 font-medium">First upload saved</p>
              <p className="text-sm text-blue-600 mt-1">
                Upload again after a few days to see who followed or unfollowed you.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DiffSection
                title="Lost followers"
                people={result.diff.lostFollowers}
                emptyText="No one unfollowed you"
                variant="lost"
              />
              <DiffSection
                title="New followers"
                people={result.diff.newFollowers}
                emptyText="No new followers"
                variant="new"
              />
            </div>
          )}
        </div>
      )}

      <SavedExports
        exports={storedExports}
        loading={loadingExports}
      />
    </div>
  );
}

function SavedExports({
  exports,
  loading,
}: {
  exports: StoredExport[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="border-t border-cyan-950/10 pt-4">
        <p className="text-xs font-semibold text-slate-400">Loading saved exports...</p>
      </div>
    );
  }

  if (exports.length === 0) {
    return (
      <div className="border-t border-cyan-950/10 pt-4">
        <p className="text-sm font-black text-slate-950">Saved exports</p>
        <p className="mt-1 text-xs font-semibold text-slate-400">No uploads saved yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-cyan-950/10 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-slate-950">Saved exports</p>
        <p className="text-xs font-semibold text-slate-400">Last {Math.min(exports.length, 5)}</p>
      </div>
      <div className="space-y-2">
        {exports.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="gap-3 rounded-lg border border-cyan-950/10 p-3 sm:flex sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-800">
                {new Date(item.uploadedAt).toLocaleDateString()}
              </p>
              <p className="text-xs font-semibold text-slate-400">
                {formatCount(item.followerCount)} followers
                {item.followingCount ? ` / ${formatCount(item.followingCount)} following` : ''}
              </p>
            </div>
            <div className="mt-3 sm:mt-0">
              <ExportButtons
                exportId={item.id}
                hasFollowing={Boolean(item.followingCount)}
                hasDiff
                compact
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportButtons({
  exportId,
  hasFollowing,
  hasDiff,
  compact = false,
}: {
  exportId: string;
  hasFollowing: boolean;
  hasDiff: boolean;
  compact?: boolean;
}) {
  const className = compact
    ? 'inline-flex items-center rounded-full border border-cyan-950/10 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:text-slate-950'
    : 'inline-flex items-center rounded-full border border-cyan-950/10 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:text-slate-950';

  return (
    <div className="flex flex-wrap gap-2">
      <a className={className} href={downloadHref(exportId, 'followers')}>
        Followers CSV
      </a>
      {hasFollowing && (
        <a className={className} href={downloadHref(exportId, 'following')}>
          Following CSV
        </a>
      )}
      {hasDiff && (
        <a className={className} href={downloadHref(exportId, 'diff')}>
          Diff CSV
        </a>
      )}
    </div>
  );
}

function downloadHref(
  exportId: string,
  type: 'followers' | 'following' | 'diff'
): string {
  return `/api/exports/${exportId}/download?type=${type}&format=csv`;
}

function formatCount(count: number | null): string {
  return typeof count === 'number' ? count.toLocaleString() : '0';
}

function DiffSection({
  title,
  people,
  emptyText,
  variant,
}: {
  title: string;
  people: Person[];
  emptyText: string;
  variant: 'lost' | 'new';
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? people : people.slice(0, 5);
  const colorClass = variant === 'lost' ? 'text-red-600' : 'text-green-600';
  const bgClass = variant === 'lost' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100';
  const countColorClass = variant === 'lost' ? 'text-red-500' : 'text-green-500';

  return (
    <div className={`rounded-lg border p-4 ${bgClass}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-semibold ${colorClass}`}>{title}</p>
        {people.length > 0 && (
          <span className={`text-xs font-medium ${countColorClass}`}>
            {people.length}
          </span>
        )}
      </div>
      {people.length === 0 ? (
        <p className="text-xs text-slate-500">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((p) => (
            <li key={p.handle} className="text-xs text-slate-700">
              <a
                href={`https://instagram.com/${p.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                @{p.handle}
              </a>
              {p.displayName && (
                <span className="ml-1 text-slate-500">{p.displayName}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {people.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs text-slate-500 transition hover:text-slate-700"
        >
          {expanded ? 'Show less' : `Show all ${people.length}`}
        </button>
      )}
    </div>
  );
}
