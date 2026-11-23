(function () {
  'use strict';

  const schema = window.Plasticina.db.schema;

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
