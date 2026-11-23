(function () {
  'use strict';

  const db = window.Plasticina.db;
  const q = db.queries.owners;

  function map(row) {
    if (!row) return null;
    return {
      id: Number(row.id),
      rut: String(row.rut),
      name: String(row.name),
      account_plan_type: String(row.account_plan_type || 'standard_pyme'),
      is_active: Boolean(row.is_active)
    };
  }

  function list() {
    return db.all(q.list).map(map);
  }

  function find(id) {
    return map(db.get(q.byId, [id]));
  }

  function byRut(rut) {
    return map(db.get(q.byRut, [rut]));
  }

  function active() {
    return map(db.get(q.active));
  }

  function create(data) {
    const result = db.run(q.insert, [data.rut, data.name, data.is_active ? 1 : 0, data.account_plan_type || 'standard_pyme']);
    return find(result.lastInsertRowid);
  }

  function update(id, data) {
    db.run(q.update, [data.rut, data.name, data.account_plan_type || 'standard_pyme', id]);
    return find(id);
  }

  function setActive(id) {
    db.run(q.deactivateAll);
    db.run(q.activate, [id]);
    return find(id);
  }

  function remove(id) {
    db.run(q.remove, [id]);
    return true;
  }

  function hasJournals(id) {
    return Boolean(db.get(q.hasJournals, [id]));
  }

  db.repositories.owners = {
    list: list, find: find, byRut: byRut, active: active, create: create,
    update: update, setActive: setActive, remove: remove, hasJournals: hasJournals
  };
})();
