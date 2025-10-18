const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

try {
  // Handle Squirrel.Windows events (first run) and quit immediately
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch (_) {
  // optional dependency; ignore if unavailable
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    backgroundColor: '#0b0b0b',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
    // Optional: open devtools
    // win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '..', 'web-dist', 'index.html');
    win.loadURL(
      url.format({ pathname: indexPath, protocol: 'file:', slashes: true })
    );
    // Alternatively: win.loadFile(indexPath);
  }

  // Open external links in the default browser
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    try {
      const isFile = target.startsWith('file:');
      const isDevServer = /^https?:\/\/localhost:\d+/.test(target);
      if (!isFile && !isDevServer) {
        shell.openExternal(target);
        return { action: 'deny' };
      }
    } catch (_) {
      // ignore
    }
    return { action: 'allow' };
  });

  win.webContents.on('will-navigate', (e, navUrl) => {
    const isDevUrl = /^https?:\/\/localhost:\d+/.test(navUrl);
    const isLocalFile = navUrl.startsWith('file:');
    if (!isDevUrl && !isLocalFile) {
      e.preventDefault();
      shell.openExternal(navUrl);
    }
  });

  return win;
}

ipcMain.on('desktop:open-external', (_event, target) => {
  if (typeof target === 'string' && target.trim().length > 0) {
    shell.openExternal(target).catch(() => {
      // ignore errors
    });
  }
});

ipcMain.handle('desktop:open-path', async (_event, filePath) => {
  if (typeof filePath !== 'string' || filePath.trim().length === 0) {
    return { success: false, error: 'invalid-path' };
  }
  const error = await shell.openPath(filePath);
  if (error) {
    return { success: false, error };
  }
  return { success: true };
});

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createMainWindow();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
