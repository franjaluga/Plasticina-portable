(function () {
  'use strict';

  window.Plasticina.db.schema.accountTemplates = [
    'CREATE TABLE IF NOT EXISTS account_templates (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'slug TEXT NOT NULL UNIQUE,' +
      'name TEXT NOT NULL,' +
      'description TEXT' +
      ')'
  ];
})();
