// lib/uploadPhoto.ts
import { getSupabaseClient } from './supabase/client'
import { generateSlug } from './utils'

export async function uploadPhoto(file: File, cardSlug: string, side: 'before' | 'after'): Promise<string> {
  const supabase = getSupabaseClient()
  const ext = file.name.includes('.') ? file.name.split('.').pop()! : 'jpg'
  const storagePath = `${cardSlug}/${side}-${generateSlug()}.${ext}`

  const { error } = await supabase.storage
    .from('card-photos')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Photo upload failed: ${error.message}`)
  return storagePath   // stored path (not signed URL — sign on demand)
}
