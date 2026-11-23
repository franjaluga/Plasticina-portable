(function () {
  'use strict';

  let bytes = null;

  function available() {
    return Object.prototype.hasOwnProperty.call(window, '__PLASTICINA_SQLITE_BYTES__');
  }

  function read() {
    if (bytes === null && window.__PLASTICINA_SQLITE_BYTES__) {
      bytes = new Uint8Array(window.__PLASTICINA_SQLITE_BYTES__);
    }
    return Promise.resolve(bytes === null ? null : new Uint8Array(bytes));
  }

  function write(next) {
    bytes = new Uint8Array(next);
    window.__PLASTICINA_SQLITE_BYTES__ = bytes;
    return Promise.resolve();
  }

  window.Plasticina.db.internals.adapters = window.Plasticina.db.internals.adapters || {};
  window.Plasticina.db.internals.adapters.memory = { name: 'memory', available: available, read: read, write: write };
})();
