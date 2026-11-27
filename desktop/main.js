const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
}

const DB_FILE = path.join(app.getPath('userData'), 'plasticina.sqlite');
const RENDERER_INDEX = path.join(
  __dirname,
  '..',
  'angular-shell',
  'dist',
  'angular-shell',
  'browser',
  'index.html'
);

function readDatabase() {
  if (!fs.existsSync(DB_FILE)) return null;
  return new Uint8Array(fs.readFileSync(DB_FILE));
}

function writeDatabase(bytes) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const temporary = DB_FILE + '.tmp-' + process.pid + '-' + Date.now();
  fs.writeFileSync(temporary, Buffer.from(bytes));
  fs.renameSync(temporary, DB_FILE);
}

const lockWaiters = [];
const lockOwners = new Map();
let lockHeld = false;
let lockSequence = 0;
let databaseRevision = 1;

function acquireLock(event) {
  if (!lockHeld) {
    lockHeld = true;
    const token = ++lockSequence;
    lockOwners.set(token, event.sender.id);
    return token;
  }
  return new Promise(function (resolve) {
    lockWaiters.push({ senderId: event.sender.id, resolve: resolve });
  });
}

function releaseLock(token) {
  if (!lockOwners.has(token)) return;
  lockOwners.delete(token);
  const next = lockWaiters.shift();
  if (!next) {
    lockHeld = false;
    return;
  }
  const nextToken = ++lockSequence;
  lockOwners.set(nextToken, next.senderId);
  next.resolve(nextToken);
}

function releaseLocksFor(senderId) {
  lockOwners.forEach(function (owner, token) {
    if (owner === senderId) releaseLock(token);
  });
  for (let index = lockWaiters.length - 1; index >= 0; index--) {
    if (lockWaiters[index].senderId === senderId) lockWaiters.splice(index, 1);
  }
}

function notifyDatabaseChanged(sourceId, writerId, revision) {
  BrowserWindow.getAllWindows().forEach(function (window) {
    if (window.isDestroyed() || window.webContents.id === sourceId) return;
    window.webContents.send('sqlite:changed', { writerId: writerId, revision: revision });
  });
}

ipcMain.handle('sqlite:read', function () {
  const bytes = readDatabase();
  return { bytes: bytes, revision: databaseRevision };
});
ipcMain.handle('sqlite:write', function (event, bytes, writerId) {
  writeDatabase(bytes);
  databaseRevision += 1;
  notifyDatabaseChanged(event.sender.id, writerId, databaseRevision);
  return { revision: databaseRevision };
});
ipcMain.handle('sqlite:acquire-lock', function (event) { return acquireLock(event); });
ipcMain.handle('sqlite:release-lock', function (_event, token) { releaseLock(token); });

app.on('web-contents-created', function (_event, contents) {
  contents.on('destroyed', function () { releaseLocksFor(contents.id); });
});

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Plasticina',
    backgroundColor: '#f8fafc',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(RENDERER_INDEX);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
