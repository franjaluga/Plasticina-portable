(function () {
  'use strict';

  const db = window.Plasticina.db;
  const schema = db.schema;

  function migrationDate(value) {
    const text = value === null || value === undefined ? '' : String(value).trim();
    let match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
    if (match) {
      return match[1] + '-' + match[2].padStart(2, '0') + '-' + match[3].padStart(2, '0');
    }
    match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
    if (match) {
      return match[3] + '-' + match[2].padStart(2, '0') + '-' + match[1].padStart(2, '0');
    }
    return null;
  }

  function firstDate(rows) {
    let earliest = null;
    rows.forEach(function (row) {
      const date = migrationDate(row.date);
      if (!date) return;
      if (!earliest || date < earliest) earliest = date;
    });
    return earliest;
  }

  db.internals.migrations = db.internals.migrations || [];
  db.internals.migrations.push({
    version: 2,
    run: function () {
      const columns = db.all('PRAGMA table_info(owners)').map(function (row) { return String(row.name); });
      const added = columns.indexOf('start_month') === -1 || columns.indexOf('start_year') === -1;
      if (columns.indexOf('start_month') === -1) {
        db.run('ALTER TABLE owners ADD COLUMN start_month INTEGER NOT NULL DEFAULT 1');
      }
      if (columns.indexOf('start_year') === -1) {
        db.run('ALTER TABLE owners ADD COLUMN start_year INTEGER NOT NULL DEFAULT 2000');
      }
      const owners = db.all('SELECT id, start_month, start_year FROM owners');
      const needsBackfill = added || owners.some(function (owner) {
        return Number(owner.start_month) === 1 && Number(owner.start_year) === 2000;
      });
      if (!needsBackfill) return;
      const journalDates = db.all('SELECT owner_id, date FROM journals WHERE date IS NOT NULL');
      const documentDates = db.all('SELECT owner_id, date FROM vc_documents WHERE date IS NOT NULL');
      const now = new Date();
      const fallbackYear = now.getFullYear();
      const fallbackMonth = now.getMonth() + 1;
      owners.forEach(function (owner) {
        const ownerId = Number(owner.id);
        const journal = firstDate(journalDates.filter(function (row) { return Number(row.owner_id) === ownerId; }));
        const document = firstDate(documentDates.filter(function (row) { return Number(row.owner_id) === ownerId; }));
        const first = journal && document ? (journal < document ? journal : document) : (journal || document);
        const year = first ? Number(first.slice(0, 4)) : fallbackYear;
        const month = first ? Number(first.slice(5, 7)) : fallbackMonth;
        db.run('UPDATE owners SET start_month = ?, start_year = ? WHERE id = ?', [month, year, ownerId]);
      });
    }
  });

  window.Plasticina.db.internals.schemaOrder = [
    'meta',
    'settings',
    'owners',
    'entities',
    'documentTypes',
    'accounts',
    'accountTemplates',
    'accountTemplateItems',
    'vcDocuments',
    'journals',
    'journalEntries'
  ];

  window.Plasticina.db.internals.dropOrder = [
    'journal_entries',
    'journals',
    'vc_documents',
    'account_template_items',
    'account_templates',
    'accounts',
    'document_types',
    'entities',
    'owners',
    'settings',
    'schema_migrations'
  ];

  window.Plasticina.db.internals.schemaStatements = function () {
    return window.Plasticina.db.internals.schemaOrder.reduce(function (all, key) {
      return all.concat(schema[key] || []);
    }, []);
  };
})();
