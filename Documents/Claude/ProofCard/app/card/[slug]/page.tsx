// app/card/[slug]/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ProofCard } from '@/components/ProofCard'
import { CopyLinkButton } from './CopyLinkButton'
import type { CardData, WeightEntry } from '@/types'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: 'ProofCard — Weight Loss Transformation',
    openGraph: {
      images: [`/api/og/${slug}`],
      title: 'My Weight Loss ProofCard',
      description: 'Created with ProofCard — Your progress. Your proof.',
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/api/og/${slug}`],
    },
  }
}

export default async function CardPage({ params }: Props) {
  const { slug } = await params
  const supabase = await getSupabaseServerClient()

  const { data: card } = await supabase
    .from('cards')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!card) notFound()

  const { data: entries } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('card_id', card.id)
    .order('date', { ascending: true })

  const getSignedUrl = async (storagePath: string) => {
    if (!storagePath) return ''
    const { data } = await supabase.storage
      .from('card-photos')
      .createSignedUrl(storagePath, 3600)
    return data?.signedUrl ?? ''
  }

  const [beforePhotoUrl, afterPhotoUrl] = await Promise.all([
    getSignedUrl(card.before_photo_url),
    getSignedUrl(card.after_photo_url),
  ])

  const weightEntries: WeightEntry[] = (entries ?? []).map(e => ({
    date: e.date,
    weight: e.weight,
    note: e.note ?? undefined,
  }))

  const cardData: CardData = {
    unit: card.unit,
    startWeight: card.start_weight,
    currentWeight: card.current_weight,
    goalWeight: card.goal_weight,
    startDate: card.start_date,
    method: card.method,
    habits: card.habits,
    beforePhotoUrl,
    afterPhotoUrl,
    watermarked: card.watermarked,
    weightEntries,
  }

  return (
    <div className="min-h-screen bg-[#eef1f0] flex flex-col items-center justify-start py-12 px-4">
      <div style={{ width: 540, height: 675 }}>
        {/* Scale card to 540px wide (half of 1080) for web display */}
        <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: 1080, height: 1350 }}>
          <ProofCard card={cardData} />
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <a
          href={`/api/og/${slug}`}
          download={`proofcard-${slug}.png`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#23624d] text-white rounded-xl font-semibold text-sm hover:bg-[#1a4a3a] transition-colors"
        >
          ↓ Download PNG
        </a>
        <CopyLinkButton />
      </div>
    </div>
  )
}
