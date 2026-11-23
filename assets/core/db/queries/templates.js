(function () {
  'use strict';

  window.Plasticina.db.queries.templates = {
    all: 'SELECT * FROM account_templates ORDER BY id',
    byId: 'SELECT * FROM account_templates WHERE id = ?',
    bySlug: 'SELECT * FROM account_templates WHERE slug = ? ORDER BY id LIMIT 1',
    insert: 'INSERT INTO account_templates (slug, name, description) VALUES (?, ?, ?)',
    nextId: 'SELECT COALESCE(MAX(id), 0) + 1 AS id FROM account_templates',
    countItems: 'SELECT COUNT(*) AS count FROM account_template_items WHERE account_template_id = ?',
    update: 'UPDATE account_templates SET name = ?, description = ? WHERE id = ?',
    remove: 'DELETE FROM account_templates WHERE id = ?',
    items: 'SELECT * FROM account_template_items WHERE account_template_id = ? ORDER BY id',
    itemById: 'SELECT * FROM account_template_items WHERE id = ? AND account_template_id = ?',
    insertItem: 'INSERT INTO account_template_items (account_template_id, code, name, category) VALUES (?, ?, ?, ?)',
    updateItem: 'UPDATE account_template_items SET code = ?, name = ?, category = ? WHERE id = ? AND account_template_id = ?',
    removeItems: 'DELETE FROM account_template_items WHERE account_template_id = ?',
    removeItem: 'DELETE FROM account_template_items WHERE id = ? AND account_template_id = ?'
  };
})();
