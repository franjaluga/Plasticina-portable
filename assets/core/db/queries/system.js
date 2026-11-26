(function () {
  'use strict';

  const q = window.Plasticina.db.queries;

  q.system = {
    owners: 'SELECT * FROM owners ORDER BY id ASC',
    accounts: 'SELECT * FROM accounts ORDER BY id ASC',
    entities: 'SELECT * FROM entities ORDER BY id ASC',
    documentTypes: 'SELECT * FROM document_types ORDER BY id ASC',
    documents: 'SELECT * FROM vc_documents ORDER BY id ASC',
    journals: 'SELECT * FROM journals ORDER BY id ASC',
    journalEntries: 'SELECT * FROM journal_entries ORDER BY id ASC',
    templates: 'SELECT * FROM account_templates ORDER BY id ASC',
    templateItems: 'SELECT * FROM account_template_items ORDER BY id ASC',
    settings: 'SELECT key, value FROM settings',
    nextId: function (table) {
      const allowed = {
        owners: 'owners', accounts: 'accounts', entities: 'entities', document_types: 'documentTypes',
        vc_documents: 'documents', journals: 'journals', journal_entries: 'journalEntries',
        account_templates: 'templates', account_template_items: 'templateItems'
      };
      const target = allowed[table];
      if (!target) throw new Error('Colección desconocida: ' + String(table));
      return 'SELECT COALESCE(MAX(id), 0) + 1 AS id FROM ' + target;
    },
    clear: [
      'DELETE FROM journal_entries',
      'DELETE FROM journals',
      'DELETE FROM vc_documents',
      'DELETE FROM account_template_items',
      'DELETE FROM account_templates',
      'DELETE FROM accounts',
      'DELETE FROM document_types',
      'DELETE FROM entities',
      'DELETE FROM owners',
      'DELETE FROM settings',
      'DELETE FROM sqlite_sequence'
    ],
    seedAccount: 'INSERT INTO accounts (owner_id, code, name, category) VALUES (?, ?, ?, ?)',
    insertOwner: 'INSERT INTO owners (id, rut, name, is_active, account_plan_type, start_month, start_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
    insertEntity: 'INSERT INTO entities (id, rut, name) VALUES (?, ?, ?)',
    insertDocumentType: 'INSERT INTO document_types (id, doctype, name) VALUES (?, ?, ?)',
    insertAccount: 'INSERT INTO accounts (id, owner_id, code, name, category) VALUES (?, ?, ?, ?, ?)',
    insertTemplate: 'INSERT INTO account_templates (id, slug, name, description) VALUES (?, ?, ?, ?)',
    insertTemplateItem: 'INSERT INTO account_template_items (id, account_template_id, code, name, category) VALUES (?, ?, ?, ?, ?)',
    insertDocument: 'INSERT INTO vc_documents (' +
      'id, month_register, year_register, type_vc, entity_id, document_type_id, folio, date, rut_ref,' +
      'folio_ref, td_ref, date_centralize, net, exempt, vat_rec, vat_no_rec, plus_oth_tax, minus_oth_tax, total, owner_id' +
      ') VALUES (' + Array.from({ length: 20 }, function () { return '?'; }).join(',') + ')',
    insertJournal: 'INSERT INTO journals (' +
      'id, vc_document_id, ref_doc_payed, owner_id, year, entry_number, date, description,' +
      'total_debit, total_credit, is_balanced, created_at, updated_at' +
      ') VALUES (' + Array.from({ length: 13 }, function () { return '?'; }).join(',') + ')',
    insertEntry: 'INSERT INTO journal_entries (' +
      'id, journal_id, account_code, component_name, debit, credit, created_at, updated_at' +
      ') VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  };
})();
