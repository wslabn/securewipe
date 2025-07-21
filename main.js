const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');

// Import our modules
const DiskManager = require('./src/disk-manager');
const WipeEngine = require('./src/wipe-engine');
const FormatManager = require('./src/format-manager');
const SafetyChecks = require('./src/safety-checks');

let mainWindow;
const isDev = process.argv.includes('--dev');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    autoHideMenuBar: true
  });

  mainWindow.loadFile('renderer/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('get-platform', () => {
  return os.platform();
});

ipcMain.handle('get-disks', async () => {
  try {
    return await DiskManager.getAvailableDisks();
  } catch (error) {
    console.error('Error getting disks:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-disk-info', async (event, devicePath) => {
  try {
    return await DiskManager.getDiskInfo(devicePath);
  } catch (error) {
    console.error('Error getting disk info:', error);
    return { error: error.message };
  }
});

ipcMain.handle('wipe-disk', async (event, options) => {
  try {
    const safetyCheck = await SafetyChecks.validateWipeOperation(options);
    if (!safetyCheck.safe) {
      return { error: safetyCheck.reason };
    }
    
    return await WipeEngine.wipeDisk(options, (progress) => {
      mainWindow.webContents.send('wipe-progress', progress);
    });
  } catch (error) {
    console.error('Error wiping disk:', error);
    return { error: error.message };
  }
});

ipcMain.handle('format-disk', async (event, options) => {
  try {
    const safetyCheck = await SafetyChecks.validateFormatOperation(options);
    if (!safetyCheck.safe) {
      return { error: safetyCheck.reason };
    }
    
    return await FormatManager.formatDisk(options, (progress) => {
      mainWindow.webContents.send('format-progress', progress);
    });
  } catch (error) {
    console.error('Error formatting disk:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-system-disk', async () => {
  try {
    return await SafetyChecks.getBootDeviceInfo();
  } catch (error) {
    console.error('Error getting system disk:', error);
    return { error: error.message };
  }
});

ipcMain.handle('process-multiple-disks', async (event, options) => {
  try {
    const { disks, operation } = options;
    
    // Process all disks in parallel
    const diskPromises = disks.map(async (disk, index) => {
      const diskOptions = { ...options, device: disk.device };
      const abortController = new AbortController();
      
      // Track this operation for cancellation
      runningOperations.set(disk.device, { abortController });
      
      // Safety check for each disk
      const safetyCheck = operation === 'wipe' 
        ? await SafetyChecks.validateWipeOperation(diskOptions)
        : await SafetyChecks.validateFormatOperation(diskOptions);
        
      if (!safetyCheck.safe) {
        runningOperations.delete(disk.device);
        return { device: disk.device, error: safetyCheck.reason };
      }
      
      // Notify start of processing for this disk
      mainWindow.webContents.send('multi-disk-progress', {
        device: disk.device,
        status: `Starting ${disk.device}...`,
        totalDisks: disks.length
      });
      
      try {
        let result;
        if (operation === 'wipe') {
          result = await WipeEngine.wipeDisk(diskOptions, (progress) => {
            mainWindow.webContents.send('multi-disk-progress', {
              ...progress,
              device: disk.device,
              totalDisks: disks.length
            });
          }, abortController.signal);
        } else {
          result = await FormatManager.formatDisk(diskOptions, (progress) => {
            mainWindow.webContents.send('multi-disk-progress', {
              ...progress,
              device: disk.device,
              totalDisks: disks.length
            });
          }, abortController.signal);
        }
        
        runningOperations.delete(disk.device);
        return { device: disk.device, ...result };
      } catch (error) {
        runningOperations.delete(disk.device);
        if (error.message === 'Operation cancelled') {
          return { device: disk.device, cancelled: true };
        }
        return { device: disk.device, error: error.message };
      }
    });
    
    // Wait for all disks to complete
    const results = await Promise.all(diskPromises);
    
    return { results };
  } catch (error) {
    console.error('Error processing multiple disks:', error);
    return { error: error.message };
  }
});

// Track running operations for cancellation
const runningOperations = new Map();

ipcMain.handle('cancel-disk-operation', async (event, device) => {
  try {
    const operation = runningOperations.get(device);
    if (operation && operation.abortController) {
      operation.abortController.abort();
      runningOperations.delete(device);
      return { success: true };
    }
    return { error: 'No running operation found for device' };
  } catch (error) {
    console.error('Error cancelling disk operation:', error);
    return { error: error.message };
  }
});

ipcMain.handle('show-confirmation', async (event, message) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Cancel', 'Proceed'],
    defaultId: 0,
    title: 'Confirm Operation',
    message: message,
    detail: 'This operation cannot be undone!'
  });
  
  return result.response === 1;
});