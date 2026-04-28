'use client'
import { useState } from 'react'

interface Props {
  slug: string
}

export function ActionBar({ slug }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setDownloading(true)
    setError('')
    try {
      const res = await fetch(`/api/og/${slug}`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `proofcard-${slug}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-8 w-full max-w-[540px]">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
        <div className="text-center">
          <p className="text-sm font-bold text-gray-800">Your ProofCard is ready</p>
          <p className="text-xs text-gray-400 mt-0.5">Download as PNG or share the link below</p>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full py-3 bg-[#23624d] hover:bg-[#1a4a3a] disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          {downloading ? 'Generating PNG…' : '↓ Download PNG'}
        </button>

        <div className="flex gap-2">
          <input
            readOnly
            value={typeof window !== 'undefined' ? window.location.href : ''}
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 truncate"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  )
}
