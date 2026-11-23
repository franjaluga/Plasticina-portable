(function () {
  'use strict';

  const db = window.Plasticina.db;
  const q = db.queries.accounts;

  function map(row) {
    if (!row) return null;
    return {
      id: Number(row.id),
      owner_id: Number(row.owner_id),
      code: String(row.code),
      name: String(row.name),
      category: String(row.category)
    };
  }

  function all() {
    return db.all(q.all).map(map);
  }

  function byOwner(ownerId) {
    return db.all(q.byOwner, [ownerId]).map(map);
  }

  function find(id) {
    return map(db.get(q.byId, [id]));
  }

  function byCode(ownerId, code) {
    return map(db.get(q.byCode, [ownerId, code]));
  }

  function create(data) {
    const result = db.run(q.insert, [data.owner_id, data.code, data.name, data.category || 'activo']);
    return find(result.lastInsertRowid);
  }

  function update(id, data) {
    db.run(q.update, [data.code, data.name, data.category || 'activo', id]);
    return find(id);
  }

  function remove(id) {
    db.run(q.remove, [id]);
    return true;
  }

  function removeByOwner(ownerId) {
    db.run(q.removeByOwner, [ownerId]);
    return true;
  }

  function nextId() {
    return Number(db.get(q.nextId).id);
  }

  function hasMovements(account) {
    return Boolean(db.get(q.hasMovements, [account.code, account.owner_id]));
  }

  db.repositories.accounts = {
    all: all, byOwner: byOwner, find: find, byCode: byCode, create: create,
    update: update, remove: remove, removeByOwner: removeByOwner,
    nextId: nextId, hasMovements: hasMovements
  };
})();
