const { app, BrowserWindow, ipcMain, desktopCapturer, session } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../public/icon-512.svg')
  });

  // Enable media permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'microphone', 'camera', 'audioCapture', 'videoCapture'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Load the Next.js app
  if (isDev) {
    // In development, load from Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from your deployed website
    mainWindow.loadURL('https://online.rv2class.com');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle screen share source selection with AUDIO support
ipcMain.handle('get-screen-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 150, height: 150 }
    });

    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      appIcon: source.appIcon ? source.appIcon.toDataURL() : null
    }));
  } catch (error) {
    console.error('Error getting screen sources:', error);
    return [];
  }
});

// Handle getting media stream with system audio
ipcMain.handle('get-screen-stream', async (event, sourceId, includeAudio) => {
  try {
    // Return the constraints that the renderer should use
    return {
      audio: includeAudio ? {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId
        }
      } : false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          minWidth: 1280,
          maxWidth: 1920,
          minHeight: 720,
          maxHeight: 1080,
          minFrameRate: 30
        }
      }
    };
  } catch (error) {
    console.error('Error preparing stream constraints:', error);
    throw error;
  }
});

// Handle window controls for screen sharing UX
ipcMain.handle('minimize-and-focus-shared', () => {
  if (mainWindow) {
    // Minimize the app window so user sees the shared content
    mainWindow.minimize();
    return true;
  }
  return false;
});

ipcMain.handle('show-app-window', () => {
  if (mainWindow) {
    // Restore and focus the app window (without stopping screen share)
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    return true;
  }
  return false;
});

ipcMain.handle('get-window-state', () => {
  if (mainWindow) {
    return {
      isMinimized: mainWindow.isMinimized(),
      isVisible: mainWindow.isVisible(),
    };
  }
  return null;
});
