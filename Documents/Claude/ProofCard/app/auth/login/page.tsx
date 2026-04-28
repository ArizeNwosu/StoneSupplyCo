'use client'
import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function handleMagicLink() {
    const supabase = getSupabaseClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })
    setSent(true)
  }

  async function handleGoogle() {
    const supabase = getSupabaseClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })
  }

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef1f0]">
      <div className="bg-white p-8 rounded-2xl shadow text-center max-w-sm w-full">
        <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
        <p className="text-gray-500 text-sm mt-2">We sent a magic link to <strong>{email}</strong></p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef1f0]">
      <div className="bg-white p-8 rounded-2xl shadow max-w-sm w-full space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Sign in to ProofCard</h1>
        <p className="text-sm text-gray-500">Sign in to remove watermarks and save your cards.</p>

        <Button onClick={handleGoogle} variant="outline" className="w-full">
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex-1 h-px bg-gray-100" />or<div className="flex-1 h-px bg-gray-100" />
        </div>

        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
        />
        <Button onClick={handleMagicLink} disabled={!email} className="w-full bg-[#23624d] hover:bg-[#1a4a3a]">
          Send Magic Link
        </Button>
      </div>
    </div>
  )
}
