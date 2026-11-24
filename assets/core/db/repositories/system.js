(function () {
  'use strict';

  const db = window.Plasticina.db;
  const q = db.queries;
  const TABLES = {
    owners: 'owners',
    accounts: 'accounts',
    entities: 'entities',
    documentTypes: 'document_types',
    documents: 'vc_documents',
    journals: 'journals',
    journalEntries: 'journal_entries',
    templates: 'account_templates',
    templateItems: 'account_template_items'
  };

  function currentYear() {
    return new Date().getFullYear();
  }

  function currentMonth() {
    return new Date().getMonth() + 1;
  }

  function ownerStart(owner) {
    const source = owner || {};
    const year = Number(source.start_year);
    const month = Number(source.start_month);
    return {
      year: Number.isInteger(year) && year >= 2000 ? year : currentYear(),
      month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : currentMonth()
    };
  }

  function templateItems() {
    return db.all(q.system.templateItems).map(function (row) {
      return {
        id: Number(row.id),
        account_template_id: Number(row.account_template_id),
        code: String(row.code),
        name: String(row.name),
        category: String(row.category)
      };
    });
  }

  function hydrate() {
    const settings = db.repositories.settings;
    return {
      owners: db.repositories.owners.list(),
      accounts: db.repositories.accounts.all(),
      entities: db.repositories.entities.all(),
      documentTypes: db.repositories.documentTypes.all(),
      documents: db.repositories.vcDocuments.all(),
      journals: db.repositories.journals.list(),
      journalEntries: db.repositories.journalEntries.all(),
      templates: db.repositories.templates.all(),
      templateItems: templateItems(),
      settings: {
        workingYear: settings.getNumber('working_year', currentYear()),
        activeOwnerId: settings.getNumber('active_owner_id', 1)
      }
    };
  }

  function seedAccounts(ownerId) {
    (window.SEED_ACCOUNTS || []).forEach(function (item) {
      db.run(q.system.seedAccount, [ownerId, String(item.code), String(item.name || ''), String(item.category || 'activo')]);
    });
  }

  function ensureSeed() {
    return db.transaction(function () {
      let owner = db.repositories.owners.find(1);
      if (!owner) {
        owner = db.repositories.owners.create({
          rut: '55555555-5', name: 'Test', is_active: true, account_plan_type: 'standard_pyme',
          start_month: currentMonth(), start_year: currentYear()
        });
      }
      if (!db.repositories.accounts.byOwner(owner.id).length) seedAccounts(owner.id);
      const settings = db.repositories.settings;
      if (settings.get('working_year') === undefined) settings.set('working_year', currentYear());
      if (settings.get('active_owner_id') === undefined) settings.set('active_owner_id', owner.id);
      return hydrate();
    });
  }

  function reset() {
    db.reset();
    return ensureSeed();
  }

  function replace(state) {
    return db.transaction(function () {
      q.system.clear.forEach(function (statement) { db.run(statement); });

      state.owners.forEach(function (row) {
        const start = ownerStart(row);
        db.run(q.system.insertOwner, [
          row.id, row.rut, row.name, row.is_active ? 1 : 0,
          row.account_plan_type || 'standard_pyme', start.month, start.year
        ]);
      });
      state.entities.forEach(function (row) {
        db.run(q.system.insertEntity, [row.id, row.rut, row.name]);
      });
      state.documentTypes.forEach(function (row) {
        db.run(q.system.insertDocumentType, [row.id, row.doctype, row.name]);
      });
      state.accounts.forEach(function (row) {
        db.run(q.system.insertAccount, [row.id, row.owner_id, row.code, row.name, row.category]);
      });
      state.templates.forEach(function (row) {
        db.run(q.system.insertTemplate, [row.id, row.slug, row.name, row.description || '']);
      });
      state.templateItems.forEach(function (row) {
        db.run(q.system.insertTemplateItem, [row.id, row.account_template_id, row.code, row.name, row.category]);
      });
      state.documents.forEach(function (row) {
        db.run(q.system.insertDocument, [
          row.id, row.month_register, row.year_register, row.type_vc, row.entity_id, row.document_type_id,
          row.folio, row.date, row.rut_ref === undefined ? null : row.rut_ref,
          row.folio_ref === undefined ? null : row.folio_ref,
          row.td_ref === undefined ? null : row.td_ref,
          row.date_centralize === undefined ? null : row.date_centralize,
          row.net, row.exempt, row.vat_rec, row.vat_no_rec, row.plus_oth_tax, row.minus_oth_tax,
          row.total, row.owner_id
        ]);
      });
      state.journals.forEach(function (row) {
        const timestamp = new Date().toISOString();
        db.run(q.system.insertJournal, [
          row.id, row.vc_document_id === undefined ? null : row.vc_document_id,
          row.ref_doc_payed === undefined ? null : row.ref_doc_payed,
          row.owner_id, row.year, row.entry_number, row.date, row.description || '',
          row.total_debit, row.total_credit, row.is_balanced ? 1 : 0, timestamp, timestamp
        ]);
      });
      state.journalEntries.forEach(function (row) {
        const timestamp = new Date().toISOString();
        db.run(q.system.insertEntry, [
          row.id, row.journal_id, row.account_code, row.component_name || 'manual',
          row.debit, row.credit, timestamp, timestamp
        ]);
      });
      db.repositories.settings.set('working_year', state.settings.workingYear);
      db.repositories.settings.set('active_owner_id', state.settings.activeOwnerId);
      return hydrate();
    });
  }

  function nextId(collection) {
    const table = TABLES[collection];
    if (!table) throw new Error('Colección desconocida: ' + String(collection));
    return Number(db.get(q.system.nextId(table)).id);
  }

  db.repositories.system = {
    hydrate: hydrate, ensureSeed: ensureSeed, reset: reset,
    replace: replace, nextId: nextId
  };
})();
