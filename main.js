const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const Registry = require('winreg');

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

// Get Steam installation path from registry
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

// Parse Steam ACF manifest file to get game info
const parseAcfFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = {};
    const lines = content.split('\n');

    lines.forEach(line => {
      const match = line.match(/"(.+?)"\s+"(.+?)"/);
      if (match) {
        data[match[1]] = match[2];
      }
    });

    return data;
  } catch (err) {
    return null;
  }
};

// Get list of installed Steam games
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
        const acfPath = path.join(steamAppsPath, file);
        const gameData = parseAcfFile(acfPath);

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
      nodeIntegration: false
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
  const gameName = path.basename(gamePath, '.exe');

  const games = getGames();
  const newGame = {
    id: Date.now(),
    name: gameName,
    path: gamePath,
    image: imagePath,
    source: 'local'
  };

  games.push(newGame);
  saveGames(games);
  return newGame;
});

ipcMain.handle('add-steam-game', async (event, steamGame) => {
  const games = getGames();

  // Check if game already added
  if (games.find(g => g.appid === steamGame.appid)) {
    return null;
  }

  const imgResult = await dialog.showOpenDialog(mainWindow, {
    title: `Select Cover Art for ${steamGame.name}`,
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'webp', 'jpeg'] }],
    properties: ['openFile']
  });

  const imagePath = imgResult.canceled ? null : imgResult.filePaths[0];

  const newGame = {
    id: Date.now(),
    name: steamGame.name,
    appid: steamGame.appid,
    image: imagePath,
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
  if (game.source === 'steam') {
    // Launch Steam game via steam protocol
    const steamUrl = `steam://run/${game.appid}`;
    const { execSync } = require('child_process');
    try {
      execSync(`start ${steamUrl}`, { shell: true, stdio: 'ignore' });
    } catch (err) {
      console.error('Failed to launch Steam game:', err);
    }
  } else {
    // Launch local game
    const child = spawn(game.path, [], {
      detached: true,
      stdio: 'ignore',
      cwd: path.dirname(game.path)
    });
    child.unref();
  }
});

ipcMain.on('minimize-app', () => mainWindow.minimize());
ipcMain.on('close-app', () => app.quit());