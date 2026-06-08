'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PLAN_LIMITS } from '@/lib/limits';
import { FollowerHistoryChart } from '@/components/tracker/FollowerHistoryChart';

interface Person {
  handle: string;
  displayName?: string;
}

interface DiffResult {
  newFollowers: Person[];
  lostFollowers: Person[];
  newCount: number;
  lostCount: number;
}

interface UploadResult {
  uploadId: string;
  followerCount: number | null;
  followingCount: number | null;
  uploadedAt: string;
  diff: DiffResult | null;
  recentlyUnfollowed: Person[];
  recentlyUnfollowedCount: number;
  ghostFollowing: Person[];
  ghostFollowingCount: number;
  fansNotFollowed?: Person[];
  fansNotFollowedCount?: number;
  mutualCount?: number;
  followRatio?: number | null;
  relationshipHealthScore?: number;
  relationshipHealthLabel?: string;
  relationshipInsights?: string[];
}

interface UnfollowAccount {
  handle: string | null;
  lastUploadAt: string;
  followerCount: number | null;
}

interface UnfollowDetectorProps {
  userPlan: 'FREE' | 'PRO' | 'AGENCY';
}

type Stage = 'intro' | 'device' | 'guide' | 'branch' | 'guide-path' | 'upload' | 'syncing' | 'results';
type Device = 'phone' | 'desktop';
type ExportPath = 'device' | 'drive';

// ── Common steps (same for both export paths) ──────────────────────────────

const PHONE_COMMON_STEPS = [
  {
    icon: '📱',
    title: 'Open Instagram',
    body: 'Tap your profile photo in the bottom-right corner of the app.',
  },
  {
    icon: '☰',
    title: 'Open Settings',
    body: 'Tap the three lines in the top-right corner, then tap "Accounts Center".',
  },
  {
    icon: '🕐',
    title: 'Your information',
    body: 'Scroll down and tap "Your information and permissions".',
  },
  {
    icon: '⬇️',
    title: 'Create Export',
    body: 'Tap "Download your information" (or "Export your information"). Then tap "Create export" — you\'ll be shown two options on the next screen.',
  },
];

const DESKTOP_COMMON_STEPS = [
  {
    icon: '💻',
    title: 'Go to Instagram.com',
    body: 'Open instagram.com in your browser and make sure you\'re signed in.',
  },
  {
    icon: '👤',
    title: 'Open Settings',
    body: 'Click the "Edit profile" button below your profile photo in the top-right corner to open your settings panel.',
  },
  {
    icon: '🏠',
    title: 'Account Center',
    body: 'In the left sidebar, click "Account Center".',
  },
  {
    icon: '⬇️',
    title: 'Create Export',
    body: 'Click "Your information and permissions". You should see "Export your information" — click that, then click "Create Export". You\'ll be shown two options on the next screen.',
  },
];

// ── Device (manual upload) path ────────────────────────────────────────────

const PHONE_DEVICE_STEPS = [
  {
    icon: '✅',
    title: 'Export to device',
    body: 'Tap "Export to device" → check "Date range" → tap "All time" then "Save".',
  },
  {
    icon: '📄',
    title: 'Choose HTML or JSON',
    body: 'Set "Format" to HTML or JSON, then tap "Save". Next tap "Start export" — Instagram may ask for your password. Instagram will email you a download link.',
  },
  {
    icon: '📧',
    title: 'Download the ZIP',
    body: 'When the download is ready, unzip it and upload only the small followers_and_following folder files. Do not upload photos, videos, or the full media folder.',
  },
];

const DESKTOP_DEVICE_STEPS = [
  {
    icon: '✅',
    title: 'Export to device',
    body: 'Select the account you want to track and click "Export to device". Then click "Date range" → check "All time" → click "Save".',
  },
  {
    icon: '📄',
    title: 'Choose HTML or JSON',
    body: 'Click "Format" and choose HTML or JSON, then click "Save" and "Start export". Instagram will email you a download link within minutes, sometimes up to 48 hours.',
  },
  {
    icon: '📧',
    title: 'Download the ZIP',
    body: 'When the download is ready, unzip it and upload only the small followers_and_following folder files. Do not upload photos, videos, or the full media folder.',
  },
];

// ── Google Drive (auto-sync) path ──────────────────────────────────────────

const PHONE_DRIVE_STEPS = [
  {
    icon: '☁️',
    title: 'Select your account',
    body: 'Scroll down and check "Google Drive" → tap "Next" → select "Daily" → select "3 years" → tap "Next" → tap "Connect". You\'ll be prompted to sign in with Google to authorize Meta to access your Google Drive. Tap "Continue".',
  },
  {
    icon: '📄',
    title: 'Choose Date Range & format',
    body: 'Tap "Date range" → check "All time" → tap "Save". Tap "Format" and choose HTML or JSON, then tap "Save" → tap "Start export". Instagram will begin transferring your data to Google Drive.',
  },
];

const DESKTOP_DRIVE_STEPS = [
  {
    icon: '☁️',
    title: 'Select your account',
    body: 'Scroll down and check "Google Drive" → click "Next" → select "Daily" → select "3 years" → click "Next" → click "Connect". You\'ll be prompted to sign in with Google to authorize Meta to access your Google Drive. Click "Continue".',
  },
  {
    icon: '📄',
    title: 'Choose Date Range & format',
    body: 'Click "Date range" → check "All time" → click "Save". Click "Format" and choose HTML or JSON, then click "Save" → click "Start export". Instagram will begin transferring your data to Google Drive.',
  },
];

