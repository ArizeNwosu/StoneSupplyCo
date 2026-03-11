'use strict'

// ─── Supabase Config ──────────────────────────────────────────────────────────
// TODO: Replace with your project credentials
const SUPABASE_URL  = 'https://nvkimudseoftlegbvctz.supabase.co'
const SUPABASE_ANON = 'sb_publishable_CsSIIPTJYtu9D-o8JhH3Yg_Awyz0mjQ'
const VIEWER_ORIGIN = 'file:///Users/riz/Downloads/Mindprint'   // e.g. https://mindprint.app

// Known AI tool hostnames
const AI_TOOL_LABELS = {
  'chatgpt.com':           'ChatGPT',
  'chat.openai.com':       'ChatGPT',
  'claude.ai':             'Claude',
  'gemini.google.com':     'Gemini',
  'bard.google.com':       'Gemini',
  'copilot.microsoft.com': 'Copilot',
  'perplexity.ai':         'Perplexity',
  'you.com':               'You.com',
  'poe.com':               'Poe',
  'character.ai':          'Character.AI',
}

// ─── IndexedDB ────────────────────────────────────────────────────────────────
const DB_NAME    = 'mindprint'
const DB_VERSION = 2
let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = ({ target: { result: db } }) => {
      if (!db.objectStoreNames.contains('sessions')) {
        const ss = db.createObjectStore('sessions', { keyPath: 'sessionId' })
        ss.createIndex('by_createdAt', 'createdAt')
        ss.createIndex('by_status',    'status')
      }
      if (!db.objectStoreNames.contains('events')) {
        const es = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true })
        es.createIndex('by_session',    'sessionId')
        es.createIndex('by_session_ts', ['sessionId', 'ts'])
      }
      if (!db.objectStoreNames.contains('segments')) {
        const seg = db.createObjectStore('segments', { keyPath: 'segmentId' })
        seg.createIndex('by_session_index', ['sessionId', 'segmentIndex'])
      }
      if (!db.objectStoreNames.contains('semantic_snapshots')) {
        const snap = db.createObjectStore('semantic_snapshots', { keyPath: 'id', autoIncrement: true })
        snap.createIndex('by_segment_ts', ['segmentId', 'ts'])
        snap.createIndex('by_session_ts', ['sessionId', 'ts'])
      }
    }
    req.onsuccess = ({ target: { result: db } }) => { _db = db; resolve(db) }
    req.onerror   = ({ target: { error  } }) => reject(error)
    req.onblocked = () => reject(new Error('IndexedDB blocked – close other extension pages'))
  })
}

function dbTxWrite(storeName, fn) {
  return new Promise(async (resolve, reject) => {
    const db = await openDB()
    const tx    = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    tx.onerror  = () => reject(tx.error)
    try {
      const req = fn(store)
      if (req && typeof req.onsuccess !== 'undefined') {
        req.onsuccess = ({ target: { result } }) => resolve(result)
        req.onerror   = ({ target: { error  } }) => reject(error)
      } else {
        tx.oncomplete = () => resolve(undefined)
      }
    } catch (e) { reject(e) }
  })
}

function dbTxRead(storeName, fn) {
  return new Promise(async (resolve, reject) => {
    const db   = await openDB()
    const tx   = db.transaction(storeName, 'readonly')
    const req  = fn(tx.objectStore(storeName))
    req.onsuccess = ({ target: { result } }) => resolve(result)
    req.onerror   = ({ target: { error  } }) => reject(error)
  })
}

async function putSession(session) {
  return dbTxWrite('sessions', s => s.put(session))
}

async function getSession(sessionId) {
  return dbTxRead('sessions', s => s.get(sessionId))
}

async function updateSession(sessionId, updates) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction('sessions', 'readwrite')
    const store = tx.objectStore('sessions')
    tx.onerror  = () => reject(tx.error)
    const req   = store.get(sessionId)
    req.onsuccess = ({ target: { result: existing } }) => {
      if (!existing) { reject(new Error(`Session ${sessionId} not found`)); return }
      const updated = { ...existing, ...updates }
      store.put(updated)
      tx.oncomplete = () => resolve(updated)
    }
    req.onerror = ({ target: { error } }) => reject(error)
  })
}

async function getAllSessions() {
  return dbTxRead('sessions', s => s.getAll())
}

async function addEvent(sessionId, event, isCheckout) {
  return dbTxWrite('events', s => s.add({
    sessionId,
    ts:         event.timestamp || Date.now(),
    event,
    isCheckout: !!isCheckout,
  }))
}

