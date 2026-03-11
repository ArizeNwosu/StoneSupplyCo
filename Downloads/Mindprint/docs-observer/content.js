'use strict'

// Mindprint content bridge
// Runs in the ISOLATED world on every page (declared in manifest.json).
// Responsibilities:
//   1. Bridge rrweb events from MAIN world → background service worker
//   2. Buffer events until RECORDING_STARTED delivers the sessionId
//   3. Detect clipboard paste events as AI interaction metadata

let sessionId  = null
const buffer   = []   // events buffered before RECORDING_STARTED arrives
let pasteGuard = false

// ── Bridge: window.postMessage (MAIN world) → chrome.runtime.sendMessage ─────
window.addEventListener('message', (e) => {
  if (!e.data?.__mindprint) return
  const data = e.data

  if (sessionId) {
    forwardRrwebEvent(data)
  } else {
    buffer.push(data)
  }
}, { passive: true })

function forwardRrwebEvent(data) {
  chrome.runtime.sendMessage({
    type:       'RRWEB_EVENT',
    sessionId:  data.sessionId || sessionId,
    event:      data.event,
    isCheckout: data.isCheckout,
  }).catch(() => {})
}

// ── Lifecycle messages from background ───────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'RECORDING_STARTED') {
    sessionId = msg.sessionId
    // Flush any events that arrived before we knew the sessionId
    for (const data of buffer.splice(0)) {
      forwardRrwebEvent(data)
    }
  }

  if (msg.type === 'RECORDING_STOPPED') {
    sessionId = null
    buffer.length = 0
  }
})

// ── AI Interaction: clipboard paste (potential AI-generated content) ──────────
document.addEventListener('paste', (e) => {
  if (!sessionId || pasteGuard) return
  pasteGuard = true
  setTimeout(() => { pasteGuard = false }, 200)

  const text = e.clipboardData?.getData('text/plain') || ''
  if (!text.trim()) return

  chrome.runtime.sendMessage({
    type:      'AI_META_EVENT',
    sessionId,
    event: {
      _mindprintMeta: true,
      type:    'paste',
      length:  text.length,
      preview: text.slice(0, 120),
      ts:      Date.now(),
    },
  }).catch(() => {})
}, { capture: true, passive: true })
