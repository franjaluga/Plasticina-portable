(function () {
  'use strict';

  const db = window.Plasticina.db;
  const q = db.queries.journalEntries;

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function all() {
    return db.all(q.all).map(function (row) {
      return {
        id: Number(row.id),
        journal_id: Number(row.journal_id),
        account_code: String(row.account_code),
        component_name: String(row.component_name || 'manual'),
        debit: number(row.debit),
        credit: number(row.credit)
      };
    });
  }

  function byJournal(journalId) {
    return db.all(q.byJournal, [journalId]).map(function (row) {
      return {
        id: Number(row.id),
        journal_id: Number(row.journal_id),
        account_code: String(row.account_code),
        component_name: String(row.component_name || 'manual'),
        debit: number(row.debit),
        credit: number(row.credit)
      };
    });
  }

  function insertMany(journalId, entries) {
    const timestamp = new Date().toISOString();
    (entries || []).forEach(function (entry) {
      db.run(q.insert, [
        journalId, String(entry.account_code || ''),
        String(entry.component_name === undefined || entry.component_name === null ? 'manual' : entry.component_name),
        number(entry.debit), number(entry.credit), timestamp, timestamp
      ]);
    });
    return true;
  }

  function removeByJournal(journalId) {
    db.run(q.removeByJournal, [journalId]);
    return true;
  }

  function removeMany(journalIds) {
    if (!journalIds.length) return true;
    db.run(q.removeMany(journalIds), journalIds);
    return true;
  }

  db.repositories.journalEntries = {
    all: all, byJournal: byJournal, insertMany: insertMany,
    removeByJournal: removeByJournal, removeMany: removeMany
  };
})();
