(function () {
  'use strict';

  window.Plasticina.db.schema.settings = [
    'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
  ];
})();
