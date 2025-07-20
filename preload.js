const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Disk operations
  getDisks: () => ipcRenderer.invoke('get-disks'),
  getDiskInfo: (devicePath) => ipcRenderer.invoke('get-disk-info', devicePath),
  
  // Wipe operations
  wipeDisk: (options) => ipcRenderer.invoke('wipe-disk', options),
  onWipeProgress: (callback) => ipcRenderer.on('wipe-progress', callback),
  
  // Format operations
  formatDisk: (options) => ipcRenderer.invoke('format-disk', options),
  onFormatProgress: (callback) => ipcRenderer.on('format-progress', callback),
  
  // UI helpers
  showConfirmation: (message) => ipcRenderer.invoke('show-confirmation', message),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});