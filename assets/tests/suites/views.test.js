(function () {
  'use strict';

  const T = window.PlasticinaTest;
  const ctx = { params: { id: 1, owner: 1, accountTemplate: 1 }, query: {} };

  T.test('Todas las vistas registradas renderizan sin lanzar', function () {
    T.resetStore();
    const names = Object.keys(window.Views);
    T.assert(names.length >= 25, 'Se esperaban al menos 25 vistas, hay ' + names.length);
    names.forEach(function (name) {
      let html = '';
      try {
        html = window.Views[name](ctx);
      } catch (error) {
        throw new Error('Vista ' + name + ': ' + error.message);
      }
      T.assertEqual(typeof html, 'string', 'Vista ' + name + ' debe devolver HTML');
      T.assert(html.length > 0, 'Vista ' + name + ' devolvió HTML vacío');
    });
  });

  T.test('La portada muestra el owner activo y atajo de contabilización', function () {
    T.resetStore();
    const html = window.Views.welcome(ctx);
    T.assertIncludes(html, 'Owner Activo');
    T.assertIncludes(html, 'Test');
  });

  T.test('El formulario de documentos expone las acciones esperadas', function () {
    T.resetStore();
    const html = window.Views.documentCreate(ctx);
    T.assertIncludes(html, 'data-action="documents.store"');
  });

  T.test('Los maestros, el sistema y la portada exponen sus accesos', function () {
    T.resetStore();
    T.assertIncludes(window.Views.templatesIndex(ctx), 'data-action="templates.store"');
    T.assertIncludes(window.Views.systemConfig(ctx), 'masters/account-templates');
    T.assertIncludes(window.Views.welcome(ctx), 'data-action="period.update"');
  });

  T.test('Los formularios de edición de owners quedan fuera de la tabla', function () {
    T.resetStore();
    const html = window.Views.ownersIndex(ctx);
    const tbody = html.split('<tbody')[1].split('</tbody>')[0];
    T.assert(!tbody.includes('data-action="owners.update"'), 'El formulario de actualización quedó dentro de tbody');
    T.assert(!tbody.includes('data-action="owners.destroy"'), 'El formulario de eliminación quedó dentro de tbody');
    T.assertIncludes(html, 'data-action="owners.update"');
    T.assertIncludes(html, 'data-action="owners.destroy"');
    T.assertIncludes(html, 'style="display:none" aria-hidden="true"');
  });

  T.test('El contexto balance pide mes y año y sobrescribe el botón Generar', function () {
    T.resetStore();
    const year = Store.workingYear();
    const html = window.Views.balanceContext({ params: {}, query: { month: '9', year: String(year) } });
    T.assertIncludes(html, '<form data-action="vc_documents.tax_balance"');
    T.assertIncludes(html, 'name="month"');
    T.assertIncludes(html, 'name="year"');
    T.assertIncludes(html, 'type="submit"');
    T.assertIncludes(html, 'Generar &rarr;');
    T.assertIncludes(html, 'value="09" selected');
    T.assertIncludes(html, 'value="' + year + '"');
    T.assert(html.indexOf('<a href="#/vc-documents/balance-tributario"') === -1,
      'La card ya no debe ser un enlace directo');
  });

  T.test('El balance tributario muestra el rango hasta el mes solicitado', function () {
    T.resetStore();
    const year = Store.workingYear();
    const html = window.Views.taxBalance({ params: {}, query: { month: '9', year: String(year) } });
    T.assertIncludes(html, '01/01/' + year + ' al 30/09/' + year);
  });
})();
