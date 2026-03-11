'use strict'

const { app, Tray, Menu, nativeImage, dialog, BrowserWindow } = require('electron')
const { spawn }         = require('child_process')
const { writeFileSync } = require('fs')
const { join }          = require('path')
const { homedir }       = require('os')

const WATCHER_BIN = join(__dirname, 'watcher')

let tray      = null
let watcher   = null
let recording = false
let events    = []

// ── Tray icon ─────────────────────────────────────────────────────────────────
const TRANSPARENT_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk' +
  'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'
)
function icon() {
  const img = nativeImage.createFromBuffer(TRANSPARENT_1PX)
  img.setTemplateImage(true)
  return img
}

// ── Menu ──────────────────────────────────────────────────────────────────────
function buildMenu() {
  const items = recording
    ? [{ label: `⏹  Stop  (${events.length} events)`, click: () => stopRecording() }]
    : [{ label: '⏺  Start Recording', click: startRecording }]
  items.push({ type: 'separator' }, { label: 'Quit', click: () => app.quit() })
  return Menu.buildFromTemplate(items)
}
function refreshTray() {
  tray.setTitle(recording ? ' ⏺' : ' ○')
  tray.setContextMenu(buildMenu())
}

// ── Recording ─────────────────────────────────────────────────────────────────
function startRecording() {
  events = []; recording = true; refreshTray()
  watcher = spawn(WATCHER_BIN)
  let buf = ''

  watcher.stdout.on('data', chunk => {
    buf += chunk.toString()
    const lines = buf.split('\n'); buf = lines.pop()
    for (const line of lines) {
      if (!line.trim()) continue
      let obj; try { obj = JSON.parse(line) } catch { continue }
      if      (obj.status === 'ready') { console.log('[watcher] ready') }
      else if (obj.error)              { dialog.showErrorBox('Watcher error', `${obj.error}\n\n${obj.detail||''}`); stopRecording(true) }
      else                             { events.push(obj); if (events.length % 10 === 0) refreshTray(); console.log(obj.ts, obj.app, obj.type, obj.text) }
    }
  })

  watcher.stderr.on('data', d => console.error('[watcher]', d.toString().trim()))
  watcher.on('exit', code => { console.log(`[watcher] exited (${code})`); if (recording) { recording = false; refreshTray() } })
}

function stopRecording(skipSave = false) {
  recording = false
  if (watcher) { watcher.kill('SIGTERM'); watcher = null }
  refreshTray()
  if (skipSave || events.length === 0) return

  const outPath = join(homedir(), 'Desktop', `keylog_${Date.now()}.json`)
  writeFileSync(outPath, JSON.stringify(events, null, 2), 'utf8')
  console.log(`[main] saved ${events.length} events → ${outPath}`)

  openViewer(events)
}

// ── Viewer window ─────────────────────────────────────────────────────────────
function openViewer(eventData) {
  const win = new BrowserWindow({
    width:  1440,
    height: 900,
    title:  'Keystroke Replay',
    webPreferences: {
      preload:          join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })

  win.loadFile('replay.html')

  // Inject event data once the page has loaded its JS
  win.webContents.once('did-finish-load', () => {
    // Pass raw JSON string; replay.html parses it
    win.webContents.send('viewer-data', JSON.stringify(eventData))
  })
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
app.on('window-all-closed', () => { /* stay alive as menu-bar app */ })

app.whenReady().then(() => {
  if (app.dock) app.dock.hide()
  tray = new Tray(icon())
  tray.setToolTip('Docs Observer')
  tray.on('click', () => tray.popUpContextMenu())
  refreshTray()
})

app.on('before-quit', () => { if (watcher) watcher.kill('SIGTERM') })
