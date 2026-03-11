'use strict'

const statusDot = document.getElementById('status-dot')
const statusLabel = document.getElementById('status-label')
const timerDisplay = document.getElementById('timer-display')
const heroTitle = document.getElementById('hero-title')
const heroBody = document.getElementById('hero-body')
const sessionCard = document.getElementById('session-card')
const sessionTitle = document.getElementById('session-title')
const eventCount = document.getElementById('event-count')
const sessionDuration = document.getElementById('session-duration')
const proofChip = document.getElementById('proof-chip')
const sessionUrlDisp = document.getElementById('session-url-display')
const certificateCard = document.getElementById('certificate-card')
const certDuration = document.getElementById('cert-duration')
const certStatus = document.getElementById('cert-status')
const certProofMode = document.getElementById('cert-proof-mode')
const shareBox = document.getElementById('share-box')
const shareUrl = document.getElementById('share-url')
const copyBtn = document.getElementById('copy-btn')
const btnStart = document.getElementById('btn-start')
const btnStop = document.getElementById('btn-stop')
const btnShare = document.getElementById('btn-share')
const btnNew = document.getElementById('btn-new')
const shareSpinner = document.getElementById('share-spinner')
const shareLabel = document.getElementById('share-label')
const sessionsList = document.getElementById('sessions-list')
const footerSessionId = document.getElementById('footer-session-id')

let currentSession = null
let pollTimer = null
let timerInterval = null
let uploadedUrl = null

function send(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (res) => resolve(res))
  })
}

function fmt(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function shortUrl(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '') + (u.pathname !== '/' ? u.pathname.slice(0, 28) : '')
  } catch (_) {
    return (url || '').slice(0, 32)
  }
}

function show(el) { el.classList.remove('hidden') }
function hide(el) { el.classList.add('hidden') }
function toggleVisible(el, yes) { el.classList.toggle('visible', yes) }

function startTimer(startTime) {
  clearInterval(timerInterval)
  timerDisplay.classList.add('visible')
  timerDisplay.textContent = fmt(Date.now() - startTime)
  timerInterval = setInterval(() => {
    timerDisplay.textContent = fmt(Date.now() - startTime)
  }, 1000)
}

function stopTimer() {
  clearInterval(timerInterval)
  timerDisplay.classList.remove('visible')
  timerDisplay.textContent = '00:00'
}

function setSessionMeta(session, countOverride) {
  sessionTitle.textContent = session?.title || 'Untitled session'
  sessionUrlDisp.textContent = shortUrl(session?.url || '')
  const count = typeof countOverride === 'number' ? countOverride : (session?.eventCount || 0)
  eventCount.textContent = count.toLocaleString()
  const durationMs = session?.durationMs || (session?.startTime ? Date.now() - session.startTime : 0)
  sessionDuration.textContent = fmt(durationMs)
  certDuration.textContent = fmt(durationMs)
  footerSessionId.textContent = session?.sessionId ? `${session.sessionId.slice(0, 8)}…` : 'pending'
}

function renderIdle() {
  currentSession = null
  uploadedUrl = null
  stopTimer()

  statusDot.className = 'status-dot'
  statusLabel.textContent = 'Idle'
  heroTitle.textContent = 'Record proof of work as it happens.'
  heroBody.textContent = 'Capture the real session, then send a replay that proves how the work was built.'
  proofChip.textContent = 'Verified replay'
  certStatus.textContent = 'Ready to record'
  certProofMode.textContent = 'Human authored'

  toggleVisible(sessionCard, false)
  toggleVisible(certificateCard, false)
  toggleVisible(shareBox, false)

  show(btnStart)
  hide(btnStop)
  hide(btnShare)
  hide(btnNew)
  btnStart.disabled = false
  btnStop.disabled = false
  btnShare.disabled = false
  shareLabel.textContent = '↗ Share this replay'
}

function renderRecording(session, count) {
  currentSession = session
  statusDot.className = 'status-dot recording'
  statusDot.style.background = '#ff6b78'
  statusLabel.textContent = 'Recording live'
  heroTitle.textContent = 'Capture the build, not just the final file.'
  heroBody.textContent = 'Mindprint is recording a live authorship session. Keep working normally.'
  proofChip.textContent = 'Captured live'
  certStatus.textContent = 'Recording'
  certProofMode.textContent = 'Human authored'

  setSessionMeta(session, count)
  toggleVisible(sessionCard, true)
  toggleVisible(certificateCard, true)
  toggleVisible(shareBox, false)

  hide(btnStart)
  show(btnStop)
  hide(btnShare)
  hide(btnNew)
  startTimer(session.startTime)
}