async function addSegment(segment) {
  return dbTxWrite('segments', s => s.put(segment))
}

async function getSessionSegments(sessionId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction('segments', 'readonly')
    const idx   = tx.objectStore('segments').index('by_session_index')
    const range = IDBKeyRange.bound([sessionId, 0], [sessionId, Infinity])
    const req   = idx.getAll(range)
    req.onsuccess = ({ target: { result } }) => resolve(result)
    req.onerror   = ({ target: { error  } }) => reject(error)
  })
}

async function addSemanticSnapshot(snapshot) {
  return dbTxWrite('semantic_snapshots', s => s.add(snapshot))
}

async function getSegmentSemanticSnapshots(segmentId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction('semantic_snapshots', 'readonly')
    const idx   = tx.objectStore('semantic_snapshots').index('by_segment_ts')
    const range = IDBKeyRange.bound([segmentId, 0], [segmentId, Infinity])
    const req   = idx.getAll(range)
    req.onsuccess = ({ target: { result } }) => resolve(result)
    req.onerror   = ({ target: { error  } }) => reject(error)
  })
}

async function getSessionEvents(sessionId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction('events', 'readonly')
    const idx   = tx.objectStore('events').index('by_session_ts')
    const range = IDBKeyRange.bound([sessionId, 0], [sessionId, Infinity])
    const req   = idx.getAll(range)
    req.onsuccess = ({ target: { result } }) => resolve(result)
    req.onerror   = ({ target: { error  } }) => reject(error)
  })
}

// ─── Recording State ──────────────────────────────────────────────────────────
// Session metadata is persisted in chrome.storage.local keyed by `rec_${tabId}`
// so it survives service-worker restarts.
const eventCounts = new Map()  // sessionId → count (in-memory only)
const ACTIVE_SESSION_KEY = 'mindprint_active_session'

function detectToolContext(url = '') {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'docs.google.com') return { tool: 'google_docs', captureMode: 'semantic' }
    if (host === 'notion.so') return { tool: 'notion', captureMode: 'semantic' }
    if (host === 'figma.com') return { tool: 'figma', captureMode: 'rrweb' }
    if (host === 'canva.com') return { tool: 'canva', captureMode: 'rrweb' }
    if (host === 'chatgpt.com' || host === 'chat.openai.com') return { tool: 'chatgpt', captureMode: 'rrweb' }
    if (host === 'claude.ai') return { tool: 'claude', captureMode: 'rrweb' }
    return { tool: host || 'browser', captureMode: 'rrweb' }
  } catch (_) {
    return { tool: 'browser', captureMode: 'rrweb' }
  }
}

async function openSegment(session, tab) {
  const context = detectToolContext(tab.url || session.url)
  const segmentIndex = session.segmentCount || 0
  const segmentId = crypto.randomUUID()
  const segment = {
    segmentId,
    sessionId: session.sessionId,
    segmentIndex,
    tool: context.tool,
    captureMode: context.captureMode,
    host: tab.url ? new URL(tab.url).hostname : '',
    url: tab.url || session.url || '',
    title: tab.title || session.title || 'Untitled',
    startedAt: Date.now(),
    endedAt: null,
    durationMs: 0,
    metadata: {},
  }
  await addSegment(segment)
  const next = {
    ...session,
    activeSegmentId: segmentId,
    activeTool: context.tool,
    activeCaptureMode: context.captureMode,
    segmentCount: segmentIndex + 1,
    tabId: tab.id || session.tabId,
    url: segment.url,
    title: segment.title,
  }
  await updateSession(session.sessionId, {
    activeSegmentId: next.activeSegmentId,
    activeTool: next.activeTool,
    activeCaptureMode: next.activeCaptureMode,
    segmentCount: next.segmentCount,
    tabId: next.tabId,
    url: next.url,
    title: next.title,
  })
  await setActiveSession(next)
  return next
}

async function closeActiveSegment(session) {
  if (!session?.activeSegmentId) return
  const segments = await getSessionSegments(session.sessionId)
  const segment = segments.find((item) => item.segmentId === session.activeSegmentId)
  if (!segment || segment.endedAt) return
  await addSegment({
    ...segment,
    endedAt: Date.now(),
    durationMs: Date.now() - segment.startedAt,
  })
}

async function getActiveSession() {
  const data = await chrome.storage.local.get(ACTIVE_SESSION_KEY)
  return data[ACTIVE_SESSION_KEY] ?? null
}

async function setActiveSession(session) {
  if (session) {
    await chrome.storage.local.set({ [ACTIVE_SESSION_KEY]: session })
  } else {
    await chrome.storage.local.remove(ACTIVE_SESSION_KEY)
  }
}

