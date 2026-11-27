const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('plasticinaSqlite', {
  read: function () {
    return ipcRenderer.invoke('sqlite:read');
  },
  write: function (bytes, writerId) {
    return ipcRenderer.invoke('sqlite:write', bytes, writerId);
  },
  acquireLock: function () {
    return ipcRenderer.invoke('sqlite:acquire-lock');
  },
  releaseLock: function (token) {
    return ipcRenderer.invoke('sqlite:release-lock', token);
  },
  onChanged: function (handler) {
    const listener = function (_event, payload) { handler(payload || {}); };
    ipcRenderer.on('sqlite:changed', listener);
    return function () { ipcRenderer.removeListener('sqlite:changed', listener); };
  }
});
