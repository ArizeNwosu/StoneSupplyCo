// app/dashboard/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: cards } = await supabase
    .from('cards')
    .select('id, slug, current_weight, start_weight, unit, created_at, watermarked')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#eef1f0] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My ProofCards</h1>
          <Link
            href="/create"
            className="px-5 py-2.5 bg-[#23624d] text-white rounded-xl font-semibold text-sm hover:bg-[#1a4a3a] transition-colors"
          >
            + New Card
          </Link>
        </div>

        {!cards || cards.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl">
            <p className="text-gray-400 text-lg">No cards yet.</p>
            <Link href="/create" className="mt-4 inline-block text-[#23624d] font-semibold text-sm underline">
              Create your first card →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map(card => {
              const loss = Math.round((card.start_weight - card.current_weight) * 10) / 10
              return (
                <Link
                  key={card.id}
                  href={`/card/${card.slug}`}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="text-3xl font-black text-[#23624d]">-{loss} {card.unit}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {card.start_weight} → {card.current_weight} {card.unit}
                  </div>
                  <div className="text-xs text-gray-400 mt-3">
                    {new Date(card.created_at).toLocaleDateString()}
                  </div>
                  {card.watermarked && (
                    <span className="mt-2 inline-block text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
                      watermarked
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