function renderStopped(session) {
  currentSession = session
  stopTimer()

  statusDot.className = 'status-dot'
  statusDot.style.background = '#46d39a'
  statusLabel.textContent = uploadedUrl ? 'Replay ready' : 'Ready to share'
  heroTitle.textContent = 'This session is now a replayable proof artifact.'
  heroBody.textContent = uploadedUrl
    ? 'Open the replay link or copy it directly into a proposal, portfolio, or application.'
    : 'Upload this session to generate a shareable replay link and authorship proof.'
  proofChip.textContent = uploadedUrl ? 'Verified replay link' : 'Human authored'
  certStatus.textContent = uploadedUrl ? 'Uploaded' : 'Stopped'
  certProofMode.textContent = 'Human authored'

  setSessionMeta(session)
  toggleVisible(sessionCard, true)
  toggleVisible(certificateCard, true)
  toggleVisible(shareBox, !!uploadedUrl)

  if (uploadedUrl) {
    shareUrl.textContent = uploadedUrl
  }

  hide(btnStart)
  hide(btnStop)
  show(btnShare)
  show(btnNew)
  btnShare.disabled = false
}

async function loadSessions() {
  const res = await send({ type: 'POPUP_LIST_SESSIONS' })
  const sessions = res?.sessions || []
  sessionsList.innerHTML = ''

  if (!sessions.length) {
    const empty = document.createElement('div')
    empty.className = 'session-row'
    empty.innerHTML = '<div class="session-row-main"><div class="session-row-title">No sessions yet</div><div class="session-row-sub">Your recent proof-of-work recordings will appear here.</div></div>'
    sessionsList.appendChild(empty)
    return
  }

  for (const session of sessions) {
    const row = document.createElement('div')
    row.className = 'session-row'

    const main = document.createElement('div')
    main.className = 'session-row-main'

    const title = document.createElement('div')
    title.className = 'session-row-title'
    title.textContent = session.title || 'Untitled session'

    const sub = document.createElement('div')
    sub.className = 'session-row-sub'
    const ago = Math.round((Date.now() - session.createdAt) / 60000)
    sub.textContent = `${ago < 1 ? 'just now' : `${ago}m ago`} · ${fmt(session.durationMs || 0)}`

    const badge = document.createElement('span')
    badge.className = `session-badge ${session.status}`
    badge.textContent = session.status

    main.appendChild(title)
    main.appendChild(sub)
    row.appendChild(main)
    row.appendChild(badge)
    sessionsList.appendChild(row)

    row.addEventListener('click', () => {
      currentSession = session
      uploadedUrl = session.status === 'uploaded' ? '' : null
      renderStopped(session)
    })
  }
}

async function pollStatus() {
  const res = await send({ type: 'POPUP_STATUS' })
  if (res?.session?.status === 'recording') {
    renderRecording(res.session, res.count || 0)
  }
}

btnStart.addEventListener('click', async () => {
  btnStart.disabled = true
  const res = await send({ type: 'POPUP_START' })
  if (res?.ok) {
    uploadedUrl = null
    renderRecording(res.session, 0)
    pollTimer = setInterval(pollStatus, 2000)
    await loadSessions()
  } else {
    alert('Could not start recording: ' + (res?.error || 'unknown error'))
    btnStart.disabled = false
  }
})

btnStop.addEventListener('click', async () => {
  btnStop.disabled = true
  clearInterval(pollTimer)
  const res = await send({ type: 'POPUP_STOP' })
  if (res?.ok) {
    uploadedUrl = null
    renderStopped(res.session)
    await loadSessions()
  } else {
    alert('Could not stop recording: ' + (res?.error || 'unknown error'))
    btnStop.disabled = false
  }
})

btnShare.addEventListener('click', async () => {
  if (!currentSession) return
  btnShare.disabled = true
  show(shareSpinner)
  shareLabel.textContent = 'Uploading replay'
  statusDot.className = 'status-dot uploading'
  statusDot.style.background = '#ffad5c'
  statusLabel.textContent = 'Uploading'

  const res = await send({ type: 'POPUP_UPLOAD', sessionId: currentSession.sessionId })
  hide(shareSpinner)
  if (res?.ok) {
    uploadedUrl = res.url
    shareUrl.textContent = res.url
    shareLabel.textContent = '↗ Share this replay'
    renderStopped(currentSession)
    await loadSessions()
  } else {
    shareLabel.textContent = '↗ Share this replay'
    renderStopped(currentSession)
    alert('Upload failed: ' + (res?.error || 'unknown error'))
  }
})

btnNew.addEventListener('click', async () => {
  renderIdle()
  await loadSessions()
})

copyBtn.addEventListener('click', async () => {
  if (!uploadedUrl) return
  await navigator.clipboard.writeText(uploadedUrl)
  copyBtn.textContent = 'Copied'
  setTimeout(() => { copyBtn.textContent = 'Copy' }, 1500)
})

shareUrl.addEventListener('click', () => {
  if (uploadedUrl) chrome.tabs.create({ url: uploadedUrl })
})

;(async () => {
  const res = await send({ type: 'POPUP_STATUS' })
  if (res?.session?.status === 'recording') {
    renderRecording(res.session, res.count || 0)
    pollTimer = setInterval(pollStatus, 2000)
  } else {
    renderIdle()
  }
  await loadSessions()
})()
