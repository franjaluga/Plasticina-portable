(function () {
  'use strict';

  window.Plasticina.db.schema.meta = [
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'
  ];
})();
