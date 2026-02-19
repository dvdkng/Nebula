const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
const dataPath = path.join(app.getPath('userData'), 'nebula_v3.json');

const getGames = () => {
  try {
    if (!fs.existsSync(dataPath)) return [];
    return JSON.parse(fs.readFileSync(dataPath));
  } catch (err) {
    return [];
  }
};

const saveGames = (games) => {
  fs.writeFileSync(dataPath, JSON.stringify(games, null, 2));
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    frame: false,
    icon: path.join(__dirname, 'assets/logo.ico'),
    backgroundColor: '#050505',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('get-games', () => getGames());

ipcMain.handle('add-game', async () => {
  const exeResult = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Game Executable',
    filters: [{ name: 'Executables', extensions: ['exe'] }],
    properties: ['openFile']
  });

  if (exeResult.canceled) return null;

  const imgResult = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Cover Art',
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'webp', 'jpeg'] }],
    properties: ['openFile']
  });

  const gamePath = exeResult.filePaths[0];
  const imagePath = imgResult.canceled ? null : imgResult.filePaths[0];
  const gameName = path.basename(gamePath, '.exe');

  const games = getGames();
  const newGame = {
    id: Date.now(),
    name: gameName,
    path: gamePath,
    image: imagePath
  };

  games.push(newGame);
  saveGames(games);
  return newGame;
});

ipcMain.on('remove-game', (event, id) => {
  const games = getGames().filter(g => g.id !== id);
  saveGames(games);
});

ipcMain.on('launch-game', (event, gamePath) => {
  const child = spawn(gamePath, [], {
    detached: true,
    stdio: 'ignore',
    cwd: path.dirname(gamePath)
  });
  child.unref();
});

ipcMain.on('minimize-app', () => mainWindow.minimize());
ipcMain.on('close-app', () => app.quit());