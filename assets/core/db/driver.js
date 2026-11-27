(function () {
  'use strict';

  const db = window.Plasticina.db;
  const internals = db.internals;
  const writerId = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  const SQLITE_HEADER = [83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0];

  let SQL = null;
  let database = null;
  let adapter = null;
  let depth = 0;
  let pendingWrite = Promise.resolve();
  let revision = 0;
  let localVersion = 0;
  let stale = false;
  let changeWatcher = null;
  const statements = new Map();
  const persistDeferred = [];
  const changeListeners = [];

  function pickAdapter() {
    const candidates = [internals.adapters.memory, internals.adapters.electron, internals.adapters.browser];
    for (let index = 0; index < candidates.length; index++) {
      const candidate = candidates[index];
      if (candidate && candidate.available()) return candidate;
    }
    throw new Error('No hay adaptador de persistencia SQLite disponible.');
  }

  function loadEngine() {
    if (typeof window.initSqlJs !== 'function') {
      return Promise.reject(new Error('No se pudo cargar el motor SQLite.'));
    }
    return window.initSqlJs({}).then(function (engine) {
      SQL = engine;
      internals.SQL = engine;
      return engine;
    });
  }

  function applyPragmas() {
    database.run('PRAGMA foreign_keys = ON');
  }

  function migrate() {
    internals.schemaStatements().forEach(function (statement) { database.run(statement); });
    const applied = database.exec('SELECT version FROM schema_migrations');
    const versions = applied.length ? applied[0].values.map(function (row) { return Number(row[0]); }) : [];
    (internals.migrations || []).forEach(function (migration) {
      if (versions.indexOf(migration.version) !== -1) return;
      migration.run();
      if (versions.indexOf(migration.version) === -1) versions.push(migration.version);
      database.run('INSERT INTO schema_migrations (version) VALUES (?)', [migration.version]);
    });
    if (versions.indexOf(db.config.schemaVersion) === -1) {
      database.run('INSERT INTO schema_migrations (version) VALUES (?)', [db.config.schemaVersion]);
      versions.push(db.config.schemaVersion);
    }
  }

  function clearStatements() {
    statements.forEach(function (prepared) {
      try { prepared.free(); } catch (error) {}
    });
    statements.clear();
  }

  function openFromBytes(bytes, nextRevision) {
    clearStatements();
    if (database) database.close();
    database = bytes ? new SQL.Database(new Uint8Array(bytes)) : new SQL.Database();
    applyPragmas();
    migrate();
    if (typeof nextRevision === 'number' && Number.isFinite(nextRevision)) revision = nextRevision;
    localVersion += 1;
    stale = false;
  }

  function normalizeRead(value) {
    if (value && typeof value === 'object' && !(value instanceof Uint8Array) && value.bytes !== undefined) {
      return { bytes: value.bytes ? new Uint8Array(value.bytes) : null, revision: Number(value.revision) || 0 };
    }
    return { bytes: value ? new Uint8Array(value) : null, revision: 0 };
  }

  function normalizeWrite(value) {
    if (!value || typeof value !== 'object') return null;
    if (value.revision === undefined) return null;
    return Number(value.revision) || 0;
  }

  function watchChanges() {
    if (!adapter || adapter.name === 'memory' || typeof adapter.onChanged !== 'function') return;
    if (changeWatcher === adapter) return;
    changeWatcher = adapter;
    adapter.onChanged(function (payload) {
      const change = payload && typeof payload === 'object' ? payload : {};
      if (change.writerId && change.writerId === writerId) return;
      const incoming = Number(change.revision) || 0;
      if (incoming && incoming <= revision) return;
      if (incoming) revision = incoming;
      stale = true;
      changeListeners.slice().forEach(function (listener) {
        try { listener(change); } catch (error) {}
      });
    });
  }

  function persist() {
    if (!database || !adapter) return Promise.resolve();
    clearStatements();
    const bytes = database.export();
    pendingWrite = pendingWrite.then(function () { return adapter.write(bytes, writerId); }).then(function (value) {
      const written = normalizeWrite(value);
      if (written !== null) revision = Math.max(revision, written);
      return value;
    }).catch(function (error) {
      internals.lastWriteError = error;
    });
    return pendingWrite;
  }

  function initialize() {
    adapter = pickAdapter();
    internals.adapter = adapter;
    changeWatcher = null;
    return pendingWrite.then(function () { return adapter.read(); }).then(function (value) {
      const loaded = normalizeRead(value);
      return loadEngine().then(function () {
        openFromBytes(loaded.bytes, loaded.revision);
        return (loaded.bytes ? Promise.resolve() : persist()).then(function () {
          watchChanges();
        });
      });
    });
  }

  function ensureFresh() {
    if (!stale || !adapter || typeof adapter.read !== 'function') return Promise.resolve();
    return adapter.read().then(function (value) {
      const loaded = normalizeRead(value);
      if (!loaded.revision || loaded.revision > revision) openFromBytes(loaded.bytes, Math.max(revision, loaded.revision));
      else stale = false;
    });
  }

  function requireDatabase() {
    if (!database) throw new Error('La base de datos SQLite no está inicializada.');
    return database;
  }

  function statementFor(sql) {
    let prepared = statements.get(sql);
    if (!prepared) {
      prepared = requireDatabase().prepare(sql);
      statements.set(sql, prepared);
    }
    return prepared;
  }

  function run(statement, params) {
    requireDatabase().run(statement, params || []);
    localVersion += 1;
    return { changes: database.getRowsModified(), lastInsertRowid: lastInsertId() };
  }

  function all(statement, params) {
    const prepared = statementFor(statement);
    const rows = [];
    try {
      prepared.reset();
      if (params && params.length) prepared.bind(params);
      while (prepared.step()) rows.push(prepared.getAsObject());
      return rows;
    } catch (error) {
      prepared.reset();
      throw error;
    }
  }

  function get(statement, params) {
    const rows = all(statement, params);
    return rows.length ? rows[0] : null;
  }

  function lastInsertId() {
    const row = get('SELECT last_insert_rowid() AS id');
    return row ? Number(row.id) : 0;
  }

  function runTransactionLocal(fn, deferWrite) {
    requireDatabase();
    depth += 1;
    persistDeferred.push(Boolean(deferWrite));
    const savepoint = 'plasticina_' + depth;
    database.run(depth === 1 ? 'BEGIN IMMEDIATE' : 'SAVEPOINT ' + savepoint);
    try {
      const result = fn();
      if (depth === 1) {
        database.run('COMMIT');
        localVersion += 1;
        if (!deferWrite) persist();
      } else {
        database.run('RELEASE ' + savepoint);
      }
      depth -= 1;
      persistDeferred.pop();
      return result;
    } catch (error) {
      if (depth === 1) database.run('ROLLBACK');
      else {
        database.run('ROLLBACK TO ' + savepoint);
        database.run('RELEASE ' + savepoint);
      }
      depth -= 1;
      persistDeferred.pop();
      throw error;
    }
  }

  function serialized(work, transactional) {
    if (!adapter || adapter.name === 'memory' || typeof adapter.withLock !== 'function') {
      return transactional ? runTransactionLocal(work, false) : work();
    }
    return adapter.withLock(function () {
      return adapter.read().then(function (value) {
        const loaded = normalizeRead(value);
        if (loaded.revision && loaded.revision > revision) openFromBytes(loaded.bytes, loaded.revision);
        return transactional ? runTransactionLocal(work, true) : work();
      }).then(function (result) {
        clearStatements();
        return adapter.write(database.export(), writerId).then(function (value) {
          const written = normalizeWrite(value);
          if (written !== null) revision = Math.max(revision, written);
          stale = false;
          return result;
        });
      });
    });
  }

  function transaction(fn) {
    if (typeof fn !== 'function') throw new Error('Transacción inválida.');
    return serialized(fn, true);
  }

  function hasSqliteHeader(bytes) {
    const source = new Uint8Array(bytes || []);
    if (source.length < SQLITE_HEADER.length) return false;
    return SQLITE_HEADER.every(function (byte, index) { return source[index] === byte; });
  }

  function exportBytes() {
    clearStatements();
    return requireDatabase().export();
  }

  function replaceBytes(bytes) {
    if (!hasSqliteHeader(bytes)) throw new Error('Archivo SQLite inválido.');
    return serialized(function () { openFromBytes(bytes); });
  }

  function reset() {
    return serialized(function () { openFromBytes(null); });
  }

  internals.initialize = initialize;
  internals.writerId = writerId;
  db.onExternalChange = function (listener) {
    if (typeof listener !== 'function') return function () {};
    changeListeners.push(listener);
    return function () {
      const index = changeListeners.indexOf(listener);
      if (index !== -1) changeListeners.splice(index, 1);
    };
  };
  db.run = run;
  db.all = all;
  db.get = get;
  db.transaction = transaction;
  db.ensureFresh = ensureFresh;
  db.version = function () { return localVersion; };
  db.revision = function () { return revision; };
  db.exportBytes = exportBytes;
  db.replaceBytes = replaceBytes;
  db.reset = reset;
  db.flush = function () { return pendingWrite; };
})();
