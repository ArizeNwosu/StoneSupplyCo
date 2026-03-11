'use strict'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('bridge', {
  // Main process calls win.webContents.send('viewer-data', jsonString)
  // Viewer calls window.bridge.onData(cb) to receive it
  onData: (cb) => ipcRenderer.on('viewer-data', (_event, data) => cb(data)),
})
