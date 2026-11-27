(function () {
  'use strict';

  const T = window.PlasticinaTest;
  const ctx = { params: { id: 1, owner: 1, accountTemplate: 1 }, query: {} };

  function monthEndIso(month, valueYear) {
    const lastDay = new Date(valueYear, month, 0).getDate();
    return valueYear + '-' + String(month).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0');
  }

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

  T.test('La portada muestra la empresa activa y atajo de contabilización', function () {
    T.resetStore();
    const html = window.Views.welcome(ctx);
    T.assertIncludes(html, 'Empresa Activa');
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

  T.test('La confirmación de contabilización masiva ofrece dos cards', function () {
    const html = window.Views.documentBatchProcessed({ params: {}, query: { processed: '3' } });
    T.assertIncludes(html, '3 documentos procesados');
    T.assertIncludes(html, 'Contabilizar más documentos');
    T.assertIncludes(html, UI.route('vc_documents.pending'));
    T.assertIncludes(html, 'Ir a libro de compras y ventas');
    T.assertIncludes(html, UI.route('accounting.analytics'));
    T.assertEqual((html.match(/class="group p-6 bg-white border border-slate-200 rounded-2xl/g) || []).length, 2);
    T.assert(html.indexOf('data-action="documents.batch"') === -1, 'La confirmación no debe mostrar el formulario de contabilización');
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
    T.assertIncludes(book, monthEndIso(3, year));
    T.assertIncludes(book, UI.route('accounting.system_journals.export_csv', bookQuery));
    T.assert(book.indexOf('Cambiar Rango') === -1, 'El flujo de rango eliminado no debe aparecer en el reporte');
  });

  T.test('El libro diario muestra documentos anteriores al inicio por su cierre de mes', function () {
    const year = Store.workingYear();
    const closingDate = monthEndIso(11, year);
    resetWithStart(11, year);
    const document = Store.createDocument({
      month_register: 11,
      year_register: year,
      type_vc: 'V',
      rut: '11111111-1',
      entity_name: 'Cliente de cierre',
      doctype: 33,
      document_type_name: 'Factura Electrónica',
      folio: 88,
      date: year + '-01-10',
      net: 1000,
      vat_rec: 190,
      total: 1190
    });
    Store.registerDocumentJournal(document.id, '4010110', 'Cierre de noviembre');
    const html = window.Views.systemJournals({ params: {}, query: { year: year } });
    T.assertIncludes(html, 'Cierre de noviembre');
    T.assertIncludes(html, closingDate);
    T.assert(html.indexOf('No se encontraron asientos contables') === -1, 'El asiento debió aparecer en el libro');
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
    T.assertIncludes(html, 'data-ui-select data-name="type_vc"');
    T.assertIncludes(html, 'data-value="V"');
    T.assertIncludes(html, 'data-value="C"');
    T.assert(html.indexOf('<select') === -1, 'No debe usar select nativo');
  });

  T.test('La tarjeta de importar compras pide el libro, mes y año antes de abrir el importador', function () {
    T.resetStore();
    const html = window.Views.ingressImport(ctx);
    T.assertIncludes(html, 'data-action="imports.purchases_start"');
    T.assertIncludes(html, 'id="purchase_month" data-ui-select data-name="month_register"');
    T.assertIncludes(html, 'name="year_register" id="purchase_year"');
    T.assertIncludes(html, 'Mes del libro');
    T.assertIncludes(html, 'Año del libro');
  });

  T.test('La carga de compras muestra el libro elegido y lo conserva oculto', function () {
    T.resetStore();
    const period = { month_register: Store.ownerStartPeriod().month, year_register: Store.workingYear() };
    const html = window.Views.ingressImportPurchases({ params: {}, query: period });
    T.assertIncludes(html, 'Libro de compras seleccionado');
    T.assertIncludes(html, 'name="month_register" value="' + period.month_register + '"');
    T.assertIncludes(html, 'name="year_register" value="' + period.year_register + '"');
    T.assertIncludes(html, 'Tipo de documento: Compra (C)');
  });

  T.test('La confirmación de importación de compras ofrece dos siguientes pasos', function () {
    T.resetStore();
    const html = window.Views.ingressImportPurchasesImported(ctx);
    T.assertIncludes(html, 'Importación de compras completada');
    T.assertIncludes(html, 'Ingresar más documentos vía importador');
    T.assertIncludes(html, 'Ir a documentos pendientes de contabilización');
    T.assertIncludes(html, UI.route('ingress.import'));
    T.assertIncludes(html, UI.route('vc_documents.pending'));
  });

  T.test('La consulta analítica usa el nombre Libro de Compras y Ventas', function () {
    T.resetStore();
    const html = window.Views.accountingAnalytics(ctx);
    T.assertIncludes(html, 'Libro de Compras y Ventas');
    T.assertIncludes(html, 'Libro de ventas');
    T.assertIncludes(html, 'Libro de compras');
    T.assert(html.indexOf('Analíticos (V/C)') === -1, 'El nombre anterior no debe aparecer');
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
    T.assertIncludes(first, 'id="balanceMonth" data-ui-select data-name="month" data-value="03"');
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

  T.test('El balance tributario ofrece exportar CSV con el mes y año del reporte', function () {
    T.resetStore();
    const year = Store.workingYear();
    const html = window.Views.taxBalance({ params: {}, query: { month: '9', year: String(year) } });
    T.assertIncludes(html, 'href="' + UI.route('vc_documents.tax_balance.export_csv', { month: '9', year: String(year) }) + '"');
    T.assertIncludes(html, 'Exportar CSV');
    T.assertIncludes(html, 'bg-green-600 text-white');
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

    T.assertEqual(typeof helpers.bindAccountSearchFormsIn, 'function', 'Falta el enlace global de cuentas');
    T.assertEqual(helpers.bindAccountSearchFormsIn(document).length, 0, 'El enlace global debe tolerar un DOM vacío');
  });

  T.test('Los formularios de contabilización buscan cuentas por código o nombre', function () {
    T.resetStore();
    const create = window.Views.manualJournalCreate(ctx);
    T.assertIncludes(create, 'accountSearchField(');
    T.assertIncludes(create, 'Código o nombre');
    T.assert(create.indexOf('list="accounts_list"') === -1, 'El formulario aún usa datalist');

    const controller = window.Plasticina.views.accountPicker;
    T.assert(controller, 'Falta el controlador centralizado de cuentas');
    const accounts = Store.activeOwnerAccounts();
    T.assert(controller.resolveValue(accounts, accounts[0].code).account, 'El código exacto debe resolver la cuenta');
    T.assert(controller.resolveValue(accounts, accounts[0].name).account, 'El nombre exacto debe resolver la cuenta');
    T.assert(controller.search(accounts, 'banco', 8).length <= 8, 'Las sugerencias deben quedarse acotadas');

    const period = Store.ownerStartPeriod();
    const pendingDocument = Store.createDocument({
      month_register: period.month,
      year_register: period.year,
      type_vc: 'V',
      rut: '11111111-1',
      entity_name: 'Cliente Prueba',
      doctype: 33,
      document_type_name: 'Factura Electrónica',
      folio: 321,
      date: period.year + '-' + String(period.month).padStart(2, '0') + '-10',
      net: 1000,
      vat_rec: 190,
      total: 1190
    });

    const pending = window.Views.documentPending(ctx);
    T.assert(pending.indexOf('name="custom_net_account"') === -1, 'Ya no debe existir el campo global de cuenta');
    T.assert(pending.indexOf('id="custom_net_account"') === -1, 'Ya no debe existir el id global de cuenta');
    T.assertIncludes(pending, 'name="custom_net_account[' + pendingDocument.id + '][code]"');
    T.assertIncludes(pending, 'id="custom_net_account_' + pendingDocument.id + '"');
    T.assertIncludes(pending, 'placeholder="Código"');
    T.assertIncludes(pending, 'data-account-picker="code"');
    T.assertIncludes(pending, 'data-account-source="catalogs.accounts"');
    T.assertIncludes(pending, 'class="account-name-label truncate text-[10px] text-gray-400 italic"');
    T.assertIncludes(pending, 'Escriba el código');
    T.assertIncludes(pending, 'autocomplete="off">');
    T.assertIncludes(pending, 'Cuenta Neto');
    T.assertEqual(pending.split('<th scope="col"').length - 1, 9, 'La tabla debe tener 9 columnas');
    T.assertIncludes(pending, 'data-select-all=".doc-checkbox"');
    T.assertEqual(pending.split('data-account-picker="code"').length - 1, 1, 'Debe haber un campo de cuenta por documento');
    T.assert(pending.indexOf('data-account-search') === -1, 'El campo de código no debe usar el buscador legacy');
    T.assert(pending.indexOf('<div class="overflow-x-auto">') !== -1 &&
      pending.indexOf('<div class="overflow-x-auto">') < pending.indexOf('<table'),
      'La tabla de pendientes debe ser desplazable horizontalmente');
    T.assertIncludes(pending, '<table class="min-w-full divide-y divide-gray-200 text-left text-xs" style="min-width:1080px">');
    T.assertIncludes(pending, '<td class="px-4 py-3" style="min-width:12rem">');
    T.assert(pending.indexOf('<script>') === -1, 'La vista de pendientes ya no debe incrustar scripts');
    T.assert(pending.indexOf('list="accounts_list"') === -1, 'El formulario aún usa datalist');
    T.assert(pending.indexOf('accountsData =') === -1, 'La vista no debe incrustar un snapshot de cuentas');
    T.assert(pending.indexOf('bindAccountSearchForm(form') === -1, 'La vista no debe usar el enlace genérico');
    T.assert(pending.indexOf('form.__plasticinaAccountSearchForm') === -1, 'La vista no debe marcar el formulario a mano');

    const parent = document.createElement('div');
    const input = document.createElement('input');
    parent.appendChild(input);
    input.setAttribute('data-account-source', 'none');
    input.value = accounts[0].code;
    const first = controller.bindInput(input, accounts, {});
    const second = controller.bindInput(input, accounts, {});
    T.assertEqual(first, second, 'El control debe enlazarse una sola vez');
    T.assertEqual(controller.bindings().length, 1, 'Debe existir un solo binding activo');
    if (input.listeners) {
      T.assert(!input.listeners.focus, 'El campo no debe renderizar al enfocar');
      T.assert(!input.listeners.click, 'El campo no debe renderizar al hacer clic');
    }

    const codeInput = document.createElement('input');
    parent.appendChild(codeInput);
    codeInput.setAttribute('data-account-picker', 'code');
    codeInput.setAttribute('data-account-source', 'none');
    const codeBinding = controller.bindInput(codeInput, accounts, {});
    T.assert(codeBinding.codeOnly, 'El modo código no debe abrir sugerencias');
    T.assertEqual(codeBinding.panel, null, 'El modo código no debe crear panel');
    if (codeInput.listeners) T.assert(!codeInput.listeners.keydown, 'El modo código no debe enlazar navegación de sugerencias');
    T.assertEqual(controller.bindings().length, 2, 'Debe existir un binding por campo');

    input.isConnected = false;
    codeInput.isConnected = false;
    controller.prune();
    T.assertEqual(controller.bindings().length, 0, 'Los bindings desconectados deben limpiarse');

    const ledger = window.Views.ledgerContext({ params: {}, query: {} });
    T.assertIncludes(ledger, 'data-account-search');
    T.assertIncludes(ledger, 'name="account_code"');
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
    T.assertIncludes(html, 'type="number" id="template-amount-input" min="1" value="1"');
    T.assert(html.indexOf('window.prompt') === -1, 'Las plantillas rápidas no deben abrir un diálogo nativo');
  });

  T.test('Las plantillas rápidas toman el monto del formulario sin diálogo nativo', function () {
    T.resetStore();
    const html = window.Views.manualJournalCreate(ctx);
    T.assertIncludes(html, "var templateAmountInput = document.getElementById('template-amount-input');");
    T.assertIncludes(html, 'var amount = templateAmountInput ? Number(String(templateAmountInput.value).trim()) : 0;');
    T.assertIncludes(html, "UI.notify('Por favor, ingrese un monto entero mayor a 0.', 'error');");
    T.assertIncludes(html, 'Store.journalTemplateEntries(templateKey, amount).forEach(function (entry) {');
    T.assert(html.indexOf('window.prompt') === -1, 'No debe quedar window.prompt en la vista');
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
    T.assert(empty.indexOf('Empresa Activa') === -1, 'La vista create no debe mostrar el bloque de empresa activa');
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
    T.assertIncludes(manual, 'data-account-search');
    T.assertIncludes(manual, 'Código o nombre');
    T.assert(manual.indexOf('<select name="entries[') === -1, 'La edición manual aún usa select de cuentas');
    T.assertIncludes(manual, 'bindAccountSearchForm');

    const month = Number(UI.today().slice(5, 7));
    const document = Store.createDocument({
      month_register: month,
      year_register: year,
      type_vc: 'V',
      rut: '11111111-1',
      entity_name: 'Cliente Prueba',
      doctype: 33,
      document_type_name: 'Factura Electrónica',
      folio: 9001,
      date: UI.today(),
      net: 1000,
      vat_rec: 190,
      total: 1190
    });
    Store.registerDocumentJournal(document.id, '4010101');
    const vcJournal = Store.journals().find(function (item) { return item.vc_document_id === document.id; });
    T.assert(vcJournal, 'No se generó el asiento V/C');

    const journal = window.Views.editJournal({ params: { id: vcJournal.id }, query: {} });
    T.assertIncludes(journal, 'data-account-search');
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
    T.assertIncludes(html, 'data-account-search');
    T.assertIncludes(html, 'bank_account_code');
    T.assertIncludes(html, 'Código o nombre');
    T.assert(html.indexOf('<select name="bank_account_code"') === -1, 'Cobros y pagos aún usa select de cuenta');
    T.assert(html.indexOf('showLabel: false') === -1, 'La cuenta de pagos debe mostrar su nombre al lado');
    T.assertIncludes(html, 'bindAccountSearchForm');
  });

  T.test('El importador ofrece dos cards con botones activos', function () {
    T.resetStore();
    const html = window.Views.ingressImport(ctx);
    T.assertIncludes(html, 'Importar compras');
    T.assertIncludes(html, 'Importar ventas');
    T.assertIncludes(html, UI.route('ingress.import.purchases'));
    T.assertIncludes(html, 'data-action="imports.sales_start"');
    T.assert(html.indexOf('Próximamente') === -1, 'El importador de ventas ya no debe estar deshabilitado');
    T.assertIncludes(html, 'text-indigo-600');
    T.assertIncludes(html, 'bg-emerald-50');
  });

  T.test('La tarjeta de importar ventas pide formato, mes y año antes de abrir el importador', function () {
    T.resetStore();
    const html = window.Views.ingressImport(ctx);
    T.assertIncludes(html, 'data-action="imports.sales_start"');
    T.assertIncludes(html, 'id="sale_format" data-ui-select data-name="sale_format"');
    T.assertIncludes(html, 'data-value="factura"');
    T.assertIncludes(html, 'data-value="boleta"');
    T.assertIncludes(html, 'id="sales_month" data-ui-select data-name="month_register"');
    T.assertIncludes(html, 'name="year_register" id="sales_year"');
    T.assertIncludes(html, 'Mes del libro');
    T.assertIncludes(html, 'Año del libro');
  });

  T.test('La carga de ventas muestra el formato y el libro elegidos', function () {
    T.resetStore();
    const period = { sale_format: 'boleta', month_register: Store.ownerStartPeriod().month, year_register: Store.workingYear() };
    const html = window.Views.ingressImportSales({ params: {}, query: period });
    T.assertIncludes(html, 'Libro de ventas seleccionado');
    T.assertIncludes(html, 'Ventas boletas');
    T.assertIncludes(html, 'name="sale_format" value="boleta"');
    T.assertIncludes(html, 'name="month_register" value="' + period.month_register + '"');
    T.assertIncludes(html, 'name="year_register" value="' + period.year_register + '"');
    T.assertIncludes(html, 'Tipo de documento: Venta (V)');
  });

  T.test('La grilla de boletas precarga el CSV y muestra la razón social derivada', function () {
    T.resetStore();
    const headers = Store.SALES_BOLETA_HEADERS;
    const cells = {};
    const period = Store.ownerStartPeriod();
    headers.forEach(function (header, index) { cells['c' + index] = ''; });
    cells.c0 = '39';
    cells.c1 = '66666666-6';
    cells.c2 = '05/01/' + Store.workingYear();
    cells.c5 = '96';
    cells.c6 = '7671';
    cells.c7 = '1458';
    cells.c8 = '0';
    cells.c9 = '9129';
    UI.remember({
      kind: 'sales',
      fileName: 'venta-boleta.csv',
      sale_format: 'boleta',
      headers: headers,
      rows: [{
        line: 2,
        cells: cells,
        derived: { document_type_name: 'Boleta Electrónica', entity_name: 'cliente con boletas' }
      }],
      month_register: period.month,
      year_register: period.year,
      type_vc: 'V'
    });
    const html = window.Views.ingressImportSalesPreview(ctx);
    T.assertIncludes(html, 'venta-boleta.csv');
    T.assertIncludes(html, 'Revisar ventas importadas');
    T.assertIncludes(html, 'name="sale_format" value="boleta"');
    T.assertIncludes(html, 'name="rows[0][entity_name]" value="cliente con boletas"');
    T.assertIncludes(html, 'Libro de ventas seleccionado');
    T.assertIncludes(html, 'Procesar 1 documento');
  });

  T.test('La confirmación de importación de ventas ofrece dos siguientes pasos', function () {
    T.resetStore();
    const html = window.Views.ingressImportSalesImported(ctx);
    T.assertIncludes(html, 'Importación de ventas completada');
    T.assertIncludes(html, 'Ingresar más documentos vía importador');
    T.assertIncludes(html, 'Ir a documentos pendientes de contabilización');
    T.assertIncludes(html, UI.route('ingress.import'));
    T.assertIncludes(html, UI.route('vc_documents.pending'));
  });

  T.test('La grilla de compras precarga el CSV y marca los datos faltantes', function () {
    T.resetStore();
    const headers = Store.PURCHASE_HEADERS;
    const cells = {};
    const period = { month_register: Store.ownerStartPeriod().month, year_register: Store.workingYear() };
    const periodLabel = String(period.month_register).padStart(2, '0') + '/' + period.year_register;
    headers.forEach(function (header, index) { cells['c' + index] = ''; });
    cells.c1 = '33';
    cells.c3 = '';
    cells.c4 = 'Proveedor sin RUT';
    cells.c5 = '4720170';
    cells.c6 = '29/10/' + Store.workingYear();
    cells.c7 = '03/11/' + Store.workingYear() + ' 09:41:06';
    cells.c10 = '4706';
    cells.c11 = '894';
    cells.c14 = '5600';
    UI.remember({
      kind: 'purchases',
      fileName: 'compra.csv',
      headers: headers,
      rows: [{ line: 2, cells: cells, derived: { document_type_name: 'Factura Electrónica' } }],
      month_register: period.month_register,
      year_register: period.year_register,
      type_vc: 'C'
    });
    const html = window.Views.ingressImportPurchasesPreview(ctx);
    T.assertIncludes(html, 'compra.csv');
    T.assertIncludes(html, 'name="rows[0][c3]"');
    T.assertIncludes(html, 'name="month_register" value="' + period.month_register + '"');
    T.assertIncludes(html, 'name="year_register" value="' + period.year_register + '"');
    T.assert(html.indexOf('name="rows[0][month_register]"') === -1, 'El periodo ya no se edita por fila');
    T.assertIncludes(html, 'Libro de compras seleccionado');
    T.assertIncludes(html, 'bg-emerald-50');
    T.assertIncludes(html, 'border-emerald-200');
    T.assertIncludes(html, 'font-mono text-xs font-bold text-emerald-800');
    T.assertIncludes(html, '>' + periodLabel + '<');
    T.assert(html.indexOf('Tipo de documento: Compra (C)') === -1, 'El bloque compacto no debe explicar el tipo de documento');
    T.assert(html.indexOf('Periodo fijo') === -1, 'El bloque compacto no debe mostrar la etiqueta Periodo fijo');
    T.assertIncludes(html, 'is-invalid');
    T.assertIncludes(html, 'Procesar 1 documento');
    T.assert(html.indexOf('disabled') !== -1, 'El botón de procesar queda bloqueado con errores');
    T.assertIncludes(html, 'Razon Social');
  });
})();
