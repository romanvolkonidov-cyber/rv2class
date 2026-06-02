const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Screen sharing with audio support
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  
  getScreenStream: (sourceId, includeAudio) => 
    ipcRenderer.invoke('get-screen-stream', sourceId, includeAudio),
  
  // Window controls for screen sharing UX
  minimizeAndFocusShared: () => ipcRenderer.invoke('minimize-and-focus-shared'),
  showAppWindow: () => ipcRenderer.invoke('show-app-window'),
  getWindowState: () => ipcRenderer.invoke('get-window-state'),
  
  // Check if running in Electron
  isElectron: true
});

// Also expose a simpler check
contextBridge.exposeInMainWorld('isElectron', true);
