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

  window.Plasticina.db.internals.adapters = window.Plasticina.db.internals.adapters || {};
  window.Plasticina.db.internals.adapters.electron = { name: 'electron', available: available, read: read, write: write };
})();