// ─── rrweb Injection ──────────────────────────────────────────────────────────
async function injectRrweb(tabId, sessionId) {
  // Ensure the isolated-world content bridge exists for already-open tabs.
  await chrome.scripting.executeScript({
    target: { tabId },
    files:  ['content.js'],
  })

  // Step 1 – load rrweb library into the page's MAIN world
  await chrome.scripting.executeScript({
    target: { tabId },
    files:  ['rrweb.iife.js'],
    world:  'MAIN',
  })

  // Step 2 – start rrweb.record() in MAIN world; relay events via postMessage
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (sid) => {
      if (window.__mindprint_recording === sid) return  // already recording this session
      if (typeof window.__mindprint_stop === 'function') {
        window.__mindprint_stop()  // stop any previous session on this tab
      }
      window.__mindprint_recording = sid
      window.__mindprint_stop = rrweb.record({
        emit(event, isCheckout) {
          window.postMessage({
            __mindprint: true,
            sessionId:   sid,
            event,
            isCheckout:  !!isCheckout,
          }, '*')
        },
        checkoutEveryNms:           20_000,  // full snapshot every 20 s
        collectFonts:               true,
        recordCrossOriginIframes:   false,
      })
    },
    args:  [sessionId],
    world: 'MAIN',
  })
}

// ─── Start Recording ──────────────────────────────────────────────────────────
const BLOCKED_PROTOCOLS = new Set(['chrome:', 'chrome-extension:', 'about:', 'edge:', 'brave:'])

async function startRecording(tabId) {
  const existing = await getActiveSession()
  if (existing?.status === 'recording') return existing  // already recording

  const tab = await chrome.tabs.get(tabId)

  // Chrome blocks script injection into browser-internal pages
  const protocol = tab.url ? new URL(tab.url).protocol : ''
  if (!tab.url || BLOCKED_PROTOCOLS.has(protocol)) {
    throw new Error('Navigate to a regular webpage first — Mindprint can\'t record browser or extension pages.')
  }
  const sessionId = crypto.randomUUID()
  const now       = Date.now()

  const session = {
    sessionId,
    tabId,
    url:        tab.url   || '',
    title:      tab.title || 'Untitled',
    startTime:  now,
    createdAt:  now,
    status:     'recording',
    eventCount: 0,
    segmentCount: 0,
    activeSegmentId: null,
  }

  await putSession(session)
  await setActiveSession(session)
  eventCounts.set(sessionId, 0)
  const nextSession = await openSegment(session, tab)

  await injectRrweb(tabId, sessionId)

  // Tell the content bridge which session to forward events for
  await chrome.tabs.sendMessage(tabId, {
    type:      'RECORDING_STARTED',
    sessionId,
    tool: nextSession.activeTool,
    captureMode: nextSession.activeCaptureMode,
    segmentId: nextSession.activeSegmentId,
  })

  chrome.action.setBadgeText({ text: '●', tabId }).catch(() => {})
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId }).catch(() => {})

  // Keep the service worker alive while recording
  chrome.alarms.create('keepalive', { periodInMinutes: 0.4 })

  return nextSession
}

// ─── Stop Recording ───────────────────────────────────────────────────────────
async function stopRecording(tabId) {
  const session = await getActiveSession()
  if (!session) return null

  const endTime = Date.now()
  const count   = eventCounts.get(session.sessionId) || 0
  await closeActiveSegment(session)

  const tabs = await chrome.tabs.query({})
  await Promise.allSettled(tabs.map(async (tab) => {
    if (!tab.id) return
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (typeof window.__mindprint_stop === 'function') window.__mindprint_stop()
          window.__mindprint_recording = null
        },
        world: 'MAIN',
      })
    } catch (_) {}

    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'RECORDING_STOPPED' })
    } catch (_) {}
  }))

  const updated = await updateSession(session.sessionId, {
    endTime,
    status:     'stopped',
    eventCount: count,
    durationMs: endTime - session.startTime,
    activeSegmentId: null,
  })

  await setActiveSession(null)
  eventCounts.delete(session.sessionId)

  chrome.action.setBadgeText({ text: '', tabId }).catch(() => {})
  chrome.alarms.clear('keepalive').catch(() => {})

  return updated
}

