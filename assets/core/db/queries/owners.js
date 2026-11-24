(function () {
  'use strict';

  window.Plasticina.db.queries.owners = {
    list: 'SELECT * FROM owners ORDER BY id',
    byId: 'SELECT * FROM owners WHERE id = ?',
    byRut: 'SELECT * FROM owners WHERE rut = ?',
    active: 'SELECT * FROM owners WHERE is_active = 1 ORDER BY id LIMIT 1',
    insert: 'INSERT INTO owners (rut, name, is_active, account_plan_type, start_month, start_year) VALUES (?, ?, ?, ?, ?, ?)',
    update: 'UPDATE owners SET rut = ?, name = ?, account_plan_type = ? WHERE id = ?',
    deactivateAll: 'UPDATE owners SET is_active = 0',
    activate: 'UPDATE owners SET is_active = 1 WHERE id = ?',
    remove: 'DELETE FROM owners WHERE id = ?',
    hasJournals: 'SELECT 1 AS found FROM journals WHERE owner_id = ? LIMIT 1'
  };
})();
