// app/create/page.tsx
'use client'
import { BuilderShell } from '@/components/builder/BuilderShell'
import { StepPhotos } from '@/components/builder/StepPhotos'
import { StepStats } from '@/components/builder/StepStats'
import { StepProgress } from '@/components/builder/StepProgress'
import { StepMethod } from '@/components/builder/StepMethod'
import { StepGenerate } from '@/components/builder/StepGenerate'
import type { BuilderState, UpdateFn } from '@/components/builder/BuilderShell'

function renderStep(state: BuilderState, update: UpdateFn) {
  const next = () => update({ step: (Math.min(state.step + 1, 5)) as BuilderState['step'] })
  const back = () => update({ step: (Math.max(state.step - 1, 1)) as BuilderState['step'] })

  if (state.step === 1) return <StepPhotos state={state} update={update} onNext={next} />
  if (state.step === 2) return <StepStats state={state} update={update} onNext={next} onBack={back} />
  if (state.step === 3) return <StepProgress state={state} update={update} onNext={next} onBack={back} />
  if (state.step === 4) return <StepMethod state={state} update={update} onNext={next} onBack={back} />
  return <StepGenerate state={state} onBack={back} />
}

export default function CreatePage() {
  return <BuilderShell renderStep={renderStep} />
}
