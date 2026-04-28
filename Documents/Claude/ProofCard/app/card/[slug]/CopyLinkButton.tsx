'use client'

export function CopyLinkButton() {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(window.location.href)}
      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold text-sm border border-gray-200 hover:border-[#23624d] transition-colors"
    >
      Copy Link
    </button>
  )
}
