const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater }                  = require('electron-updater');
const log                              = require('electron-log');
const path                             = require('path');
const fs                               = require('fs');

// ── Logging ──────────────────────────────────────────────────
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting — version', app.getVersion());

// ── Window ───────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1280,
    height:    800,
    minWidth:  900,
    minHeight: 600,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

  // Hide default menu bar in production
  if (app.isPackaged) mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  // Only check for updates in packaged builds
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── Auto-updater events ───────────────────────────────────────
autoUpdater.on('checking-for-update',  () => log.info('Checking for update...'));
autoUpdater.on('update-not-available', () => log.info('Up to date.'));
autoUpdater.on('error',            err => log.error('Updater error:', err));

autoUpdater.on('update-available', info => {
  log.info('Update available:', info.version);
  mainWindow?.webContents.send('update-available', info.version);
});

autoUpdater.on('download-progress', prog => {
  mainWindow?.webContents.send('update-progress', Math.round(prog.percent));
});

autoUpdater.on('update-downloaded', info => {
  log.info('Update downloaded:', info.version);
  mainWindow?.webContents.send('update-downloaded', info.version);
});

// ── IPC ───────────────────────────────────────────────────────
ipcMain.handle('install-update',    () => autoUpdater.quitAndInstall());
ipcMain.handle('check-for-updates', () => autoUpdater.checkForUpdates());
ipcMain.handle('get-version',       () => app.getVersion());

// ── Library Sync (UNC path) ───────────────────────────────────
ipcMain.handle('read-library', async (_e, uncPath) => {
  try {
    const filePath = path.join(uncPath, 'bibliothek.json');
    if (!fs.existsSync(filePath)) return { success: false, error: 'Datei nicht gefunden' };
    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data };
  } catch (e) {
    log.error('read-library error:', e.message);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('write-library', async (_e, uncPath, content) => {
  try {
    if (!fs.existsSync(uncPath)) fs.mkdirSync(uncPath, { recursive: true });
    const filePath = path.join(uncPath, 'bibliothek.json');
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (e) {
    log.error('write-library error:', e.message);
    return { success: false, error: e.message };
  }
});
