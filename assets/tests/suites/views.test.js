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

  T.test('El buscador de cuentas reconoce códigos, nombres y tildes', function () {
    const helpers = window.Plasticina.views.helpers;
    const accounts = [
      { code: '1010101', name: 'Caja' },
      { code: '1010102', name: 'Banco Cuenta Corriente' },
      { code: '4010101', name: 'Ventas' }
    ];

    T.assertEqual(helpers.normalizeAccountText('  BÁNCO   cuenta '), 'banco cuenta');
    T.assertEqual(helpers.searchAccounts(accounts, '101010', 8).length, 2);
    T.assertEqual(helpers.searchAccounts(accounts, 'banco', 8)[0].code, '1010102');
    T.assertEqual(helpers.resolveAccount(accounts, '1010102').account.name, 'Banco Cuenta Corriente');
    T.assertEqual(helpers.resolveAccount(accounts, 'caja').account.code, '1010101');
    T.assertEqual(helpers.resolveAccount(accounts, 'corriente').account.code, '1010102');
    T.assertEqual(helpers.resolveAccount(accounts, '999').account, null);

    const repeated = [{ code: '1010101', name: 'Caja' }, { code: '1010102', name: 'Caja' }];
    const ambiguous = helpers.resolveAccount(repeated, 'caja');
    T.assertEqual(ambiguous.account, null);
    T.assertEqual(ambiguous.ambiguous, true);

    const field = helpers.accountSearchField('account_code', '1010102', { accounts: accounts });
    T.assertIncludes(field, 'data-account-search');
    T.assertIncludes(field, 'placeholder="Código o nombre"');
    T.assertIncludes(field, 'account-search-wrap flex items-center gap-2');
    T.assertIncludes(field, 'account-search-field relative min-w-0 flex-1');
    T.assertIncludes(field, 'account-name-label truncate');
    T.assertIncludes(field, '>Banco Cuenta Corriente<');
    T.assert(field.indexOf('mt-1') === -1, 'La etiqueta no debe mostrarse debajo del cuadro');

    T.assertEqual(helpers.accountLabelState(accounts, '1010102').state, 'valid');
    T.assertEqual(helpers.accountLabelState(accounts, '1010102').text, 'Banco Cuenta Corriente');
    T.assertEqual(helpers.accountLabelState(accounts, '').state, 'empty');
  });

  T.test('Los formularios de contabilización buscan cuentas por código o nombre', function () {
    T.resetStore();
    const create = window.Views.manualJournalCreate(ctx);
    T.assertIncludes(create, 'accountSearchField(');
    T.assertIncludes(create, 'Código o nombre');
    T.assert(create.indexOf('list="accounts_list"') === -1, 'El formulario aún usa datalist');

    const pending = window.Views.documentPending(ctx);
    T.assertIncludes(pending, 'accountSearchField(');
    T.assertIncludes(pending, 'custom_net_account');
    T.assertIncludes(pending, 'Código o nombre');
    T.assert(pending.indexOf('list="accounts_list"') === -1, 'El formulario aún usa datalist');

    const ledger = window.Views.ledgerContext({ params: {}, query: {} });
    T.assertIncludes(ledger, 'accountSearchField(');
    T.assertIncludes(ledger, 'account_code');
    T.assertIncludes(ledger, 'Código o nombre');
    T.assert(ledger.indexOf('list="accounts_list"') === -1, 'El formulario aún usa datalist');
  });

  T.test('El acordeón de asientos prefabricados empieza cerrado', function () {
    T.resetStore();
    const html = window.Views.manualJournalCreate(ctx);
    T.assertIncludes(html, 'id="templates-toggle"');
    T.assert(html.indexOf('</form>') < html.indexOf('id="templates-toggle"'), 'El acordeón debe estar después del formulario');
    T.assertIncludes(html, 'aria-expanded="false"');
    T.assertIncludes(html, 'aria-controls="templates-panel"');
    T.assertIncludes(html, '[+] ver asientos prefabricados');
    T.assertIncludes(html, 'id="templates-panel" class="hidden"');
    T.assertIncludes(html, "[−] ocultar asientos prefabricados");
  });

  T.test('El asiento manual recalcula totales y muestra el cuadre en la fila de totales', function () {
    T.resetStore();
    const html = window.Views.manualJournalCreate(ctx);
    const tfootStart = html.indexOf('<tfoot>');
    const tfootEnd = html.indexOf('</tfoot>');
    ['id="journal-difference"', 'id="balance-indicator-dot"', 'id="balance-indicator-text"'].forEach(function (id) {
      T.assert(html.indexOf(id) > tfootStart && html.indexOf(id) < tfootEnd, id + ' debe estar en la fila de totales');
    });
    T.assert(html.indexOf('id="save-journal-btn"') > tfootEnd, 'El botón de guardar sigue fuera de la tabla');
    T.assert(html.indexOf('oninput="calculateTotals()"') === -1, 'El recálculo ya no depende de un handler en línea');
    T.assertIncludes(html, 'input.oninput = function () {');
    T.assertIncludes(html, 'input.onfocus = function () { this.select(); };');
    T.assertIncludes(html, 'input.onclick = function () { this.select(); };');
    T.assertEqual(html.split('step="1"').length - 1, 2, 'Los montos del asiento son enteros');
    T.assertIncludes(html, 'Por ingresar');
    T.assertIncludes(html, "'Cuadrado'");
    T.assertIncludes(html, "'Descuadrado'");
    T.assertIncludes(html, 'bg-amber-500');
    T.assertIncludes(html, 'bg-green-500');
    T.assertIncludes(html, 'bg-red-500');
    T.assertIncludes(html, 'saveButton.disabled = empty;');
    T.assertIncludes(html, "El asiento está por ingresar; ingrese montos antes de guardar.");
    T.assertIncludes(html, 'monto entero mayor a 0');
    T.assert(html.indexOf('class="w-24 text-xs p-1.5 border border-gray-300 bg-gray-50 text-right font-mono font-bold text-gray-500"') === -1,
      'Ya no debe existir el campo antiguo de diferencia');
  });

  T.test('Los formularios de asientos corrigen de inmediato los montos negativos', function () {
    const year = Store.workingYear();
    resetWithStart(1, year);
    const create = window.Views.manualJournalCreate(ctx);
    const manualId = Store.registerManualJournal(year, 1, year + '-01-05', 'Asiento de prueba', [
      { account_code: '1010101', debit: 10, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 10, component_name: 'manual' }
    ]);
    const manual = window.Views.editManualJournal({ params: { id: manualId }, query: {} });
    const doc = Store.createDocument({
      month_register: 1,
      year_register: year,
      type_vc: 'V',
      rut: '11111111-1',
      entity_name: 'Cliente Prueba',
      doctype: 33,
      document_type_name: 'Factura Electrónica',
      folio: 9002,
      date: year + '-01-10',
      net: 1000,
      vat_rec: 190,
      total: 1190
    });
    const vcId = Store.registerDocumentJournal(doc.id, '4010101');
    const vc = window.Views.editJournal({ params: { id: vcId }, query: {} });
    T.assertEqual(create.split('min="0"').length - 1, 2, 'El formulario de creación debe limitar Debe y Haber');
    T.assertEqual(manual.split('min="0"').length - 1, 6, 'La edición manual debe limitar todas sus filas');
    T.assertEqual(vc.split('min="0"').length - 1, 8, 'La edición V/C debe limitar todas sus filas');
    [create, manual, vc].forEach(function (html) {
      T.assertIncludes(html, 'No se permiten montos negativos en Debe ni en Haber.');
      T.assertIncludes(html, 'Number(this.value) < 0');
      T.assertIncludes(html, 'this.value = 0;');
    });
  });

  T.test('La edición de asientos permite buscar cuentas por código o nombre', function () {
    T.resetStore();
    const year = Store.workingYear();
    const id = Store.registerManualJournal(year, 1, year + '-01-05', 'Asiento de prueba', [
      { account_code: '1010101', debit: 10, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 10, component_name: 'manual' }
    ]);

    const manual = window.Views.editManualJournal({ params: { id: id }, query: {} });
    T.assertIncludes(manual, 'accountSearchField(');
    T.assertIncludes(manual, 'Código o nombre');
    T.assert(manual.indexOf('<select name="entries[') === -1, 'La edición manual aún usa select de cuentas');
    T.assertIncludes(manual, 'bindAccountSearchForm');

    const journal = window.Views.editJournal({ params: { id: id }, query: {} });
    T.assertIncludes(journal, 'accountSearchField(');
    T.assert(journal.indexOf('<select name="entries[') === -1, 'La edición V/C aún usa select de cuentas');
    T.assertIncludes(journal, 'bindAccountSearchForm');
    T.assertIncludes(journal, 'entries[devengo][account_code]');
  });

  T.test('Cobros y pagos permite buscar la cuenta bancaria por código o nombre', function () {
    const year = Store.workingYear();
    resetWithStart(1, year);
    const document = Store.createDocument({
      month_register: 1,
      year_register: year,
      type_vc: 'V',
      rut: '11111111-1',
      entity_name: 'Cliente Prueba',
      doctype: 33,
      document_type_name: 'Factura Electrónica',
      folio: 9001,
      date: year + '-01-10',
      net: 1000,
      vat_rec: 190,
      total: 1190
    });
    Store.registerDocumentJournal(document.id, '4010101');

    const html = window.Views.paymentsIndex(ctx);
    T.assertIncludes(html, 'accountSearchField(');
    T.assertIncludes(html, 'bank_account_code');
    T.assertIncludes(html, 'Código o nombre');
    T.assert(html.indexOf('<select name="bank_account_code"') === -1, 'Cobros y pagos aún usa select de cuenta');
    T.assert(html.indexOf('showLabel: false') === -1, 'La cuenta de pagos debe mostrar su nombre al lado');
    T.assertIncludes(html, 'bindAccountSearchForm');
  });
})();
