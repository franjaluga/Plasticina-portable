(function () {
  'use strict';

  window.Plasticina.db.schema.documentTypes = [
    'CREATE TABLE IF NOT EXISTS document_types (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'doctype INTEGER NOT NULL UNIQUE,' +
      'name TEXT NOT NULL' +
      ')'
  ];
})();
