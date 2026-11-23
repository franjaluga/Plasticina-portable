const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('plasticinaSqlite', {
  read: function () {
    return ipcRenderer.invoke('sqlite:read');
  },
  write: function (bytes) {
    return ipcRenderer.invoke('sqlite:write', bytes);
  }
});
