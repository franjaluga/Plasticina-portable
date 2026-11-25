const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('plasticinaSqlite', {
  read: function () {
    return ipcRenderer.invoke('sqlite:read');
  },
  write: function (bytes) {
    return ipcRenderer.invoke('sqlite:write', bytes);
  },
  acquireLock: function () {
    return ipcRenderer.invoke('sqlite:acquire-lock');
  },
  releaseLock: function (token) {
    return ipcRenderer.invoke('sqlite:release-lock', token);
  },
  onChanged: function (handler) {
    ipcRenderer.on('sqlite:changed', function () { handler(); });
  }
});
