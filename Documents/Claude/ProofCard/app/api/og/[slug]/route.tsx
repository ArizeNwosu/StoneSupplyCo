// app/api/og/[slug]/route.ts
import { ImageResponse } from '@vercel/og'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ProofCard } from '@/components/ProofCard'
import { getFonts } from '@/lib/fonts'
import type { CardData, WeightEntry } from '@/types'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await getSupabaseServerClient()

  // Fetch card
  const { data: card } = await supabase
    .from('cards')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!card) {
    return new Response('Not found', { status: 404 })
  }

  // Fetch weight entries
  const { data: entries } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('card_id', card.id)
    .order('date', { ascending: true })

  const weightEntries: WeightEntry[] = (entries ?? []).map(e => ({
    date: e.date,
    weight: e.weight,
    note: e.note ?? undefined,
  }))

  // Get signed photo URLs
  const getUrl = async (storagePath: string) => {
    if (!storagePath) return ''
    const { data } = await supabase.storage
      .from('card-photos')
      .createSignedUrl(storagePath, 60)
    return data?.signedUrl ?? ''
  }

  const [beforePhotoUrl, afterPhotoUrl] = await Promise.all([
    getUrl(card.before_photo_url),
    getUrl(card.after_photo_url),
  ])

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

  const fonts = await getFonts()

  return new ImageResponse(
    <ProofCard card={cardData} width={1080} height={1350} />,
    {
      width: 1080,
      height: 1350,
      fonts,
    }
  )
}
