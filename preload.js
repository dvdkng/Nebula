const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getGames: () => ipcRenderer.invoke('get-games'),
  getSteamGames: () => ipcRenderer.invoke('get-steam-games'),
  addGame: () => ipcRenderer.invoke('add-game'),
  addSteamGame: (game) => ipcRenderer.invoke('add-steam-game', game),
  removeGame: (id) => ipcRenderer.send('remove-game', id),
  launchGame: (game) => ipcRenderer.send('launch-game', game),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  closeApp: () => ipcRenderer.send('close-app'),
  saveGames: (games) => ipcRenderer.send('save-games', games) // NEW
});