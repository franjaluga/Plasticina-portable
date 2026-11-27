(function () {
  'use strict';

  function available() {
    return Boolean(window.plasticinaSqlite && typeof window.plasticinaSqlite.read === 'function');
  }

  function read() {
    return Promise.resolve(window.plasticinaSqlite.read()).then(function (value) {
      if (!value || typeof value !== 'object') return { bytes: null, revision: 0 };
      const bytes = value.bytes || value;
      return {
        bytes: bytes === null || bytes === undefined ? null : (bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)),
        revision: Number(value.revision) || 0
      };
    });
  }

  function write(bytes) {
    const writerId = window.Plasticina.db.internals.writerId;
    return Promise.resolve(window.plasticinaSqlite.write(bytes, writerId)).then(function (value) {
      return value && typeof value === 'object' ? value : {};
    });
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
    if (typeof window.plasticinaSqlite.onChanged !== 'function') return function () {};
    return window.plasticinaSqlite.onChanged(handler);
  }

  window.Plasticina.db.internals.adapters = window.Plasticina.db.internals.adapters || {};
  window.Plasticina.db.internals.adapters.electron = {
    name: 'electron', available: available, read: read, write: write, withLock: withLock, onChanged: onChanged
  };
})();
