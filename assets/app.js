(function () {
  'use strict';

  const app = document.getElementById('app');
  const routes = [
    { path: '/', view: 'welcome' },
    { path: '/ingress/manual', view: 'ingressManual' },
    { path: '/ingress/import', view: 'ingressImport' },
    { path: '/reports/analytics', view: 'analyticsHub' },
    { path: '/reports/journal-context', view: 'journalContext' },
    { path: '/reports/balance-context', view: 'balanceContext' },
    { path: '/reports/ledger-context', view: 'ledgerContext' },
    { path: '/vc-documents/libro-diario/rango', view: 'dateRangeForm' },
    { path: '/system/config', view: 'systemConfig' },
    { path: '/owners', view: 'ownersIndex' },
    { path: '/owners/{owner}', view: 'ownersShow' },
    { path: '/owners/{owner}/accounts', view: 'ownersAccounts' },
    { path: '/vc-documents/create', view: 'documentCreate' },
    { path: '/vc-documents/pendientes', view: 'documentPending' },
    { path: '/vc-documents/libro-diario', view: 'journalBook' },
    { path: '/vc-documents/libro-diario/generar', view: 'journalBook' },
    { path: '/vc-documents/balance-tributario', view: 'taxBalance' },
    { path: '/accounting/documents/query', view: 'documentQueryResults' },
    { path: '/accounting/reports', view: 'accountingIndex' },
    { path: '/accounting/analytics', view: 'accountingAnalytics' },
    { path: '/accounting/reports/audit', view: 'auditIndex' },
    { path: '/accounting/audit', view: 'auditIndex' },
    { path: '/accounting/system-journals', view: 'systemJournals' },
    { path: '/accounting/journals/{id}/detail', view: 'journalDetail' },
    { path: '/accounting/journals/{id}/edit', view: 'editJournal' },
    { path: '/accounting/manual-journals/create', view: 'manualJournalCreate' },
    { path: '/accounting/manual-journals/{id}/edit', view: 'editManualJournal' },
    { path: '/accounting/payments', view: 'paymentsIndex' },
    { path: '/accounting/ledger', view: 'ledgerResults' },
    { path: '/accounting/documents/{id}', view: 'documentDetail' },
    { path: '/masters/account-templates', view: 'templatesIndex' },
    { path: '/masters/account-templates/{accountTemplate}/edit', view: 'templatesEdit' }
  ];

  const getActions = {
    'vc_documents.pending': 'vc_documents.pending',
    'vc_documents.journal_book.generate': 'vc_documents.journal_book.generate',
    'vc_documents.query': 'vc_documents.query',
    'accounting.system_journals': 'accounting.system_journals',
    'accounting.ledger': 'accounting.ledger'
  };

  function matchRoute(path) {
    for (let index = 0; index < routes.length; index++) {
      const route = routes[index];
      const keys = [];
      const pattern = route.path.replace(/\{([^}]+)\}/g, function (_, key) {
        keys.push(key);
        return '([^/]+)';
      });
      const regex = new RegExp('^' + pattern + '$');
      const match = regex.exec(path);
      if (!match) continue;
      const params = {};
      keys.forEach(function (key, offset) {
        params[key] = decodeURIComponent(match[offset + 1]);
      });
      return { view: route.view, params: params };
    }
    return null;
  }

  function runScripts(container) {
    const scripts = Array.prototype.slice.call(container.querySelectorAll('script'));
    scripts.forEach(function (oldScript) {
      const script = document.createElement('script');
      Array.prototype.forEach.call(oldScript.attributes, function (attribute) {
        script.setAttribute(attribute.name, attribute.value);
      });
      script.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(script, oldScript);
    });
  }

  function exportJournalCsv(query) {
    const options = { year: Store.workingYear() };
    const owner = Store.activeOwner();
    if (owner) options.owner_id = owner.id;
    if (query.date_from && query.date_to) {
      options.date_from = query.date_from;
      options.date_to = query.date_to;
    }
    const journals = Store.journals(options);
    const rows = [['Asiento ID', 'Fecha', 'Doc V/C ID', 'Estado', 'Codigo Cuenta', 'Componente', 'Debe', 'Haber']];
    journals.forEach(function (journal, index) {
      journal.entries.forEach(function (entry) {
        rows.push([
          journal.id,
          journal.date,
          journal.vc_document_id || '',
          journal.is_balanced ? 'Cuadrado' : 'Descuadrado',
          entry.account_code,
          entry.account ? entry.account.name : 'Sin nombre',
          entry.debit,
          entry.credit
        ]);
      });
      if (index < journals.length - 1) rows.push(['---', '---', '---', '---', '---', '---', '---', '---']);
    });
    const csv = '\uFEFF' + rows.map(function (row) {
      return row.map(function (cell) {
        const value = String(cell === null || cell === undefined ? '' : cell);
        return /[;"\n\r]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
      }).join(';');
    }).join('\r\n');
    UI.download('libro_diario_' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.csv', csv, 'text/csv;charset=utf-8');
    UI.flash('success', 'Libro diario exportado en CSV.');
    window.location.hash = UI.route('vc_documents.journal_book');
  }

  function render() {
    const parsed = UI.parseHash(window.location.hash);
    if (parsed.path === '/system/database/export') {
      if (Actions['system.export']) Actions['system.export']();
      return;
    }
    if (parsed.path === '/vc-documents/libro-diario/export-csv') {
      exportJournalCsv(parsed.query);
      return;
    }

    const match = matchRoute(parsed.path);
    const flash = UI.takeFlash();
    if (!match || typeof window.Views[match.view] !== 'function') {
      app.innerHTML = flash + '<div class="max-w-xl mx-auto p-10 text-center text-sm text-slate-600">404 - Vista no encontrada.</div>';
      return;
    }
    try {
      app.innerHTML = flash + window.Views[match.view]({ params: match.params, query: parsed.query });
      runScripts(app);
    } catch (error) {
      app.innerHTML = flash + '<div class="max-w-2xl mx-auto p-8"><div class="bg-red-50 border-l-4 border-red-500 p-4 text-xs text-red-700">' + UI.h(error.message || String(error)) + '</div></div>';
    }
    sessionStorage.removeItem('plasticina_old');
    window.scrollTo(0, 0);
  }

  function navigate(path) {
    window.location.hash = path;
  }

  document.addEventListener('submit', async function (event) {
    const form = event.target.closest('form[data-action]');
    if (!form) return;
    event.preventDefault();

    const button = event.submitter;
    const confirmMessage = button && button.getAttribute('data-confirm')
      ? button.getAttribute('data-confirm')
      : form.getAttribute('data-confirm');
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    const action = form.dataset.action;
    const values = Actions.readForm(form);

    if (Object.prototype.hasOwnProperty.call(getActions, action)) {
      UI.remember(values);
      navigate(UI.route(getActions[action], values));
      return;
    }

    const handler = Actions[action];
    if (!handler) {
      UI.flash('error', 'Acción no implementada: ' + action);
      render();
      return;
    }

    UI.remember(values);
    try {
      await handler(form);
    } catch (error) {
      UI.flash('error', error.message || String(error));
      render();
    }
  });

  document.addEventListener('click', function (event) {
    const element = event.target.closest('[data-link-action]');
    if (!element) return;
    event.preventDefault();
    const action = element.getAttribute('data-link-action');
    if (Actions[action]) Actions[action]();
  });

  window.addEventListener('hashchange', render);

  Store.load();
  if (!window.location.hash) {
    window.history.replaceState(null, '', '#/');
  }
  window.App = { render: render, navigate: navigate };
  render();
})();
