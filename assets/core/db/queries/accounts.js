(function () {
  'use strict';

  window.Plasticina.db.queries.accounts = {
    all: 'SELECT * FROM accounts ORDER BY code, id',
    byOwner: 'SELECT * FROM accounts WHERE owner_id = ? ORDER BY code, id',
    byId: 'SELECT * FROM accounts WHERE id = ?',
    byCode: 'SELECT * FROM accounts WHERE owner_id = ? AND code = ? ORDER BY id LIMIT 1',
    insert: 'INSERT INTO accounts (owner_id, code, name, category) VALUES (?, ?, ?, ?)',
    update: 'UPDATE accounts SET code = ?, name = ?, category = ? WHERE id = ?',
    remove: 'DELETE FROM accounts WHERE id = ?',
    removeByOwner: 'DELETE FROM accounts WHERE owner_id = ?',
    nextId: 'SELECT COALESCE(MAX(id), 0) + 1 AS id FROM accounts',
    hasMovements: 'SELECT 1 AS found FROM journal_entries e JOIN journals j ON j.id = e.journal_id ' +
      'WHERE e.account_code = ? AND j.owner_id = ? LIMIT 1'
  };
})();
