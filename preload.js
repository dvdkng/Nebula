const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getGames: () => ipcRenderer.invoke('get-games'),
  addGame: () => ipcRenderer.invoke('add-game'),
  removeGame: (id) => ipcRenderer.send('remove-game', id),
  launchGame: (path) => ipcRenderer.send('launch-game', path),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  closeApp: () => ipcRenderer.send('close-app')
});