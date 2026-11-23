(function () {
  'use strict';

  window.Plasticina.db.schema.accounts = [
    'CREATE TABLE IF NOT EXISTS accounts (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,' +
      'code TEXT NOT NULL,' +
      'name TEXT NOT NULL,' +
      'category TEXT NOT NULL CHECK (category IN (\'activo\',\'pasivo\',\'patrimonio\',\'perdida\',\'ganancia\')),' +
      'UNIQUE (owner_id, code)' +
      ')',
    'CREATE INDEX IF NOT EXISTS accounts_owner_code_idx ON accounts(owner_id, code)'
  ];
})();
