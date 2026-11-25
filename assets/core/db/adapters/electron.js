(function () {
  'use strict';

  function available() {
    return Boolean(window.plasticinaSqlite && typeof window.plasticinaSqlite.read === 'function');
  }

  function read() {
    return Promise.resolve(window.plasticinaSqlite.read()).then(function (value) {
      if (value === null || value === undefined) return null;
      return value instanceof Uint8Array ? value : new Uint8Array(value);
    });
  }

  function write(bytes) {
    return Promise.resolve(window.plasticinaSqlite.write(bytes));
  }

  function withLock(callback) {
    let token;
    return Promise.resolve(window.plasticinaSqlite.acquireLock()).then(function (value) {
      token = value;
      return callback();
    }).then(function (result) {
      return Promise.resolve(window.plasticinaSqlite.releaseLock(token)).then(function () { return result; });
    }, function (error) {
      if (token === undefined) throw error;
      return Promise.resolve(window.plasticinaSqlite.releaseLock(token)).then(function () { throw error; });
    });
  }

  function onChanged(handler) {
    if (typeof window.plasticinaSqlite.onChanged === 'function') window.plasticinaSqlite.onChanged(handler);
  }

  window.Plasticina.db.internals.adapters = window.Plasticina.db.internals.adapters || {};
  window.Plasticina.db.internals.adapters.electron = {
    name: 'electron', available: available, read: read, write: write, withLock: withLock, onChanged: onChanged
  };
})();
