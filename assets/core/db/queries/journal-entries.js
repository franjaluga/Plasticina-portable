(function () {
  'use strict';

  window.Plasticina.db.queries.journalEntries = {
    all: 'SELECT * FROM journal_entries ORDER BY id ASC',
    byJournal: 'SELECT * FROM journal_entries WHERE journal_id = ? ORDER BY id ASC',
    insert: 'INSERT INTO journal_entries (journal_id, account_code, component_name, debit, credit, created_at, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?)',
    removeByJournal: 'DELETE FROM journal_entries WHERE journal_id = ?',
    removeMany: function (ids) {
      return 'DELETE FROM journal_entries WHERE journal_id IN (' + ids.map(function () { return '?'; }).join(',') + ')';
    }
  };
})();
