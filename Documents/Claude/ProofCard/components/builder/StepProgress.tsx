// components/builder/StepProgress.tsx
'use client'
import { useState } from 'react'
import type { BuilderState, WeightEntry } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  state: BuilderState
  update: (patch: Partial<BuilderState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepProgress({ state, update, onNext, onBack }: Props) {
  const [date, setDate] = useState('')
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')

  function addEntry() {
    if (!date || !weight) return
    const entry: WeightEntry = { date, weight: parseFloat(weight), note: note || undefined }
    const sorted = [...state.weightEntries, entry].sort((a, b) => a.date.localeCompare(b.date))
    update({ weightEntries: sorted })
    setDate('')
    setWeight('')
    setNote('')
  }

  function removeEntry(i: number) {
    const updated = state.weightEntries.filter((_, idx) => idx !== i)
    update({ weightEntries: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Progress log</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add your weight entries. These draw the chart. Minimum 2 entries needed.
        </p>
      </div>

      {/* Add entry form */}
      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide text-gray-500">Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide text-gray-500">Weight ({state.unit})</Label>
            <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0" className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs font-bold uppercase tracking-wide text-gray-500">Annotation (optional)</Label>
          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder='e.g. "Week 3 Plateau"'
            className="mt-1"
          />
        </div>
        <Button onClick={addEntry} disabled={!date || !weight} className="w-full bg-[#23624d] hover:bg-[#1a4a3a]">
          + Add Entry
        </Button>
      </div>

      {/* Entry list */}
      {state.weightEntries.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {state.weightEntries.map((entry, i) => (
            <div key={`${entry.date}-${entry.weight}`} className="flex items-center justify-between px-4 py-2 bg-white rounded-lg border border-gray-100 text-sm">
              <div>
                <span className="font-semibold">{entry.date}</span>
                <span className="text-gray-500 ml-3">{entry.weight} {state.unit}</span>
                {entry.note && <span className="text-[#23624d] ml-3 italic">{entry.note}</span>}
              </div>
              <button onClick={() => removeEntry(i)} className="text-gray-300 hover:text-red-400 ml-2">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">← Back</Button>
        <Button onClick={onNext} disabled={state.weightEntries.length < 2} className="flex-1 bg-[#23624d] hover:bg-[#1a4a3a]">
          Continue →
        </Button>
      </div>
    </div>
  )
}
