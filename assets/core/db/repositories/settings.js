(function () {
  'use strict';

  const db = window.Plasticina.db;
  const q = db.queries.settings;

  function all() {
    const result = {};
    db.all(q.all).forEach(function (row) { result[row.key] = row.value; });
    return result;
  }

  function get(key, fallback) {
    const row = db.get(q.byKey, [key]);
    return row ? row.value : fallback;
  }

  function getNumber(key, fallback) {
    const value = Number(get(key, fallback));
    return Number.isFinite(value) ? value : fallback;
  }

  function set(key, value) {
    db.run(q.set, [key, String(value)]);
    return value;
  }

  db.repositories.settings = { all: all, get: get, getNumber: getNumber, set: set };
})();
