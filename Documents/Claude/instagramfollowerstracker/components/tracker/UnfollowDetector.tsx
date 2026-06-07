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
  newCount: number;
  lostCount: number;
}

interface UploadResult {
  uploadId: string;
  followerCount: number | null;
  followingCount: number | null;
  uploadedAt: string;
  diff: DiffResult | null;
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
    title: 'Choose JSON format',
    body: 'Tap "Format" and set it to JSON (not HTML), then tap "Save". Next tap "Start export" — Instagram may ask for your password. Enter it and tap "Continue". Instagram will email you a download link (a few minutes up to 48 hours).',
  },
  {
    icon: '📧',
    title: 'Download the ZIP',
    body: 'Instagram will email you when the download is ready. Open the email, download the ZIP file to your phone or computer, then come back here and upload it.',
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
    title: 'Choose JSON format',
    body: 'Click "Format" and set it to JSON (not HTML), then click "Save" → click "Start export". You may be prompted to re-enter your password. Instagram will then email you a download link within minutes (up to 48 hours).',
  },
  {
    icon: '📧',
    title: 'Download the ZIP',
    body: 'Instagram will email you when the download is ready. Open the email, download the ZIP file, then come back here and upload it.',
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
    title: 'Choose Date Range & JSON format',
    body: 'Tap "Date range" → check "All time" → tap "Save". Tap "Format" and set it to JSON (not HTML), then tap "Save" → tap "Start export". You may be prompted to re-enter your password. Instagram will begin transferring your data to Google Drive and will email you within minutes (up to 48 hours).',
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
    title: 'Choose Date Range & JSON format',
    body: 'Click "Date range" → check "All time" → click "Save". Click "Format" and set it to JSON (not HTML), then click "Save" → click "Start export". You may be prompted to re-enter your password. Instagram will begin transferring your data to Google Drive and will email you within minutes (up to 48 hours).',
  },
];

