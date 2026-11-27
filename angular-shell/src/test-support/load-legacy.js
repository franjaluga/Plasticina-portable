(function () {
  'use strict';

  var scripts = [
    'core/namespace.js',
    'vendor/sql-asm.js',
    'core/db/config.js',
    'core/db/base64.js',
    'core/db/adapters/electron.js',
    'core/db/adapters/browser.js',
    'core/db/adapters/memory.js',
    'core/db/driver.js',
    'core/db/schema/meta.js',
    'core/db/schema/settings.js',
    'core/db/schema/owners.js',
    'core/db/schema/entities.js',
    'core/db/schema/document-types.js',
    'core/db/schema/accounts.js',
    'core/db/schema/account-templates.js',
    'core/db/schema/account-template-items.js',
    'core/db/schema/vc-documents.js',
    'core/db/schema/journals.js',
    'core/db/schema/journal-entries.js',
    'core/db/schema/index.js',
    'core/db/queries/owners.js',
    'core/db/queries/accounts.js',
    'core/db/queries/masters.js',
    'core/db/queries/templates.js',
    'core/db/queries/settings.js',
    'core/db/queries/vc-documents.js',
    'core/db/queries/journals.js',
    'core/db/queries/journal-entries.js',
    'core/db/queries/system.js',
    'core/db/repositories/owners.js',
    'core/db/repositories/accounts.js',
    'core/db/repositories/masters.js',
    'core/db/repositories/vc-documents.js',
    'core/db/repositories/journals.js',
    'core/db/repositories/journal-entries.js',
    'core/db/repositories/settings.js',
    'core/db/repositories/system.js',
    'core/db/index.js',
    'core/db/access.js',
    'core/ui/routes.js',
    'core/ui/format.js',
    'core/ui/session.js',
    'core/ui/forms.js',
    'core/ui/dom.js',
    'core/ui/index.js',
    'data/chart-of-accounts.js',
    'data/journal-templates.js',
    'store/context.js',
    'store/masters.js',
    'store/documents.js',
    'store/journals.js',
    'store/accounting.js',
    'store/csv.js',
    'store/import-purchases.js',
    'store/import-sales.js',
    'store/index.js',
    'store/datasets.js',
    'views/shared/helpers.js',
    'views/shared/dropdown.js',
    'views/shared/account-picker.js',
    'views/home/welcome.js',
    'views/system/config.js',
    'views/ingress/manual.js',
    'views/ingress/import.js',
    'views/ingress/import-purchases.js',
    'views/ingress/import-purchases-preview.js',
    'views/ingress/import-purchases-imported.js',
    'views/ingress/import-sales.js',
    'views/ingress/import-sales-preview.js',
    'views/ingress/import-sales-imported.js',
    'views/reports/hub.js',
    'views/reports/balance-context.js',
    'views/reports/ledger-context.js',
    'views/documents/create.js',
    'views/documents/pending.js',
    'views/documents/batch-processed.js',
    'views/accounting/analytics.js',
    'views/accounting/tax-balance.js',
    'views/accounting/system-journals.js',
    'views/accounting/journal-detail.js',
    'views/accounting/edit-journal.js',
    'views/accounting/edit-manual-journal.js',
    'views/accounting/manual-journal-create.js',
    'views/accounting/manual-journal-created.js',
    'views/accounting/audit.js',
    'views/accounting/payments.js',
    'views/accounting/document-query.js',
    'views/accounting/document-detail.js',
    'views/accounting/ledger-results.js',
    'views/owners/index.js',
    'views/owners/show.js',
    'views/owners/accounts.js',
    'views/masters/index.js',
    'views/masters/edit.js',
    'actions/helpers.js',
    'actions/period.js',
    'actions/owners.js',
    'actions/accounts.js',
    'actions/documents.js',
    'actions/imports.js',
    'actions/journals.js',
    'actions/payments.js',
    'actions/templates.js',
    'actions/system.js',
    'app/config.js',
    'app/view-data.js',
    'app/csv-export.js',
    'app/router.js',
    'app/events.js',
    'app/bootstrap.js',
    'tests/harness.js',
    'tests/core.test.js',
    'tests/store.test.js',
    'tests/views.test.js',
    'tests/app.test.js',
    'tests/actions.test.js',
    'specific-test/owners/owners.test.js',
    'specific-test/period/period.test.js'
  ];

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = function () { reject(new Error('No se pudo cargar ' + url)); };
      document.head.appendChild(script);
    });
  }

  window.__PLASTICINA_LOAD_LEGACY__ = function () {
    if (window.__PLASTICINA_LOAD_LEGACY_PROMISE__) {
      return window.__PLASTICINA_LOAD_LEGACY_PROMISE__;
    }
    window.__PLASTICINA_SQLITE_BYTES__ = null;
    window.__PLASTICINA_LOAD_LEGACY_PROMISE__ = scripts.reduce(function (chain, path) {
      return chain.then(function () {
        return loadScript(new URL('assets/' + path, document.baseURI).href);
      });
    }, Promise.resolve());
    return window.__PLASTICINA_LOAD_LEGACY_PROMISE__;
  };
})();
