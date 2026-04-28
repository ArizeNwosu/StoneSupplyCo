// components/builder/StepPhotos.tsx
'use client'
import { useRef, useState } from 'react'
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
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{label}</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragEnter={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`w-full h-48 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center overflow-hidden bg-gray-50
          ${dragging ? 'border-[#23624d] bg-[#eef6f0]' : 'border-gray-200 hover:border-[#23624d]'}`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 pointer-events-none">
            <span className="text-gray-400 text-sm">{dragging ? 'Drop to upload' : 'Click or drag to upload'}</span>
          </div>
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
