(function () {
  'use strict';

  const config = window.Plasticina.app.config;

  config.routes = [
    { path: '/', view: 'welcome' },
    { path: '/ingress/manual', view: 'ingressManual' },
    { path: '/ingress/import', view: 'ingressImport' },
    { path: '/ingress/import/generic', view: 'documentUpload' },
    { path: '/ingress/import/compras', view: 'ingressImportPurchases' },
    { path: '/ingress/import/compras/preview', view: 'ingressImportPurchasesPreview' },
    { path: '/reports/analytics', view: 'analyticsHub' },
    { path: '/reports/balance-context', view: 'balanceContext' },
    { path: '/reports/ledger-context', view: 'ledgerContext' },
    { path: '/system/config', view: 'systemConfig' },
    { path: '/owners', view: 'ownersIndex' },
    { path: '/owners/{owner}', view: 'ownersShow' },
    { path: '/owners/{owner}/accounts', view: 'ownersAccounts' },
    { path: '/vc-documents/create', view: 'documentCreate' },
    { path: '/vc-documents/pendientes', view: 'documentPending' },
    { path: '/vc-documents/balance-tributario', view: 'taxBalance' },
    { path: '/accounting/documents/query', view: 'documentQueryResults' },
    { path: '/accounting/analytics', view: 'accountingAnalytics' },
    { path: '/accounting/reports/audit', view: 'auditIndex' },
    { path: '/accounting/audit', view: 'auditIndex' },
    { path: '/accounting/system-journals', view: 'systemJournals' },
    { path: '/accounting/journals/{id}/detail', view: 'journalDetail' },
    { path: '/accounting/journals/{id}/edit', view: 'editJournal' },
    { path: '/accounting/manual-journals/create', view: 'manualJournalCreate' },
    { path: '/accounting/manual-journals/created', view: 'manualJournalCreated' },
    { path: '/accounting/manual-journals/{id}/edit', view: 'editManualJournal' },
    { path: '/accounting/payments', view: 'paymentsIndex' },
    { path: '/accounting/ledger', view: 'ledgerResults' },
    { path: '/accounting/documents/{id}', view: 'documentDetail' },
    { path: '/masters/account-templates', view: 'templatesIndex' },
    { path: '/masters/account-templates/{accountTemplate}/edit', view: 'templatesEdit' }
  ];

  const centered = 'font-sans antialiased bg-slate-50 text-slate-900 flex items-center justify-center min-h-screen p-4';
  const slateList = 'bg-slate-50 text-slate-900 font-sans antialiased min-h-screen py-10';
  const grayList = 'bg-gray-50 text-gray-900 font-sans antialiased min-h-screen py-10';
  const previewWide = 'font-sans antialiased bg-slate-50 text-slate-900 min-h-screen p-6';

  config.bodyClasses = {
    welcome: centered,
    ingressManual: centered,
    ingressImport: centered,
    ingressImportPurchases: centered,
    ingressImportPurchasesPreview: previewWide,
    analyticsHub: centered,
    balanceContext: centered,
    ledgerContext: centered,
    systemConfig: centered,
    ownersIndex: slateList,
    ownersShow: slateList,
    ownersAccounts: slateList,
    documentCreate: 'font-sans antialiased bg-gray-100 text-gray-900',
    documentUpload: centered,
    documentPending: grayList,
    taxBalance: 'bg-white text-slate-900 font-sans p-8 max-w-6xl mx-auto',
    documentQueryResults: 'bg-white text-black font-sans p-6 max-w-[95%] mx-auto',
    manualJournalCreated: centered,
    accountingAnalytics: centered,
    auditIndex: 'font-sans antialiased bg-slate-50 text-slate-900 p-6',
    systemJournals: 'bg-gray-50 text-gray-900 font-sans antialiased min-h-screen py-10',
    journalDetail: grayList,
    editJournal: grayList,
    editManualJournal: grayList,
    manualJournalCreate: 'bg-white text-black font-sans p-6 max-w-4xl mx-auto',
    paymentsIndex: 'font-sans antialiased bg-slate-50 text-slate-900 p-6',
    ledgerResults: 'bg-white text-black font-sans p-6 max-w-[95%] mx-auto',
    documentDetail: 'bg-white text-slate-900 font-sans p-8 max-w-3xl mx-auto',
    templatesIndex: slateList,
    templatesEdit: slateList
  };

  config.getActions = {
    'vc_documents.tax_balance': 'vc_documents.tax_balance',
    'vc_documents.pending': 'vc_documents.pending',
    'vc_documents.query': 'vc_documents.query',
    'accounting.system_journals': 'accounting.system_journals',
    'accounting.ledger': 'accounting.ledger'
  };

  config.reportPeriodRoutes = {
    '/vc-documents/balance-tributario': { kind: 'month-year', context: '/reports/balance-context' },
    '/accounting/ledger': { kind: 'month-year', context: '/reports/ledger-context' },
    '/accounting/documents/query': { kind: 'month-year', context: '/accounting/analytics' },
    '/accounting/system-journals': { kind: 'date-from-or-year', context: '/accounting/system-journals' },
    '/accounting/system-journals/export-csv': { kind: 'date-from-or-year', context: '/accounting/system-journals' },
    '/accounting/audit': { kind: 'year', context: '/accounting/reports/audit' }
  };
})();
