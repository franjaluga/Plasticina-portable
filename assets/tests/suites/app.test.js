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

  T.test('El router renderiza la portada en el contenedor', function () {
    T.resetStore();
    window.location.hash = '#/';
    app.router.render();
    T.assertIncludes(document.getElementById('app').innerHTML, 'Owner Activo');
  });

  T.test('El router muestra 404 para rutas desconocidas', function () {
    window.location.hash = '#/ruta-inexistente';
    app.router.render();
    T.assertIncludes(document.getElementById('app').innerHTML, '404');
    window.location.hash = '#/';
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
