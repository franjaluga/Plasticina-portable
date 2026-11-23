(function () {
  'use strict';

  window.Plasticina.db.queries.settings = {
    all: 'SELECT key, value FROM settings',
    byKey: 'SELECT value FROM settings WHERE key = ?',
    set: 'INSERT INTO settings (key, value) VALUES (?, ?) ' +
      'ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  };
})();
