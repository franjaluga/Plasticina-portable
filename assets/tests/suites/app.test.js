(function () {
  'use strict';

  const T = window.PlasticinaTest;
  const app = window.Plasticina.app;

  T.test('El router resuelve rutas simples y con parámetros', function () {
    T.assertDeepEqual(app.router.matchRoute('/owners'), { view: 'ownersIndex', params: {} });
    T.assertDeepEqual(app.router.matchRoute('/owners/4/accounts'), { view: 'ownersAccounts', params: { owner: '4' } });
    T.assertDeepEqual(app.router.matchRoute('/accounting/journals/9/detail'), { view: 'journalDetail', params: { id: '9' } });
    T.assertEqual(app.router.matchRoute('/no-existe'), null);
  });

  T.test('Cada ruta declarada tiene una vista registrada', function () {
    app.config.routes.forEach(function (route) {
      T.assertEqual(typeof window.Views[route.view], 'function', 'Falta la vista ' + route.view);
    });
  });

  T.test('Las acciones GET redirigen a rutas conocidas', function () {
    Object.keys(app.config.getActions).forEach(function (action) {
      const hash = UI.route(app.config.getActions[action], { id: 1, owner: 1 });
      const path = UI.parseHash(hash).path;
      T.assert(app.router.matchRoute(path), 'Ruta no registrada para ' + action + ': ' + path);
    });
  });

  T.test('La confirmación de asiento manual tiene ruta y vista propias', function () {
    T.assertEqual(UI.route('accounting.manual_journals.created'), '#/accounting/manual-journals/created');
    const match = app.router.matchRoute('/accounting/manual-journals/created');
    T.assert(match, 'Falta la ruta de confirmación del asiento manual');
    T.assertEqual(match.view, 'manualJournalCreated');
  });

  T.test('La ruta heredada de reportes contables redirige al hub analítico', function () {
    T.resetStore();
    T.assertEqual(UI.route('accounting.reports.index'), '#/reports/analytics');
    T.assertEqual(app.router.matchRoute('/accounting/reports'), null);
    T.assertEqual(app.router.matchRoute('/reports/analytics').view, 'analyticsHub');
    T.assertEqual(app.router.matchRoute('/accounting/reports/audit').view, 'auditIndex');
    window.location.hash = '#/accounting/reports';
    app.router.render();
    T.assertEqual(window.location.hash, '#/reports/analytics');
    app.router.render();
    T.assertIncludes(document.getElementById('app').innerHTML, 'Reportes y Análisis');
    window.location.hash = '#/';
  });

  T.test('La confirmación muestra el mensaje de éxito, el número creado y sus dos opciones', function () {
    T.resetStore();
    const year = Store.workingYear();
    const id = Store.registerManualJournal(year, 3, year + '-03-05', 'Asiento creado', [
      { account_code: '1010101', debit: 100, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 100, component_name: 'manual' }
    ]);
    const journal = Store.journal(id);
    UI.flash('success', 'Asiento contable manual creado exitosamente.');
    window.location.hash = UI.route('accounting.manual_journals.created', { journal_id: id });
    app.router.render();
    const html = document.getElementById('app').innerHTML;
    T.assertIncludes(html, 'Asiento contable manual creado exitosamente.');
    T.assertIncludes(html, 'Asiento N° <span class="font-mono">' + journal.entry_number + '</span>');
    T.assertIncludes(html, UI.route('accounting.journals.detail', journal.id));
    T.assertIncludes(html, 'Crear otro asiento');
    T.assertIncludes(html, 'Volver al inicio');
    window.location.hash = '#/';
    T.resetStore();
  });

  T.test('El router renderiza la portada en el contenedor', function () {
    T.resetStore();
    window.location.hash = '#/';
    app.router.render();
    T.assertIncludes(document.getElementById('app').innerHTML, 'Owner Activo');
  });

  T.test('El botón HOME con forma de casita aparece salvo en la portada', function () {
    T.resetStore();
    const home = 'aria-label="Ir al inicio"';
    window.location.hash = '#/';
    app.router.render();
    T.assert(document.getElementById('app').innerHTML.indexOf(home) === -1,
      'La portada no debe mostrar el botón HOME');

    window.location.hash = UI.route('reports.analytics');
    app.router.render();
    const html = document.getElementById('app').innerHTML;
    T.assertIncludes(html, home);
    T.assertIncludes(html, 'href="#/"');
    T.assertIncludes(html, '<svg class="w-5 h-5"');
    T.assertIncludes(html, 'M3 12l2-2m0 0l7-7 7 7');

    window.location.hash = '#/ruta-inexistente';
    app.router.render();
    T.assertIncludes(document.getElementById('app').innerHTML, home);
    window.location.hash = '#/';
  });

  T.test('El router muestra 404 para rutas desconocidas', function () {
    window.location.hash = '#/ruta-inexistente';
    app.router.render();
    T.assertIncludes(document.getElementById('app').innerHTML, '404');
    window.location.hash = '#/';
  });

  T.test('El CSV del libro diario incluye la glosa de cada asiento', function () {
    T.resetStore();
    const originalDownload = UI.download;
    let downloaded = '';
    UI.download = function (filename, content) {
      downloaded = content;
    };
    try {
      const year = Store.workingYear();
      Store.registerManualJournal(year, 3, year + '-03-05', 'Glosa CSV', [
        { account_code: '1010101', debit: 100, credit: 0, component_name: 'manual' },
        { account_code: '4010101', debit: 0, credit: 100, component_name: 'manual' }
      ]);
      app.exportJournalCsv({});
      T.assertIncludes(downloaded, 'Asiento ID;Fecha;Glosa;Doc V/C ID;Estado;Codigo Cuenta;Componente;Debe;Haber');
      T.assertIncludes(downloaded, 'Glosa CSV');
      T.assert(downloaded.indexOf('Sin descripción') === -1, 'El asiento tiene glosa y no debe usar el fallback');
    } finally {
      UI.download = originalDownload;
      window.location.hash = '#/';
    }
  });

  T.test('El balance genera la ruta con el mes y el año elegidos', function () {
    const hash = UI.route('vc_documents.tax_balance', { month: 9, year: 2026 });
    const parsed = UI.parseHash(hash);
    T.assertEqual(parsed.path, '/vc-documents/balance-tributario');
    T.assertDeepEqual(parsed.query, { month: '9', year: '2026' });
    T.assertEqual(app.router.matchRoute(parsed.path).view, 'taxBalance');
  });

  T.test('El router bloquea reportes directos anteriores al inicio de actividades', function () {
    T.resetStore();
    const year = Store.workingYear();
    const owner = Store.createOwner({
      rut: '88888888-8',
      name: 'Empresa con inicio en junio',
      account_plan_type: 'standard_pyme',
      start_month: 6,
      start_year: year
    });
    Store.setActiveOwner(owner.id);
    const before = app.router.validateReportPeriod('month-year', { month: 5, year: year });
    T.assertEqual(before.allowed, false);
    T.assertEqual(before.reason, 'before-start');
    window.location.hash = '#/accounting/ledger?month=5&year=' + year;
    app.router.render();
    T.assertIncludes(document.getElementById('app').innerHTML, 'No es posible generar el reporte');
    T.assertIncludes(document.getElementById('app').innerHTML, '06/' + year);
    window.location.hash = '#/';
    T.resetStore();
  });
})();
