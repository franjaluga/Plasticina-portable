(function () {
  'use strict';

  const db = window.Plasticina.db;
  const q = db.queries.vcDocuments;
  const AMOUNT_FIELDS = ['net', 'exempt', 'vat_rec', 'vat_no_rec', 'plus_oth_tax', 'minus_oth_tax', 'total'];

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function nullable(value) {
    return value === '' || value === null || value === undefined ? null : value;
  }

  function map(row) {
    if (!row) return null;
    const document = Object.assign({}, row);
    document.id = Number(row.id);
    document.month_register = Number(row.month_register);
    document.year_register = Number(row.year_register);
    document.entity_id = Number(row.entity_id);
    document.document_type_id = Number(row.document_type_id);
    document.folio = Number(row.folio);
    document.folio_ref = nullable(row.folio_ref);
    document.td_ref = nullable(row.td_ref);
    document.owner_id = Number(row.owner_id);
    AMOUNT_FIELDS.forEach(function (field) { document[field] = number(row[field]); });
    return document;
  }

  function list(filters) {
    const built = q.list(filters || {});
    return db.all(built.sql, built.params).map(map);
  }

  function pending(ownerId, year, filters) {
    const built = q.pending(ownerId, year, filters || {});
    return db.all(built.sql, built.params).map(map);
  }

  function query(typeVc, month, year, ownerId) {
    const params = [ownerId, String(typeVc).trim().toUpperCase(), month, year];
    return db.all(q.query, params).map(map);
  }

  function find(id) {
    return map(db.get(q.byId, [id]));
  }

  function duplicate(entityId, documentTypeId, folio) {
    return map(db.get(q.duplicate, [entityId, documentTypeId, folio]));
  }

  function hasJournal(id) {
    return Boolean(db.get(q.hasJournal, [id]));
  }

  function create(data) {
    const values = [
      data.month_register, data.year_register, data.type_vc, data.entity_id, data.document_type_id,
      data.folio, data.date, nullable(data.rut_ref), nullable(data.folio_ref), nullable(data.td_ref),
      nullable(data.date_centralize)
    ].concat(AMOUNT_FIELDS.map(function (field) { return number(data[field]); }), [data.owner_id]);
    const result = db.run(q.insert, values);
    return find(result.lastInsertRowid);
  }

  function remove(id) {
    db.run(q.remove, [id]);
    return true;
  }

  function nextId() {
    return Number(db.get(q.nextId).id);
  }

  function all() {
    return db.all(q.all).map(map);
  }

  db.repositories.vcDocuments = {
    all: all, list: list, pending: pending, query: query, find: find, duplicate: duplicate,
    hasJournal: hasJournal, create: create, remove: remove, nextId: nextId
  };
})();
