// components/builder/StepGenerate.tsx
'use client'
import { useState } from 'react'
import type { BuilderState } from '@/types'
import { Button } from '@/components/ui/button'
import { getSupabaseClient } from '@/lib/supabase/client'
import { uploadPhoto } from '@/lib/uploadPhoto'
import { generateSlug } from '@/lib/utils'

interface Props {
  state: BuilderState
  onBack: () => void
}

export function StepGenerate({ state, onBack }: Props) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [slug, setSlug] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleGenerate() {
    setStatus('saving')
    try {
      const supabase = getSupabaseClient()
      const cardSlug = generateSlug()

      // Upload photos
      const [beforePath, afterPath] = await Promise.all([
        uploadPhoto(state.beforePhotoFile!, cardSlug, 'before'),
        uploadPhoto(state.afterPhotoFile!, cardSlug, 'after'),
      ])

      // Save card
      const { data: card, error: cardErr } = await supabase
        .from('cards')
        .insert({
          slug: cardSlug,
          unit: state.unit,
          start_weight: parseFloat(state.startWeight),
          current_weight: parseFloat(state.currentWeight),
          goal_weight: parseFloat(state.goalWeight),
          start_date: state.startDate,
          method: state.method,
          habits: state.habits,
          before_photo_url: beforePath,
          after_photo_url: afterPath,
          watermarked: true,
        })
        .select()
        .single()

      if (cardErr || !card) throw new Error(cardErr?.message ?? 'Failed to save card')

      // Save weight entries
      if (state.weightEntries.length > 0) {
        const { error: entriesErr } = await supabase
          .from('weight_entries')
          .insert(state.weightEntries.map(e => ({
            card_id: card.id,
            date: e.date,
            weight: e.weight,
            note: e.note ?? null,
          })))
        if (entriesErr) throw new Error(entriesErr.message)
      }

      setSlug(cardSlug)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  const shareUrl = slug ? `${process.env.NEXT_PUBLIC_APP_URL}/card/${slug}` : ''
  const downloadUrl = slug ? `/api/og/${slug}` : ''

  if (status === 'done' && slug) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your ProofCard is ready!</h2>
          <p className="text-sm text-gray-500 mt-1">Download or share your card below.</p>
        </div>

        <a
          href={downloadUrl}
          download={`proofcard-${slug}.png`}
          className="block w-full"
        >
          <Button className="w-full bg-[#23624d] hover:bg-[#1a4a3a] text-white font-bold py-3">
            ↓ Download PNG (with watermark)
          </Button>
        </a>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Shareable Link</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700"
            />
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              Copy
            </Button>
          </div>
        </div>

        <div className="p-4 bg-[#eef6f0] rounded-xl text-center">
          <p className="text-sm text-[#23624d] font-semibold">Want a clean download without the watermark?</p>
          <p className="text-xs text-[#4a8a6a] mt-1">Create a free account to unlock clean exports and save your cards.</p>
          <Button className="mt-3 bg-[#23624d] hover:bg-[#1a4a3a] text-white text-sm">
            Create Free Account
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Generate your card</h2>
        <p className="text-sm text-gray-500 mt-1">
          We&apos;ll save your card and create a shareable link.
          Free cards include a watermark — create an account to remove it.
        </p>
      </div>

      {status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">← Back</Button>
        <Button
          onClick={handleGenerate}
          disabled={status === 'saving'}
          className="flex-1 bg-[#23624d] hover:bg-[#1a4a3a]"
        >
          {status === 'saving' ? 'Saving...' : 'Generate Card →'}
        </Button>
      </div>
    </div>
  )
}
