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
const DB_VERSION = 1
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
  }

  await putSession(session)
  await setActiveSession(session)
  eventCounts.set(sessionId, 0)

  await injectRrweb(tabId, sessionId)

  // Tell the content bridge which session to forward events for
  await chrome.tabs.sendMessage(tabId, { type: 'RECORDING_STARTED', sessionId })

  chrome.action.setBadgeText({ text: '●', tabId }).catch(() => {})
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId }).catch(() => {})

  // Keep the service worker alive while recording
  chrome.alarms.create('keepalive', { periodInMinutes: 0.4 })

  return session
}

// ─── Stop Recording ───────────────────────────────────────────────────────────
async function stopRecording(tabId) {
  const session = await getActiveSession()
  if (!session) return null

  const endTime = Date.now()
  const count   = eventCounts.get(session.sessionId) || 0

  // Stop rrweb in MAIN world
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (typeof window.__mindprint_stop === 'function') window.__mindprint_stop()
        window.__mindprint_recording = null
      },
      world: 'MAIN',
    })
  } catch (_) { /* tab may have navigated away */ }

  // Tell the content bridge to stop forwarding
  try { await chrome.tabs.sendMessage(tabId, { type: 'RECORDING_STOPPED' }) } catch (_) {}

  const updated = await updateSession(session.sessionId, {
    endTime,
    status:     'stopped',
    eventCount: count,
    durationMs: endTime - session.startTime,
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
      metadata:        { eventCount: rrwebEvts.length },
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
  const session = await getActiveSession()
  if (!session) return
  try {
    await injectRrweb(tabId, session.sessionId)
    await chrome.tabs.sendMessage(tabId, {
      type:      'RECORDING_STARTED',
      sessionId: session.sessionId,
    })
    const tab = await chrome.tabs.get(tabId)
    const next = {
      ...session,
      tabId,
      url:   tab.url   || session.url,
      title: tab.title || session.title,
    }
    await updateSession(session.sessionId, {
      tabId: next.tabId,
      url:   next.url,
      title: next.title,
    })
    await setActiveSession(next)
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
    const session = await getActiveSession()
    if (session?.status === 'recording') {
      const protocol = tab.url ? new URL(tab.url).protocol : ''
      if (tab.url && !BLOCKED_PROTOCOLS.has(protocol)) {
        await injectRrweb(tabId, session.sessionId)
        await chrome.tabs.sendMessage(tabId, {
          type:      'RECORDING_STARTED',
          sessionId: session.sessionId,
        })
        const next = {
          ...session,
          tabId,
          url:   tab.url   || session.url,
          title: tab.title || session.title,
        }
        await updateSession(session.sessionId, {
          tabId: next.tabId,
          url:   next.url,
          title: next.title,
        })
        await setActiveSession(next)
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
