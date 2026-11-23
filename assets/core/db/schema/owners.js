(function () {
  'use strict';

  window.Plasticina.db.schema.owners = [
    'CREATE TABLE IF NOT EXISTS owners (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'rut TEXT NOT NULL UNIQUE,' +
      'name TEXT NOT NULL,' +
      'is_active INTEGER NOT NULL DEFAULT 0,' +
      'account_plan_type TEXT NOT NULL DEFAULT \'standard_pyme\'' +
      ')'
  ];
})();
