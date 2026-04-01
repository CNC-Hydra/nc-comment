const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, safe API to the renderer (index.html)
contextBridge.exposeInMainWorld('electronAPI', {
  // Version
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Update flow
  checkForUpdates:  () => ipcRenderer.invoke('check-for-updates'),
  installUpdate:    () => ipcRenderer.invoke('install-update'),

  // Update events (renderer registers callbacks)
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (_e, version) => cb(version)),
  onUpdateProgress:  (cb) => ipcRenderer.on('update-progress',  (_e, percent) => cb(percent)),
  onUpdateDownloaded:(cb) => ipcRenderer.on('update-downloaded', (_e, version) => cb(version))
});
