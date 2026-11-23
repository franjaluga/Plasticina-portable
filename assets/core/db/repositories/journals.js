(function () {
  'use strict';

  const db = window.Plasticina.db;
  const q = db.queries.journals;

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function nullable(value) {
    return value === '' || value === null || value === undefined ? null : Number(value);
  }

  function map(row) {
    if (!row) return null;
    return {
      id: Number(row.id),
      vc_document_id: nullable(row.vc_document_id),
      ref_doc_payed: nullable(row.ref_doc_payed),
      owner_id: Number(row.owner_id),
      year: Number(row.year),
      entry_number: Number(row.entry_number),
      date: String(row.date || ''),
      description: row.description === null || row.description === undefined ? '' : String(row.description),
      total_debit: number(row.total_debit),
      total_credit: number(row.total_credit),
      is_balanced: Boolean(row.is_balanced)
    };
  }

  function list(filters) {
    const built = q.list(filters || {});
    return db.all(built.sql, built.params).map(map);
  }

  function system(ownerId, year, filters) {
    const built = q.system(ownerId, year, filters || {});
    return db.all(built.sql, built.params).map(map);
  }

  function ledger(ownerId, year, month, accountCode) {
    const params = [ownerId, String(year).padStart(4, '0'), String(month).padStart(2, '0'), accountCode];
    return db.all(q.ledger, params).map(map);
  }

  function taxTotals(ownerId, year) {
    return db.all(q.taxTotals, [ownerId, year]).map(function (row) {
      return {
        code: String(row.code),
        name: String(row.name),
        category: String(row.category || ''),
        sum_debit: number(row.sum_debit),
        sum_credit: number(row.sum_credit)
      };
    });
  }

  function find(id) {
    return map(db.get(q.byId, [id]));
  }

  function nextEntryNumber(ownerId, year) {
    return Number(db.get(q.nextEntryNumber, [ownerId, year]).entry_number);
  }

  function hasJournal(documentId) {
    return Boolean(db.get(q.hasJournal, [documentId]));
  }

  function paidAmount(ownerId, documentId, accountCode, column) {
    const row = db.get(q.paidAmount(column), [ownerId, documentId, accountCode]);
    return number(row ? row.paid : 0);
  }

  function create(data) {
    const timestamp = new Date().toISOString();
    const values = [
      nullable(data.vc_document_id), nullable(data.ref_doc_payed), data.owner_id, data.year,
      data.entry_number, String(data.date || ''), String(data.description || ''),
      number(data.total_debit), number(data.total_credit), data.is_balanced ? 1 : 0, timestamp, timestamp
    ];
    const result = db.run(q.insert, values);
    return find(result.lastInsertRowid);
  }

  function update(id, data) {
    db.run(q.update, [
      data.year, String(data.date || ''), String(data.description || ''),
      number(data.total_debit), number(data.total_credit), data.is_balanced ? 1 : 0,
      new Date().toISOString(), id
    ]);
    return find(id);
  }

  function remove(id) {
    db.run(q.remove, [id]);
    return true;
  }

  function removeMany(ids) {
    if (!ids.length) return true;
    db.run(q.removeMany(ids), ids);
    return true;
  }

  db.repositories.journals = {
    list: list, system: system, ledger: ledger, taxTotals: taxTotals, find: find,
    nextEntryNumber: nextEntryNumber, hasJournal: hasJournal, paidAmount: paidAmount,
    create: create, update: update, remove: remove, removeMany: removeMany
  };
})();
