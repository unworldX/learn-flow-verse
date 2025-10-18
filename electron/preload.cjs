const { contextBridge, ipcRenderer } = require('electron');

// Expose a tiny, safe API surface for renderer processes
contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  openExternal: (target) => {
    if (typeof target === 'string') {
      ipcRenderer.send('desktop:open-external', target);
    }
  },
  openPath: (filePath) => {
    if (typeof filePath === 'string') {
      return ipcRenderer.invoke('desktop:open-path', filePath);
    }
    return Promise.resolve({ success: false, error: 'invalid-path' });
  },
});
