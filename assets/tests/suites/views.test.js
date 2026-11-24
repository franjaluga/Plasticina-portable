(function () {
  'use strict';

  const T = window.PlasticinaTest;
  const ctx = { params: { id: 1, owner: 1, accountTemplate: 1 }, query: {} };

  function resetWithStart(month, startYear) {
    T.resetStore();
    const owner = Store.createOwner({
      rut: '88888888-8',
      name: 'Empresa Histórica',
      account_plan_type: 'standard_pyme',
      start_month: month,
      start_year: startYear
    });
    Store.setActiveOwner(owner.id);
  }

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

  T.test('La confirmación de asiento manual ofrece solo dos opciones', function () {
    const html = window.Views.manualJournalCreated(ctx);
    T.assertIncludes(html, UI.route('accounting.manual_journals.create'));
    T.assertIncludes(html, 'Crear otro asiento');
    T.assertIncludes(html, UI.route('welcome'));
    T.assertIncludes(html, 'Volver al inicio');
    T.assert(html.indexOf('accounting/reports') === -1, 'La confirmación no debe enlazar a reportes contables');
    T.assert(html.indexOf('Reportes Contables') === -1, 'La confirmación no debe mostrar el hub duplicado');
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
    T.assertIncludes(html, 'name="start_month"');
    T.assertIncludes(html, 'name="start_year"');
    T.assertIncludes(html, 'Inicio de Actividades (Inalterable)');
    T.assertIncludes(html, 'style="display:none" aria-hidden="true"');
  });

  T.test('El contexto balance permite el mes de inicio y bloquea meses anteriores', function () {
    const year = Store.workingYear();
    resetWithStart(3, year);
    const entries = [
      { account_code: '1010101', debit: 10, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 10, component_name: 'manual' }
    ];
    Store.registerManualJournal(year, 3, year + '-03-05', 'Marzo', entries);

    const first = window.Views.balanceContext({ params: {}, query: { month: '3', year: String(year) } });
    T.assertIncludes(first, '<form id="balanceContextForm" data-action="vc_documents.tax_balance"');
    T.assertIncludes(first, '<option value="03" selected>');
    T.assertIncludes(first, 'id="balancePeriodHelp"');
    T.assertIncludes(first, 'Se procesa desde 01/01/' + year + ' hasta el 31/03/' + year + '.');
    T.assertIncludes(first, 'id="balanceGenerateBtn"');
    T.assert(first.indexOf('disabled aria-disabled="true"') === -1, 'El primer mes contable debe estar habilitado');
    T.assert(first.indexOf('No hay contabilidad disponible') === -1, 'No debe simular ausencia de contabilidad');

    const later = window.Views.balanceContext({ params: {}, query: { month: '9', year: String(year) } });
    T.assertIncludes(later, 'Se procesa desde 01/01/' + year + ' hasta el 30/09/' + year + '.');
    T.assert(later.indexOf('disabled aria-disabled="true"') === -1, 'No debe bloquear un periodo posterior');

    const before = window.Views.balanceContext({ params: {}, query: { month: '2', year: String(year) } });
    T.assertIncludes(before, 'La fecha no puede ser anterior a 03/' + year);
    T.assertIncludes(before, 'No es posible generar el balance');
    T.assertIncludes(before, 'disabled aria-disabled="true"');
    T.assert(before.indexOf('<a href="#/vc-documents/balance-tributario"') === -1,
      'La card ya no debe ser un enlace directo');
    T.resetStore();
  });

  T.test('El contexto balance bloquea la generación si no hay contabilidad disponible', function () {
    const year = Store.workingYear();
    resetWithStart(1, year);
    const html = window.Views.balanceContext({ params: {}, query: { month: '1', year: String(year) } });
    T.assertIncludes(html, 'No hay contabilidad disponible para este negocio');
    T.assertIncludes(html, 'disabled aria-disabled="true"');
  });

  T.test('El balance tributario muestra el rango hasta el mes solicitado y vuelve al contexto anterior', function () {
    T.resetStore();
    const year = Store.workingYear();
    const html = window.Views.taxBalance({ params: {}, query: { month: '9', year: String(year) } });
    T.assertIncludes(html, '01/01/' + year + ' al 30/09/' + year);
    T.assertIncludes(html, 'href="javascript:history.back()"');
    T.assert(html.indexOf(UI.route('welcome')) === -1, 'El balance no debe volver al inicio');
  });

  T.test('El balance tributario sin query mantiene el volver contextual', function () {
    T.resetStore();
    const html = window.Views.taxBalance({ params: {}, query: {} });
    T.assertIncludes(html, 'href="javascript:history.back()"');
  });
})();
