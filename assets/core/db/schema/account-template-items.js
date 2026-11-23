(function () {
  'use strict';

  window.Plasticina.db.schema.accountTemplateItems = [
    'CREATE TABLE IF NOT EXISTS account_template_items (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'account_template_id INTEGER NOT NULL REFERENCES account_templates(id) ON DELETE CASCADE,' +
      'code TEXT NOT NULL,' +
      'name TEXT NOT NULL,' +
      'category TEXT NOT NULL' +
      ')',
    'CREATE INDEX IF NOT EXISTS account_template_items_template_idx ON account_template_items(account_template_id)'
  ];
})();