export function UnfollowDetector({ userPlan }: UnfollowDetectorProps) {
  const isPro = userPlan !== 'FREE';

  const [stage, setStage] = useState<Stage>('upload');
  const [device, setDevice] = useState<Device | null>(null);
  const [exportPath, setExportPath] = useState<ExportPath | null>(null);
  const [guideStep, setGuideStep] = useState(0);
  const [pathStep, setPathStep] = useState(0);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [unfollowAccounts, setUnfollowAccounts] = useState<UnfollowAccount[]>([]);
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [uploadHandle, setUploadHandle] = useState('');

  const maxUnfollowAccounts = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS].maxUnfollowAccounts;
  const canAddMore = maxUnfollowAccounts === null || unfollowAccounts.length < maxUnfollowAccounts;

  // Load persisted results on mount so data survives refresh / logout.
  // First-time visitors (no uploads, never seen guide) start at the guide.
  useEffect(() => {
    void (async () => {
      try {
        const accountsRes = await fetch('/api/exports/accounts');
        if (accountsRes.ok) {
          const accountsData = (await accountsRes.json()) as UnfollowAccount[];
          setUnfollowAccounts(accountsData);

          if (accountsData.length > 0) {
            const firstHandle = accountsData[0]!.handle;
            setSelectedHandle(firstHandle);
            setUploadHandle(firstHandle ?? '');
            const url = firstHandle
              ? `/api/exports/latest?handle=${encodeURIComponent(firstHandle)}`
              : '/api/exports/latest';
            const res = await fetch(url);
            if (res.ok) {
              const data = (await res.json()) as UploadResult | null;
              if (data) {
                setResult(data);
                setStage('results');
              }
            }
          } else {
            const hasSeen = typeof window !== 'undefined' && localStorage.getItem('ift_guide_seen');
            if (!hasSeen) setStage('device');
          }
        }
      } catch {
        // silent — fall through to upload stage
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, []);

  const commonSteps = device === 'desktop' ? DESKTOP_COMMON_STEPS : PHONE_COMMON_STEPS;
  const isLastCommonStep = guideStep === commonSteps.length - 1;

  const pathSteps = exportPath === 'drive'
    ? (device === 'desktop' ? DESKTOP_DRIVE_STEPS : PHONE_DRIVE_STEPS)
    : (device === 'desktop' ? DESKTOP_DEVICE_STEPS : PHONE_DEVICE_STEPS);
  const isLastPathStep = pathStep === pathSteps.length - 1;

  // When user returns from Google OAuth, auto-trigger a Drive sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('drive') === 'connected') {
      // Remove the query param from URL without a page reload
      const url = new URL(window.location.href);
      url.searchParams.delete('drive');
      window.history.replaceState({}, '', url.toString());
      queueMicrotask(() => setStage('syncing'));
      void (async () => {
        try {
          const res = await fetch('/api/drive/sync', { method: 'POST' });
          const data = (await res.json()) as { status: string; followerCount?: number; lostFollowers?: number; newFollowers?: number };
          if (data.status === 'synced') {
            // Fetch the latest export to show as result
            const exportsRes = await fetch('/api/exports');
            const exports = (await exportsRes.json()) as Array<{ id: string; followerCount: number | null; followingCount: number | null; uploadedAt: string }>;
            const latest = exports[0];
            if (latest) {
              setResult({
                uploadId: latest.id,
                followerCount: latest.followerCount,
                followingCount: latest.followingCount,
                uploadedAt: latest.uploadedAt,
                diff: data.lostFollowers !== undefined
                  ? { lostCount: data.lostFollowers, newCount: data.newFollowers ?? 0, lostFollowers: [], newFollowers: [] }
                  : null,
                recentlyUnfollowed: [],
                recentlyUnfollowedCount: 0,
                ghostFollowing: [],
                ghostFollowingCount: 0,
                fansNotFollowed: [],
                fansNotFollowedCount: 0,
                mutualCount: 0,
                followRatio: null,
                relationshipHealthScore: undefined,
                relationshipHealthLabel: undefined,
                relationshipInsights: [],
              });
              setStage('results');
            } else {
              setStage('upload');
            }
          } else if (data.status === 'no_new_files') {
            setError('Drive connected! No new export found yet — Instagram may still be preparing it (can take up to 48 hours).');
            setStage('upload');
          } else {
            setError('Drive sync failed. Try uploading manually or sync again later.');
            setStage('upload');
          }
        } catch {
          setError('Could not connect to Drive sync. Try again later.');
          setStage('upload');
        }
      })();
    }
  }, []);

  const switchAccount = useCallback(async (handle: string | null) => {
    if (handle === selectedHandle && stage === 'results') return;
    setSelectedHandle(handle);
    setUploadHandle(handle ?? '');
    setLoadingExisting(true);
    try {
      const url = handle
        ? `/api/exports/latest?handle=${encodeURIComponent(handle)}`
        : '/api/exports/latest';
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as UploadResult | null;
        if (data) {
          setResult(data);
          setStage('results');
        } else {
          setResult(null);
          setStage('upload');
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingExisting(false);
    }
  }, [selectedHandle, stage]);

  const handleUpload = useCallback(async () => {
    const files = Array.from(fileRef.current?.files ?? []);
    if (files.length === 0) {
      setError('Please select at least one file.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    for (const file of files) {
      formData.append('file', file);
    }

    const normalizedHandle = uploadHandle.trim().replace(/^@/, '').toLowerCase();
    if (normalizedHandle) {
      formData.append('handle', normalizedHandle);
    }

    try {
      const res = await fetch('/api/exports', { method: 'POST', body: formData });
      const data = (await res.json()) as UploadResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Upload failed. Please try again.');
      } else {
        setResult(data);
        if (fileRef.current) fileRef.current.value = '';
        // Refresh accounts list then set selected handle to the newly uploaded account
        const accountsRes = await fetch('/api/exports/accounts');
        if (accountsRes.ok) {
          const refreshed = (await accountsRes.json()) as UnfollowAccount[];
          setUnfollowAccounts(refreshed);
          // Select the uploaded handle (or null if no handle was detected)
          const uploadedHandle = normalizedHandle || null;
          setSelectedHandle(uploadedHandle);
        }
        setStage('results');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [uploadHandle]);

  return (
    <div className="rounded-2xl border border-cyan-950/10 bg-white shadow-xl shadow-cyan-950/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-cyan-950/10 px-6 py-4">
        <h3 className="text-sm font-black text-slate-950">Unfollow Detector</h3>
        {!isPro && (
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-black text-teal-800">
            PRO
          </span>
        )}
        {isPro && (
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-black text-teal-800">PRO</span>
        )}
      </div>

      {/* Account tabs */}
      {!loadingExisting && unfollowAccounts.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-cyan-950/10 bg-slate-50/50 px-4 py-2">
          {unfollowAccounts.map((a) => (
            <button
              key={a.handle ?? '__unscoped__'}
              type="button"
              onClick={() => void switchAccount(a.handle)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                selectedHandle === a.handle
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {a.handle ? `@${a.handle}` : 'My account'}
            </button>
          ))}
          {canAddMore && (
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setError(null);
                setUploadHandle('');
                setStage('upload');
              }}
              className="ml-1 flex-shrink-0 rounded-full border border-dashed border-cyan-950/20 px-3 py-1 text-xs font-bold text-slate-400 transition hover:border-slate-400 hover:text-slate-600"
            >
              + Add account
            </button>
          )}
          {!canAddMore && (
            <Link
              href="/pricing"
              className="ml-auto flex-shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
            >
              Upgrade for more ↗
            </Link>
          )}
        </div>
      )}

      <div className="p-6">
        {loadingExisting ? (
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            <div className="grid grid-cols-3 gap-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : null}

        {!loadingExisting && stage === 'intro' && <IntroStage onStart={() => setStage('device')} />}

        {!loadingExisting && stage === 'device' && (
          <DeviceStage
            onSelect={(d) => {
              setDevice(d);
              setGuideStep(0);
              setStage('guide');
            }}
            onBack={() => {
              localStorage.setItem('ift_guide_seen', '1');
              setStage('upload');
            }}
          />
        )}

        {stage === 'guide' && device && (
          <GuideStage
            steps={commonSteps}
            currentStep={guideStep}
            nextLabel="Next"
            onNext={() => {
              if (isLastCommonStep) {
                setStage('branch');
              } else {
                setGuideStep((s) => s + 1);
              }
            }}
            onBack={() => {
              if (guideStep === 0) {
                setStage('device');
              } else {
                setGuideStep((s) => s - 1);
              }
            }}
          />
        )}

        {stage === 'branch' && (
          <BranchStage
            onSelect={(path) => {
              setExportPath(path);
              setPathStep(0);
              setStage('guide-path');
            }}
            onBack={() => {
              setGuideStep(commonSteps.length - 1);
              setStage('guide');
            }}
          />
        )}

        {stage === 'guide-path' && device && exportPath && (
          <GuideStage
            steps={pathSteps}
            currentStep={pathStep}
            totalOffset={commonSteps.length}
            nextLabel={isLastPathStep && exportPath === 'drive' ? 'Connect Google Drive →' : 'Next'}
            onNext={() => {
              if (isLastPathStep) {
                if (exportPath === 'drive') {
                  window.location.href = '/api/drive/connect';
                } else {
                  localStorage.setItem('ift_guide_seen', '1');
                  setStage('upload');
                }
              } else {
                setPathStep((s) => s + 1);
              }
            }}
            onBack={() => {
              if (pathStep === 0) {
                setStage('branch');
              } else {
                setPathStep((s) => s - 1);
              }
            }}
          />
        )}

        {!loadingExisting && stage === 'syncing' && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
            <p className="text-sm font-bold text-slate-700">Syncing from Google Drive…</p>
            <p className="text-xs text-slate-400">This usually takes a few seconds.</p>
          </div>
        )}

        {!loadingExisting && stage === 'upload' && (
          <UploadStage
            fileRef={fileRef}
            uploading={uploading}
            error={error}
            onUpload={handleUpload}
            onStartGuide={() => setStage('device')}
            handle={uploadHandle}
            onHandleChange={setUploadHandle}
            hasExistingAccounts={unfollowAccounts.length > 0}
            onCancel={unfollowAccounts.length > 0 ? () => {
              const first = unfollowAccounts[0];
              if (first) void switchAccount(first.handle);
            } : undefined}
          />
        )}

        {!loadingExisting && stage === 'results' && result && (
          <ResultsStage
            result={result}
            isPro={isPro}
            handle={selectedHandle}
            onUploadAnother={() => {
              setResult(null);
              setError(null);
              setUploadHandle(selectedHandle ?? '');
              setStage('upload');
            }}
          />
        )}
      </div>
    </div>
  );
}

function IntroStage({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
        🔍
      </div>
      <div className="space-y-2">
        <h4 className="text-xl font-black text-slate-950">
          Find out who unfollowed you
        </h4>
        <p className="mx-auto max-w-sm text-sm leading-6 text-slate-500">
          Upload your Instagram data export and we&apos;ll instantly show you who unfollowed you since your last check. Free to try — no card needed.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { emoji: '👀', label: 'See unfollowers' },
          { emoji: '✨', label: 'New followers' },
          { emoji: '📊', label: 'Growth stats' },
        ].map(({ emoji, label }) => (
          <div
            key={label}
            className="rounded-xl border border-cyan-950/10 bg-slate-50 px-3 py-3 text-center"
          >
            <div className="text-2xl">{emoji}</div>
            <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
      >
        Get started — it&apos;s free
      </button>
    </div>
  );
}

function DeviceStage({ onSelect, onBack }: { onSelect: (d: Device) => void; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-lg font-black text-slate-950">How are you using Instagram?</h4>
        <p className="mt-1 text-sm text-slate-500">
          We&apos;ll show you the right steps for your device.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {(
          [
            { device: 'phone' as Device, icon: '📱', label: 'On my phone', sub: 'iOS or Android' },
            { device: 'desktop' as Device, icon: '💻', label: 'On my computer', sub: 'Mac or Windows' },
          ] as const
        ).map(({ device, icon, label, sub }) => (
          <button
            key={device}
            type="button"
            onClick={() => onSelect(device)}
            className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-cyan-950/10 bg-slate-50 p-6 text-center transition hover:border-slate-950 hover:bg-white"
          >
            <span className="text-4xl">{icon}</span>
            <div>
              <p className="text-sm font-black text-slate-900">{label}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
      >
        Skip guide — I already have my files →
      </button>
    </div>
  );
}

function GuideStage({
  steps,
  currentStep,
  totalOffset = 0,
  nextLabel = 'Next',
  onNext,
  onBack,
}: {
  steps: { icon: string; title: string; body: string }[];
  currentStep: number;
  totalOffset?: number;
  nextLabel?: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const step = steps[currentStep] ?? steps[0]!;
  const totalSteps = totalOffset + steps.length;
  const displayStep = totalOffset + currentStep + 1;

  return (
    <div className="space-y-6">
      {/* Progress dots — across all steps */}
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === totalOffset + currentStep
                ? 'w-6 bg-slate-950'
                : i < totalOffset + currentStep
                ? 'w-1.5 bg-slate-400'
                : 'w-1.5 bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-cyan-950/10 bg-slate-50 p-6 text-center">
        <div className="mb-4 text-5xl">{step.icon}</div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
          Step {displayStep} of {totalSteps}
        </p>
        <h4 className="mb-3 text-lg font-black text-slate-950">{step.title}</h4>
        <p className="text-sm leading-6 text-slate-600">{step.body}</p>
      </div>

      {/* Nav */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-full border border-cyan-950/15 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-[2] rounded-full bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

function BranchStage({
  onSelect,
  onBack,
}: {
  onSelect: (path: ExportPath) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h4 className="text-lg font-black text-slate-950">Which export option do you see?</h4>
        <p className="mt-1 text-sm text-slate-500">Choose the path that matches what Instagram is showing you.</p>
      </div>

      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => onSelect('device')}
          className="flex items-start gap-4 rounded-2xl border-2 border-cyan-950/10 bg-slate-50 p-5 text-left transition hover:border-slate-950 hover:bg-white"
        >
          <span className="mt-0.5 text-3xl">📲</span>
          <div>
            <p className="font-black text-slate-950">Export to device</p>
            <p className="mt-1 text-sm text-slate-500">
              Download a ZIP file to your phone or computer, then upload it here. Ready in minutes.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('drive')}
          className="flex items-start gap-4 rounded-2xl border-2 border-cyan-950/10 bg-slate-50 p-5 text-left transition hover:border-slate-950 hover:bg-white"
        >
          <span className="mt-0.5 text-3xl">☁️</span>
          <div>
            <p className="font-black text-slate-950">Export to external service</p>
            <p className="mt-1 text-sm text-slate-500">
              Send your data directly to Google Drive and let us sync it automatically — no more manual uploads.
            </p>
            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
              <p className="font-bold mb-1">⏱ How long Drive exports take</p>
              <p>• First export: up to 2 days</p>
              <p>• Subsequent daily exports: 1 day or less</p>
              <p className="mt-2 text-amber-700">
                <strong>Tip:</strong> After setting up Drive, also do a one-time &quot;Export to device&quot; upload below — it gives you immediate results while waiting for Drive to deliver your first export.
              </p>
            </div>
          </div>
        </button>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-full border border-cyan-950/15 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-slate-400"
      >
        Back
      </button>
    </div>
  );
}

const TARGET_FILES = [
  { key: 'followers', label: 'Followers file', desc: 'followers_*.html or followers_*.json', required: true },
  { key: 'following', label: 'Following file', desc: 'following.html or following.json', required: true },
  { key: 'recently', label: 'Recently unfollowed', desc: 'recently_unfollowed_profiles.html, optional', required: false },
];

// Instagram ZIP filename format: instagram-{username}-YYYY-MM-DD-{hash}.zip
// Usernames can't contain hyphens so the date pattern is an unambiguous boundary.
function detectHandleFromZipName(filename: string): string | null {
  const m = filename.match(/^instagram-([a-z0-9._]{1,30})-\d{4}-\d{2}-\d{2}-[a-z0-9]+\.zip$/i);
  return m ? m[1]!.toLowerCase() : null;
}

function UploadStage({
  fileRef,
  uploading,
  error,
  onUpload,
  onStartGuide,
  handle,
  onHandleChange,
  hasExistingAccounts,
  onCancel,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
  error: string | null;
  onUpload: () => void;
  onStartGuide?: () => void;
  handle: string;
  onHandleChange: (v: string) => void;
  hasExistingAccounts: boolean;
  onCancel?: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const folderRef = useRef<HTMLInputElement>(null);

  const syncFileNames = (fileList: FileList | null) => {
    setSelectedFiles(fileList ? Array.from(fileList).map((f) => f.webkitRelativePath || f.name) : []);
    // Auto-detect handle from ZIP filename; only override if not already known
    if (fileList) {
      const zip = Array.from(fileList).find((f) => f.name.toLowerCase().endsWith('.zip'));
      if (zip) {
        const detected = detectHandleFromZipName(zip.name);
        if (detected) onHandleChange(detected);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!fileRef.current) return;
    const dt = new DataTransfer();
    for (const file of Array.from(e.dataTransfer.files)) {
      dt.items.add(file);
    }
    fileRef.current.files = dt.files;
    syncFileNames(dt.files);
  };

  const selectedBaseNames = selectedFiles.map((name) => name.split('/').at(-1) ?? name);
  const hasFollowers = selectedBaseNames.some((name) => /^followers_?\d*\.(html|json)$/i.test(name));
  const hasFollowing = selectedBaseNames.some((name) => /^following\.(html|json)$/i.test(name));
  const hasRecently = selectedBaseNames.some((name) => /^recently_unfollowed_profiles\.html$/i.test(name));
  const recognizedSelected = selectedFiles.filter((name) =>
    /^followers_?\d*\.(html|json)$/i.test(name.split('/').at(-1) ?? name) ||
    /^following\.(html|json)$/i.test(name.split('/').at(-1) ?? name) ||
    /^recently_unfollowed_profiles\.html$/i.test(name.split('/').at(-1) ?? name)
  );
  const unrecognizedSelected = selectedFiles.filter((name) => !recognizedSelected.includes(name));

  return (
    <div className="space-y-5">
      {/* Detected account badge */}
      {handle && (
        <div className="flex items-center gap-1.5 rounded-xl border border-cyan-950/10 bg-slate-50 px-3 py-2">
          <span className="text-xs text-slate-400">Uploading for</span>
          <span className="text-xs font-black text-slate-800">@{handle}</span>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-xl border border-cyan-950/10 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500 mb-3">Upload the small follower folder</p>
        <ol className="space-y-2">
          {[
            'Unzip the file Instagram emailed you',
            <>Open <code className="bg-white border border-slate-200 rounded px-1 text-xs">connections/followers_and_following</code></>,
            'Upload that small folder, or select the files inside it',
            'HTML and JSON both work. Photos, videos, messages, and media are not needed.',
          ].map((step, i) => (
            <li key={i} className="flex gap-2.5 text-xs text-slate-600 font-medium">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-white font-black text-[9px]">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-3 space-y-1">
          {TARGET_FILES.map((f) => {
            const selected =
              f.key === 'followers' ? hasFollowers :
              f.key === 'following' ? hasFollowing :
              hasRecently;
            return (
              <div key={f.key} className="flex items-center gap-2">
                <span className={`text-xs font-bold ${selected ? 'text-green-600' : 'text-slate-400'}`}>
                  {selected ? '✓' : '○'}
                </span>
                <span className={`text-xs font-bold ${selected ? 'text-slate-800' : 'text-slate-500'}`}>{f.label}</span>
                <span className="text-xs text-slate-400">— {f.desc}{f.required ? '' : ''}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => folderRef.current?.click()}
          className="rounded-full border border-cyan-950/15 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
        >
          Select followers_and_following folder
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-cyan-950/15 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
        >
          Select files instead
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragging
            ? 'border-slate-950 bg-slate-50'
            : selectedFiles.length > 0
            ? 'border-green-400 bg-green-50/40'
            : 'border-cyan-950/20 bg-slate-50/50 hover:border-slate-400'
        }`}
      >
        <div className="text-3xl">{selectedFiles.length > 0 ? '✅' : '📂'}</div>
        {selectedFiles.length === 0 ? (
          <div>
            <p className="text-sm font-bold text-slate-700">Drop follower files here</p>
            <p className="text-xs text-slate-400">HTML or JSON accepted. The recently-unfollowed file is optional.</p>
          </div>
        ) : (
          <div className="w-full text-left space-y-1">
            {recognizedSelected.map((name) => (
              <p key={name} className="text-xs font-bold text-green-700">✓ {name}</p>
            ))}
            {unrecognizedSelected.map((name) => (
              <p key={name} className="text-xs font-medium text-slate-500">• {name}</p>
            ))}
            <p className="text-xs text-slate-400 pt-1">Click to change selection</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".zip,.json,.html,application/zip,application/x-zip-compressed,application/json,text/html"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => syncFileNames(e.target.files)}
        />
        <input
          ref={folderRef}
          type="file"
          multiple
          accept=".json,.html,application/json,text/html"
          className="hidden"
          onChange={(e) => {
            if (!fileRef.current) return;
            fileRef.current.files = e.target.files;
            syncFileNames(e.target.files);
          }}
          {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={onUpload}
        disabled={uploading || selectedFiles.length === 0}
        className="w-full rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {uploading ? 'Analysing…' : 'Analyse my data'}
      </button>

      {hasExistingAccounts && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
        >
          ← Back to my accounts
        </button>
      )}

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-cyan-950/10" />
        <span className="text-xs font-semibold text-slate-400">or connect automatically</span>
        <div className="h-px flex-1 bg-cyan-950/10" />
      </div>

      <GoogleDrivePanel />

      {onStartGuide && (
        <p className="text-center text-xs text-slate-400">
          Don&apos;t have your export yet?{' '}
          <button
            type="button"
            onClick={onStartGuide}
            className="font-bold text-slate-600 underline hover:text-slate-900"
          >
            See step-by-step guide →
          </button>
        </p>
      )}
    </div>
  );
}

function ResultsStage({
  result,
  isPro,
  handle,
  onUploadAnother,
}: {
  result: UploadResult;
  isPro: boolean;
  handle: string | null;
  onUploadAnother: () => void;
}) {
  const {
    diff,
    followerCount,
    followingCount,
    uploadedAt,
    recentlyUnfollowed,
    recentlyUnfollowedCount,
    ghostFollowing,
    ghostFollowingCount,
    fansNotFollowed = [],
    fansNotFollowedCount = 0,
    mutualCount = 0,
    followRatio = null,
    relationshipHealthScore,
    relationshipHealthLabel,
    relationshipInsights = [],
  } = result;
  const lostCount = diff?.lostCount ?? 0;
  const newCount = diff?.newCount ?? 0;
  const isFirst = diff === null;
  const unfollowedCount = recentlyUnfollowedCount ?? 0;
  const net = newCount - lostCount;
  // If the API returned names, treat as Pro regardless of prop timing (fixes race condition)
  const effectiveIsPro = isPro ||
    (diff?.lostFollowers?.length ?? 0) > 0 ||
    (diff?.newFollowers?.length ?? 0) > 0 ||
    recentlyUnfollowed.length > 0 ||
    (ghostFollowing?.length ?? 0) > 0 ||
    fansNotFollowed.length > 0;
  const fc = followerCount ?? 0;
  const fwc = followingCount ?? 0;
  const netTotal = fc - fwc;
  const maxBar = Math.max(fc, fwc, 1);
  const ghostCount = ghostFollowingCount ?? 0;
  const healthScore = relationshipHealthScore ?? null;

  return (
    <div className="space-y-4">

      {/* ── Dark overview panel ── */}
      <div className="rounded-2xl bg-slate-950 p-5">
        {/* Status row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-green-400">Tracking Active</span>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {new Date(uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
          <div>
            <p className="text-2xl font-black text-white tabular-nums">{fc.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Followers</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white tabular-nums">{fwc.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Following</p>
          </div>
          <div>
            <p className={`text-2xl font-black tabular-nums ${netTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {netTotal >= 0 ? '+' : ''}{netTotal.toLocaleString()}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Net ratio</p>
          </div>
          {ghostCount > 0 && (
            <div>
              <p className="text-2xl font-black text-amber-400 tabular-nums">{ghostCount.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Not following back</p>
            </div>
          )}
        </div>

        {/* Ratio bars */}
        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Followers</span>
              <span className="text-[10px] text-slate-600">{fc.toLocaleString()}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-cyan-500 transition-all duration-700" style={{ width: `${(fc / maxBar) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Following</span>
              <span className="text-[10px] text-slate-600">{fwc.toLocaleString()}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-slate-500 transition-all duration-700" style={{ width: `${(fwc / maxBar) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <RelationshipHealthPanel
        score={healthScore}
        label={relationshipHealthLabel}
        followerCount={fc}
        followingCount={fwc}
        mutualCount={mutualCount}
        ghostCount={ghostCount}
        fansNotFollowedCount={fansNotFollowedCount}
        followRatio={followRatio}
        insights={relationshipInsights}
      />

      {/* ── First upload: baseline card ── */}
      {isFirst && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg">🎯</div>
            <div>
              <p className="font-black text-indigo-900">Baseline established</p>
              <p className="mt-1 text-sm leading-relaxed text-indigo-600">
                Your snapshot is saved. Upload again in a few days and we&apos;ll show you exactly who followed or unfollowed you since today.
              </p>
              <p className="mt-2.5 text-xs font-bold text-indigo-400">
                Tip: You can request a new Instagram export anytime from Account Center.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Diff: KPI cards + chart + lists ── */}
      <>
          {/* 3 KPI cards — always shown; zeroes on first upload */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Unfollowed You', value: lostCount, bg: 'bg-red-50', border: 'border-red-100', num: 'text-red-600', sub: 'text-red-400', icon: '↓' },
              { label: 'New Followers', value: newCount, bg: 'bg-green-50', border: 'border-green-100', num: 'text-green-600', sub: 'text-green-400', icon: '↑' },
              { label: 'You Unfollowed', value: unfollowedCount, bg: 'bg-amber-50', border: 'border-amber-100', num: 'text-amber-600', sub: 'text-amber-400', icon: '→' },
            ].map(({ label, value, bg, border, num, sub, icon }) => (
              <div key={label} className={`rounded-xl border p-3 ${bg} ${border}`}>
                <p className={`text-[10px] font-black uppercase tracking-wide ${sub} mb-1`}>{icon}</p>
                <p className={`text-2xl font-black tabular-nums leading-none ${num}`}>{value}</p>
                <p className={`text-[10px] font-bold mt-1.5 leading-tight ${num} opacity-70`}>{label}</p>
              </div>
            ))}
          </div>

          {/* Change chart */}
          {(lostCount > 0 || newCount > 0) && (
            <div className="rounded-xl border border-cyan-950/10 bg-white p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Change This Period</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${
                  net > 0 ? 'bg-green-100 text-green-700' : net < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {net > 0 ? '↑' : net < 0 ? '↓' : '→'} {net > 0 ? '+' : ''}{net} net
                </span>
              </div>
              {[
                { label: 'Unfollowed you', value: lostCount, bar: 'bg-red-400', text: 'text-red-600' },
                { label: 'New followers', value: newCount, bar: 'bg-green-400', text: 'text-green-600' },
              ].map(({ label, value, bar, text }) => {
                const maxChange = Math.max(lostCount, newCount, 1);
                return (
                  <div key={label} className="flex items-center gap-3 mb-2.5 last:mb-0">
                    <span className="text-xs font-medium text-slate-500 w-24 shrink-0">{label}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${(value / maxChange) * 100}%` }} />
                    </div>
                    <span className={`text-sm font-black tabular-nums w-5 text-right ${text}`}>{value}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Detail lists */}
          {effectiveIsPro ? (
            <div className="space-y-3">
              {diff!.lostFollowers.length > 0 && (
                <DiffSection title="Unfollowed you" people={diff!.lostFollowers} emptyText="" variant="lost" />
              )}
              {diff!.newFollowers.length > 0 && (
                <DiffSection title="New followers" people={diff!.newFollowers} emptyText="" variant="new" />
              )}
              {recentlyUnfollowed.length > 0 && (
                <YouUnfollowedSection people={recentlyUnfollowed} />
              )}
              {ghostCount > 0 && (
                <GhostFollowingSection people={ghostFollowing ?? []} count={ghostCount} />
              )}
              {fansNotFollowedCount > 0 && (
                <FansNotFollowedSection people={fansNotFollowed} count={fansNotFollowedCount} />
              )}
            </div>
          ) : (
            <PaywallNames lostCount={lostCount} newCount={newCount} unfollowedCount={unfollowedCount} ghostCount={ghostCount} fansNotFollowedCount={fansNotFollowedCount} />
          )}
        </>

      {/* ── First upload notice (replaces detail lists until 2nd upload) ── */}
      {isFirst && (
        <div className="rounded-xl border border-cyan-950/10 bg-slate-50 px-4 py-3 flex items-start gap-3">
          <span className="text-base mt-0.5">📂</span>
          <div>
            <p className="text-sm font-black text-slate-950">This is your baseline snapshot</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Upload your export again in a few days and we&apos;ll show you exactly who followed and unfollowed you in between.
            </p>
          </div>
        </div>
      )}

      {/* ── Recently unfollowed + ghost following (available from first upload) ── */}
      <div className="space-y-3">
        {unfollowedCount > 0 && (
          effectiveIsPro && recentlyUnfollowed.length > 0
            ? <YouUnfollowedSection people={recentlyUnfollowed} />
            : (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-800">You recently unfollowed {unfollowedCount} {unfollowedCount === 1 ? 'account' : 'accounts'}</p>
                {!effectiveIsPro && <p className="mt-1 text-xs text-amber-600">Upgrade to Pro to see who</p>}
              </div>
            )
        )}
        {ghostCount > 0 && effectiveIsPro && (
          <GhostFollowingSection people={ghostFollowing ?? []} count={ghostCount} />
        )}
        {fansNotFollowedCount > 0 && effectiveIsPro && (
          <FansNotFollowedSection people={fansNotFollowed} count={fansNotFollowedCount} />
        )}
        {ghostCount > 0 && !effectiveIsPro && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-800">{ghostCount.toLocaleString()} accounts don&apos;t follow you back</p>
            <p className="mt-1 text-xs text-slate-500">Upgrade to Pro to see who and clean up your following list.</p>
          </div>
        )}
        {fansNotFollowedCount > 0 && !effectiveIsPro && (
          <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-sm font-black text-cyan-900">{fansNotFollowedCount.toLocaleString()} followers are fans you do not follow back</p>
            <p className="mt-1 text-xs text-cyan-700">Upgrade to Pro to see the accounts and decide who to engage.</p>
          </div>
        )}
      </div>

      {/* ── CSV exports ── */}
      <ExportSection
        uploadId={result.uploadId}
        isPro={effectiveIsPro}
        hasFollowing={!!followingCount}
        hasDiff={!isFirst}
      />

      {/* ── Growth history chart ── */}
      <FollowerHistoryChart handle={handle} />

      {/* ── Upload another ── */}
      <button
        type="button"
        onClick={onUploadAnother}
        className="w-full rounded-full border border-cyan-950/15 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
      >
        Upload next snapshot →
      </button>
    </div>
  );
}

function RelationshipHealthPanel({
  score,
  label,
  followerCount,
  followingCount,
  mutualCount,
  ghostCount,
  fansNotFollowedCount,
  followRatio,
  insights,
}: {
  score: number | null;
  label?: string;
  followerCount: number;
  followingCount: number;
  mutualCount: number;
  ghostCount: number;
  fansNotFollowedCount: number;
  followRatio: number | null;
  insights: string[];
}) {
  return (
    <div className="rounded-2xl border border-cyan-950/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Relationship health</p>
          <h4 className="mt-1 text-xl font-black text-slate-950">
            {score === null ? 'Snapshot intelligence' : `${score}/100 ${label ?? 'score'}`}
          </h4>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Based on followers, following, mutuals, and cleanup opportunities.
          </p>
        </div>
        <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
          {followRatio === null ? 'No ratio' : `${followRatio.toFixed(1)}x following ratio`}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniMetric label="Mutuals" value={mutualCount} />
        <MiniMetric label="Not following back" value={ghostCount} />
        <MiniMetric label="Fans not followed" value={fansNotFollowedCount} />
        <MiniMetric label="Net audience" value={followerCount - followingCount} signed />
      </div>

      {insights.length > 0 && (
        <div className="mt-4 space-y-2">
          {insights.map((insight) => (
            <p key={insight} className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
              {insight}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniMetric({ label, value, signed = false }: { label: string; value: number; signed?: boolean }) {
  return (
    <div className="rounded-lg border border-cyan-950/10 bg-slate-50 p-3">
      <p className="text-lg font-black text-slate-950">
        {signed && value > 0 ? '+' : ''}{value.toLocaleString()}
      </p>
      <p className="mt-1 text-[10px] font-black uppercase leading-tight text-slate-400">{label}</p>
    </div>
  );
}

function YouUnfollowedSection({ people }: { people: Person[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? people : people.slice(0, 5);
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-amber-700">You recently unfollowed</p>
        <span className="text-xs font-bold text-amber-500">{people.length}</span>
      </div>
      <ul className="space-y-1.5">
        {shown.map((p) => (
          <li key={p.handle} className="text-xs text-slate-700">
            <a href={`https://instagram.com/${p.handle}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
              @{p.handle}
            </a>
          </li>
        ))}
      </ul>
      {people.length > 5 && (
        <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-2 text-xs text-amber-600 hover:text-amber-800">
          {expanded ? 'Show less' : `Show all ${people.length}`}
        </button>
      )}
    </div>
  );
}

function GoogleDrivePanel() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    void (async () => {
      setStatus('loading');
      try {
        const res = await fetch('/api/drive/status');
        const data = (await res.json()) as { connected: boolean; lastSync: string | null };
        setStatus(data.connected ? 'connected' : 'idle');
        setLastSync(data.lastSync);
      } catch {
        setStatus('idle');
      }
    })();
  }, []);

  const handleDisconnect = async () => {
    await fetch('/api/drive/disconnect', { method: 'DELETE' });
    setStatus('idle');
    setLastSync(null);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/drive/sync', { method: 'POST' });
      const data = (await res.json()) as { status: string; lastSync?: string };
      if (data.status === 'synced') setLastSync(new Date().toISOString());
    } finally {
      setSyncing(false);
    }
  };

  if (status === 'loading') return null;

  if (status === 'connected') {
    return (
      <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div>
              <p className="text-sm font-black text-green-800">Google Drive connected</p>
              {lastSync && (
                <p className="text-xs text-green-600">
                  Last synced {new Date(lastSync).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="rounded-full border border-green-200 bg-white px-3 py-1.5 text-xs font-bold text-green-700 transition hover:border-green-400 disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="rounded-full border border-green-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:border-red-300 hover:text-red-600"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-950/10 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-2xl">☁️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-950">Skip the upload — use Google Drive</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Set Instagram to export daily to Google Drive, connect once, and we&apos;ll sync your data automatically every day.
          </p>
        </div>
      </div>
      <Link
        href="/api/drive/connect"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-950/15 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
      >
        <svg className="h-4 w-4" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5L6.6 66.85z" fill="#0066DA"/>
          <path d="M43.65 25L29.9 1.2C28.55.4 27 0 25.45 0 23.9 0 22.35.4 21 1.2L6.6 66.85l16.75-29.1L43.65 25z" fill="#00AC47"/>
          <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.75L73.55 76.8z" fill="#EA4335"/>
          <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2L43.65 25z" fill="#00832D"/>
          <path d="M59.75 53H27.55L13.8 76.8c1.35.8 2.9 1.2 4.45 1.2h50.8c1.55 0 3.1-.4 4.45-1.2L59.75 53z" fill="#2684FC"/>
          <path d="M73.4 26.65l-7.35-12.7c-.8-1.4-1.95-2.5-3.3-3.3L49 25l16.75 29.1 16.75-29.1c-.8-1.4-1.2-2.95-1.2-4.5z" fill="#FFBA00"/>
        </svg>
        Connect Google Drive
      </Link>
    </div>
  );
}

function GhostFollowingSection({ people, count }: { people: Person[]; count: number }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? people : people.slice(0, 5);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Not following you back</p>
        <span className="text-xs font-bold text-slate-400">{count.toLocaleString()}</span>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        You follow these accounts but they don&apos;t follow you back. Unfollowing them can improve your reach.
      </p>
      {people.length > 0 && (
        <>
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
                {p.displayName && <span className="ml-1 text-slate-400">{p.displayName}</span>}
              </li>
            ))}
          </ul>
          {count > 5 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 text-xs text-slate-500 transition hover:text-slate-700"
            >
              {expanded ? 'Show less' : `Show all ${count.toLocaleString()}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function FansNotFollowedSection({ people, count }: { people: Person[]; count: number }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? people : people.slice(0, 5);
  return (
    <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-cyan-900">Fans you do not follow back</p>
        <span className="text-xs font-bold text-cyan-600">{count.toLocaleString()}</span>
      </div>
      <p className="mb-3 text-xs text-cyan-700">
        These followers already chose you. They can be good candidates for engagement, replies, or relationship building.
      </p>
      {people.length > 0 && (
        <>
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
                {p.displayName && <span className="ml-1 text-slate-400">{p.displayName}</span>}
              </li>
            ))}
          </ul>
          {count > 5 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 text-xs text-cyan-700 transition hover:text-cyan-900"
            >
              {expanded ? 'Show less' : `Show all ${count.toLocaleString()}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function PaywallNames({
  lostCount,
  newCount,
  unfollowedCount = 0,
  ghostCount = 0,
  fansNotFollowedCount = 0,
}: {
  lostCount: number;
  newCount: number;
  unfollowedCount?: number;
  ghostCount?: number;
  fansNotFollowedCount?: number;
}) {
  const total = lostCount + newCount + unfollowedCount + ghostCount + fansNotFollowedCount;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-950/10">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none p-4 opacity-30 blur-sm">
        <p className="mb-2 text-xs font-bold text-red-600">Unfollowed you ({lostCount})</p>
        {Array.from({ length: Math.min(lostCount, 3) }).map((_, i) => (
          <p key={i} className="mb-1 text-xs text-slate-700">@{'█'.repeat(6 + (i % 4))}</p>
        ))}
        <p className="mb-2 mt-3 text-xs font-bold text-green-600">New followers ({newCount})</p>
        {Array.from({ length: Math.min(newCount, 3) }).map((_, i) => (
          <p key={i} className="mb-1 text-xs text-slate-700">@{'█'.repeat(5 + (i % 5))}</p>
        ))}
        {unfollowedCount > 0 && (
          <>
            <p className="mb-2 mt-3 text-xs font-bold text-amber-600">You unfollowed ({unfollowedCount})</p>
            {Array.from({ length: Math.min(unfollowedCount, 2) }).map((_, i) => (
              <p key={i} className="mb-1 text-xs text-slate-700">@{'█'.repeat(7 + (i % 3))}</p>
            ))}
          </>
        )}
        {ghostCount > 0 && (
          <>
            <p className="mb-2 mt-3 text-xs font-bold text-slate-600">Not following back ({ghostCount})</p>
            {Array.from({ length: Math.min(ghostCount, 2) }).map((_, i) => (
              <p key={i} className="mb-1 text-xs text-slate-700">@{'█'.repeat(8 + (i % 3))}</p>
            ))}
          </>
        )}
        {fansNotFollowedCount > 0 && (
          <>
            <p className="mb-2 mt-3 text-xs font-bold text-cyan-700">Fans not followed ({fansNotFollowedCount})</p>
            {Array.from({ length: Math.min(fansNotFollowedCount, 2) }).map((_, i) => (
              <p key={i} className="mb-1 text-xs text-slate-700">@{'█'.repeat(7 + (i % 4))}</p>
            ))}
          </>
        )}
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 p-6 text-center backdrop-blur-sm">
        <span className="text-2xl">🔒</span>
        <div>
          <p className="text-sm font-black text-slate-950">
            See all {total.toLocaleString()} names
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Upgrade to Pro to see who unfollowed you, new followers, accounts you stopped following, and who isn&apos;t following you back.
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-5 py-2 text-sm font-black text-white transition hover:bg-slate-800"
        >
          Upgrade to Pro
        </Link>
      </div>
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
    <div className={`rounded-xl border p-4 ${bgClass}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className={`text-sm font-semibold ${colorClass}`}>{title}</p>
        {people.length > 0 && (
          <span className={`text-xs font-medium ${countColorClass}`}>{people.length}</span>
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

function ExportSection({
  uploadId,
  isPro,
  hasFollowing,
  hasDiff,
}: {
  uploadId: string;
  isPro: boolean;
  hasFollowing: boolean;
  hasDiff: boolean;
}) {
  const exports = [
    {
      type: 'followers' as const,
      icon: '👥',
      label: 'Followers list',
      desc: 'Every account that follows you, as CSV',
      available: true,
    },
    {
      type: 'following' as const,
      icon: '➡️',
      label: 'Following list',
      desc: 'Every account you follow, as CSV',
      available: hasFollowing,
    },
    {
      type: 'diff' as const,
      icon: '📊',
      label: 'Changes report',
      desc: 'Who followed and unfollowed since last upload',
      available: hasDiff,
    },
  ].filter((e) => e.available);

  return (
    <div className="rounded-2xl border border-cyan-950/10 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-cyan-950/10 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base">⬇️</span>
          <p className="text-sm font-black text-slate-950">Export your data</p>
        </div>
        <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-black text-teal-800">PRO</span>
      </div>

      {isPro ? (
        <div className="p-4 space-y-2">
          <p className="text-xs text-slate-500 mb-3">
            Download your follower data as CSV — import into Excel, Sheets, or any analytics tool.
          </p>
          {exports.map(({ type, icon, label, desc }) => (
            <a
              key={type}
              href={downloadHref(uploadId, type)}
              className="flex items-center gap-3 rounded-xl border border-cyan-950/10 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white group"
            >
              <span className="text-xl shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-950">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <span className="text-xs font-bold text-teal-700 group-hover:text-teal-600 shrink-0">
                CSV ↓
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="p-5">
          <p className="text-sm text-slate-600 mb-4">
            Export any snapshot as a CSV file — import into Excel, Google Sheets, or your own analytics.
          </p>
          <div className="space-y-2 mb-5">
            {exports.map(({ icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-cyan-950/10 bg-slate-50 px-4 py-3 opacity-50">
                <span className="text-xl shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-950">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <span className="text-xs font-bold text-slate-300 shrink-0">🔒</span>
              </div>
            ))}
          </div>
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Unlock CSV exports — Upgrade to Pro
          </Link>
          <p className="mt-2.5 text-center text-xs text-slate-400">
            Also unlocks full unfollower names, ghost following list, and multi-account tracking.
          </p>
        </div>
      )}
    </div>
  );
}

function downloadHref(exportId: string, type: 'followers' | 'following' | 'diff'): string {
  return `/api/exports/${exportId}/download?type=${type}&format=csv`;
}
