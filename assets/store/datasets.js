(function () {
  'use strict';

  const db = window.Plasticina.db;
  const access = db.access;

  function numberOr(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
  }

  function queryYear(context) {
    return numberOr(context.query.year, context.workingYear || new Date().getFullYear());
  }

  function queryMonth(context) {
    return numberOr(context.query.month, context.month || new Date().getMonth() + 1);
  }

  function ownerOf(context) {
    const owner = Store.owner(context.ownerId);
    if (!owner) throw new Error('La empresa del contexto no existe.');
    return owner;
  }

  function define(name, resolver, options) {
    access.define(name, resolver, options);
  }

  define('home.summary', function (context) {
    return {
      owner: Store.owner(context.ownerId) || Store.activeOwner(),
      workingYear: context.workingYear || Store.workingYear(),
      pendingCount: Store.pendingDocuments({ year: context.workingYear || Store.workingYear() }).length
    };
  }, { tags: ['documents', 'settings'], required: [] });

  define('meta.context', function (context) {
    const owner = Store.owner(context.ownerId) || Store.activeOwner();
    return {
      owner: owner,
      workingYear: context.workingYear || Store.workingYear(),
      year: queryYear(context),
      month: queryMonth(context)
    };
  }, { tags: ['settings'], required: [] });

  define('owners.list', function () {
    return Store.owners();
  }, { tags: ['owners'] });

  define('owners.detail', function (context) {
    const owner = Store.owner(context.params.owner);
    if (!owner) return null;
    return {
      owner: owner,
      accountsCount: db.repositories.accounts.byOwner(owner.id).length
    };
  }, { tags: ['owners', 'accounts'] });

  define('owners.accounts', function (context) {
    const owner = Store.owner(context.params.owner);
    if (!owner) return { owner: null, accounts: [] };
    return { owner: owner, accounts: Store.accounts(owner.id) };
  }, { tags: ['owners', 'accounts'] });

  define('masters.templates', function () {
    return Store.templates();
  }, { tags: ['templates'] });

  define('masters.templateDetail', function (context) {
    const template = Store.template(context.params.accountTemplate);
    return {
      template: template,
      items: template ? Store.templateItems(template.id) : []
    };
  }, { tags: ['templates'] });

  define('catalogs.accounts', function (context) {
    return {
      owner: ownerOf(context),
      accounts: Store.accounts(context.ownerId)
    };
  }, { tags: ['accounts', 'owners'], required: ['ownerId'] });

  define('catalogs.documentTypes', function () {
    return Store.documentTypes();
  }, { tags: ['entities'] });

  define('documents.pending', function (context) {
    return Store.pendingDocuments(context.query);
  }, { tags: ['documents', 'journals'], required: ['ownerId'] });

  define('documents.query', function (context) {
    const typeVc = context.query.type_vc === undefined || context.query.type_vc === '' ? 'V' : context.query.type_vc;
    return Store.queryDocuments(typeVc, queryMonth(context), queryYear(context));
  }, { tags: ['documents', 'journals'], required: ['ownerId', 'workingYear'] });

  define('documents.detail', function (context) {
    return Store.document(context.params.id);
  }, { tags: ['documents'], required: ['ownerId'] });

  define('journals.system', function (context) {
    return Store.systemJournals(queryYear(context), context.query);
  }, { tags: ['journals', 'documents'], required: ['ownerId', 'workingYear'] });

  define('journals.audit', function (context) {
    return Store.journals({ owner_id: context.ownerId, year: queryYear(context) });
  }, { tags: ['journals'], required: ['ownerId', 'workingYear'] });

  define('journals.detail', function (context) {
    return Store.journal(context.params.id);
  }, { tags: ['journals'], required: ['ownerId'] });

  define('journals.ledger', function (context) {
    const accountCode = context.query.account_code === undefined || context.query.account_code === null
      ? '' : context.query.account_code;
    return Store.ledger(accountCode, queryMonth(context), queryYear(context));
  }, { tags: ['journals'], required: ['ownerId', 'workingYear'] });

  define('reports.taxBalance', function (context) {
    const year = queryYear(context);
    const rawMonth = queryMonth(context);
    const month = Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : 12;
    const lastDay = new Date(year, month, 0).getDate();
    const pad = function (value) { return String(value).padStart(2, '0'); };
    const options = Object.assign({}, context.query, {
      date_from: year + '-01-01',
      date_to: year + '-' + pad(month) + '-' + pad(lastDay)
    });
    return Store.taxBalance(year, options);
  }, { tags: ['journals'], required: ['ownerId', 'workingYear'] });

  define('reports.paymentsPending', function (context) {
    return Store.pendingBalanceDocuments(queryYear(context));
  }, { tags: ['journals', 'documents'], required: ['ownerId', 'workingYear'] });

  define('editors.manualJournal', function (context) {
    return {
      owner: Store.owner(context.ownerId) || Store.activeOwner(),
      workingYear: context.workingYear || Store.workingYear(),
      accounts: Store.activeOwnerAccounts(),
      templates: Store.journalTemplates(),
      entryNumber: Store.nextEntryNumber(context.ownerId, context.workingYear || Store.workingYear())
    };
  }, { tags: ['accounts', 'journals', 'settings'], required: ['ownerId'] });

  define('editors.journal', function (context) {
    const journal = Store.journal(context.params.id);
    return {
      journal: journal,
      accounts: journal ? Store.accounts(journal.owner_id) : []
    };
  }, { tags: ['journals', 'accounts'], required: ['ownerId'] });

  define('system.config', function () {
    return {
      owner: Store.activeOwner(),
      workingYear: Store.workingYear(),
      range: Store.workingYearRange()
    };
  }, { tags: ['settings', 'owners'] });
})();
