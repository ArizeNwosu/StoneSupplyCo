import { DollarSign, Edit3, Gamepad2, Plus, TrendingUp, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext';
import { cyberbackpackSpec, splitflaskSpec } from '../data/demos';
import type { ExperienceStatus, GameSpec, TargetingRules } from '../types';

const chartData = [
  { day: 'Mon', revenue: 4000 },
  { day: 'Tue', revenue: 3000 },
  { day: 'Wed', revenue: 5000 },
  { day: 'Thu', revenue: 2780 },
  { day: 'Fri', revenue: 6890 },
  { day: 'Sat', revenue: 8390 },
  { day: 'Sun', revenue: 10490 },
];

type ExperienceRow = {
  id: string;
  name: string;
  placement: string;
  status: ExperienceStatus;
  metrics: { label: string; value: string }[];
  spec: GameSpec;
  targeting?: TargetingRules;
};

const demoExperiences: ExperienceRow[] = [
  {
    id: 'demo-splitflask',
    name: splitflaskSpec.experience.name,
    placement: 'Product page popup',
    status: 'active',
    metrics: [{ label: 'Play rate', value: '23.8%' }, { label: 'Revenue', value: '$4,318' }],
    spec: splitflaskSpec,
  },
  {
    id: 'demo-cyberbackpack',
    name: cyberbackpackSpec.experience.name,
    placement: 'Homepage popup',
    status: 'active',
    metrics: [{ label: 'Lead rate', value: '27.1%' }, { label: 'Revenue', value: '$3,150' }],
    spec: cyberbackpackSpec,
  },
];

const surfaceLabel: Record<GameSpec['experience']['surface'], string> = {
  popup: 'Popup',
  embedded: 'Embedded',
  exit_intent: 'Exit intent',
  cart: 'Cart',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const rows = state.experience
    ? [
        {
          id: state.experience.id,
          name: state.experience.name,
          placement: surfaceLabel[state.experience.targeting.placement],
          status: state.experience.status,
          metrics: [{ label: 'Plays', value: '—' }, { label: 'Revenue', value: '—' }],
          spec: state.experience.spec,
          targeting: state.experience.targeting,
        },
        ...demoExperiences,
      ]
    : demoExperiences;

  const edit = (experience: ExperienceRow) => {
    dispatch({ type: 'RESET_FLOW' });
    dispatch({ type: 'SET_GAME_SPEC', payload: experience.spec });
    if (experience.targeting) dispatch({ type: 'SET_TARGETING', payload: experience.targeting });
    navigate('/editor');
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 px-4 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Overview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950">Dashboard</h1>
          <p className="mt-2 text-neutral-600">Track your interactive conversion layer and edit live experiences.</p>
        </div>
        <Link to="/create" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
          <Plus className="mr-2 size-4" aria-hidden="true" />Create experience
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Performance summary">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4"><h2 className="text-sm font-semibold text-neutral-500">Attributed revenue</h2><span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><DollarSign className="size-5" aria-hidden="true" /></span></div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-neutral-950">$10,613</p>
          <p className="mt-2 flex items-center text-sm font-medium text-emerald-700"><TrendingUp className="mr-1.5 size-4" aria-hidden="true" />14.2% from last week</p>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4"><h2 className="text-sm font-semibold text-neutral-500">New leads captured</h2><span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Users className="size-5" aria-hidden="true" /></span></div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-neutral-950">2,789</p>
          <p className="mt-2 flex items-center text-sm font-medium text-emerald-700"><TrendingUp className="mr-1.5 size-4" aria-hidden="true" />5.4% from last week</p>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4"><h2 className="text-sm font-semibold text-neutral-500">Total game plays</h2><span className="flex size-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><Gamepad2 className="size-5" aria-hidden="true" /></span></div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-neutral-950">14,231</p>
          <p className="mt-2 text-sm text-neutral-500">Across the two demo campaigns</p>
        </article>
      </section>

      <section className="flex h-80 flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:h-96 sm:p-6" aria-labelledby="revenue-heading">
        <div className="mb-4"><h2 id="revenue-heading" className="text-lg font-bold text-neutral-950">Attributed revenue trend</h2><p className="mt-1 text-sm text-neutral-500">Static sample data for the current MVP dashboard.</p></div>
        <div className="min-h-0 flex-1" role="img" aria-label="Area chart showing attributed revenue rising from 4,000 dollars Monday to 10,490 dollars Sunday, with day-to-day variation">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
              <YAxis width={54} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value: number) => `$${value / 1000}k`} />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 10px 25px -10px rgb(0 0 0 / 0.2)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="url(#revenue-fill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm" aria-labelledby="experiences-heading">
        <div className="border-b border-neutral-200 px-5 py-5 sm:px-6"><h2 id="experiences-heading" className="text-lg font-bold text-neutral-950">Experiences</h2><p className="mt-1 text-sm text-neutral-500">Published work and playable demo brands.</p></div>
        <div className="divide-y divide-neutral-100">
          {rows.map((experience) => (
            <article key={experience.id} className="flex flex-col gap-5 p-5 transition hover:bg-neutral-50 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${experience.status === 'active' ? 'bg-emerald-500' : experience.status === 'draft' ? 'bg-amber-400' : 'bg-neutral-300'}`}><span className="sr-only">{experience.status}</span></span>
                <div className="min-w-0"><h3 className="truncate font-semibold text-neutral-950">{experience.name}</h3><p className="mt-1 text-sm text-neutral-500">{experience.placement} · <span className="capitalize">{experience.status}</span></p></div>
              </div>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 sm:flex-nowrap">
                {experience.metrics.map((metric) => <div key={metric.label} className="min-w-20"><p className="font-semibold tabular-nums text-neutral-900">{metric.value}</p><p className="mt-0.5 text-xs text-neutral-500">{metric.label}</p></div>)}
                <button type="button" onClick={() => edit(experience)} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"><Edit3 className="mr-2 size-4" aria-hidden="true" />Edit</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
