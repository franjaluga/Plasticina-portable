(function () {
  'use strict';

  const base64 = window.Plasticina.db.internals.base64;
  const STORE = 'plasticina_sqlite_db_v1';
  const DB_NAME = 'plasticina_sqlite';
  const OBJECT_STORE = 'files';

  function available() {
    return typeof window.indexedDB !== 'undefined' || typeof window.localStorage !== 'undefined';
  }

  function openIndexedDb() {
    return new Promise(function (resolve, reject) {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = function () {
        const database = request.result;
        if (!database.objectStoreNames.contains(OBJECT_STORE)) database.createObjectStore(OBJECT_STORE);
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function indexedRead() {
    return openIndexedDb().then(function (database) {
      return new Promise(function (resolve, reject) {
        const transaction = database.transaction(OBJECT_STORE, 'readonly');
        const request = transaction.objectStore(OBJECT_STORE).get(STORE);
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error); };
      }).then(function (value) {
        database.close();
        return value;
      }, function (error) {
        database.close();
        throw error;
      });
    });
  }

  function indexedWrite(bytes) {
    return openIndexedDb().then(function (database) {
      return new Promise(function (resolve, reject) {
        const transaction = database.transaction(OBJECT_STORE, 'readwrite');
        transaction.objectStore(OBJECT_STORE).put(bytes, STORE);
        transaction.oncomplete = function () { resolve(); };
        transaction.onerror = function () { reject(transaction.error); };
      }).then(function () {
        database.close();
      }, function (error) {
        database.close();
        throw error;
      });
    });
  }

  function fallbackRead() {
    try {
      const value = window.localStorage.getItem(STORE);
      return Promise.resolve(value === null ? null : base64.fromBase64(value));
    } catch (error) {
      return Promise.resolve(null);
    }
  }

  function fallbackWrite(bytes) {
    try {
      window.localStorage.setItem(STORE, base64.toBase64(bytes));
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function read() {
    if (typeof window.indexedDB === 'undefined') return fallbackRead();
    return indexedRead().catch(fallbackRead);
  }

  function write(bytes) {
    if (typeof window.indexedDB === 'undefined') return fallbackWrite(bytes);
    return indexedWrite(bytes).catch(function () { return fallbackWrite(bytes); });
  }

  window.Plasticina.db.internals.adapters = window.Plasticina.db.internals.adapters || {};
  window.Plasticina.db.internals.adapters.browser = { name: 'browser', available: available, read: read, write: write };
})();
