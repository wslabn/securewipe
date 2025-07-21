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
  
  // System info
  getSystemDisk: () => ipcRenderer.invoke('get-system-disk'),
  
  // Multiple disk operations
  processMultipleDisks: (options) => ipcRenderer.invoke('process-multiple-disks', options),
  onMultiDiskProgress: (callback) => ipcRenderer.on('multi-disk-progress', callback),
  cancelDiskOperation: (device) => ipcRenderer.invoke('cancel-disk-operation', device),
  
  // UI helpers
  showConfirmation: (message) => ipcRenderer.invoke('show-confirmation', message),
  updateSplashStatus: (status) => ipcRenderer.invoke('update-splash-status', status),
  
  // Update functions
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  performUpdate: () => ipcRenderer.invoke('perform-update'),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});