// ─── Upload to Supabase ───────────────────────────────────────────────────────
async function uploadRecording(sessionId) {
  const session = await getSession(sessionId)
  if (!session) throw new Error('Session not found')

  const rows       = await getSessionEvents(sessionId)
  const rrwebEvts  = rows.filter(r => !r.event._mindprintMeta).map(r => r.event)
  const aiEvts     = rows.filter(r =>  r.event._mindprintMeta).map(r => r.event)
  const segments   = await getSessionSegments(sessionId)

  const hdrs = {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_ANON,
    'Authorization': `Bearer ${SUPABASE_ANON}`,
  }

  // 1. Insert recording row
  const recRes = await fetch(`${SUPABASE_URL}/rest/v1/recordings`, {
    method:  'POST',
    headers: { ...hdrs, 'Prefer': 'return=representation' },
    body: JSON.stringify({
      session_id:      sessionId,
      url:             session.url,
      title:           session.title,
      duration_ms:     session.durationMs ?? 0,
      ai_interactions: aiEvts,
      metadata:        {
        eventCount: rrwebEvts.length,
        segmentCount: segments.length,
        primaryTool: segments[0]?.tool || null,
      },
    }),
  })
  if (!recRes.ok) {
    throw new Error(`Recording insert failed: ${await recRes.text()}`)
  }

  // 2. Upload rrweb events in chunks of 200
  const CHUNK = 200
  for (let i = 0; i < rrwebEvts.length; i += CHUNK) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/recording_chunks`, {
      method:  'POST',
      headers: { ...hdrs, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        session_id:  sessionId,
        chunk_index: Math.floor(i / CHUNK),
        events:      rrwebEvts.slice(i, i + CHUNK),
      }),
    })
    if (!res.ok) {
      throw new Error(`Chunk ${Math.floor(i / CHUNK)} upload failed: ${await res.text()}`)
    }
  }

  if (segments.length) {
    const segmentRows = segments.map((segment) => ({
      id:           segment.segmentId,
      session_id:   sessionId,
      segment_index: segment.segmentIndex,
      tool:         segment.tool,
      host:         segment.host,
      url:          segment.url,
      title:        segment.title,
      capture_mode: segment.captureMode,
      started_at:   new Date(segment.startedAt).toISOString(),
      ended_at:     segment.endedAt ? new Date(segment.endedAt).toISOString() : null,
      duration_ms:  segment.durationMs || 0,
      metadata:     segment.metadata || {},
    }))
    const segmentRes = await fetch(`${SUPABASE_URL}/rest/v1/recording_segments`, {
      method:  'POST',
      headers: { ...hdrs, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(segmentRows),
    })
    if (!segmentRes.ok) {
      throw new Error(`Segment upload failed: ${await segmentRes.text()}`)
    }

    const artifactRows = []
    for (const segment of segments) {
      const snapshots = await getSegmentSemanticSnapshots(segment.segmentId)
      snapshots.forEach((snapshot, index) => {
        artifactRows.push({
          session_id:   sessionId,
          segment_id:   segment.segmentId,
          artifact_type: 'semantic_checkpoint',
          chunk_index:  index,
          payload:      snapshot.payload,
        })
      })
    }
    if (artifactRows.length) {
      const artifactRes = await fetch(`${SUPABASE_URL}/rest/v1/segment_artifacts`, {
        method:  'POST',
        headers: { ...hdrs, 'Prefer': 'return=minimal' },
        body: JSON.stringify(artifactRows),
      })
      if (!artifactRes.ok) {
        throw new Error(`Segment artifact upload failed: ${await artifactRes.text()}`)
      }
    }
  }

  await updateSession(sessionId, { status: 'uploaded' })
  return `${VIEWER_ORIGIN}/viewer/index.html?id=${sessionId}`
}

// ─── Message Handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // ── rrweb event stream from the content bridge ──
  if (msg.type === 'RRWEB_EVENT') {
    const { sessionId, event, isCheckout } = msg
    eventCounts.set(sessionId, (eventCounts.get(sessionId) || 0) + 1)
    addEvent(sessionId, event, isCheckout).catch(console.error)
    return false  // no response needed; don't hold channel open
  }

  // ── AI paste / metadata events from content bridge ──
  if (msg.type === 'AI_META_EVENT') {
    const { sessionId, event } = msg
    addEvent(sessionId, { ...event, _mindprintMeta: true }, false).catch(console.error)
    return false
  }

  if (msg.type === 'DOCS_SEMANTIC_SNAPSHOT') {
    addSemanticSnapshot({
      sessionId: msg.sessionId,
      segmentId: msg.segmentId,
      ts: msg.ts || Date.now(),
      payload: msg.payload,
    }).catch(console.error)
    return false
  }

  // ── Popup: get current tab recording status ──
  if (msg.type === 'POPUP_STATUS') {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (!tab) { sendResponse({ status: 'no-tab' }); return }
      const session = await getActiveSession()
      const count   = session ? (eventCounts.get(session.sessionId) || 0) : 0
      sendResponse({ session, count })
    })
    return true
  }

  // ── Popup: start recording current tab ──
  if (msg.type === 'POPUP_START') {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (!tab) { sendResponse({ error: 'No active tab' }); return }
      try {
        const session = await startRecording(tab.id)
        sendResponse({ ok: true, session })
      } catch (e) {
        sendResponse({ error: e.message })
      }
    })
    return true
  }

  // ── Popup: stop recording current tab ──
  if (msg.type === 'POPUP_STOP') {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (!tab) { sendResponse({ error: 'No active tab' }); return }
      try {
        const session = await stopRecording(tab.id)
        sendResponse({ ok: true, session })
      } catch (e) {
        sendResponse({ error: e.message })
      }
    })
    return true
  }

  // ── Popup: upload a stopped session to Supabase ──
  if (msg.type === 'POPUP_UPLOAD') {
    ;(async () => {
      try {
        const url = await uploadRecording(msg.sessionId)
        sendResponse({ ok: true, url })
      } catch (e) {
        sendResponse({ error: e.message })
      }
    })()
    return true
  }

  // ── Popup: list recent sessions ──
  if (msg.type === 'POPUP_LIST_SESSIONS') {
    ;(async () => {
      try {
        const all    = await getAllSessions()
        const sorted = all.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10)
        sendResponse({ sessions: sorted })
      } catch (e) {
        sendResponse({ sessions: [], error: e.message })
      }
    })()
    return true
  }
})

// ─── Re-inject rrweb on Navigation ───────────────────────────────────────────
// When the user navigates to a new page within a recording session, re-inject.
chrome.webNavigation.onCompleted.addListener(async ({ tabId, frameId }) => {
  if (frameId !== 0) return  // main frame only
  let session = await getActiveSession()
  if (!session) return
  try {
    const tab = await chrome.tabs.get(tabId)
    const context = detectToolContext(tab.url || session.url)
    if (
      context.tool !== session.activeTool ||
      context.captureMode !== session.activeCaptureMode ||
      (tab.url && tab.url !== session.url)
    ) {
      await closeActiveSegment(session)
      session = await openSegment(session, tab)
    }
    await injectRrweb(tabId, session.sessionId)
    await chrome.tabs.sendMessage(tabId, {
      type:      'RECORDING_STARTED',
      sessionId: session.sessionId,
      tool: session.activeTool,
      captureMode: session.activeCaptureMode,
      segmentId: session.activeSegmentId,
    })
  } catch (_) {}
})

// ─── AI Interaction Tracking ─────────────────────────────────────────────────
async function logAIVisit(url, title) {
  let host, label
  try {
    host  = new URL(url).hostname.replace(/^www\./, '')
    label = AI_TOOL_LABELS[host]
    if (!label) return
  } catch (_) { return }

  const session = await getActiveSession()
  if (!session?.sessionId) return
  await addEvent(session.sessionId, {
    _mindprintMeta: true,
    type:   'ai_visit',
    tool:   label,
    host,
    url,
    title:  title || '',
    ts:     Date.now(),
  }, false).catch(() => {})
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId)
    let session = await getActiveSession()
    if (session?.status === 'recording') {
      const protocol = tab.url ? new URL(tab.url).protocol : ''
      if (tab.url && !BLOCKED_PROTOCOLS.has(protocol)) {
        const context = detectToolContext(tab.url || session.url)
        if (
          context.tool !== session.activeTool ||
          context.captureMode !== session.activeCaptureMode ||
          tab.url !== session.url
        ) {
          await closeActiveSegment(session)
          session = await openSegment(session, tab)
        }
        await injectRrweb(tabId, session.sessionId)
        await chrome.tabs.sendMessage(tabId, {
          type:      'RECORDING_STARTED',
          sessionId: session.sessionId,
          tool: session.activeTool,
          captureMode: session.activeCaptureMode,
          segmentId: session.activeSegmentId,
        })
      }
    }
    if (tab.url) await logAIVisit(tab.url, tab.title)
  } catch (_) {}
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return
  await logAIVisit(tab.url, tab.title)
})

// ─── Keep-alive Alarm ────────────────────────────────────────────────────────
chrome.alarms.onAlarm.addListener(({ name }) => {
  if (name === 'keepalive') {
    // Any storage access keeps the service worker alive
    chrome.storage.local.get('_ping').catch(() => {})
  }
})
