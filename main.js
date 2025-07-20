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
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false
  });

  mainWindow.loadFile('renderer/index.html');
  
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

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