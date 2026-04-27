// components/builder/StepPhotos.tsx
'use client'
import { useRef } from 'react'
import type { BuilderState } from '@/types'
import { Button } from '@/components/ui/button'

interface Props {
  state: BuilderState
  update: (patch: Partial<BuilderState>) => void
  onNext: () => void
}

function PhotoUploader({
  label,
  preview,
  onFile,
}: {
  label: string
  preview: string
  onFile: (file: File) => void
}) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{label}</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full h-48 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#23624d] transition-colors flex flex-col items-center justify-center overflow-hidden bg-gray-50"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">Click to upload</span>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
        }}
      />
    </div>
  )
}

export function StepPhotos({ state, update, onNext }: Props) {
  function handleFile(side: 'before' | 'after', file: File) {
    const url = URL.createObjectURL(file)
    if (side === 'before') update({ beforePhotoFile: file, beforePhotoPreview: url })
    else update({ afterPhotoFile: file, afterPhotoPreview: url })
  }

  const canProceed = !!state.beforePhotoFile && !!state.afterPhotoFile

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Upload your photos</h2>
        <p className="text-sm text-gray-500 mt-1">Both before and after photos are required.</p>
      </div>
      <PhotoUploader label="Before" preview={state.beforePhotoPreview} onFile={f => handleFile('before', f)} />
      <PhotoUploader label="After"  preview={state.afterPhotoPreview}  onFile={f => handleFile('after', f)} />
      <Button onClick={onNext} disabled={!canProceed} className="w-full bg-[#23624d] hover:bg-[#1a4a3a]">
        Continue →
      </Button>
    </div>
  )
}
