// components/builder/StepStats.tsx
'use client'
import type { BuilderState, Unit } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  state: BuilderState
  update: (patch: Partial<BuilderState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepStats({ state, update, onNext, onBack }: Props) {
  const canProceed = state.startWeight && state.currentWeight && state.goalWeight && state.startDate

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Your stats</h2>
        <p className="text-sm text-gray-500 mt-1">This powers the badge and stats section.</p>
      </div>

      {/* Unit toggle */}
      <div>
        <Label className="text-xs font-bold uppercase tracking-wide text-gray-500">Unit</Label>
        <div className="flex gap-2 mt-2">
          {(['lbs', 'kg'] as Unit[]).map(u => (
            <button
              key={u}
              onClick={() => update({ unit: u })}
              className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-colors
                ${state.unit === u ? 'bg-[#23624d] text-white border-[#23624d]' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {u.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Weight fields */}
      {[
        { label: 'Start Weight', key: 'startWeight' as const },
        { label: 'Current Weight', key: 'currentWeight' as const },
        { label: 'Goal Weight', key: 'goalWeight' as const },
      ].map(({ label, key }) => (
        <div key={key}>
          <Label className="text-xs font-bold uppercase tracking-wide text-gray-500">{label} ({state.unit})</Label>
          <Input
            type="number"
            value={state[key]}
            onChange={e => update({ [key]: e.target.value })}
            placeholder="0"
            className="mt-1"
          />
        </div>
      ))}

      {/* Start date */}
      <div>
        <Label className="text-xs font-bold uppercase tracking-wide text-gray-500">Journey Start Date</Label>
        <Input
          type="date"
          value={state.startDate}
          onChange={e => update({ startDate: e.target.value })}
          className="mt-1"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">← Back</Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1 bg-[#23624d] hover:bg-[#1a4a3a]">
          Continue →
        </Button>
      </div>
    </div>
  )
}
