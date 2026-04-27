// components/builder/BuilderShell.tsx
'use client'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { BUILDER_DEFAULTS, type BuilderState } from '@/types'
import { ProofCard } from '@/components/ProofCard'
import type { CardData } from '@/types'

export type { BuilderState }
export type UpdateFn = (patch: Partial<BuilderState>) => void

function buildPreviewCard(state: BuilderState): CardData {
  return {
    unit: state.unit,
    startWeight: parseFloat(state.startWeight) || 0,
    currentWeight: parseFloat(state.currentWeight) || 0,
    goalWeight: parseFloat(state.goalWeight) || 0,
    startDate: state.startDate || new Date().toISOString().slice(0, 10),
    method: state.method || 'YOUR METHOD',
    habits: state.habits.length > 0 ? state.habits : ['CONSISTENCY'],
    beforePhotoUrl: state.beforePhotoPreview || '',
    afterPhotoUrl: state.afterPhotoPreview || '',
    weightEntries: state.weightEntries,
    watermarked: true,
  }
}

const STEP_LABELS = ['Photos', 'Stats', 'Progress', 'Method', 'Generate']

interface Props {
  renderStep: (state: BuilderState, update: UpdateFn) => ReactNode
}

export function BuilderShell({ renderStep }: Props) {
  const [state, setState] = useState<BuilderState>(BUILDER_DEFAULTS)

  function update(patch: Partial<BuilderState>) {
    setState(prev => ({ ...prev, ...patch }))
  }

  const previewCard = buildPreviewCard(state)

  return (
    <div className="flex min-h-screen bg-[#eef1f0]">
      {/* Left — form */}
      <div className="flex flex-col w-[520px] min-h-screen bg-white shadow-lg shrink-0">
        {/* Step indicator */}
        <div className="flex items-center px-8 pt-8 pb-6">
          {STEP_LABELS.map((label, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3 | 4 | 5
            const isActive = state.step === stepNum
            const isDone = state.step > stepNum
            return (
              <div key={label} className="flex items-center">
                <button
                  onClick={() => { if (isDone) update({ step: stepNum }) }}
                  className={[
                    'flex flex-col items-center gap-1 w-16 transition-all',
                    isActive ? 'opacity-100' : isDone ? 'opacity-70 cursor-pointer hover:opacity-100' : 'opacity-30',
                  ].join(' ')}
                >
                  <div className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    isActive ? 'bg-[#23624d] text-white' : isDone ? 'bg-[#5aaa7e] text-white' : 'bg-gray-200 text-gray-500',
                  ].join(' ')}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{label}</span>
                </button>
                {i < STEP_LABELS.length - 1 && (
                  <div className={['h-0.5 w-4 mb-5', state.step > stepNum ? 'bg-[#5aaa7e]' : 'bg-gray-200'].join(' ')} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {renderStep(state, update)}
        </div>
      </div>

      {/* Right — live preview */}
      <div className="flex-1 flex items-start justify-center pt-12 pb-12 overflow-hidden">
        <div style={{ transform: 'scale(0.42)', transformOrigin: 'top center', width: 1080, flexShrink: 0 }}>
          <ProofCard card={previewCard} />
        </div>
      </div>
    </div>
  )
}
