(function () {
  'use strict';

  window.Plasticina.db.schema.journals = [
    'CREATE TABLE IF NOT EXISTS journals (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'vc_document_id INTEGER REFERENCES vc_documents(id) ON DELETE CASCADE,' +
      'ref_doc_payed INTEGER REFERENCES vc_documents(id) ON DELETE SET NULL,' +
      'owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,' +
      'year INTEGER NOT NULL,' +
      'entry_number INTEGER NOT NULL,' +
      'date TEXT NOT NULL,' +
      'description TEXT,' +
      'total_debit NUMERIC NOT NULL DEFAULT 0,' +
      'total_credit NUMERIC NOT NULL DEFAULT 0,' +
      'is_balanced INTEGER NOT NULL DEFAULT 0,' +
      'created_at TEXT,' +
      'updated_at TEXT,' +
      'UNIQUE (owner_id, year, entry_number)' +
      ')',
    'CREATE INDEX IF NOT EXISTS journals_owner_year_idx ON journals(owner_id, year, entry_number)',
    'CREATE INDEX IF NOT EXISTS journals_document_idx ON journals(vc_document_id)',
    'CREATE INDEX IF NOT EXISTS journals_paid_document_idx ON journals(ref_doc_payed)'
  ];
})();
