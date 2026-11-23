(function () {
  'use strict';

  window.Plasticina.db.schema.journalEntries = [
    'CREATE TABLE IF NOT EXISTS journal_entries (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'journal_id INTEGER NOT NULL REFERENCES journals(id) ON DELETE CASCADE,' +
      'account_code TEXT NOT NULL,' +
      'component_name TEXT NOT NULL,' +
      'debit NUMERIC NOT NULL DEFAULT 0,' +
      'credit NUMERIC NOT NULL DEFAULT 0,' +
      'created_at TEXT,' +
      'updated_at TEXT' +
      ')',
    'CREATE INDEX IF NOT EXISTS journal_entries_journal_idx ON journal_entries(journal_id)',
    'CREATE INDEX IF NOT EXISTS journal_entries_account_idx ON journal_entries(account_code)'
  ];
})();