export function UnfollowDetector({ userPlan }: UnfollowDetectorProps) {
  const isPro = userPlan !== 'FREE';

  const [stage, setStage] = useState<Stage>('upload');
  const [device, setDevice] = useState<Device | null>(null);
  const [exportPath, setExportPath] = useState<ExportPath | null>(null);
  const [guideStep, setGuideStep] = useState(0);
  const [pathStep, setPathStep] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleUpload = useCallback(async () => {
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
        setStage('results');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

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

      <div className="p-6">
        {stage === 'intro' && <IntroStage onStart={() => setStage('device')} />}

        {stage === 'device' && (
          <DeviceStage
            onSelect={(d) => {
              setDevice(d);
              setGuideStep(0);
              setStage('guide');
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

        {stage === 'syncing' && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
            <p className="text-sm font-bold text-slate-700">Syncing from Google Drive…</p>
            <p className="text-xs text-slate-400">This usually takes a few seconds.</p>
          </div>
        )}

        {stage === 'upload' && (
          <UploadStage
            fileRef={fileRef}
            uploading={uploading}
            error={error}
            onUpload={handleUpload}
            onStartGuide={() => setStage('device')}
          />
        )}

        {stage === 'results' && result && (
          <ResultsStage
            result={result}
            isPro={isPro}
            onUploadAnother={() => {
              setResult(null);
              setError(null);
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

function DeviceStage({ onSelect }: { onSelect: (d: Device) => void }) {
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

function UploadStage({
  fileRef,
  uploading,
  error,
  onUpload,
  onStartGuide,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
  error: string | null;
  onUpload: () => void;
  onStartGuide?: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || !fileRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    fileRef.current.files = dt.files;
    setFileName(file.name);
  };

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-base font-black text-slate-950">Upload your Instagram export</h4>
        <p className="mt-1 text-sm text-slate-500">
          Upload the ZIP file Instagram emailed you. We accept the full ZIP or just <strong>followers_1.json</strong>.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragging
            ? 'border-slate-950 bg-slate-50'
            : 'border-cyan-950/20 bg-slate-50/50 hover:border-slate-400'
        }`}
      >
        <div className="text-3xl">📂</div>
        <div>
          <p className="text-sm font-bold text-slate-700">
            {fileName ?? 'Drop your ZIP or JSON here'}
          </p>
          <p className="text-xs text-slate-400">or click to browse</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,.json,application/zip,application/x-zip-compressed,application/json"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={onUpload}
        disabled={uploading}
        className="w-full rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {uploading ? 'Analysing…' : 'Analyse my data'}
      </button>

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
  onUploadAnother,
}: {
  result: UploadResult;
  isPro: boolean;
  onUploadAnother: () => void;
}) {
  const { diff, followerCount, followingCount, uploadedAt } = result;

  const lostCount = diff?.lostCount ?? 0;
  const newCount = diff?.newCount ?? 0;
  const isFirst = diff === null;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">
          {formatCount(followerCount)} followers · {formatCount(followingCount)} following
        </p>
        <p className="text-xs text-slate-400">{new Date(uploadedAt).toLocaleDateString()}</p>
      </div>

      {isFirst ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-sm font-black text-blue-800">First upload saved!</p>
          <p className="mt-1 text-sm text-blue-600">
            Upload again in a few days to see exactly who followed or unfollowed you.
          </p>
        </div>
      ) : (
        <>
          {/* Stat cards — visible to everyone */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              value={lostCount}
              label="Unfollowed you"
              color="red"
            />
            <StatCard
              value={newCount}
              label="New followers"
              color="green"
            />
          </div>

          {/* Names — gated for free users */}
          {isPro ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DiffSection
                title="Lost followers"
                people={diff!.lostFollowers}
                emptyText="No one unfollowed you"
                variant="lost"
              />
              <DiffSection
                title="New followers"
                people={diff!.newFollowers}
                emptyText="No new followers"
                variant="new"
              />
            </div>
          ) : (
            <PaywallNames
              lostCount={lostCount}
              newCount={newCount}
            />
          )}

          {/* CSV export for Pro */}
          {isPro && (
            <div className="flex flex-wrap gap-2 border-t border-cyan-950/10 pt-4">
              <a
                href={downloadHref(result.uploadId, 'followers')}
                className="inline-flex items-center rounded-full border border-cyan-950/10 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:text-slate-950"
              >
                Followers CSV
              </a>
              {followingCount && (
                <a
                  href={downloadHref(result.uploadId, 'following')}
                  className="inline-flex items-center rounded-full border border-cyan-950/10 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:text-slate-950"
                >
                  Following CSV
                </a>
              )}
              <a
                href={downloadHref(result.uploadId, 'diff')}
                className="inline-flex items-center rounded-full border border-cyan-950/10 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:text-slate-950"
              >
                Changes CSV
              </a>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={onUploadAnother}
        className="w-full rounded-full border border-cyan-950/15 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
      >
        Upload another export
      </button>
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

function StatCard({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: 'red' | 'green';
}) {
  const bg = color === 'red' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100';
  const text = color === 'red' ? 'text-red-700' : 'text-green-700';
  const num = color === 'red' ? 'text-red-600' : 'text-green-600';

  return (
    <div className={`rounded-xl border p-4 text-center ${bg}`}>
      <p className={`text-3xl font-black ${num}`}>{value}</p>
      <p className={`mt-1 text-xs font-semibold ${text}`}>{label}</p>
    </div>
  );
}

function PaywallNames({
  lostCount,
  newCount,
}: {
  lostCount: number;
  newCount: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-950/10">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none p-4 opacity-30 blur-sm">
        <p className="mb-2 text-xs font-bold text-red-600">Lost followers ({lostCount})</p>
        {Array.from({ length: Math.min(lostCount, 4) }).map((_, i) => (
          <p key={i} className="mb-1 text-xs text-slate-700">
            @{'█'.repeat(6 + (i % 4))}
          </p>
        ))}
        <p className="mb-2 mt-3 text-xs font-bold text-green-600">New followers ({newCount})</p>
        {Array.from({ length: Math.min(newCount, 3) }).map((_, i) => (
          <p key={i} className="mb-1 text-xs text-slate-700">
            @{'█'.repeat(5 + (i % 5))}
          </p>
        ))}
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 p-6 text-center backdrop-blur-sm">
        <span className="text-2xl">🔒</span>
        <div>
          <p className="text-sm font-black text-slate-950">
            See all {lostCount + newCount} names
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Upgrade to Pro to reveal who unfollowed you and your new followers.
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

function downloadHref(exportId: string, type: 'followers' | 'following' | 'diff'): string {
  return `/api/exports/${exportId}/download?type=${type}&format=csv`;
}

function formatCount(count: number | null): string {
  return typeof count === 'number' ? count.toLocaleString() : '0';
}
