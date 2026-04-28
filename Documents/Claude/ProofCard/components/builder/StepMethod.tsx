// components/builder/StepMethod.tsx
'use client'
import { useState } from 'react'
import type { BuilderState } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  state: BuilderState
  update: (patch: Partial<BuilderState>) => void
  onNext: () => void
  onBack: () => void
}

const HABIT_SUGGESTIONS = ['CONSISTENCY', 'PROTEIN', 'WALKING', 'HYDRATION', 'SLEEP', 'CARDIO', 'STRENGTH', 'FASTING']

export function StepMethod({ state, update, onNext, onBack }: Props) {
  const [habitInput, setHabitInput] = useState('')

  function toggleHabit(habit: string) {
    const has = state.habits.includes(habit)
    update({ habits: has ? state.habits.filter(h => h !== habit) : [...state.habits, habit] })
  }

  function addCustomHabit() {
    const h = habitInput.trim().toUpperCase()
    if (h && !state.habits.includes(h)) {
      update({ habits: [...state.habits, h] })
    }
    setHabitInput('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Method & habits</h2>
        <p className="text-sm text-gray-500 mt-1">Describe what drove your results.</p>
      </div>

      <div>
        <Label className="text-xs font-bold uppercase tracking-wide text-gray-500">Method Label</Label>
        <Input
          value={state.method}
          onChange={e => update({ method: e.target.value.toUpperCase() })}
          placeholder="ZEPBOUND, MOUNJARO, WEGOVY, etc."
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 block">Habits</Label>
        <div className="flex flex-wrap gap-2">
          {HABIT_SUGGESTIONS.map(h => (
            <button
              key={h}
              onClick={() => toggleHabit(h)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors
                ${state.habits.includes(h)
                  ? 'bg-[#23624d] text-white border-[#23624d]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#23624d]'}`}
            >
              {h}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <Input
            value={habitInput}
            onChange={e => setHabitInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomHabit()}
            placeholder="Custom habit..."
            className="flex-1"
          />
          <Button variant="outline" onClick={addCustomHabit}>Add</Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">← Back</Button>
        <Button onClick={onNext} disabled={!state.method} className="flex-1 bg-[#23624d] hover:bg-[#1a4a3a]">
          Continue →
        </Button>
      </div>
    </div>
  )
}
