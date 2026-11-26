(function () {
  'use strict';

  const ui = window.Plasticina.ui;
  const routes = {
    'welcome': '/',
    'period.update': '/period/update',
    'ingress.manual': '/ingress/manual',
    'ingress.import': '/ingress/import',
    'ingress.import.generic': '/ingress/import/generic',
    'ingress.import.purchases': '/ingress/import/compras',
    'ingress.import.purchases.preview': '/ingress/import/compras/preview',
    'ingress.import.purchases.imported': '/ingress/import/compras/importado',
    'ingress.import.sales': '/ingress/import/ventas',
    'ingress.import.sales.preview': '/ingress/import/ventas/preview',
    'ingress.import.sales.imported': '/ingress/import/ventas/importado',
    'reports.analytics': '/reports/analytics',
    'reports.balance_context': '/reports/balance-context',
    'reports.ledger_context': '/reports/ledger-context',
    'system.config': '/system/config',
    'owners.index': '/owners',
    'owners.show': '/owners/{owner}',
    'owners.accounts.index': '/owners/{owner}/accounts',
    'vc_documents.create': '/vc-documents/create',
    'vc_documents.pending': '/vc-documents/pendientes',
    'vc_documents.batch_processed': '/vc-documents/contabilizados',
    'vc_documents.tax_balance': '/vc-documents/balance-tributario',
    'vc_documents.query': '/accounting/documents/query',
    'accounting.reports.index': '/reports/analytics',
    'accounting.analytics': '/accounting/analytics',
    'accounting.reports.audit': '/accounting/reports/audit',
    'accounting.audit.index': '/accounting/audit',
    'accounting.system_journals': '/accounting/system-journals',
    'accounting.system_journals.export_csv': '/accounting/system-journals/export-csv',
    'accounting.journals.detail': '/accounting/journals/{id}/detail',
    'accounting.journals.edit': '/accounting/journals/{id}/edit',
    'accounting.manual_journals.create': '/accounting/manual-journals/create',
    'accounting.manual_journals.created': '/accounting/manual-journals/created',
    'accounting.manual_journals.edit': '/accounting/manual-journals/{id}/edit',
    'accounting.payments.index': '/accounting/payments',
    'accounting.ledger': '/accounting/ledger',
    'accounting.documents.detail': '/accounting/documents/{id}',
    'masters.account_templates.index': '/masters/account-templates',
    'masters.account_templates.edit': '/masters/account-templates/{accountTemplate}/edit',
    'system.database.export': '/system/database/export'
  };

  function route(name, parameters) {
    let path = routes[name] || '/';
    const params = parameters === undefined || parameters === null
      ? {}
      : (typeof parameters === 'object' ? Object.assign({}, parameters) : { id: parameters });
    path = path.replace(/\{([^}]+)\}/g, function (_, key) {
      const value = params[key];
      delete params[key];
      if (value && typeof value === 'object' && 'id' in value) return encodeURIComponent(String(value.id));
      return value === undefined || value === null ? '' : encodeURIComponent(String(value));
    });
    const query = Object.keys(params)
      .filter(function (key) { return params[key] !== undefined && params[key] !== null && params[key] !== ''; })
      .map(function (key) { return encodeURIComponent(key) + '=' + encodeURIComponent(String(params[key])); })
      .join('&');
    return '#' + path + (query ? '?' + query : '');
  }

  function parseHash(hash) {
    const raw = String(hash || '').replace(/^#/, '') || '/';
    const parts = raw.split('?');
    const path = '/' + parts[0].replace(/^\/+|\/+$/g, '');
    const query = {};
    new URLSearchParams(parts[1] || '').forEach(function (value, key) { query[key] = value; });
    return { path: path === '/' ? '/' : path, query: query };
  }

  ui.routes = routes;
  ui.route = route;
  ui.parseHash = parseHash;
})();
