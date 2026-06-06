'use client';

import { useCallback, useRef, useState } from 'react';
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

interface UnfollowDetectorProps {
  userPlan: 'FREE' | 'PRO' | 'AGENCY';
}

type Stage = 'intro' | 'device' | 'guide' | 'upload' | 'results';
type Device = 'phone' | 'desktop';

const PHONE_GUIDE_STEPS = [
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
    title: 'Your Activity',
    body: 'Scroll down and tap "Your information and permissions".',
  },
  {
    icon: '⬇️',
    title: 'Download your information',
    body: 'Tap "Download your information". If you see "Export your information" instead, tap that — it\'s the same thing.',
  },
  {
    icon: '✅',
    title: 'Create Export',
    body: 'Tap "Create export" → "Export to device" → check "Date range" → tap "All time" then "Save".',
  },
  {
    icon: '📄',
    title: 'Choose JSON format',
    body: 'Tap "Format" and set it to JSON (not HTML), then tap "Save". Next tap "Start export" — Instagram may ask for your password. Enter it and tap "Continue". You\'ll see the requested export and Instagram will email you a download link (a few minutes up to 48 hours).',
  },
  {
    icon: '📧',
    title: 'Download the ZIP',
    body: 'Instagram will email you when the download is ready. Open the email, download the ZIP file to your phone or computer, then come back here and upload it.',
  },
];

const DESKTOP_GUIDE_STEPS = [
  {
    icon: '💻',
    title: 'Go to Instagram.com',
    body: 'Open instagram.com in your browser and make sure you\'re signed in.',
  },
  {
    icon: '👤',
    title: 'Open Settings',
    body: 'Click your profile photo in the top-right corner, then click "Settings".',
  },
  {
    icon: '🕐',
    title: 'Your Activity',
    body: 'In the left sidebar, click "Your activity".',
  },
  {
    icon: '⬇️',
    title: 'Download your information',
    body: 'Click "Download your information". If you see "Export your information" instead, click that — it\'s the same thing.',
  },
  {
    icon: '✅',
    title: 'Select followers & following',
    body: 'Click "Download or transfer information" → "Some of your information" → check "Followers and following" → click "Download to device".',
  },
  {
    icon: '📄',
    title: 'Choose JSON format',
    body: 'Set the format to JSON (not HTML), then click "Create files". Instagram will email you a download link within minutes (up to 48 hours).',
  },
  {
    icon: '📧',
    title: 'Download the ZIP',
    body: 'Open the email from Instagram, download the ZIP file, then come back here and upload it below.',
  },
];

export function UnfollowDetector({ userPlan }: UnfollowDetectorProps) {
  const isPro = userPlan !== 'FREE';

  const [stage, setStage] = useState<Stage>(isPro ? 'upload' : 'intro');
  const [device, setDevice] = useState<Device | null>(null);
  const [guideStep, setGuideStep] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const guideSteps = device === 'desktop' ? DESKTOP_GUIDE_STEPS : PHONE_GUIDE_STEPS;
  const isLastGuideStep = guideStep === guideSteps.length - 1;

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
            steps={guideSteps}
            currentStep={guideStep}
            isLast={isLastGuideStep}
            onNext={() => {
              if (isLastGuideStep) {
                setStage('upload');
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

        {stage === 'upload' && (
          <UploadStage
            fileRef={fileRef}
            uploading={uploading}
            error={error}
            onUpload={handleUpload}
            onBack={isPro ? undefined : () => setStage('guide')}
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
  isLast,
  onNext,
  onBack,
}: {
  steps: typeof PHONE_GUIDE_STEPS;
  currentStep: number;
  isLast: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  const step = steps[currentStep] ?? steps[0]!;

  return (
    <div className="space-y-6">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === currentStep
                ? 'w-6 bg-slate-950'
                : i < currentStep
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
          Step {currentStep + 1} of {steps.length}
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
          {isLast ? 'Upload my file →' : 'Next'}
        </button>
      </div>
    </div>
  );
}

function UploadStage({
  fileRef,
  uploading,
  error,
  onUpload,
  onBack,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
  error: string | null;
  onUpload: () => void;
  onBack?: () => void;
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
      <div className="text-center">
        <h4 className="text-lg font-black text-slate-950">Upload your Instagram export</h4>
        <p className="mt-1 text-sm text-slate-500">
          Upload the ZIP file Instagram sent you. We accept the full ZIP or just <strong>followers_1.json</strong>.
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
            {fileName ?? 'Drop your ZIP here'}
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

      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-full border border-cyan-950/15 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-slate-400"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onUpload}
          disabled={uploading}
          className="flex-[2] rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {uploading ? 'Analysing…' : 'Analyse my data'}
        </button>
      </div>
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

  const lostCount = diff?.lostFollowers.length ?? 0;
  const newCount = diff?.newFollowers.length ?? 0;
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
