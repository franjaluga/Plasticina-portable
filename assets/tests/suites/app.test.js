(function () {
  'use strict';

  const T = window.PlasticinaTest;
  const app = window.Plasticina.app;

  T.test('El router resuelve rutas simples y con parámetros', function () {
    T.assertDeepEqual(app.router.matchRoute('/owners'), { view: 'ownersIndex', params: {} });
    T.assertDeepEqual(app.router.matchRoute('/owners/4/accounts'), { view: 'ownersAccounts', params: { owner: '4' } });
    T.assertDeepEqual(app.router.matchRoute('/accounting/journals/9/detail'), { view: 'journalDetail', params: { id: '9' } });
    T.assertEqual(app.router.matchRoute('/no-existe'), null);
    T.assertEqual(app.router.matchRoute('/reports/journal-context'), null);
    T.assertEqual(app.router.matchRoute('/vc-documents/libro-diario/rango'), null);
    T.assertEqual(app.router.matchRoute('/vc-documents/libro-diario'), null);
    T.assertEqual(app.router.matchRoute('/vc-documents/libro-diario/generar'), null);
  });

  T.test('Cada ruta declarada tiene una vista registrada', function () {
    app.config.routes.forEach(function (route) {
      T.assertEqual(typeof window.Views[route.view], 'function', 'Falta la vista ' + route.view);
    });
  });

  T.test('El importador de compras tiene carga, revisión y confirmación con rutas propias', function () {
    T.assertEqual(UI.route('ingress.import.purchases'), '#/ingress/import/compras');
    T.assertEqual(UI.route('ingress.import.purchases.preview'), '#/ingress/import/compras/preview');
    T.assertEqual(UI.route('ingress.import.purchases.imported'), '#/ingress/import/compras/importado');
    T.assertEqual(app.router.matchRoute('/ingress/import/compras').view, 'ingressImportPurchases');
    T.assertEqual(app.router.matchRoute('/ingress/import/compras/preview').view, 'ingressImportPurchasesPreview');
    T.assertEqual(app.router.matchRoute('/ingress/import/compras/importado').view, 'ingressImportPurchasesImported');
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

  T.test('La confirmación de contabilización masiva tiene ruta y vista propias', function () {
    T.assertEqual(UI.route('vc_documents.batch_processed'), '#/vc-documents/contabilizados');
    const match = app.router.matchRoute('/vc-documents/contabilizados');
    T.assert(match, 'Falta la ruta de confirmación de contabilización masiva');
    T.assertEqual(match.view, 'documentBatchProcessed');
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
    const hubHtml = document.getElementById('app').innerHTML;
    T.assertIncludes(hubHtml, 'Reportes y Análisis');
    T.assertIncludes(hubHtml, UI.route('accounting.system_journals'));
    T.assert(hubHtml.indexOf('#/reports/journal-context') === -1, 'El hub ya no debe enlazar al contexto de libro diario');
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

  T.test('La confirmación masiva muestra el mensaje y sus dos cards', function () {
    T.resetStore();
    UI.flash('success', 'Se procesaron correctamente 1 documentos.');
    window.location.hash = UI.route('vc_documents.batch_processed', { processed: 1 });
    app.router.render();
    const html = document.getElementById('app').innerHTML;
    T.assertIncludes(html, 'Se procesaron correctamente 1 documentos.');
    T.assertIncludes(html, 'Contabilizar más documentos');
    T.assertIncludes(html, UI.route('vc_documents.pending'));
    T.assertIncludes(html, 'Ir a libro de compras y ventas');
    T.assertIncludes(html, UI.route('accounting.analytics'));
    T.assertEqual((html.match(/class="group p-6 bg-white border border-slate-200 rounded-2xl/g) || []).length, 2);
    window.location.hash = '#/';
  });

  T.test('El router renderiza la portada en el contenedor', function () {
    T.resetStore();
    window.location.hash = '#/';
    app.router.render();
    T.assertIncludes(document.getElementById('app').innerHTML, 'Empresa Activa');
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

  T.test('El CSV de asientos del sistema incluye la glosa y respeta los filtros', function () {
    T.resetStore();
    const originalDownload = UI.download;
    let downloaded = '';
    UI.download = function (filename, content) {
      downloaded = content;
    };
    try {
      const year = Store.workingYear();
      const owner = Store.createOwner({
        rut: '88888888-8',
        name: 'Empresa Histórica',
        account_plan_type: 'standard_pyme',
        start_month: 1,
        start_year: year
      });
      Store.setActiveOwner(owner.id);
      const entries = [
        { account_code: '1010101', debit: 100, credit: 0, component_name: 'manual' },
        { account_code: '4010101', debit: 0, credit: 100, component_name: 'manual' }
      ];
      Store.registerManualJournal(year, 3, year + '-03-05', 'Glosa CSV', entries);
      Store.registerManualJournal(year, 4, year + '-04-05', 'Glosa fuera de rango', entries);
      app.exportSystemJournalsCsv({ date_from: year + '-03-01', date_to: year + '-03-31' });
      T.assertIncludes(downloaded, 'Asiento ID;Fecha;Glosa;Doc V/C ID;Estado;Codigo Cuenta;Componente;Debe;Haber');
      T.assertIncludes(downloaded, 'Glosa CSV');
      T.assert(downloaded.indexOf('Glosa fuera de rango') === -1, 'El CSV debe respetar el rango de fechas');
      T.assert(downloaded.indexOf('Sin descripción') === -1, 'El asiento tiene glosa y no debe usar el fallback');
    } finally {
      UI.download = originalDownload;
      window.location.hash = '#/';
    }
  });

  T.test('La exportación CSV vive en asientos del sistema', function () {
    const hash = UI.route('accounting.system_journals.export_csv', { year: 2026, date_from: '2026-03-01' });
    const parsed = UI.parseHash(hash);
    T.assertEqual(parsed.path, '/accounting/system-journals/export-csv');
    T.assertDeepEqual(parsed.query, { year: '2026', date_from: '2026-03-01' });
    T.assert(app.config.reportPeriodRoutes[parsed.path], 'La exportación debe validar el periodo del reporte');
    T.assert(!app.config.getActions['vc_documents.journal_book.generate'], 'La acción de rango eliminada no debe quedar registrada');
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
