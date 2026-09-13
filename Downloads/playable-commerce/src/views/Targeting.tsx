import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Clock3, Laptop, LayoutTemplate, Play, Smartphone, Target, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { TargetingRules } from '../types';

type Choice<T extends string> = { value: T; label: string };

function ChoiceGroup<T extends string>({ legend, value, options, onChange }: { legend: string; value: T; options: Choice<T>[]; onChange: (value: T) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-neutral-800">{legend}</legend>
      <div className={`grid gap-2 ${options.length === 4 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {options.map((option) => (
          <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-blue-100 ${value === option.value ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400'}`}>{option.label}</button>
        ))}
      </div>
    </fieldset>
  );
}

function RangeControl({ id, label, value, min, max, step = 1, suffix, onChange }: { id: string; label: string; value: number; min: number; max: number; step?: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-semibold text-neutral-800">{label}</label>
        <output htmlFor={id} className="rounded-md bg-neutral-100 px-2 py-1 text-sm font-bold tabular-nums text-neutral-700">{value}{suffix}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-11 w-full cursor-pointer accent-blue-600" />
      <div className="flex justify-between text-xs text-neutral-400" aria-hidden="true"><span>{min}{suffix}</span><span>{max}{suffix}</span></div>
    </div>
  );
}

export default function Targeting() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spec = state.gameSpec;
  const targeting = state.targeting;

  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
  }, []);

  if (!spec) {
    return (
      <div className="mx-auto flex min-h-full max-w-xl items-center px-4 py-12 text-center sm:px-8">
        <div className="w-full rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <Target className="mx-auto mb-4 size-10 text-neutral-400" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-neutral-950">Build an experience first</h1>
          <p className="mt-3 text-neutral-600">Targeting rules are attached to a finished game spec.</p>
          <Link to="/create" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white"><ArrowLeft className="mr-2 size-4" aria-hidden="true" />Create experience</Link>
        </div>
      </div>
    );
  }

  const update = (patch: Partial<TargetingRules>) => dispatch({ type: 'SET_TARGETING', payload: { ...targeting, ...patch } });

  const publish = () => {
    if (publishing || published) return;
    setPublishing(true);
    redirectTimer.current = setTimeout(() => {
      dispatch({ type: 'PUBLISH_EXPERIENCE' });
      setPublishing(false);
      setPublished(true);
      redirectTimer.current = setTimeout(() => navigate('/'), 1100);
    }, 700);
  };

  const placementLabels: Record<TargetingRules['placement'], string> = { popup: 'Popup', embedded: 'Embedded', exit_intent: 'Exit intent', cart: 'Cart' };
  const visitorLabels: Record<TargetingRules['visitorType'], string> = { all: 'All visitors', new: 'New visitors', returning: 'Returning visitors' };
  const deviceLabels: Record<TargetingRules['device'], string> = { all: 'All devices', mobile: 'Mobile', desktop: 'Desktop' };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Final step</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950">Targeting and delivery</h1>
        <p className="mt-2 max-w-2xl leading-7 text-neutral-600">Choose when <span className="font-semibold text-neutral-800">{spec.experience.name}</span> should appear and who should see it.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="delivery-heading">
            <div className="mb-6 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><LayoutTemplate className="size-5" aria-hidden="true" /></div><div><h2 id="delivery-heading" className="font-bold text-neutral-950">Placement</h2><p className="text-sm text-neutral-500">Where the experience enters the journey.</p></div></div>
            <ChoiceGroup legend="Experience placement" value={targeting.placement} options={[{ value: 'popup', label: 'Popup' }, { value: 'embedded', label: 'Embedded' }, { value: 'exit_intent', label: 'Exit intent' }, { value: 'cart', label: 'Cart' }]} onChange={(placement) => update({ placement })} />
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="audience-heading">
            <div className="mb-6 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><Users className="size-5" aria-hidden="true" /></div><div><h2 id="audience-heading" className="font-bold text-neutral-950">Audience</h2><p className="text-sm text-neutral-500">Limit delivery by visitor and device.</p></div></div>
            <div className="space-y-6">
              <ChoiceGroup legend="Visitor type" value={targeting.visitorType} options={[{ value: 'all', label: 'All' }, { value: 'new', label: 'New' }, { value: 'returning', label: 'Returning' }]} onChange={(visitorType) => update({ visitorType })} />
              <ChoiceGroup legend="Device" value={targeting.device} options={[{ value: 'all', label: 'All devices' }, { value: 'mobile', label: 'Mobile' }, { value: 'desktop', label: 'Desktop' }]} onChange={(device) => update({ device })} />
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="timing-heading">
            <div className="mb-6 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Clock3 className="size-5" aria-hidden="true" /></div><div><h2 id="timing-heading" className="font-bold text-neutral-950">Timing and frequency</h2><p className="text-sm text-neutral-500">Balance visibility with a respectful visit.</p></div></div>
            <div className="grid gap-7 sm:grid-cols-2">
              <RangeControl id="trigger-delay" label="Time on site" value={targeting.triggerDelay} min={0} max={60} suffix="s" onChange={(triggerDelay) => update({ triggerDelay })} />
              <RangeControl id="scroll-depth" label="Scroll depth" value={targeting.scrollDepth} min={0} max={100} step={5} suffix="%" onChange={(scrollDepth) => update({ scrollDepth })} />
              <div className="sm:col-span-2"><RangeControl id="frequency-cap" label="Show once every" value={targeting.frequencyCap} min={1} max={90} suffix=" days" onChange={(frequencyCap) => update({ frequencyCap })} /></div>
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:sticky lg:top-6" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="text-lg font-bold text-neutral-950">Launch summary</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-start gap-3"><LayoutTemplate className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" /><div><dt className="text-neutral-500">Placement</dt><dd className="mt-0.5 font-semibold text-neutral-900">{placementLabels[targeting.placement]}</dd></div></div>
            <div className="flex items-start gap-3"><Users className="mt-0.5 size-4 shrink-0 text-purple-600" aria-hidden="true" /><div><dt className="text-neutral-500">Audience</dt><dd className="mt-0.5 font-semibold text-neutral-900">{visitorLabels[targeting.visitorType]}</dd></div></div>
            <div className="flex items-start gap-3">{targeting.device === 'mobile' ? <Smartphone className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" /> : <Laptop className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />}<div><dt className="text-neutral-500">Device</dt><dd className="mt-0.5 font-semibold text-neutral-900">{deviceLabels[targeting.device]}</dd></div></div>
            <div className="flex items-start gap-3"><Clock3 className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" /><div><dt className="text-neutral-500">Trigger</dt><dd className="mt-0.5 font-semibold text-neutral-900">After {targeting.triggerDelay}s and {targeting.scrollDepth}% scroll</dd></div></div>
          </dl>

          <div className="my-6 border-t border-neutral-200" />
          <p className="text-sm leading-6 text-neutral-600">{state.store ? `Ready for ${state.store.storeName}.` : 'This prototype stores the active experience locally. Connect a store before production delivery.'}</p>
          <button type="button" onClick={publish} disabled={publishing || published} className={`mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition focus-visible:outline-none focus-visible:ring-4 ${published ? 'bg-emerald-600 focus-visible:ring-emerald-200' : 'bg-blue-600 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70 focus-visible:ring-blue-200'}`}>
            {published ? <Check className="mr-2 size-4" aria-hidden="true" /> : <Play className="mr-2 size-4" aria-hidden="true" />}
            {published ? 'Published' : publishing ? 'Publishing…' : 'Publish experience'}
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-neutral-500" role="status" aria-live="polite">{published ? 'Experience is active. Returning to the dashboard.' : 'You can keep editing after publishing.'}</p>
          <Link to="/editor" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-200"><ArrowLeft className="mr-2 size-4" aria-hidden="true" />Back to editor</Link>
        </aside>
      </div>
    </div>
  );
}
