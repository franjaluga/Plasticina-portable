(function () {
  'use strict';

  window.Plasticina.db.schema.entities = [
    'CREATE TABLE IF NOT EXISTS entities (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'rut TEXT NOT NULL UNIQUE,' +
      'name TEXT NOT NULL' +
      ')'
  ];
})();
