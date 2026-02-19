const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const Registry = require('winreg');

// Hardware-Beschleunigung deaktivieren für weniger CPU-Last im Hintergrund
app.disableHardwareAcceleration();

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

const getSteamPath = async () => {
  return new Promise((resolve) => {
    try {
      const regKey = new Registry({
        hive: Registry.HKLM,
        key: '\\Software\\Valve\\Steam'
      });
      regKey.get('InstallPath', (err, item) => {
        if (err) resolve(null);
        else resolve(item.value);
      });
    } catch (err) {
      resolve(null);
    }
  });
};

const parseAcfFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = {};
    const lines = content.split('\n');
    lines.forEach(line => {
      const match = line.match(/"(.+?)"\s+"(.+?)"/);
      if (match) data[match[1]] = match[2];
    });
    return data;
  } catch (err) {
    return null;
  }
};

const getSteamGames = async () => {
  const steamPath = await getSteamPath();
  if (!steamPath) return [];
  const steamAppsPath = path.join(steamPath, 'steamapps');

  try {
    if (!fs.existsSync(steamAppsPath)) return [];
    const files = fs.readdirSync(steamAppsPath);
    const games = [];

    files.forEach(file => {
      if (file.endsWith('.acf')) {
        const gameData = parseAcfFile(path.join(steamAppsPath, file));
        if (gameData && gameData.appid) {
          games.push({
            appid: gameData.appid,
            name: gameData.name,
            installdir: gameData.installdir,
            source: 'steam'
          });
        }
      }
    });
    return games;
  } catch (err) {
    return [];
  }
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
      nodeIntegration: false,
      backgroundThrottling: true // CPU-Sparmodus aktivieren
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('get-games', () => getGames());
ipcMain.handle('get-steam-games', async () => getSteamGames());

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

  const newGame = {
    id: Date.now(),
    name: path.basename(gamePath, '.exe'),
    path: gamePath,
    image: imagePath,
    source: 'local'
  };

  const games = getGames();
  games.push(newGame);
  saveGames(games);
  return newGame;
});

ipcMain.handle('add-steam-game', async (event, steamGame) => {
  const games = getGames();
  if (games.find(g => g.appid === steamGame.appid)) return null;

  const imgResult = await dialog.showOpenDialog(mainWindow, {
    title: `Select Cover Art for ${steamGame.name}`,
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'webp', 'jpeg'] }],
    properties: ['openFile']
  });

  const newGame = {
    id: Date.now(),
    name: steamGame.name,
    appid: steamGame.appid,
    image: imgResult.canceled ? null : imgResult.filePaths[0],
    source: 'steam'
  };

  games.push(newGame);
  saveGames(games);
  return newGame;
});

ipcMain.on('remove-game', (event, id) => {
  const games = getGames().filter(g => g.id !== id);
  saveGames(games);
});

ipcMain.on('launch-game', (event, game) => {
  if (mainWindow) mainWindow.minimize(); // Versteckt den Launcher beim Spielen

  if (game.source === 'steam') {
    const steamUrl = `steam://run/${game.appid}`;
    exec(`start ${steamUrl}`, (err) => {
      if (err) console.error('Failed to launch Steam game:', err);
    });
  } else {
    try {
      const child = spawn(game.path, [], {
        detached: true,
        stdio: 'ignore',
        cwd: path.dirname(game.path)
      });
      child.unref();
    } catch (err) {
      console.error('Failed to launch local game:', err);
    }
  }
});

ipcMain.on('minimize-app', () => mainWindow.minimize());
ipcMain.on('close-app', () => app.quit());