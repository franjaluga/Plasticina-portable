(function () {
  'use strict';

  window.Plasticina.db.schema.vcDocuments = [
    'CREATE TABLE IF NOT EXISTS vc_documents (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'month_register INTEGER NOT NULL,' +
      'year_register INTEGER NOT NULL,' +
      'type_vc TEXT NOT NULL,' +
      'entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,' +
      'document_type_id INTEGER NOT NULL REFERENCES document_types(doctype) ON DELETE RESTRICT,' +
      'folio INTEGER NOT NULL,' +
      'date TEXT NOT NULL,' +
      'rut_ref TEXT,' +
      'folio_ref INTEGER,' +
      'td_ref INTEGER,' +
      'date_centralize TEXT,' +
      'net NUMERIC NOT NULL DEFAULT 0,' +
      'exempt NUMERIC NOT NULL DEFAULT 0,' +
      'vat_rec NUMERIC NOT NULL DEFAULT 0,' +
      'vat_no_rec NUMERIC NOT NULL DEFAULT 0,' +
      'plus_oth_tax NUMERIC NOT NULL DEFAULT 0,' +
      'minus_oth_tax NUMERIC NOT NULL DEFAULT 0,' +
      'total NUMERIC NOT NULL DEFAULT 0,' +
      'owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,' +
      'UNIQUE (entity_id, document_type_id, folio)' +
      ')',
    'CREATE INDEX IF NOT EXISTS vc_documents_period_idx ON vc_documents(year_register, month_register, type_vc)',
    'CREATE INDEX IF NOT EXISTS vc_documents_owner_period_idx ON vc_documents(owner_id, year_register, month_register)'
  ];
})();
