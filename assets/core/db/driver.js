(function () {
  'use strict';

  const db = window.Plasticina.db;
  const internals = db.internals;
  let SQL = null;
  let database = null;
  let adapter = null;
  let depth = 0;
  let pendingWrite = Promise.resolve();

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
    database.run('PRAGMA busy_timeout = 5000');
  }

  function migrate() {
    internals.schemaStatements().forEach(function (statement) { database.run(statement); });
    const applied = database.exec('SELECT version FROM schema_migrations');
    const versions = applied.length ? applied[0].values.map(function (row) { return Number(row[0]); }) : [];
    if (versions.indexOf(db.config.schemaVersion) === -1) {
      database.run('INSERT INTO schema_migrations (version) VALUES (?)', [db.config.schemaVersion]);
    }
  }

  function openFromBytes(bytes) {
    if (database) database.close();
    database = bytes ? new SQL.Database(new Uint8Array(bytes)) : new SQL.Database();
    applyPragmas();
    migrate();
  }

  function persist() {
    if (!database || !adapter) return Promise.resolve();
    const bytes = database.export();
    pendingWrite = pendingWrite.then(function () { return adapter.write(bytes); }).catch(function (error) {
      internals.lastWriteError = error;
    });
    return pendingWrite;
  }

  function initialize() {
    adapter = pickAdapter();
    internals.adapter = adapter;
    return adapter.read().then(function (bytes) {
      return loadEngine().then(function () {
        openFromBytes(bytes);
        if (!bytes) return persist();
        return undefined;
      });
    });
  }

  function requireDatabase() {
    if (!database) throw new Error('La base de datos SQLite no está inicializada.');
    return database;
  }

  function run(statement, params) {
    requireDatabase().run(statement, params || []);
    return { changes: database.getRowsModified(), lastInsertRowid: lastInsertId() };
  }

  function all(statement, params) {
    const prepared = requireDatabase().prepare(statement);
    try {
      if (params && params.length) prepared.bind(params);
      const rows = [];
      while (prepared.step()) rows.push(prepared.getAsObject());
      return rows;
    } finally {
      prepared.free();
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

  function transaction(fn) {
    if (typeof fn !== 'function') throw new Error('Transacción inválida.');
    requireDatabase();
    depth += 1;
    const savepoint = 'plasticina_' + depth;
    database.run(depth === 1 ? 'BEGIN IMMEDIATE' : 'SAVEPOINT ' + savepoint);
    try {
      const result = fn();
      if (depth === 1) {
        database.run('COMMIT');
        persist();
      } else {
        database.run('RELEASE ' + savepoint);
      }
      depth -= 1;
      return result;
    } catch (error) {
      if (depth === 1) {
        database.run('ROLLBACK');
      } else {
        database.run('ROLLBACK TO ' + savepoint);
        database.run('RELEASE ' + savepoint);
      }
      depth -= 1;
      throw error;
    }
  }

  function exportBytes() {
    return requireDatabase().export();
  }

  function replaceBytes(bytes) {
    const source = new Uint8Array(bytes || []);
    if (!source.length) throw new Error('Archivo SQLite inválido.');
    openFromBytes(source);
    return persist();
  }

  function reset() {
    openFromBytes(null);
    return persist();
  }

  internals.initialize = initialize;
  db.run = run;
  db.all = all;
  db.get = get;
  db.transaction = transaction;
  db.exportBytes = exportBytes;
  db.replaceBytes = replaceBytes;
  db.reset = reset;
  db.flush = function () { return pendingWrite; };
})();
