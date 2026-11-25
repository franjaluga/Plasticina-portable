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

  T.test('La confirmación de asiento manual muestra el número creado y enlace al detalle', function () {
    T.resetStore();
    const year = Store.workingYear();
    const id = Store.registerManualJournal(year, 3, year + '-03-05', 'Asiento creado', [
      { account_code: '1010101', debit: 100, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 100, component_name: 'manual' }
    ]);
    const journal = Store.journal(id);
    const html = window.Views.manualJournalCreated({ params: {}, query: { journal_id: String(id) } });
    T.assertIncludes(html, 'Asiento contable manual creado exitosamente.');
    T.assertIncludes(html, 'Asiento N° <span class="font-mono">' + journal.entry_number + '</span>');
    T.assertIncludes(html, UI.route('accounting.journals.detail', journal.id));
    T.assertIncludes(html, 'Ver asiento');
    T.resetStore();
  });

  T.test('Los reportes muestran la glosa del asiento y no la entidad como glosa', function () {
    const year = Store.workingYear();
    resetWithStart(1, year);
    Store.registerManualJournal(year, 3, year + '-03-05', 'Glosa manual de prueba', [
      { account_code: '1010401', debit: 1190, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 1190, component_name: 'manual' }
    ]);
    const document = Store.createDocument({
      month_register: 3,
      year_register: year,
      type_vc: 'V',
      rut: '11111111-1',
      entity_name: 'Cliente Prueba',
      doctype: 33,
      document_type_name: 'Factura Electrónica',
      folio: 77,
      date: year + '-03-10',
      net: 1000,
      vat_rec: 190,
      total: 1190
    });
    Store.registerDocumentJournal(document.id, '4010101', 'Glosa del documento');

    const ledger = window.Views.ledgerResults({
      params: {},
      query: { account_code: '1010401', month: 3, year: year }
    });
    T.assertIncludes(ledger, 'Glosa manual de prueba');
    T.assertIncludes(ledger, 'Glosa del documento');
    T.assert(ledger.indexOf('Cliente Prueba') === -1, 'El libro mayor no debe usar la entidad como glosa');
    T.assert(ledger.indexOf('Asiento contable N°') === -1, 'El libro mayor no debe usar un fallback de asiento');
    T.assertIncludes(ledger, '<th class="py-2.5 px-3">Glosa</th>');
    T.assert(ledger.indexOf('Glosa / Entidad') === -1, 'El encabezado del libro mayor no debe mencionar entidad');

    const bookQuery = { year: year, date_from: year + '-03-01', date_to: year + '-03-31' };
    const book = window.Views.systemJournals({
      params: {},
      query: bookQuery
    });
    T.assertIncludes(book, 'N° Asiento');
    T.assertIncludes(book, 'Glosa manual de prueba');
    T.assertIncludes(book, 'Glosa del documento');
    T.assertIncludes(book, '11111111-1');
    T.assertIncludes(book, UI.route('accounting.system_journals.export_csv', bookQuery));
    T.assert(book.indexOf('Cambiar Rango') === -1, 'El flujo de rango eliminado no debe aparecer en el reporte');
  });

  T.test('El formulario de documentos expone las acciones esperadas', function () {
    T.resetStore();
    const html = window.Views.documentCreate(ctx);
    T.assertIncludes(html, 'data-action="documents.store"');
  });

  T.test('El formulario de documentos precarga mes, cierre de mes y referencias de 33/34', function () {
    T.resetStore();
    const html = window.Views.documentCreate(ctx);
    const month = new Date().getMonth() + 1;
    T.assertIncludes(html, 'name="month_register" id="month_register" min="1" max="12" value="' + month + '"');
    T.assertIncludes(html, 'name="date_centralize" id="date_centralize" value=""');
    T.assertIncludes(html, 'new Date(config.workingYear, currentDate.getMonth() + 1, 0)');
    T.assertIncludes(html, "(monthText.length < 2 ? '0' + monthText : monthText)");
    T.assertIncludes(html, "code === '33' || code === '34'");
    T.assertIncludes(html, 'rutRefInput.value = rutValue;');
    T.assertIncludes(html, 'tdRefInput.value = code;');
    T.assertIncludes(html, 'folioRefInput.value = folioValue;');
    T.assertIncludes(html, "if (autoRutRef) { rutRefInput.value = ''; autoRutRef = false; }");
    T.assertIncludes(html, "if (autoTdRef) { tdRefInput.value = ''; autoTdRef = false; }");
    T.assertIncludes(html, "if (autoFolioRef) { folioRefInput.value = ''; autoFolioRef = false; }");
    T.assertIncludes(html, "rutInput.addEventListener('input', syncReferences);");
    T.assertIncludes(html, "rutRefInput.addEventListener('input', function () { autoRutRef = false; });");
  });

  T.test('El formulario de documentos mantiene funcional el selector V/C', function () {
    T.resetStore();
    const html = window.Views.documentCreate(ctx);
    T.assertIncludes(html, '<option value="V" selected>Venta</option>');
    T.assertIncludes(html, '<option value="C">Compra</option>');
  });

  T.test('El formulario de documentos calcula el total al digitar sin seleccionar el contenido', function () {
    T.resetStore();
    const html = window.Views.documentCreate(ctx);
    T.assertIncludes(html, "amountOf('net') + amountOf('exempt') + amountOf('vat_rec') +");
    T.assertIncludes(html, "- amountOf('minus_oth_tax')");
    T.assertIncludes(html, 'Math.round((sum + Number.EPSILON) * 100) / 100');
    T.assertIncludes(html, "input.addEventListener('input', calculateTotal);");
    T.assert(html.indexOf('selectContent') === -1, 'No debe seleccionar todo el campo al enfocar o hacer clic');
    T.assert(html.indexOf("field.addEventListener('focus'") === -1, 'El foco no debe reemplazar la selección del usuario');
    T.assert(html.indexOf("field.addEventListener('click'") === -1, 'El clic debe permitir colocar el cursor');
    const totalTag = html.split('name="total" id="total"')[1].split('>')[0];
    T.assert(totalTag.indexOf('readonly') === -1, 'El total debe seguir editable');
    T.assertIncludes(totalTag, 'step="0.01"');
    const script = html.split('<script>')[1].split('</script>')[0];
    new Function(script);
  });

  T.test('El formulario de documentos muestra campos visibles y totalmente editables', function () {
    T.resetStore();
    const html = window.Views.documentCreate(ctx);
    const rutTag = html.split('name="rut" id="rut"')[1].split('>')[0];
    [
      'border border-gray-300', 'bg-white', 'px-3 py-2', 'min-w-0',
      'outline-none', 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-2'
    ].forEach(function (token) { T.assertIncludes(rutTag, token); });
    T.assertIncludes(html, 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6');
    T.assertIncludes(html, 'sm:col-span-2 md:col-span-4');
    T.assertEqual(html.split('step="0.01"').length - 1, 7, 'Los siete montos deben aceptar decimales');
    T.assert(html.indexOf("setAttribute('readonly'") === -1, 'El autocompletado no debe bloquear campos');
    T.assertEqual(html.split('readonly="readonly"').length - 1, 0, 'Ningún campo debe tener readonly en el HTML');
    T.assertIncludes(html, "nameInput.removeAttribute('readonly')");
    T.assertIncludes(html, "docNameInput.removeAttribute('readonly')");
  });

  T.test('Los maestros, el sistema y la portada exponen sus accesos', function () {
    T.resetStore();
    T.assertIncludes(window.Views.templatesIndex(ctx), 'data-action="templates.store"');
    T.assertIncludes(window.Views.systemConfig(ctx), 'masters/account-templates');
    T.assertIncludes(window.Views.welcome(ctx), 'data-action="period.update"');
  });

  T.test('system/config ofrece reset con dos confirmaciones alternadas', function () {
    T.resetStore();
    const html = window.Views.systemConfig(ctx);
    T.assertEqual((html.match(/p-5 /g) || []).length, 4);
    [
      'Planes de Cuentas Maestros',
      'Exportar Base de Datos (SQLite)',
      'Restaurar Base de Datos (SQLite)',
      'Reiniciar Base de Datos'
    ].forEach(function (title) { T.assertIncludes(html, title); });
    T.assertIncludes(html, 'id="resetDatabaseModal"');
    T.assertIncludes(html, 'id="resetStepOne"');
    T.assertIncludes(html, 'id="resetStepTwo"');
    T.assertIncludes(html, 'data-reset-step="1" data-reset-advance');
    T.assertIncludes(html, 'data-reset-step="2" data-link-action="system.reset"');
    T.assert(!html.includes('data-confirm'), 'El reset no debe usar confirmación nativa');

    const stepOne = html.split('id="resetStepOne"')[1].split('id="resetStepTwo"')[0];
    const stepTwo = html.split('id="resetStepTwo"')[1].split('</script>')[0];
    T.assert(stepOne.indexOf('data-reset-step="1"') < stepOne.indexOf('Cancelar'),
      'El primer Confirmar debe estar a la izquierda');
    T.assert(stepTwo.indexOf('Cancelar') < stepTwo.indexOf('data-reset-step="2"'),
      'El segundo Confirmar debe estar a la derecha');

    const script = html.split('<script>')[1].split('</script>')[0];
    new Function(script);
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
    T.assert(ledger.indexOf('for="account_code"') < ledger.indexOf('id="ledger_month"'), 'La cuenta debe estar arriba del mes');
    T.assert(ledger.indexOf('id="ledger_month"') < ledger.indexOf('id="ledger_year"'), 'El mes debe estar antes del año');
    T.assertIncludes(ledger, 'sm:col-span-4', 'La cuenta debe ocupar un bloque completo');
    T.assertIncludes(ledger, 'bg-amber-50', 'La cuenta debe estar resaltada');
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

  T.test('El asiento manual muestra el correlativo propuesto antes del detalle', function () {
    T.resetStore();
    const empty = window.Views.manualJournalCreate(ctx);
    const previewStart = empty.indexOf('id="entry-number-preview"');
    const detailStart = empty.indexOf('Detalle de Cuentas');
    T.assert(previewStart > -1 && detailStart > previewStart, 'El bloque propuesto debe ir antes del detalle');
    T.assert(empty.indexOf('Owner Activo') === -1, 'La vista create no debe mostrar el bloque de owner activo');
    T.assert(empty.indexOf('owners.index') === -1, 'La vista create no debe incluir el enlace Cambiar a owners');
    T.assertIncludes(empty, 'Asiento propuesto</span>\n            <strong class="font-mono font-bold text-slate-800">1</strong>');
    T.assertIncludes(empty, '[?]</button>');
    T.assertIncludes(empty, 'title="Sin asientos registrados · Próximo N° 1\nEl número definitivo se asigna al guardar; si otro asiento se registra primero, se recalculará automáticamente."');
    T.assert(empty.indexOf('name="entry_number"') === -1, 'El número propuesto no debe enviarse como campo');

    const year = Store.workingYear();
    Store.registerManualJournal(year, 1, year + '-01-05', 'Asiento previo', [
      { account_code: '1010101', debit: 10, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 10, component_name: 'manual' }
    ]);
    const next = window.Views.manualJournalCreate(ctx);
    T.assertIncludes(next, 'Asiento propuesto</span>\n            <strong class="font-mono font-bold text-slate-800">2</strong>');
    T.assertIncludes(next, 'title="Último asiento N° 1 · Próximo N° 2\nEl número definitivo se asigna al guardar; si otro asiento se registra primero, se recalculará automáticamente."');
  });

  T.test('El asiento manual convierte montos vacíos en cero y descarta filas sin datos', function () {
    T.resetStore();
    const html = window.Views.manualJournalCreate(ctx);
    T.assertIncludes(html, 'function normalizeAmountInput(input) {');
    T.assertIncludes(html, "if (value.trim() === '') input.value = '0';");
    T.assertIncludes(html, 'input.onblur = function () { normalizeAmountInput(this); calculateTotals(); };');
    T.assertIncludes(html, 'function pruneBlankRows() {');
    T.assertIncludes(html, 'pruneBlankRows();');
    T.assertIncludes(html, "Cada línea con monto debe tener una cuenta contable.");
    T.assert(html.indexOf('debit-input" required>') === -1, 'Debe no debe ser obligatorio para poder normalizarlo');
    T.assert(html.indexOf('credit-input" required>') === -1, 'Haber no debe ser obligatorio para poder normalizarlo');
    T.assertIncludes(html, 'required: false');
  });

  T.test('El asiento manual inserta líneas entremedio y usa botones de acción circulares', function () {
    T.resetStore();
    const html = window.Views.manualJournalCreate(ctx);
    T.assertIncludes(html, 'function insertRowBelow(button) {');
    T.assertIncludes(html, 'tbody.insertBefore(row, current.nextElementSibling);');
    T.assertIncludes(html, 'window.insertRowBelow = insertRowBelow;');
    T.assertIncludes(html, "var row = createRow('row_' + rowSeq, '', 0, 0);");
    T.assertIncludes(html, 'class="row-action-btn row-insert-btn"');
    T.assertIncludes(html, 'class="row-action-btn row-remove-btn"');
    T.assertIncludes(html, 'aria-label="Agregar línea debajo"');
    T.assertIncludes(html, 'aria-label="Eliminar línea"');
    T.assert(html.indexOf("&times;</button>") === -1, 'La equis debe ir dentro del botón circular');
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

  T.test('Los formularios de asientos impiden Debe y Haber en la misma fila', function () {
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
      folio: 9003,
      date: year + '-01-10',
      net: 1000,
      vat_rec: 190,
      total: 1190
    });
    const vcId = Store.registerDocumentJournal(doc.id, '4010101');
    const vc = window.Views.editJournal({ params: { id: vcId }, query: {} });
    [create, manual, vc].forEach(function (html) {
      T.assertIncludes(html, 'Cada fila del asiento debe registrar solo Debe o solo Haber.');
      T.assertIncludes(html, 'function enforceSingleSide(input) {');
      T.assertIncludes(html, 'enforceSingleSide(this);');
      T.assertIncludes(html, "input.classList.contains('debit-input') ? '.credit-input' : '.debit-input'");
      T.assertIncludes(html, 'opposite.value = 0;');
      T.assertIncludes(html, "input.closest('tr')");
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
