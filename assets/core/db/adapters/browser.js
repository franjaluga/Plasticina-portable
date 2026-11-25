(function () {
  'use strict';

  const base64 = window.Plasticina.db.internals.base64;
  const STORE = 'plasticina_sqlite_db_v1';
  const DB_NAME = 'plasticina_sqlite';
  const OBJECT_STORE = 'files';
  const LOCK_STORE = 'locks';
  const LOCK_KEY = 'sqlite-write';
  const LOCK_NAME = 'plasticina-sqlite-write';
  const CHANNEL_NAME = 'plasticina-sqlite-changed';
  const LEASE_MS = 5000;
  const FALLBACK_LOCK_KEY = 'plasticina_sqlite_lock_v1';
  let channel = null;

  function available() {
    return typeof window.indexedDB !== 'undefined' || typeof window.localStorage !== 'undefined';
  }

  function openIndexedDb() {
    return new Promise(function (resolve, reject) {
      const request = window.indexedDB.open(DB_NAME, 2);
      request.onupgradeneeded = function () {
        const database = request.result;
        if (!database.objectStoreNames.contains(OBJECT_STORE)) database.createObjectStore(OBJECT_STORE);
        if (!database.objectStoreNames.contains(LOCK_STORE)) database.createObjectStore(LOCK_STORE);
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function withStore(storeName, mode, operation) {
    return openIndexedDb().then(function (database) {
      return new Promise(function (resolve, reject) {
        const transaction = database.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        let result;
        transaction.oncomplete = function () { resolve(result); };
        transaction.onerror = function () { reject(transaction.error); };
        transaction.onabort = function () { reject(transaction.error); };
        operation(store, function (value) { result = value; });
      }).then(function (value) {
        database.close();
        return value;
      }, function (error) {
        database.close();
        throw error;
      });
    });
  }

  function indexedRead() {
    return withStore(OBJECT_STORE, 'readonly', function (store, done) {
      const request = store.get(STORE);
      request.onsuccess = function () { done(request.result || null); };
    });
  }

  function indexedWrite(bytes) {
    return withStore(OBJECT_STORE, 'readwrite', function (store, done) {
      store.put(bytes, STORE);
      done();
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
    const pending = typeof window.indexedDB === 'undefined' ? fallbackWrite(bytes) : indexedWrite(bytes).catch(fallbackWrite);
    return pending.then(function () {
      notifyChanged();
    });
  }

  function readFallbackLease() {
    try {
      const value = window.localStorage.getItem(FALLBACK_LOCK_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function acquireLockOwner(owner) {
    if (typeof window.indexedDB === 'undefined') {
      return Promise.resolve(function () {
        const lease = readFallbackLease();
        if (lease && Number(lease.expiresAt) >= Date.now()) return false;
        window.localStorage.setItem(FALLBACK_LOCK_KEY, JSON.stringify({ owner: owner, expiresAt: Date.now() + LEASE_MS }));
        return true;
      }());
    }
    return withStore(LOCK_STORE, 'readwrite', function (store, done) {
      const request = store.get(LOCK_KEY);
      request.onsuccess = function () {
        const lease = request.result;
        if (!lease || Number(lease.expiresAt) < Date.now()) {
          store.put({ owner: owner, expiresAt: Date.now() + LEASE_MS }, LOCK_KEY);
          done(true);
          return;
        }
        done(false);
      };
    });
  }

  function renewLockOwner(owner) {
    if (typeof window.indexedDB === 'undefined') {
      const lease = readFallbackLease();
      if (lease && lease.owner === owner) {
        window.localStorage.setItem(FALLBACK_LOCK_KEY, JSON.stringify({ owner: owner, expiresAt: Date.now() + LEASE_MS }));
      }
      return Promise.resolve();
    }
    return withStore(LOCK_STORE, 'readwrite', function (store, done) {
      const request = store.get(LOCK_KEY);
      request.onsuccess = function () {
        const lease = request.result;
        if (lease && lease.owner === owner) store.put({ owner: owner, expiresAt: Date.now() + LEASE_MS }, LOCK_KEY);
        done();
      };
    });
  }

  function releaseLockOwner(owner) {
    if (typeof window.indexedDB === 'undefined') {
      const lease = readFallbackLease();
      if (lease && lease.owner === owner) window.localStorage.removeItem(FALLBACK_LOCK_KEY);
      return Promise.resolve();
    }
    return withStore(LOCK_STORE, 'readwrite', function (store, done) {
      const request = store.get(LOCK_KEY);
      request.onsuccess = function () {
        const lease = request.result;
        if (lease && lease.owner === owner) store.delete(LOCK_KEY);
        done();
      };
    });
  }

  function withLeaseLock(callback) {
    const owner = String(Date.now()) + '-' + Math.random().toString(36).slice(2);

    function attempt() {
      return acquireLockOwner(owner).then(function (acquired) {
        if (!acquired) {
          return new Promise(function (resolve) { setTimeout(resolve, 80); }).then(attempt);
        }
        const timer = setInterval(function () { renewLockOwner(owner).catch(function () {}); }, LEASE_MS / 3);
        return Promise.resolve().then(callback).then(function (result) {
          clearInterval(timer);
          return releaseLockOwner(owner).then(function () { return result; });
        }, function (error) {
          clearInterval(timer);
          return releaseLockOwner(owner).then(function () { throw error; });
        });
      });
    }

    return attempt();
  }

  function withLock(callback) {
    if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
      return navigator.locks.request(LOCK_NAME, callback);
    }
    return withLeaseLock(callback);
  }

  function changeChannel() {
    if (channel === null && typeof BroadcastChannel === 'function') channel = new BroadcastChannel(CHANNEL_NAME);
    return channel;
  }

  function notifyChanged() {
    const active = changeChannel();
    if (active) active.postMessage({ type: 'changed' });
  }

  function onChanged(handler) {
    const active = changeChannel();
    if (!active) return;
    active.onmessage = function (event) {
      if (event.data && event.data.type === 'changed') handler();
    };
  }

  window.Plasticina.db.internals.adapters = window.Plasticina.db.internals.adapters || {};
  window.Plasticina.db.internals.adapters.browser = {
    name: 'browser', available: available, read: read, write: write,
    withLock: withLock, onChanged: onChanged
  };
})();
