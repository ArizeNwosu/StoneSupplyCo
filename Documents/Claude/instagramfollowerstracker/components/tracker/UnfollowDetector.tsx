'use client';

import { useRef, useState } from 'react';
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
  followerCount: number;
  uploadedAt: string;
  diff: DiffResult | null;
}

interface UnfollowDetectorProps {
  userPlan: 'FREE' | 'PRO' | 'AGENCY';
}

export function UnfollowDetector({ userPlan }: UnfollowDetectorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (userPlan === 'FREE') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Unfollow Detector</h3>
          <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">PRO</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          See exactly who followed and unfollowed you. Upload your Instagram data export and we&apos;ll show you every change since your last upload.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition"
        >
          Upgrade to Pro →
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
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Unfollow Detector</h3>
        <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">PRO</span>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1.5">
        <p className="font-medium text-gray-700 mb-2">How to get your Instagram export:</p>
        <p>1. Open Instagram → <strong>Settings → Your Activity → Download Your Information</strong></p>
        <p>2. Select <strong>JSON format</strong>, tap &quot;Request a download&quot;</p>
        <p>3. Wait for the email (up to 48 hours), download the ZIP</p>
        <p>4. Extract the ZIP and upload <strong>followers_1.json</strong> below</p>
      </div>

      {/* Upload area */}
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-5 py-2 text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {uploading ? 'Analysing…' : 'Upload'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Results */}
      {result && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {result.followerCount.toLocaleString()} followers in this export
            </p>
            <p className="text-xs text-gray-400">
              {new Date(result.uploadedAt).toLocaleDateString()}
            </p>
          </div>

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
    </div>
  );
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
        <p className="text-xs text-gray-400">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((p) => (
            <li key={p.handle} className="text-xs text-gray-700">
              <a
                href={`https://instagram.com/${p.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                @{p.handle}
              </a>
              {p.displayName && (
                <span className="text-gray-400 ml-1">{p.displayName}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {people.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition"
        >
          {expanded ? 'Show less' : `Show all ${people.length}`}
        </button>
      )}
    </div>
  );
}
