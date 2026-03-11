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
let activeTool = null
let activeCaptureMode = null
let activeSegmentId = null
let docsSnapshotTimer = null
let docsFlushTimer = null
let docsObserver = null
let lastDocsSignature = null

function normalizeText(text) {
  return (text || '')
    .replace(/\u200b/g, '')
    .replace(/\u2060/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

function resolveGoogleDocsRoot() {
  return document.querySelector('[role="textbox"]')
    || document.querySelector('.kix-appview-editor')
    || document.querySelector('.kix-page-content-wrapper')
    || document.querySelector('.kix-page')
}

function extractGoogleDocsBlocks(root) {
  const paragraphSelectors = [
    '[role="paragraph"]',
    '.kix-paragraphrenderer',
    '.kix-lineview',
    '.kix-lineview-content'
  ]
  const nodes = root.querySelectorAll(paragraphSelectors.join(','))
  const seen = new Set()
  const blocks = []

  for (const node of nodes) {
    const text = normalizeText(
      node.getAttribute('aria-label')
      || node.innerText
      || node.textContent
      || ''
    )
    if (!text) continue
    const key = `${node.className || node.getAttribute('role') || 'node'}:${text}`
    if (seen.has(key)) continue
    seen.add(key)
    blocks.push({
      blockId: `gdoc_${blocks.length}`,
      type: blocks.length === 0 && text.length < 140 ? 'heading' : 'paragraph',
      text,
      index: blocks.length,
    })
  }

  if (blocks.length) return blocks

  const fallbackText = normalizeText(
    root.getAttribute('aria-label')
    || root.innerText
    || root.textContent
    || ''
  )
  if (!fallbackText) return []
  return fallbackText
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .filter(Boolean)
    .map((line, index) => ({
      blockId: `gdoc_${index}`,
      type: index === 0 && line.length < 140 ? 'heading' : 'paragraph',
      text: line,
      index,
    }))
}

function buildGoogleDocsSnapshot() {
  const root = resolveGoogleDocsRoot()
  if (!root) return null
  const blocks = extractGoogleDocsBlocks(root)
  const text = blocks.map((block) => block.text).join('\n\n')
  if (!text.trim()) return null

  const selection = document.getSelection()
  return {
    source: 'google_docs',
    title: document.title || 'Untitled Google Doc',
    url: location.href,
    text,
    blocks,
    capturedAt: Date.now(),
    lineCount: blocks.length,
    selectionText: normalizeText(selection ? selection.toString() : ''),
  }
}

function sendGoogleDocsSnapshot(reason = 'interval') {
  if (!sessionId || activeTool !== 'google_docs' || !activeSegmentId) return
  const snapshot = buildGoogleDocsSnapshot()
  if (!snapshot) return
  const signature = JSON.stringify({
    text: snapshot.text,
    selectionText: snapshot.selectionText,
  })
  if (reason !== 'stop' && reason !== 'start' && signature === lastDocsSignature) {
    return
  }
  lastDocsSignature = signature
  chrome.runtime.sendMessage({
    type: 'DOCS_SEMANTIC_SNAPSHOT',
    sessionId,
    segmentId: activeSegmentId,
    ts: Date.now(),
    payload: {
      reason,
      ...snapshot,
    },
  }).catch(() => {})
}

function queueGoogleDocsSnapshot(reason = 'mutation', delay = 120) {
  clearTimeout(docsFlushTimer)
  docsFlushTimer = setTimeout(() => {
    docsFlushTimer = null
    sendGoogleDocsSnapshot(reason)
  }, delay)
}

function bindGoogleDocsObserver() {
  const root = resolveGoogleDocsRoot()
  if (!root) return
  docsObserver = new MutationObserver(() => {
    queueGoogleDocsSnapshot('mutation', 120)
  })
  docsObserver.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'style']
  })
}

function stopDocsSnapshotting() {
  clearInterval(docsSnapshotTimer)
  clearTimeout(docsFlushTimer)
  docsObserver?.disconnect()
  docsSnapshotTimer = null
  docsFlushTimer = null
  docsObserver = null
  lastDocsSignature = null
}

function startDocsSnapshotting() {
  stopDocsSnapshotting()
  sendGoogleDocsSnapshot('start')
  bindGoogleDocsObserver()
  docsSnapshotTimer = setInterval(() => sendGoogleDocsSnapshot('heartbeat'), 2000)
}

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
    activeTool = msg.tool || null
    activeCaptureMode = msg.captureMode || null
    activeSegmentId = msg.segmentId || null
    // Flush any events that arrived before we knew the sessionId
    for (const data of buffer.splice(0)) {
      forwardRrwebEvent(data)
    }
    if (activeTool === 'google_docs' && activeCaptureMode === 'semantic') {
      startDocsSnapshotting()
    } else {
      stopDocsSnapshotting()
    }
  }

  if (msg.type === 'RECORDING_STOPPED') {
    if (activeTool === 'google_docs') {
      sendGoogleDocsSnapshot('stop')
    }
    sessionId = null
    activeTool = null
    activeCaptureMode = null
    activeSegmentId = null
    buffer.length = 0
    stopDocsSnapshotting()
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

document.addEventListener('beforeinput', () => {
  if (activeTool === 'google_docs' && activeCaptureMode === 'semantic') {
    queueGoogleDocsSnapshot('beforeinput', 80)
  }
}, true)

document.addEventListener('input', () => {
  if (activeTool === 'google_docs' && activeCaptureMode === 'semantic') {
    queueGoogleDocsSnapshot('input', 80)
  }
}, true)

document.addEventListener('keyup', () => {
  if (activeTool === 'google_docs' && activeCaptureMode === 'semantic') {
    queueGoogleDocsSnapshot('keyup', 90)
  }
}, true)

document.addEventListener('selectionchange', () => {
  if (activeTool === 'google_docs' && activeCaptureMode === 'semantic') {
    queueGoogleDocsSnapshot('selectionchange', 140)
  }
}, true)
